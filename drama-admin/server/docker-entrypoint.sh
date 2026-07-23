#!/bin/sh
# 后端容器启动脚本
# 1. 等待 MySQL 就绪
# 2. 初始化管理员账号
# 3. 启动 Express 服务

set -e

echo "[entrypoint] 等待 MySQL 就绪..."
MAX_WAIT=60
WAITED=0
until node -e "
  const mysql = require('mysql2/promise');
  const host = process.env.DB_HOST || 'db';
  const port = process.env.DB_PORT || 3306;
  mysql.createConnection({
    host, port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    connectTimeout: 2000,
  }).then(c => c.end()).then(() => process.exit(0)).catch(() => process.exit(1));
" 2>/dev/null; do
  WAITED=$((WAITED + 2))
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "[entrypoint] ✗ MySQL 等待超时（${MAX_WAIT}s）"
    exit 1
  fi
  echo "[entrypoint] 等待 MySQL... (${WAITED}s)"
  sleep 2
done
echo "[entrypoint] ✓ MySQL 已就绪"

# 初始化管理员（幂等：存在则重置密码，不存在则创建）
echo "[entrypoint] 初始化管理员账号..."
node src/utils/initAdmin.js || echo "[entrypoint] ⚠ init-admin 失败，继续启动"

# 启动服务
echo "[entrypoint] 启动 Express 服务 (port ${PORT:-3000})..."
exec node src/app.js
