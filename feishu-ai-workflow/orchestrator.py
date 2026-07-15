"""
协作编排器:解析总负责AI的指令,串联调用其他角色。
当总负责AI输出 [CALL:xxx] 标记时,自动触发对应角色。
"""

import re
import time
from roles import ROLES, ROLE_PM, ROLE_UI, ROLE_CODER, ROLE_LEAD, ROLE_NAMES
from ai_engine import chat


def run_single_role(role: str, user_message: str, context: str = "") -> str:
    """
    单角色模式:用户直接 @ 某个 AI,该 AI 独立回复。
    """
    role_config = ROLES[role]
    emoji = role_config["emoji"]
    name = role_config["name"]

    print(f"[编排] 单角色调用: {name} <- {user_message[:50]}...")
    result = chat(role, user_message, context)
    return f"{emoji} {name}:\n\n{result}"


def run_lead_workflow(user_message: str) -> list:
    """
    总负责AI编排模式:串联多个角色完成完整工作流。

    流程:
    1. 总负责AI 分析需求 → 输出执行计划(含 [CALL:xxx] 标记)
    2. 按顺序调用被标记的角色
    3. 每个角色的产出作为下一个角色的上下文
    4. 总负责AI 最后汇总

    Returns:
        list[dict]: 每步的 {role, name, content} 列表
    """
    results = []

    # Step 1: 总负责AI 分析需求
    print(f"[编排] 总负责AI 分析需求: {user_message[:50]}...")
    lead_response = chat(ROLE_LEAD, user_message)
    results.append({
        "role": ROLE_LEAD,
        "name": ROLE_NAMES[ROLE_LEAD],
        "content": lead_response,
    })

    # Step 2: 解析 [CALL:xxx] 标记,确定调用顺序
    call_pattern = re.compile(r'\[CALL:(pm|ui|coder)\]', re.IGNORECASE)
    calls = call_pattern.findall(lead_response)

    if not calls:
        # 没有调用标记,直接返回总负责AI的回复
        return results

    # 去重保持顺序
    seen = set()
    ordered_calls = []
    for c in calls:
        c_lower = c.lower()
        if c_lower not in seen:
            seen.add(c_lower)
            ordered_calls.append(c_lower)

    print(f"[编排] 调用链: {' → '.join([ROLE_NAMES[c] for c in ordered_calls])}")

    # Step 3: 依次调用各角色,上下文传递
    context = ""
    for role in ordered_calls:
        role_config = ROLES[role]
        emoji = role_config["emoji"]
        name = role_config["name"]

        # 构造该角色的任务
        if context:
            task = f"根据上游角色的产出,完成你负责的部分:\n\n原始需求: {user_message}"
        else:
            task = user_message

        print(f"[编排] 调用 {name}...")
        result = chat(role, task, context)

        results.append({
            "role": role,
            "name": name,
            "content": result,
        })

        # 当前产出作为下一个角色的上下文
        context += f"\n\n--- {name} 的产出 ---\n{result}"
        time.sleep(1)  # 避免 API 频率限制

    # Step 4: 总负责AI 汇总
    print("[编排] 总负责AI 汇总...")
    summary = chat(
        ROLE_LEAD,
        "请根据以上各角色的产出,给出项目总结和下一步建议。",
        context,
    )
    results.append({
        "role": ROLE_LEAD,
        "name": ROLE_NAMES[ROLE_LEAD],
        "content": summary,
    })

    return results


def format_workflow_results(results: list) -> str:
    """
    将工作流结果格式化为飞书消息文本。
    """
    lines = []
    for i, r in enumerate(results):
        role_config = ROLES[r["role"]]
        emoji = role_config["emoji"]
        lines.append(f"\n{'='*40}")
        lines.append(f"{emoji} {r['name']}")
        lines.append(f"{'='*40}\n")
        lines.append(r["content"])

    return "\n".join(lines)
