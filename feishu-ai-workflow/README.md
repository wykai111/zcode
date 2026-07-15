# 飞书 AI 协作工作流

在飞书群里实现 4 个 AI 角色协作:产品需求AI → UI设计AI → 编码AI,由总负责AI 协调全流程。

## 架构

```
飞书群 (@产品AI / @UI设计AI / @编码AI / @总负责AI)
    │
    ▼ (事件订阅 webhook)
后端服务 (FastAPI, 本机 + ngrok 穿透)
    │
    ├── 角色路由 (根据 app_id 判断哪个 bot 被 @)
    ├── 4 个 AI 角色 (调用 GLM-5.2 API)
    │   ├── 产品需求AI → 输出 PRD
    │   ├── UI设计AI → 输出设计方案
    │   ├── 编码AI → 输出代码
    │   └── 总负责AI → 协调全流程
    └── 飞书消息发送 (发回群聊)
```

## 快速开始

### 1. 安装依赖

```bash
cd feishu-ai-workflow
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env,填入 4 个飞书应用的 App ID/Secret + GLM API Key
```

### 3. 创建 4 个飞书应用

在 [open.feishu.cn](https://open.feishu.cn) 创建 4 个自建应用:

| 应用名 | 角色 | 环境变量前缀 |
|---|---|---|
| 产品需求AI | 整理需求,输出 PRD | FEISHU_PM_ |
| UI设计AI | 界面设计,配色方案 | FEISHU_UI_ |
| 编码AI | 写代码 | FEISHU_CODER_ |
| 总负责AI | 协调全流程 | FEISHU_LEAD_ |

每个应用需要:
1. 开启「机器人」能力
2. 申请权限: `im:message`, `im:message:send_as_bot`, `im:chat`
3. 配置事件订阅: URL 填 `https://<ngrok地址>/webhook/event`,订阅 `im.message.receive_v1`
4. 发布并审批通过
5. 把 4 个机器人都拉进同一个群

### 4. 启动 ngrok 内网穿透

```bash
brew install ngrok   # 如果没装
ngrok http 8000
```

把 ngrok 给出的公网地址(如 `https://xxxx.ngrok-free.app`)填到飞书事件订阅 URL 里。

### 5. 启动服务

```bash
python main.py
```

### 6. 测试

**手动测试(不经过飞书)**:
```bash
# 测试单个角色
curl "http://localhost:8000/test/pm?message=设计一个登录功能"

# 测试完整编排流程
curl "http://localhost:8000/test/lead?message=做一个待办事项App"
```

**飞书群测试**:
- 在群里 @产品需求AI + 描述需求 → 获取 PRD
- 在群里 @UI设计AI + 描述需求 → 获取设计方案
- 在群里 @总负责AI + 描述项目 → 自动串联全流程

## 协作流程

当用户 @总负责AI 时:

```
用户: @总负责AI 帮我做一个天气查询App
  │
  ├─ 总负责AI: 分析需求,制定计划 [CALL:pm] [CALL:ui] [CALL:coder]
  │
  ├─ 产品需求AI: 输出 PRD(功能模块、用户故事、验收标准)
  │
  ├─ UI设计AI: 根据 PRD 输出设计方案(配色、布局、组件)
  │
  ├─ 编码AI: 根据设计方案输出代码
  │
  └─ 总负责AI: 汇总,给出项目总结
```

每步结果都会实时发送到飞书群。

## 文件说明

| 文件 | 说明 |
|---|---|
| `main.py` | FastAPI 入口,接收飞书回调,路由到角色 |
| `roles.py` | 4 个 AI 角色的 system prompt 定义 |
| `ai_engine.py` | GLM API 调用封装 |
| `bots.py` | 飞书消息收发(4 个应用的凭证管理) |
| `orchestrator.py` | 协作编排(总负责AI 调度其他角色) |
| `.env.example` | 环境变量配置模板 |

## 技术栈

- **FastAPI** — Web 框架
- **httpx** — 飞书 API HTTP 调用
- **openai SDK** — GLM-5.2 API(OpenAI 兼容接口)
- **pycryptodome** — 飞书事件加密解密
- **ngrok** — 内网穿透
