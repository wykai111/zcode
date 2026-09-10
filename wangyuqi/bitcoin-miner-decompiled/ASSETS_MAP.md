# Bitcoin Miner 试玩广告 — 素材修改指南

> 目标：让你**不用碰任何代码**，就能替换游戏里的图片 / 音频 / 字体。

---

## 一、30 秒上手

所有可替换素材都已经按**人类可读的名字**复制到 `friendly/` 目录：

```
friendly/
├── images/   ← 34 张 PNG，文件名 = 用途__原始UUID.png
├── audio/    ← 6 个音频（1 背景音乐 + 5 音效）
├── font/     ← 1 个字体 FT_NotoSerif_Regular.ttf
└── manifest.json  ← 完整对照表（UUID ↔ 文件名 ↔ 用途）
```

**替换流程：**
1. 打开 `friendly/images/`，找到你要换的图（文件名已说明是什么）。
2. 用同尺寸 / 同比例的新图**覆盖**它（或编辑后另存为同名文件）。
3. 运行 `./apply-assets.sh`，把改好的素材同步回游戏目录。
4. 用浏览器打开 `index.html` 预览效果（见第三节）。

> ⚠️ 文件名里的 `__UUID` 部分必须保留，脚本靠它定位原始文件。

---

## 二、完整素材清单

### 角色 (Characters)

| 友好名 | 尺寸 | 原始文件 (UUID) | 说明 |
|--------|------|-----------------|------|
| T_Miner_01 | 63×49 | `1bb7cdcd-7991-413f-b5cf-d2d3f8305232` | 矿工角色帧 1 |
| T_Miner_02 | 63×49 | `5a7efef3-974d-4983-8fd9-7d5ce3b4cc6f` | 矿工角色帧 2 |
| T_Miner_03 | 63×49 | `79615220-1d97-4341-ad66-965c448e24dd` | 矿工角色帧 3 |
| T_Miner_04 | 63×49 | `fd90e441-4c13-454d-ba4d-2dbbdbc270dc` | 矿工角色帧 4 |
| T_Miner_portrait | 63×49 | `13300433-c80c-4f91-ab74-2f684ca9d96b` | 矿工头像帧 |
| T_Miner_avatar | 127×126 | `28463a74-17ef-44fc-9b91-dd5cc0dae836` | 矿工立绘（大图，含 `_a`） |
| T_Pig_Side_01 | 101×84 | `2557ff53-e2f0-4576-a657-5d74b8efb63d` | 小猪存钱罐 - 侧面 1 |
| T_Pig_Side_02 | 101×84 | `d91e89b6-134f-46f2-aeb4-63e86b92661f` | 小猪存钱罐 - 侧面 2 |

> 💡 6 个 `T_Miner_*`（63×49）是矿工挖矿动画的逐帧，建议整套一起换保持风格统一。

### UI / 按钮 (Buttons & UI)

| 友好名 | 尺寸 | 原始文件 (UUID) | 说明 |
|--------|------|-----------------|------|
| **T_Button_01a_CTA** | 1024² | `43938fbd-107f-4348-afdd-be1c8082af89` | 下载 CTA 按钮 - 橙 1 ⭐ |
| **T_Button_02b_CTA** | 1024² | `747e9fe2-4e32-4dff-b1e4-9157882ce7ea` | 下载 CTA 按钮 - 橙 2 ⭐ |
| **T_Button_03_CTA** | 1024² | `d661fe23-9bdf-435f-ad78-415fe5ea638d` | 下载 CTA 按钮 - 绿 ⭐ |
| T_Icon_Pointer | 24² | `26f0698e-4cc0-4062-8c8a-2863701ac419` | 手指引导指针 |
| T_Mask_01_Wide | 128×16 | `66fbcd42-d182-4144-b1c5-7ce274fcde8d` | 遮罩/裁切条 1 |
| T_Mask_02_Wide_02 | 64×16 | `5cfb3e65-1111-4fad-8a73-c1ff5979e726` | 遮罩/裁切条 2 |
| default_btn_normal | 40² | `20835ba4-6145-4fbc-a58a-051ce700aa3e` | 引擎默认按钮-常态 |
| default_btn_pressed | 40² | `544e49d6-3f05-4fa8-9a9e-091f98fc2ce8` | 引擎默认按钮-按下 |
| default_btn_disabled | 40² | `57520716-48c8-4a19-8acf-41c9f8777fb0` | 引擎默认按钮-禁用 |
| default_btn_normal_2 | 40² | `951249e0-9f16-456d-8b85-a6ca954da16b` | 引擎默认按钮 (副本) |

