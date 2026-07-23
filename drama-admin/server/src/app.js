// Express 应用入口
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件：上传的图片
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== 路由挂载 =====
// 小程序前端 API（无需鉴权）
app.use('/api/home', require('./routes/api/home'));
app.use('/api/dramas', require('./routes/api/dramas'));
app.use('/api/categories', require('./routes/api/categories'));
app.use('/api/history', require('./routes/api/history'));
app.use('/api/foryou', require('./routes/api/foryou'));

// 管理后台 API
// auth 路由内含 /login 和 /profile，挂载到 /admin
app.use('/admin', require('./routes/admin/auth'));
// 以下路由内部已用 authRequired 中间件鉴权
app.use('/admin/dramas', require('./routes/admin/dramas'));
app.use('/admin/episodes', require('./routes/admin/episodes'));
app.use('/admin/categories', require('./routes/admin/categories'));
app.use('/admin/upload', require('./routes/admin/upload'));
app.use('/admin/dashboard', require('./routes/admin/dashboard'));

// 健康检查
app.get('/health', (req, res) => res.json({ code: 0, message: 'ok', data: { uptime: process.uptime() } }));

// 404
app.use((req, res) => {
  res.json({ code: 404, message: `路由不存在: ${req.method} ${req.path}`, data: null });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.json({ code: 500, message: err.message || '服务器错误', data: null });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  ShortDrama Admin Server');
  console.log('========================================');
  console.log(`  API:    http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log('========================================');
  console.log('  小程序 API:');
  console.log(`    GET  /api/home          首页聚合`);
  console.log(`    GET  /api/dramas        短剧列表`);
  console.log(`    GET  /api/dramas/:id    短剧详情`);
  console.log(`    GET  /api/categories    分类列表`);
  console.log('  管理后台 API:');
  console.log(`    POST /admin/login       管理员登录`);
  console.log(`    CRUD /admin/dramas      短剧管理`);
  console.log('========================================');
});

module.exports = app;
