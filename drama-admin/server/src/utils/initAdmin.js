// 初始化管理员账号脚本
// 用法: node src/utils/initAdmin.js
const bcrypt = require('bcryptjs');
require('dotenv').config();
const adminModel = require('../models/admin');

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await adminModel.findByUsername(username);
  if (existing) {
    // 重置密码
    const hash = await bcrypt.hash(password, 10);
    const pool = require('../config/db');
    await pool.query('UPDATE admins SET password = ? WHERE username = ?', [hash, username]);
    console.log(`✓ 已重置管理员 [${username}] 的密码`);
  } else {
    await adminModel.create({ username, password, nickname: '超级管理员' });
    console.log(`✓ 已创建管理员 [${username}]`);
  }
  console.log(`  账号: ${username}`);
  console.log(`  密码: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ 初始化失败:', err.message);
  console.error('  请确认数据库已启动并已执行 schema.sql');
  process.exit(1);
});