> ⭐ **CTA 按钮**（Call-To-Action）是广告最关键的转化素材——"Download / Install / Play Now"。
> 3 个 1024² 大图各自带有 `.astc/.pkm/.pvr` 压缩版本（移动端用），见第五节。

### 图标 / Logo (Icons)

| 友好名 | 尺寸 | 原始文件 (UUID) | 说明 |
|--------|------|-----------------|------|
| **T_BitcoinLogo** | 512² | `71304163-d1df-4539-bf33-ba433225fc26` | 比特币金币 Logo |
| **Icon1_rounded** | 512² | `44b181bf-d459-477a-9611-e8e94c7cac46` | 应用图标 / 圆角图标 |
| T_Burst_Gold | 512² | `8e68a8f5-994d-4aa3-9547-3e3ba0fc7b1b` | 金色爆炸 / 星光特效 |
| T_Coin_icon | 32² | `2cb10f3a-aa5f-4ee3-a9dc-47e19c9a3809` | 比特币小图标 |
| T_Icon_GoldCoin | 22×24 | `b3eee01a-85e3-4c33-a5a5-b2bcfbeb246d` | 金币小图标 |
| T_Thumbnail_Hills | 128² | `039f661e-e9a2-4a65-85fa-579d14ba7c79` | 场景缩略图 / 背景预览 |

### 场景道具 (Props & Environment)

| 友好名 | 尺寸 | 原始文件 (UUID) | 说明 |
|--------|------|-----------------|------|
| T_Panelling | 256² | `d9002f1b-013d-49c9-aede-7de2ba527652` | 镶板 / 平台贴图 |
| T_Hills_Tree_01 | 52×44 | `829e7fdd-566b-406b-972b-359e16a73d46` | 树 1 |
| T_Hills_Tree_02 | 38×40 | `7ddd1139-606d-46fa-8a69-4fc870f6c260` | 树 2 |
| T_Hills_Barrel | 27×31 | `e0e9fc8e-ea98-49db-940a-8028ba4575c2` | 木桶 |
| T_Platform_01 | 16² | `4463a0b9-8203-47c8-88c6-6790540af505` | 木板 / 平台纹理 |
| T_Dirt_02 | 16² | `c8ce7985-e288-49bb-8fe0-39c3f29cb78c` | 泥土纹理 2 |
| T_Dirt_01_comp | 16² | `4bd475f5-fdeb-4c07-bfce-810a038197e1` | 泥土纹理 1（含压缩） |
| T_Wire | 8² | `75e69599-2ab7-4ba0-854f-bfc9ad07776b` | 金币轨道 / 电线（含压缩） |
| T_Power | 8² | `cb3aee13-b07b-4816-bb47-298514aeadb9` | 电力 / 连接点（含压缩） |
| T_Square_1by1 | 1×1 | `caa2fd1a-574e-412c-8e36-5bce9bbf1f0d` | 1×1 占位图（不可见，可忽略） |

### 音频 (Audio)

| 友好名 | 格式 | 原始文件 (UUID) | 说明 |
|--------|------|-----------------|------|
| BGM_background | mp3 (484K) | `b0f0bb33-2427-41e0-8dbc-ecc1d4d94152` | 背景音乐 |
| SFX_mining_01 | wav (107K) | `c29907b4-4854-42e8-8f9d-ba03a11dff43` | 音效 - 挖矿 |
| SFX_02 | wav (80K) | `39d19996-9c37-49ed-8033-9544b7d0b526` | 音效 |
| SFX_click | wav (28K) | `9dce07d6-2b7d-40f8-b525-c8205bdc51ba` | 音效 - 点击 |
| SFX_03 | wav (23K) | `53438407-5d6f-4490-ae6e-82649b9531c1` | 音效 |
| SFX_short | wav (12K) | `b1abb801-9e2f-4062-b1db-f412148a9212` | 短音效 |

### 字体 (Font)

| 友好名 | 原始文件 (UUID) | 说明 |
|--------|-----------------|------|
| FT_NotoSerif_Regular | `0a8bc9ae-7252-4120-b211-bc6d484a118d` | Noto Serif Regular (ttf, 96K) |

---

## 三、预览 / 调试

### ⭐ 方式一：双击打开单文件（最简单）

直接双击 **`bitcoin-miner-standalone.html`**（3.0 MB），用浏览器打开即可。
这是一个把引擎 + 全部 80 个资源内联进单个 HTML 的独立版本，**不需要起 server**，
双击就能玩。适合快速预览改完素材后的效果。

