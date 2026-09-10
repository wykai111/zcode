# 资源清单 (Asset Inventory)

原始试玩广告是 Mintegral 单文件打包：所有资源以 base64 + zlib 压缩进一个
`window.__adapter_zip__` blob。本目录已把它解开为标准 Cocos Creator 3.7.4
web-mobile 构建产物，共 **76 个文件**（58 二进制 + 18 文本）。

## 目录结构

```
bitcoin-miner-decompiled/
├── index.html                  ← 本地启动入口（已替换掉 adapter zip 机制）
├── source.html                 ← 原始 Mintegral HTML（只读存档）
├── js/                         ← 原 CDN 上的脚本（已解压），仅供溯源
│   ├── 70d6…js  (1.6MB)        ← 含 __adapter_zip__ 赋值（zlib base64）
│   ├── e309…js  (1.3MB)        ← __adapter_zip__ 追加片段
│   ├── aec1…js                ← adapter 解包器（pako.inflate + JSON.parse）
│   ├── 8b89…js                ← adapter fetch/SystemJS 劫持层
│   ├── 7762…js                ← pako (zlib 解压库)
│   └── …
├── extract.js                  ← 解包脚本（可重跑）
└── assets/                     ← ★ 完整 Cocos 项目，所有可替换资源都在这里
    ├── application.js          ← Cocos Application 入口
    ├── index.js                ← SystemJS 入口（创建 canvas + 启动引擎）
    ├── cocos-js/cc.js          ← Cocos Creator 3.7.4 引擎 (2.7MB)
    └── src/
        ├── settings.json       ← 引擎/项目设置（分辨率 720×1280，启动场景…）
        ├── import-map.json     ← {"cc":"./../cocos-js/cc.js"}
        ├── polyfills.bundle.js ← Promise/fetch 等 polyfill
        ├── system.bundle.js    ← SystemJS
        └── chunks/bundle.js    ← Mraid/广告桥接代码
    └── assets/                 ← 游戏资源 bundles
        ├── internal/           ← 引擎内置资源
        └── main/               ← 主 bundle（游戏本体）
            ├── config.json     ← UUID/路径/版本映射
            ├── index.js        ← ★ 游戏全部 48 个 TS 脚本（编译后）
            ├── import/         ← 序列化资源描述 (.json/.cconb)
            └── native/         ← ★ 真正的图片/音频/字体文件
```

## 可替换的视觉/听觉资源

全部位于 `assets/assets/main/native/`，文件名是 Cocos 的 UUID。
**同名覆盖即可替换**，无需改任何代码。

### 图片 (34 张 PNG)
按用途/尺寸推断（原项目无文件名，UUID 是运行时 ID）：

| 尺寸 | 数量 | 推断用途 |
|------|------|---------|
| 1024×1024 | 2 | 大背景图（d661fe23… 84KB、747e9fe2… 36KB）|
| 512×512 | 3 | 主角色/矿工精灵（8e68a8f5… 233KB、44b181bf… 108KB、71304163… 66KB）|
| 256×256 | 1 | 中等图标/道具（d9002f1b… 52KB）|
| 128×128 | 1 | 图标（039f661e…）|
| 101×84 | 2 | UI 按钮底板 |
| 63×49 | 6 | 矿石/小图标 |
| 40×40 | 3 | 小图标 |
| 其它小图 | 16 | 粒子/光斑/1×1 占位 |

含纹理压缩版本（同一 UUID 4 种格式）：
- `.png`  通用 / WebGL
- `.astc` ASTC（移动端）
- `.pkm`  ETC1（Android）
- `.pvr`  PVRTC（iOS）

> 替换时建议**只换 .png**；若要移动端等价，需用 Cocos 的纹理压缩工具同步生成 astc/pkm/pvr，否则移动端会回退到 png。

### 音频 (6 个)
| 文件 | 大小 | 推断 |
|------|------|------|
| b0f0bb33…mp3 | 496KB | 背景音乐（最长）|
| c29907b4…wav | 110KB | 音效（挖矿？）|
| 39d19996…wav |  82KB | 音效 |
| 9dce07d6…wav |  29KB | 音效（点击？）|
| 53438407…wav |  23KB | 音效 |
| b1abb801…wav |  12KB | 短音效 |

### 字体 (1 个)
`assets/assets/main/native/0a/0a8bc9ae…/FT_NotoSerif_Regular.ttf` — Noto Serif Regular

### 动画片段 (5 个 .cconb)
Cocos 序列化二进制，含动画名（从内部字符串提取）：
- `6372247c…cconb` → **A_Miner_02**（矿工动画2）
- `ad5a0a6d…cconb` → **A_Miner_01**（矿工动画1）
- `c64d46ae…cconb` → **A_Miner_03**（矿工动画3）
- `e3cc0d7d…cconb` → **A_CashOut_Hand**（提现手势）
- `ea39cf49…cconb` → **A_starburst_spin**（星光爆裂）

## 游戏脚本（48 个 TS 类，编译在 main/index.js）

从 `System.register("chunks:///_virtual/XXX.ts")` 还原：

**广告/桥接**：MraidManager、MraidAccess、MraidLinks、MraidReadyState(2)、
AdManager、AdState、AdTimer、AdEndButton、AdToggledNode、GameOverDownloadHandler、
GameOverScreenController、MobilePlatform(Detection)

**核心玩法**：
- 矿区：MineSectionController、MineOpenButton、MineOpenHandHint、ConditionalMineElement、MineEventType
- 金币：CoinPathContainer、CoinSpeedManager、CoinEventType、TotalEarningsUI
- 角色：HandVisual、UpgradeHandVisual、PigVisuals、PiggyBankHandler
- 升级：RowUIController、RowUpgradeButtonHandler
- 提现：CashOutScreen、ConstantCTAButton
- 音频：AudioManager、AudioPlayer、AudioGroup、AudioType
- 通用：GameData、Evt、Help、DelayLogic、IdComponent、IdRef、FocusTarget、
  PlayerFocus、InitialOverlayManager、KeyValuePair

**启动场景**：`db://assets/_Game/Scenes/SCNE_Playable.scene`
**设计分辨率**：720 × 1280（竖屏）
**自定义图层**：GAMEOVER / Coins / Wires / Environment
