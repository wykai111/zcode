# 车言槽（12315car.com）网站复刻

根据 https://www.12315car.com 的分类模块重建的汽车消费维权信息门户，纯浏览展示型网站（原生 HTML + JavaScript，零构建工具）。

所有数据实时来源于官方接口 `https://carapi.12315car.com`（接口文档：https://carapi.12315car.com/swagger-ui/index.html），接口已放开 CORS，前端直连无需代理。

## 页面模块

| 页面 | 路径 | 数据接口 |
|------|------|----------|
| 首页（轮播+最新投诉+最新吐槽+新闻） | `index.html` | `/api/banner/list` `/api/complaint/list` `/api/topic/list` `/api/cms/post/list` |
| 投诉列表（20条/页） | `complaint/index.html` | `/api/complaint/list` |
| 投诉详情 + 评论（10条/页） | `complaint/show.html?id=` | `/api/complaint/get` `/api/complaint/comment/list` |
| 吐槽列表（20条/页） | `topic/index.html` | `/api/topic/list` |
| 吐槽详情 + 评论（10条/页） | `topic/show.html?id=` | `/api/topic/get` `/api/topic/comment/list` |
| 新闻中心（按栏目分组） | `cms/index.html` | `/api/cms/catalog/list` `/api/cms/post/list` |
| 栏目新闻列表（分页） | `cms/list.html?id=` | `/api/cms/post/list` |
| 新闻详情（富文本） | `cms/show.html?id=` | `/api/cms/post/get` |
| 能耗榜（续航排名表格） | `ranking/index.html` | `/api/catalog/rank` |
| 下载中心（APP 介绍/二维码/APK） | `download/index.html` | 静态（APK: `https://carapi.12315car.com/files/app.apk`） |

## 本地运行

任意静态服务器均可，例如：

```bash
cd car12315-website
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 发布部署

本站为纯静态站点（零构建、无后端依赖、CORS 直连数据接口），解压后部署到任意静态服务即可：

- **Nginx**：将整个目录内容放入站点根目录
  ```nginx
  server {
      listen 80;
      server_name your.domain.com;
      root /var/www/car12315-website;
      index index.html;
  }
  ```
- **对象存储 / CDN**：上传全部文件至 OSS / COS / S3 等并开启静态托管，访问入口 `index.html`
- **GitHub Pages / Vercel / Netlify**：直接上传目录，构建命令留空，发布目录为根目录

注意：页面数据实时来自 `https://carapi.12315car.com`，部署环境需能访问该接口（浏览器端直连，服务器无需代理）。

## 技术说明

- 原生 HTML/JS 多页面结构，v2 视觉升级：吸顶品牌导航、渐变 Hero 统计区、两栏门户布局、卡片化列表、数字页码分页、返回顶部、深色页脚
- `assets/js/app.js` 公共库：接口请求封装（POST JSON，`code==0` 校验）、日期格式化、HTML 转义、数字页码分页（链接式/AJAX式）、轻量轮播、轻量灯箱、页头页脚注入、评论列表组件、返回顶部
- 投诉状态：`0=已解决`（绿）、`2=已答复`（黄，展示平台答复 `responseText`）、其余为 `待答复`（红）
- 图片加载失败自动替换占位图；接口无数据时显示空态提示；列表图片懒加载
- 静态资源（bootstrap/font-awesome 字体图标）已下载至 `vendor/`，离线可用
