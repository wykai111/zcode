"""
飞书消息收发封装。
管理 4 个飞书应用的凭证,提供消息发送能力。
"""

import os
import json
import hashlib
import base64
import struct
import time
import httpx

# ========== 4 个飞书应用的凭证 ==========
# 从环境变量或 config 读取
# 格式: app_id -> {app_id, app_secret, name, role}
FEISHU_APPS = {}


def load_apps_config():
    """从环境变量加载 4 个飞书应用配置"""
    apps = {}
    # 产品需求AI
    apps["pm"] = {
        "app_id": os.getenv("FEISHU_PM_APP_ID", ""),
        "app_secret": os.getenv("FEISHU_PM_APP_SECRET", ""),
        "name": "产品需求AI",
        "role": "pm",
    }
    # UI设计AI
    apps["ui"] = {
        "app_id": os.getenv("FEISHU_UI_APP_ID", ""),
        "app_secret": os.getenv("FEISHU_UI_APP_SECRET", ""),
        "name": "UI设计AI",
        "role": "ui",
    }
    # 编码AI
    apps["coder"] = {
        "app_id": os.getenv("FEISHU_CODER_APP_ID", ""),
        "app_secret": os.getenv("FEISHU_CODER_APP_SECRET", ""),
        "name": "编码AI",
        "role": "coder",
    }
    # 总负责AI
    apps["lead"] = {
        "app_id": os.getenv("FEISHU_LEAD_APP_ID", ""),
        "app_secret": os.getenv("FEISHU_LEAD_APP_SECRET", ""),
        "name": "总负责AI",
        "role": "lead",
    }
    return apps


# ========== Token 缓存 ==========
_token_cache = {}  # app_id -> (token, expire_time)


def get_tenant_access_token(app_id: str, app_secret: str) -> str:
    """获取飞书 tenant_access_token(带缓存)"""
    cache_key = app_id
    now = time.time()
    if cache_key in _token_cache:
        token, expire = _token_cache[cache_key]
        if now < expire - 60:  # 提前 60 秒刷新
            return token

    resp = httpx.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        json={"app_id": app_id, "app_secret": app_secret},
        timeout=10,
    )
    data = resp.json()
    token = data.get("tenant_access_token", "")
    expire = now + data.get("expire", 7200)
    _token_cache[cache_key] = (token, expire)
    return token


def send_text_message(app_id: str, app_secret: str, chat_id: str, text: str):
    """
    通过指定应用向群聊发送文本消息。

    Args:
        app_id: 飞书应用 App ID
        app_secret: 飞书应用 App Secret
        chat_id: 群聊 ID
        text: 要发送的文本(支持 Markdown)
    """
    token = get_tenant_access_token(app_id, app_secret)
    # 飞书消息有长度限制,超过 4000 字符分段发送
    max_len = 4000
    chunks = [text[i:i + max_len] for i in range(0, len(text), max_len)]

    for chunk in chunks:
        resp = httpx.post(
            "https://open.feishu.cn/open-apis/im/v1/messages",
            headers={"Authorization": f"Bearer {token}"},
            params={"receive_id_type": "chat_id"},
            json={
                "receive_id": chat_id,
                "msg_type": "text",
                "content": json.dumps({"text": chunk}),
            },
            timeout=15,
        )
        data = resp.json()
        if data.get("code") != 0:
            print(f"[飞书发送失败] app={app_id} code={data.get('code')} msg={data.get('msg')}")
        time.sleep(0.3)  # 避免频率限制


def reply_message(app_id: str, app_secret: str, message_id: str, text: str):
    """
    回复指定消息。

    Args:
        app_id: 飞书应用 App ID
        app_secret: 飞书应用 App Secret
        message_id: 要回复的消息 ID
        text: 回复内容
    """
    token = get_tenant_access_token(app_id, app_secret)
    resp = httpx.post(
        f"https://open.feishu.cn/open-apis/im/v1/messages/{message_id}/reply",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "msg_type": "text",
            "content": json.dumps({"text": text}),
        },
        timeout=15,
    )
    data = resp.json()
    if data.get("code") != 0:
        print(f"[飞书回复失败] app={app_id} code={data.get('code')} msg={data.get('msg')}")


# ========== 事件订阅签名校验 ==========

def verify_signature(encrypt_key: str, timestamp: str, nonce: str, body: str, signature: str) -> bool:
    """
    校验飞书事件订阅的签名。
    """
    import hmac
    buf = timestamp + nonce + encrypt_key + body
    expected = hashlib.sha256(buf.encode("utf-8")).hexdigest()
    return hmac.compare_digest(expected, signature)


def decrypt_event(encrypt_key: str, encrypted_data: str) -> dict:
    """
    解密飞书事件订阅的加密消息。
    """
    key = hashlib.sha256(encrypt_key.encode("utf-8")).digest()
    encrypted = base64.b64decode(encrypted_data)
    cipher = AES.new(key, AES.MODE_CBC, key[:16])
    decrypted = cipher.decrypt(encrypted)
    # 去除 PKCS7 padding
    pad_len = decrypted[-1]
    decrypted = decrypted[:-pad_len]
    return json.loads(decrypted.decode("utf-8"))


# AES 解密需要 pycryptodome
try:
    from Crypto.Cipher import AES
except ImportError:
    # 如果没有 pycryptodome,用纯 Python 实现 AES-CBC
    # 但推荐安装: pip install pycryptodome
    AES = None
    print("[警告] 未安装 pycryptodome,AES 解密不可用。请运行: pip install pycryptodome")


def find_app_by_id(app_id: str, apps: dict) -> dict:
    """根据 app_id 查找应用配置"""
    for key, app in apps.items():
        if app["app_id"] == app_id:
            return app
    return None
