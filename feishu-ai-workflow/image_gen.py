"""
图片生成模块:调用智谱 CogView-3 API 生成 UI 效果图。
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GLM_API_KEY = os.getenv("GLM_API_KEY", "")


def generate_ui_image(design_description: str) -> bytes | None:
    """
    根据设计描述生成 UI 效果图。

    Args:
        design_description: 设计描述(中文或英文)

    Returns:
        图片二进制数据,失败返回 None
    """
    # 构造英文 prompt(CogView 对英文支持更好),强化 UI 设计感
    prompt = (
        f"Professional UI/UX design mockup, mobile app interface, "
        f"{design_description}, "
        f"high quality, clean modern design, sharp detail, "
        f"flat design style, app screenshot, 9:16 aspect ratio"
    )

    # 限制 prompt 长度
    if len(prompt) > 500:
        prompt = prompt[:500]

    try:
        resp = httpx.post(
            "https://open.bigmodel.cn/api/paas/v4/images/generations",
            headers={
                "Authorization": f"Bearer {GLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "cogview-3",
                "prompt": prompt,
            },
            timeout=120,
        )
        data = resp.json()

        if "data" not in data or not data["data"]:
            print(f"[图片生成失败] 无图片数据: {data}")
            return None

        img_url = data["data"][0].get("url", "")
        if not img_url:
            print("[图片生成失败] 无图片 URL")
            return None

        # 下载图片
        img_resp = httpx.get(img_url, timeout=60)
        if img_resp.status_code != 200:
            print(f"[图片下载失败] status={img_resp.status_code}")
            return None

        return img_resp.content

    except Exception as e:
        print(f"[图片生成异常] {type(e).__name__}: {e}")
        return None
