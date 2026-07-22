# 🎬 ShortDrama 短剧管理后台

服务于 TikTok 短剧小程序的后端 + 管理系统。包含数据库、API、管理后台前端三部分。

## 📁 项目结构

```
drama-admin/
├── server/                    # 后端 Node.js + Express
│   ├── src/
│   │   ├── config/db.js       # MySQL 连接池
│   │   ├── models/            # 数据访问层（drama/episode/category/admin/history）
│   │   ├── routes/
│   │   │   ├── api/           # 小程序前端 API（无需鉴权）
│   │   │   └── admin/         # 管理后台 API（需 JWT 鉴权）
│   │   ├── middleware/auth.js # JWT 鉴权
│   │   ├── utils/initAdmin.js # 初始化管理员脚本
│   │   └── app.js             # Express 入口
│   ├── sql/
│   │   ├── schema.sql         # 建表语句（6 张表）
│   │   └── seed.sql           # 种子数据
│   ├── uploads/               # 上传的图片
│   ├── .env                   # 配置
│   └── package.json
│
└── web/                       # 管理后台前端 Vue + Element Plus
    ├── src/
    │   ├── api/               # axios 请求封装
    │   ├── views/             # 页面（dashboard/drama/episode/category/login）
    │   ├── router/            # 路由 + 登录守卫
    │   ├── layout/            # 侧边栏布局
    │   └── App.vue
    ├── vite.config.js
    └── package.json
```

## 🚀 快速启动

### 前置要求
- Node.js 16+
- MySQL 5.7+ / 8.0

### 1. 初始化数据库

```bash
# 登录 MySQL 执行建表和种子数据
mysql -u root -p < server/sql/schema.sql
mysql -u root -p < server/sql/seed.sql
```

### 2. 启动后端

```bash
cd server

# 修改配置（数据库密码等）
vi .env

# 安装依赖
npm install

# 初始化管理员账号（首次）
npm run init-admin

# 启动服务
npm start
# 后端运行在 http://localhost:3000
```

### 3. 启动管理后台前端

```bash
cd web
npm install
npm run dev
# 前端运行在 http://localhost:5173
```

打开 http://localhost:5173 ，用 **admin / admin123** 登录。

---

## 🗄️ 数据库设计

### ER 关系图

```
categories 1───M dramas 1───M episodes
                    │
                    │
                users 1───M watch_history M───1 dramas
```

### 6 张表

| 表 | 说明 | 主要字段 |
|----|------|---------|
| `categories` | 分类 | id(slug), name, icon, sort_order |
| `dramas` | 短剧（核心） | id, title, cover, description, category_id, episodes, rating, views, tag, **board**(JSON), **tags**(JSON), duration, status |
| `episodes` | 剧集 | id, drama_id, ep_number, label, free, duration, video_url |
| `users` | 用户 | id, openid, nickname, vip, following, followers, likes |
| `watch_history` | 观看历史 | user_id, drama_id, ep_number, progress, watched_at |
| `admins` | 管理员 | username, password(bcrypt), nickname |

### 关键设计：board 字段

`dramas.board` 是 JSON 数组，标识短剧出现在首页哪些板块：

```json
["gallery", "new", "topshort", "trending"]
```

一部剧可以同时出现在多个板块（如 "Out of Control" 同时在 Gallery + Trending + Top Shorts）。

---

## 🔌 小程序前端数据接口

> 所有接口返回统一格式：`{ code: 0, message, data }`，`code === 0` 表示成功。

### 1. 首页聚合数据

```
GET /api/home
```

返回首页所有板块数据，**一次请求拿全首页内容**：

```json
{
  "code": 0,
  "data": {
    "gallery": [...],        // 画廊轮播（4条）
    "topShorts": [...],      // Top Shorts（6条）
    "newArrivals": [...],    // New Arrivals（3条）
    "trending": [...]        // Trending（6条）
  }
}
```

### 2. 短剧列表（See All 页）

```
GET /api/dramas?board=new&page=1&pageSize=20
```

| 参数 | 说明 |
|------|------|
| `board` | 按板块筛选：`gallery`/`new`/`topshort`/`trending` |
| `categoryId` | 按分类筛选 |
| `keyword` | 搜索关键字 |
| `page` / `pageSize` | 分页 |

### 3. 短剧详情

```
GET /api/dramas/:id
```

### 4. 短剧的剧集列表

```
GET /api/dramas/:id/episodes
```

```json
{
  "data": {
    "total": 30,
    "episodes": [
      { "id": "ep_001_01", "ep": 1, "label": "EP 1", "free": true, "duration": "0:58" },
      ...
    ]
  }
}
```

### 5. 分类列表

```
GET /api/categories
```

### 6. 观看历史

```
GET /api/history?userId=user_001
POST /api/history
```

POST body：
```json
{ "user_id": "user_001", "drama_id": "drama_001", "ep_number": 5, "progress": 75 }
```

---

## 🛠️ 管理后台 API（需 JWT 鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/admin/login` | 管理员登录，返回 token |
| GET | `/admin/dashboard` | 数据概览 |
| GET/POST/PUT/DELETE | `/admin/dramas` | 短剧 CRUD |
| POST | `/admin/dramas/:id/episodes/generate` | 批量生成剧集 |
| GET/PUT/DELETE | `/admin/episodes` | 剧集管理 |
| GET/POST/PUT/DELETE | `/admin/categories` | 分类 CRUD |
| POST | `/admin/upload` | 上传封面图 |

所有 `/admin/*` 接口（除 login）需在 Header 带上：
```
Authorization: Bearer <token>
```

---

## 📱 小程序对接示例

把 `tiktok-mini-app/utils/mock.js` 的静态数据替换为 `tt.request` 调用：

```js
// 之前：const { gallery } = require('../utils/mock')
// 现在：
const API_BASE = 'http://localhost:3000/api';

function fetchHome() {
  return new Promise((resolve, reject) => {
    tt.request({
      url: `${API_BASE}/home`,
      success: (res) => {
        if (res.data.code === 0) resolve(res.data.data);
        else reject(res.data);
      },
      fail: reject,
    });
  });
}

// 在 index.js 的 onLoad 中：
onLoad() {
  fetchHome().then((data) => {
    this.setData({
      gallery: data.gallery,
      topShorts: data.topShorts,
      newArrivals: data.newArrivals,
      trending: data.trending,
    });
  });
}
```

---

## 🔒 安全

- 管理员密码 **bcrypt** 加密存储
- JWT token 鉴权（默认 7 天有效期）
- SQL **参数化查询**，防注入
- 上传文件大小限制 5MB，类型白名单
- `.env` 配置敏感信息，不入版本库

---

## 📄 License

MIT
