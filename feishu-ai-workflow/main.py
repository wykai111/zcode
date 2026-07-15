"""
FastAPI 入口:接收飞书事件订阅回调,路由到对应 AI 角色。

启动: python main.py
端口: 8000 (配合 ngrok http 8000 使用)
"""

import os
import json
import time
import hashlib
import threading
import httpx
from fastapi import FastAPI, Request, Query
from fastapi.responses import JSONResponse

from bots import load_apps_config, get_tenant_access_token, send_text_message, find_app_by_id
from roles import ROLES, ROLE_LEAD, ROLE_NAMES
from orchestrator import run_single_role, run_lead_workflow, format_workflow_results

app = FastAPI(title="飞书 AI 协作工作流")

# 加载 4 个飞书应用配置
FEISHU_APPS = load_apps_config()

# 飞书 Encrypt Key(用于事件订阅加密,可选,在飞书后台设置)
ENCRYPT_KEY = os.getenv("FEISHU_ENCRYPT_KEY", "")

# 飞书 Verification Token(事件订阅验证)
VERIFICATION_TOKEN = os.getenv("FEISHU_VERIFICATION_TOKEN", "")

# ========== URL 验证(飞书首次配置回调地址时触发) ==========

@app.post("/webhook/event")
async def webhook_event(request: Request):
    """
    飞书事件订阅统一回调入口。
    所有 4 个应用的事件都发到这里,通过 app_id 区分。
    """
    body = await request.body()
    body_str = body.decode("utf-8")
    try:
        data = json.loads(body_str)
    except json.JSONDecodeError:
        return JSONResponse({"error": "invalid json"}, status_code=400)

    print(f"[回调] 收到事件: {json.dumps(data, ensure_ascii=False)[:200]}")

    # 1. URL 验证(challenge)
    if data.get("type") == "url_verification":
        challenge = data.get("challenge", "")
        print(f"[验证] URL verification, challenge={challenge[:30]}...")
        return JSONResponse({"challenge": challenge})

    # 2. 解析事件
    header = data.get("header", {})
    event = data.get("event", {})
    event_type = header.get("event_type", "")
    app_id = header.get("app_id", "")

    if event_type != "im.message.receive_v1":
        return JSONResponse({"code": 0})

    # 3. 查找是哪个应用被 @
    app_config = find_app_by_id(app_id, FEISHU_APPS)
    if not app_config:
        print(f"[警告] 未知 app_id: {app_id}")
        return JSONResponse({"code": 0})

    role = app_config["role"]
    name = app_config["name"]

    # 4. 提取消息内容
    message = event.get("message", {})
    sender = event.get("sender", {})
    chat_id = message.get("chat_id", "")
    message_id = message.get("message_id", "")
    chat_type = message.get("chat_type", "")  # p2p 或 group
    msg_type = message.get("message_type", "")

    if msg_type != "text":
        # 先回复"只支持文本"
        threading.Thread(
            target=send_text_message,
            args=(app_config["app_id"], app_config["app_secret"], chat_id,
                  f"⚠️ {name} 目前只支持文本消息")
        ).start()
        return JSONResponse({"code": 0})

    # 解析文本内容
    content_str = message.get("content", "{}")
    try:
        content = json.loads(content_str)
        text = content.get("text", "").strip()
    except json.JSONDecodeError:
        text = ""

    if not text:
        return JSONResponse({"code": 0})

    sender_name = sender.get("sender_id", {}).get("open_id", "unknown")
    print(f"[消息] app={name} chat={chat_type} sender={sender_name} text={text[:80]}")

    # 5. 异步处理(避免飞书 3 秒超时)
    threading.Thread(
        target=process_message,
        args=(role, text, chat_id, app_config),
        daemon=True,
    ).start()

    # 立即返回 200,飞书要求 3 秒内响应
    return JSONResponse({"code": 0})


def process_message(role: str, text: str, chat_id: str, app_config: dict):
    """
    异步处理消息:调用 AI,发送回复。
    """
    app_id = app_config["app_id"]
    app_secret = app_config["app_secret"]
    name = app_config["name"]

    try:
        # 先发一条"处理中"提示
        send_text_message(app_id, app_secret, chat_id, f"⏳ {name} 正在思考中...")

        if role == ROLE_LEAD:
            # 总负责AI:走完整编排流程
            results = run_lead_workflow(text)
            full_text = format_workflow_results(results)

            # 分角色发送(每条消息单独发,更清晰)
            for r in results:
                role_config = ROLES[r["role"]]
                emoji = role_config["emoji"]
                msg = f"{emoji} {r['name']}:\n\n{r['content']}"
                send_text_message(app_id, app_secret, chat_id, msg)
                time.sleep(0.5)
        else:
            # 单角色:直接调用对应 AI
            result = run_single_role(role, text)
            send_text_message(app_id, app_secret, chat_id, result)

    except Exception as e:
        error_msg = f"❌ {name} 处理失败: {str(e)}"
        print(f"[错误] {error_msg}")
        send_text_message(app_id, app_secret, chat_id, error_msg)


# ========== 健康检查 ==========

@app.get("/")
async def health():
    """健康检查 + 配置状态"""
    status = {}
    for key, app in FEISHU_APPS.items():
        status[key] = {
            "name": app["name"],
            "configured": bool(app["app_id"] and app["app_secret"]),
        }
    return {
        "status": "running",
        "apps": status,
        "glm_configured": bool(os.getenv("GLM_API_KEY")),
    }


@app.get("/test/{role}")
async def test_role(role: str, message: str = "你好,请介绍一下你自己"):
    """
    手动测试某个角色(不经过飞书,直接调 AI)。
    访问: /test/pm?message=设计一个登录页面
    """
    if role not in ROLES:
        return {"error": f"未知角色: {role}, 可选: {list(ROLES.keys())}"}

    result = run_single_role(role, message)
    return {"role": role, "response": result}


@app.get("/test/lead")
async def test_lead(message: str = "帮我做一个待办事项App"):
    """
    手动测试总负责AI完整编排流程。
    访问: /test/lead?message=做一个天气查询App
    """
    results = run_lead_workflow(message)
    return {
        "steps": len(results),
        "results": [
            {"role": r["role"], "name": r["name"], "content": r["content"]}
            for r in results
        ],
    }


if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("  飞书 AI 协作工作流服务")
    print("=" * 50)
    print(f"  角色: 产品需求AI / UI设计AI / 编码AI / 总负责AI")
    print(f"  端口: 8000")
    print(f"  回调: http://localhost:8000/webhook/event")
    print(f"  健康检查: http://localhost:8000/")
    print(f"  手动测试: http://localhost:8000/test/pm?message=你好")
    print(f"  编排测试: http://localhost:8000/test/lead?message=做一个App")
    print("=" * 50)

    # 检查配置
    for key, app_cfg in FEISHU_APPS.items():
        if not app_cfg["app_id"]:
            print(f"  ⚠️ {app_cfg['name']} 未配置 (FEISHU_{key.upper()}_APP_ID)")
    if not os.getenv("GLM_API_KEY"):
        print("  ⚠️ GLM_API_KEY 未配置")

    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
