# Bitcoin Miner - Gold Diggers · Unity 前端复刻版

基于对 `golddigger.apk`（`com.fortune.btminer` v1.6.2，Unity 2022.3.62 IL2CPP）的逆向分析，
用 **Unity 2022.3 LTS + uGUI（纯代码构建）** 复刻其完整前端功能。

> ⚠️ 本工程仅供技术学习。所有数据仅保存在本地（PlayerPrefs），广告与内购均为模拟，不含任何真实金融/挖矿行为。

## 快速开始

1. 安装 [Unity Hub](https://unity.com/download) → 安装 **Unity 2022.3 LTS**（任意小版本）
2. `Add` → 选择本目录 `GoldDiggerUnity/`
3. 首次打开时，`Assets/Editor/SceneGenerator.cs` 会自动生成并打开 `Main.unity`（Camera + GameBootstrap）
4. 点击 ▶ Play 即可

无任何第三方依赖、无预制体、无美术资源：全部 UI 由 `UIFactory` 运行时生成（含运行时绘制的圆形/圆角 Sprite），字体使用内置 `LegacyRuntime.ttf`。

## 功能清单（对照原版）

| 模块 | 说明 |
|---|---|
| 登录 | 游客 / Google（模拟）登录，协议勾选，对标 LoginWindow |
| 开屏/启动 | 模拟开屏广告 2s + 假加载条（AppOpenAdPreLogin） |
| 大厅挖矿 | 8 台金币矿机 + 2 台广告矿机（24h 限时），总算力/产出速率实时刷新 |
| 广告矿机 | 看激励视频解锁，`AdMinerMaxLimit=2` 同时生效上限（对标原版） |
| 离线收益 | 启动按离线时长结算（上限 8h），看广告双倍 |
| 提现 | 闪电地址校验（user@domain / lnbc…）、VIP 单笔限额、每日次数限制 |
| 提现状态机 | 已提交 → 审核通过(8s) → 处理中(22s) → 打款成功(40s)，服务端定时推送 + 邮件通知 |
| VIP 0-6 | 充值总额升级：提现额度/次数提升、V5+ 无限次数、算力加成 |
| 商店 | 金币礼包模拟内购（购买→验证→发放，首充双倍），对标 PurchaseSuccess 流程 |
| 7 日签到 | 每日一签 + 看广告双倍，7 天一轮（SevenDayConfig） |
| 任务中心 | 每日任务（看广告/挖矿时长/签到/提现）+ 成就任务（算力/累计提现/累计广告/解锁矿机），红点提醒 |
| 邮件 | 列表/阅读/领取附件/新邮件推送（欢迎邮件、VIP 升级、提现到账） |
| 公告 | 启动推送 + 红点（对标 Announcement 本地快照） |
| 邀请 | 我的邀请码/复制/绑定好友码双方得 300 金币 |
| 评分 | 星级评分弹窗（RateWindow + SubmitRate） |
| 设置 | 账号信息、音效开关、协议/隐私、退出登录、删除账号（清档） |
| 新手引导 | 首次入厅 4 步引导 |
| 广告系统 | 模拟激励视频(5s)/插屏(3s，关窗频控 60s)/开屏(2s) |
| Toast/Dialog | 轻提示 + 二次确认弹窗 |

## 架构

```
Assets/Scripts/
├── Core/       GameBootstrap(场景入口) · GameManager(主循环+流程状态机) · EventBus(推送总线) · GameClock
├── Data/       PlayerModel(玩家数据) · Storage(JSON+PlayerPrefs) · Config/Configs(全部数值)
├── Network/    Messages(C2G/C2H/G2C/H2C 消息，命名复刻原版) · INetworkService/Net ·
│               MockNetworkService(延迟路由) · ServerSimulator(模拟服务端：状态机/推送/邮件)
├── Ads/        IAdService · MockAdService(全屏倒计时假广告)
├── Game/       MiningSystem(每秒产出) · VipSystem · TaskSystem(事件驱动进度) · SignInSystem · WithdrawSystem
└── UI/         Theme · UIFactory(代码建 UI) · UIManager(窗口栈/层级/插屏频控) · UIWindowBase
    └── Windows/ 18 个功能窗口（全部代码构建）
```

**请求-响应**：`Net.Call<TReq,TResp>(req, cb)` → `MockNetworkService`（模拟 0.25~0.7s 延迟）→ `ServerSimulator.Handle()` → 回调。
**服务端推送**：`ServerSimulator` 通过 `EventBus.Publish(H2C_XXXPush 等价事件)` 广播，UI 订阅刷新。
接入真实后端时实现 `INetworkService`（WebSocket/KCP）替换 `MockNetworkService` 即可，上层零改动。

## 目录外文件

- `docs/功能对照表.md` —— 原版逆向发现 ↔ 本工程实现映射
- `Assets/Editor/SceneGenerator.cs` —— 首次打开自动生成场景
