# TikTok Mini App — ShortDrama(国际版)

短剧流媒体小程序,**从抖音原生小程序迁移至 TikTok Minis(H5 架构)**,可发布到海外 TikTok 平台。

技术栈:Vite + React 19 + TypeScript + React Router + Zustand + hls.js,通过 `ttdx`(TikTok Minis CLI)构建调试。

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 本地开发(http://localhost:5173)

# TikTok Minis 构建(每次改完代码都要按顺序执行)
npm run build            # 1. 先构建出 dist/
ttdx minis build:after   # 2. 生成 minis.manifest.json
ttdx minis check --output # 3. 校验

# 或用 package.json 里的快捷脚本
npm run build:minis      # = ttdx minis build(内含 build:after)
npm run check:minis:output
```

本地真机预览:`ttdx minis debug`(会启动本地服务并打开 Chrome 调试,需在真实终端运行)。

## 项目结构

```
src/
├── lib/           # 基础设施
│   ├── config.ts      # API 基址/密钥(⚠️ SK 在前端,见下方安全说明)
│   ├── sign.ts        # HMAC-SHA256 签名(Web Crypto,等价原算法)
│   ├── request.ts     # fetch 封装
│   ├── api.ts         # 接口 + 字段归一化(1:1 移植自原 utils/api.js)
│   ├── storage.ts     # localStorage 观看历史
│   ├── util.ts        # 工具函数
│   └── nav.ts         # 路由跳转辅助
├── store/         # 状态管理(Zustand)
│   ├── appStore.ts    # 全局状态(模拟 app.globalData)
│   └── uiStore.ts     # Toast / Modal
├── components/    # 复用组件(TabBar/Toast/Modal)
├── pages/         # 6 个页面
│   ├── HomePage.tsx       # 首页(gallery + 3 rails)
│   ├── ForYouPage.tsx     # 推荐流
│   ├── HistoryPage.tsx    # 观看历史
│   ├── ProfilePage.tsx    # 个人中心
│   ├── PlayerPage.tsx     # ⭐播放器(hls.js + 竖滑 + 进度拖拽 + 连播)
│   └── ListPage.tsx       # 列表/See All 页
├── router.tsx     # 路由表(HashRouter)
└── types.ts       # 类型定义
```

## 从原项目迁移的内容

源项目:`tiktok-mini-app`(抖音原生小程序,`.ttml`/`.ttss`/`tt.*` API)。

| 原项目 | 本项目 |
|---|---|
| `app.globalData` | Zustand `appStore` |
| `tt.navigateTo` / `navigateBack` / `switchTab` | React Router `useNavigate` |
| `tt.request` | `fetch` + 签名头注入(`lib/request.ts`) |
| `tt.getStorageSync('watch_history')` | `localStorage`(`lib/storage.ts`,结构完全不变) |
| `tt.showToast` / `showModal` | 自定义 `<Toast>` / `<Modal>` 组件 |
| `tt.createVideoContext().play/pause/seek` | `<video>` ref + hls.js |
| `<swiper vertical>` 切集 | 自定义 touch 手势(阈值 50px / 800ms) |
| `wx:if` / `wx:for` | JSX 三元 / `.map()` |
| `rpx` 单位 | `px`(1rpx ≈ 0.5px,375 设计稿) |

签名算法已用对照测试验证(`scripts/verify-sign.mjs`):原手写 HMAC-SHA256 与 Web Crypto 产出完全一致,6/6 通过(含中文特殊字符)。

## ⚠️ 上线前必须处理的问题

### 1. Secret Key 暴露(最高优先级)
`src/lib/config.ts` 中的 `SK` 写在前端代码里。H5 是公开环境,任何人可在浏览器里提取 SK 伪造请求。

**解决方案**:引入后端代理。前端只调自己的服务端接口,签名在后端完成,SK 只存在于服务端。需改造 `lib/request.ts`(改为请求自家代理)和 `lib/sign.ts`(移到服务端)。

### 2. 内容授权
对接的是第三方短剧源 `api.qlaryline.xyz`。发布到 TikTok 前,请确认短剧内容有合法分发授权——TikTok 审核较严,未授权影视内容会被拒。

### 3. TikTok 登录
当前未接入登录(原项目 `tt.login` 也是 stub)。如需用户体系,要用 TikTok JS-SDK / OAuth 流程。

## 已知限制(与原项目一致,未额外引入)

- **List 页 board 过滤失效**:原 `fetchDramaList` 忽略 `board` 参数,三个 See All 页(New/TopShort/Trending)返回相同数据。这是原项目的既有行为。
- **搜索是占位**:首页搜索框只 toast,无实际搜索功能(原项目同样)。
- **For You 只展示封面**:推荐流是封面图竖滑,非真实视频播放(原项目同样)。
