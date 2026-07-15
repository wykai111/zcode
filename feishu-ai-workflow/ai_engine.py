"""
AI 引擎:调用 GLM-5.2 API,为不同角色生成回复。
使用 OpenAI 兼容接口(baseURL 指向 bigmodel)。
"""

import os
from openai import OpenAI
from roles import ROLES, ROLE_LEAD

# 从环境变量读取 GLM API Key
GLM_API_KEY = os.getenv("GLM_API_KEY", "")
GLM_BASE_URL = os.getenv("GLM_BASE_URL", "https://open.bigmodel.cn/api/anthropic")
GLM_MODEL = os.getenv("GLM_MODEL", "GLM-5.2")

# 初始化 OpenAI 兼容客户端
_client = None


def get_client():
    """懒加载 OpenAI 客户端"""
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=GLM_API_KEY,
            base_url=GLM_BASE_URL,
        )
    return _client


def chat(role: str, user_message: str, context: str = "") -> str:
    """
    调用 GLM API 生成回复。

    Args:
        role: 角色标识 (pm / ui / coder / lead)
        user_message: 用户消息内容
        context: 上下文(其他角色的产出,可选)

    Returns:
        AI 生成的回复文本
    """
    if role not in ROLES:
        return f"[错误] 未知角色: {role}"

    role_config = ROLES[role]
    system_prompt = role_config["prompt"]

    # 构造用户消息(如果有上下文,拼接进去)
    if context:
        full_message = f"## 上下文(来自上游角色的产出)\n{context}\n\n## 当前任务\n{user_message}"
    else:
        full_message = user_message

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=GLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_message},
            ],
            max_tokens=4096,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"[AI 调用失败] {role_config['name']} 无法响应: {str(e)}"


def lead_orchestrate(user_message: str) -> str:
    """
    总负责AI 的编排入口。
    分析需求,返回包含 [CALL:xxx] 标记的执行计划。
    后续由 orchestrator.py 解析标记并调用对应角色。
    """
    return chat(ROLE_LEAD, user_message)
