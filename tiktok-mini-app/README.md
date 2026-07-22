# 🎬 TikTok Mini App - ShortDrama

一个基于 **TikTok/字节跳动小程序** 框架的短剧流媒体 App，完美还原了设计图中的深色主题界面。

> 设计风格：黑色背景 + TikTok 红 (#FE2C55) + 青色 (#25F4EE) + 金色 (#FFD60A) 高亮

---

## ✨ 功能特性

| 页面 | 路径 | 功能 |
|------|------|------|
| 🏠 **Home** | `pages/index` | 主推视频 Banner + 分类标签 + Top Shorts 横向列表 |
| 🔥 **For You** | `pages/foryou` | 全屏竖屏短视频流（Swiper 上下滑动）+ 点赞/关注/评论 |
| 🕐 **History** | `pages/history` | 观看历史（进度条 + 继续观看 + 筛选） |
| 👤 **Profile** | `pages/profile` | 个人主页（数据统计 + VIP 徽章 + 作品网格） |

### 核心亮点
- ✅ **自定义顶部导航栏**（兼容刘海屏，动态获取状态栏高度）
- ✅ **深色主题设计系统**（CSS 变量，统一的色彩/圆角/间距 token）
- ✅ **响应式布局**（rpx 单位，适配所有机型）
- ✅ **流畅动画**（淡入、旋转、脉冲等）
- ✅ **可复用组件**（`video-card` 支持 grid/list 两种模式）
- ✅ **下拉刷新**（Home 页）
- ✅ **原生分享**（For You / Profile 页）
- ✅ **Haptic 反馈**（点击振动）

---

## 📁 项目结构

```
tiktok-mini-app/
├── app.js                      # 入口：系统信息、登录
├── app.json                    # 全局配置（页面注册、tabBar、window）
├── app.ttss                    # 全局样式 + 设计 Token
├── project.config.json         # 项目配置
├── sitemap.json                # 搜索索引
│
├── components/
│   └── video-card/             # 可复用视频卡片
│       ├── video-card.js
│       ├── video-card.ttml
│       ├── video-card.ttss
│       └── video-card.json
│
├── pages/
│   ├── index/                  # 首页（主设计图）
│   │   ├── index.js
│   │   ├── index.ttml
│   │   ├── index.ttss
│   │   └── index.json
│   ├── foryou/                 # For You 推荐页
│   ├── history/                # 观看历史
│   └── profile/                # 个人中心
│
├── utils/
│   ├── mock.js                 # 模拟数据（视频、用户、分类）
│   └── util.js                 # 工具函数（格式化、防抖、节流等）
│
└── images/                     # tabBar 图标（PNG）
    ├── tab-home.png
    ├── tab-home-active.png
    ├── tab-foryou.png
    ├── tab-foryou-active.png
    ├── tab-history.png
    ├── tab-history-active.png
    ├── tab-profile.png
    └── tab-profile-active.png
```

---

## 🚀 如何运行

### 方式一：TikTok Developer IDE（推荐）

1. 下载并安装 [**TikTok Developer Tools**](https://developers.tiktok.com/doc/miniprogram/dev/mini-program/developer-tool/developer-tool/)（海外 TikTok 小程序开发者工具）
2. 打开 IDE → **导入项目**
3. 选择 `tiktok-mini-app/` 目录
4. AppID 选择「测试号」或填入你自己的 AppID
5. 点击编译即可预览

### 方式二：抖音开发者工具（国内）

> 注：国内抖音小程序与 TikTok 小程序的 API 基本兼容（`tt.*`），文件扩展名也一致（`.ttml` / `.ttss`）。

1. 下载 [**抖音开发者工具**](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/developer-instrument/developer-instrument-update-and-download)
2. 导入项目目录
3. 直接预览

### 方式三：在手机上预览

1. 在开发者工具中点击「预览」
2. 用 TikTok / 抖音 App 扫描二维码即可在手机上打开

---

## 🎨 设计规范

### 配色（Color Palette）

| Token | 颜色 | 用途 |
|-------|------|------|
| `--color-bg` | `#000000` | 主背景 |
| `--color-bg-card` | `#1C1C1E` | 卡片背景 |
| `--color-accent` | `#FE2C55` | TikTok 红（主按钮、强调） |
| `--color-accent-cyan` | `#25F4EE` | TikTok 青（副标题、装饰） |
| `--color-gold` | `#FFD60A` | 金色（标题、VIP、评分） |
| `--color-text-primary` | `#FFFFFF` | 主文字 |
| `--color-text-secondary` | `#8E8E93` | 次要文字 |

### 圆角

- `--radius-sm`: 8rpx（标签、小按钮）
- `--radius-md`: 16rpx（小卡片、按钮）
- `--radius-lg`: 24rpx（视频卡片）
- `--radius-xl`: 32rpx（Banner、主卡片）

### 间距

- 使用 8 的倍数：8 / 16 / 24 / 32 / 48 rpx

---

## 🔧 自定义配置

### 替换为你自己的数据

修改 `utils/mock.js`，替换其中的 `featuredVideo`、`topShorts`、`forYouFeed` 等数据即可。

### 接入真实后端

在各个页面的 `onLoad` 中替换为真实的 `tt.request` 调用：

```js
tt.request({
  url: 'https://your-api.com/videos',
  success: (res) => {
    this.setData({ shorts: res.data });
  },
});
```

### 替换图标

`images/` 目录下的 PNG 文件可以直接替换为你自己的图标（建议 81x81 px，PNG 格式，透明背景）。

---

## 📱 截图说明

**Home 首页**：
- 顶部搜索栏 + 汉堡菜单
- 大幅主推视频 Banner（含标签、标题、描述、类型、Play 按钮）
- 分类标签横滑
- Top Shorts 横滑短剧列表

**For You 推荐页**：
- 全屏竖屏视频背景
- 顶部 Following / For You Tab 切换
- 右侧操作栏（头像 + 关注、点赞、评论、分享）
- 底部作者、标题、描述、话题标签、音乐信息

---

## 📄 License

MIT License - 可自由使用、修改、分发。

---

## 💡 后续可扩展

- [ ] 接入真实视频播放器（`<video>` 组件）
- [ ] 搜索页（含搜索历史、热搜榜）
- [ ] 视频详情页（剧集列表、评论列表）
- [ ] 消息中心
- [ ] 充值 VIP
- [ ] 数据埋点
- [ ] 国际化 i18n

---

Made with ❤️  -  还原你的设计稿