> 改完素材后，运行 `node pack-standalone.js` 重新生成这个单文件，再双击打开即可看到最新效果。

### 方式二：本地 server（调试引擎内部用）

本项目是从 Mintegral 单文件广告解包出来的标准 **Cocos Creator 3.7.4** web-mobile 构建。
游戏入口在 `bitcoin-miner-decompiled/index.html`（已替换掉原始 adapter zip 机制，资源走本地文件）。

```bash
cd bitcoin-miner-decompiled
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/
```

设计分辨率 **720×1280（竖屏）**，建议用 Chrome 设备模拟器（手机模式）查看。

---

## 四、替换素材的标准流程

`friendly/` 只是**预览副本**。改好后必须同步回游戏真实目录，引擎才能加载到。

**完整三步：**

```bash
cd bitcoin-miner-decompiled

# 1. 把 friendly/ 里改过的素材同步回 assets/ 真实目录
./apply-assets.sh

# 2. 重新打包成单文件（这样双击打开的就是最新素材）
node pack-standalone.js

# 3. 双击 bitcoin-miner-standalone.html 预览
```

`apply-assets.sh` 读取 `friendly/manifest.json`，把每个改过的文件按 UUID 复制回
`assets/assets/main/native/<XX>/<UUID>.<ext>` 的正确位置。
**只同步比源文件新的文件**，没改过的不会被动到。

### 单独替换一个文件（手动）

以替换「下载按钮 1」为例：

```bash
# 1. 你的新图准备好后，复制到 native 目录（替换 .png）
cp 新按钮.png \
   assets/assets/main/native/43/43938fbd-107f-4348-afdd-be1c8082af89.png

# 2. 重新预览
python3 -m http.server 8080
```

> 注意路径前缀 `43/` 是 UUID 的前两位。每个素材的真实路径见 `friendly/manifest.json`
> 的 `variants` 字段，或下表。

---

## 五、纹理压缩（重要）

4 个素材除了 `.png`，还带有移动端专用压缩格式：

| 素材 | .png | .astc | .pkm | .pvr |
|------|------|-------|------|------|
| T_Button_01a_CTA (`43938fbd`) | ✅ | ASTC(移动) | ETC1(Android) | PVRTC(iOS) |
| T_Dirt_01_comp (`4bd475f5`) | ✅ | ✅ | ✅ | ✅ |
| T_Wire (`75e69599`) | ✅ | ✅ | ✅ | ✅ |
| T_Power (`cb3aee13`) | ✅ | ✅ | ✅ | ✅ |

- **只换 `.png`** → 桌面浏览器正常，但真机（移动端）可能仍显示旧图（引擎优先用压缩版）。
- 要移动端等价：需用 Cocos Creator 的纹理压缩工具重新生成 `.astc/.pkm/.pvr`，
  或把这 3 个小图（dirt/wire/power）直接删掉压缩版让引擎回退到 png。

> 一般桌面预览调试只换 `.png` 就够了。

---

## 六、各目录速查

| 路径 | 作用 |
|------|------|
| `friendly/` | ⭐ **你在这里改素材**（人类可读文件名） |
| `friendly/manifest.json` | UUID ↔ 文件名 ↔ 用途 完整对照表 |
| `assets/assets/main/native/` | 引擎**真正读取**的资源目录（UUID 命名） |
| `assets/assets/main/index.js` | 游戏全部 48 个 TS 脚本（编译后，非素材） |
| `assets/src/settings.json` | 引擎设置（分辨率 720×1280、启动场景） |
| `index.html` | 本地预览入口 |
| `source.html` | 原始 Mintegral HTML（只读存档） |
| `js/` | 原 CDN 脚本解压（仅供溯源，不要改） |
| `extract.js` / `pack*.js` | 解包 / 重打包工具脚本 |

---

## 七、注意事项

1. **保持尺寸一致**：替换图的像素尺寸最好和原图相同，否则 Cocos 的 SpriteFrame
   （`rect/originalSize` 在 import JSON 里写死了）可能裁切错位。要改尺寸需同步改
   `assets/assets/main/import/` 下对应 JSON 的 `width/height`。
2. **保持透明通道**：角色 / 按钮 / 图标都是有透明背景的 PNG，替换时不要压平背景。
3. **`_a.png` 变体**：少数图（矿工立绘、按钮）带 `_a.png`，是 alpha 通道分离版，
   引擎用于特定混合模式。替换主图后建议同步生成或一并替换。
4. 改完先本地 `http.server` 预览确认无误，再考虑重打包回 Mintegral 单文件
   （用 `pack-standalone.js`）。
