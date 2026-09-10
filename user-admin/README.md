# 用户管理中心（后台管理系统）

Vue3 + Element Plus + Spring Boot 3 + MySQL(MariaDB) 的后台管理系统，包含三大模块：
后台管理员账号登录管理、APP 普通用户信息管理、股票码表基础数据维护。

## 生产部署（已完成，服务器 172.16.30.150）

| 组件 | 部署方式 | 位置 |
|------|---------|------|
| 后端 | systemd 服务 `user-admin`（jar 运行，绑定 127.0.0.1:8080） | /opt/user-admin/backend |
| 前端 | Nginx 托管静态文件（端口 80），`/api` 反向代理到 8080 | /opt/user-admin/web |
| 数据库 | MariaDB 本机（仅监听 127.0.0.1:3306） | 与后端同机 |

- 生产配置：`/opt/user-admin/backend/prod.yml`（独立 JWT 密钥、关闭 SQL 日志、验证码严格校验）
- 访问地址：内网 `http://172.16.30.150`；公网访问需在云控制台/网关做端口转发（参考现有 15022→22 的映射方式）

### 更新部署（改代码后重新发布）

```bash
cd backend && mvn package -DskipTests          # 构建 jar
cd ../frontend && npm run build && tar czf web.tar.gz -C dist .
scp -P 15022 backend/target/user-admin-backend-1.0.0.jar root@www.followman.com:/tmp/
scp -P 15022 frontend/web.tar.gz root@www.followman.com:/tmp/
ssh -p 15022 root@www.followman.com '
  cp /tmp/user-admin-backend.jar /opt/user-admin/backend/ &&
  rm -rf /opt/user-admin/web/* &&              # 先清空旧资源，避免旧版本 chunk 残留
  tar xzf /tmp/web.tar.gz -C /opt/user-admin/web &&
  rm -f /tmp/web.tar.gz /tmp/user-admin-backend.jar &&
  systemctl restart user-admin && systemctl reload nginx'
```

### 运维命令（服务器上）

```bash
systemctl status user-admin      # 后端状态
journalctl -u user-admin -f      # 后端日志（文件日志在 /opt/user-admin/logs/app.log）
systemctl restart user-admin     # 重启后端
systemctl reload nginx           # 重载前端/代理配置
```

## 目录结构

```
user-admin/
├── sql/
│   ├── schema.sql            # 建库建表（10 张表）
│   └── seed.sql              # 角色 + 菜单种子数据
├── backend/                  # Spring Boot 3 (Java 17) + MyBatis-Plus + EasyExcel
└── frontend/                 # Vue3 + Vite + Element Plus + Pinia
```

## 环境要求

- Java 17、Maven 3.9+、Node 18+
- MySQL/MariaDB（当前部署在远程服务器 172.16.30.150，本地通过 SSH 隧道连接）

## 启动步骤

### 1. 数据库（一次性初始化）

```bash
# 在数据库服务器上执行（本环境已初始化完成）
mysql < sql/schema.sql
mysql < sql/seed.sql
```

首次启动后端时自动创建初始超级管理员：**admin / admin123**（请尽快修改密码）。

### 2. SSH 隧道（连接远程数据库，本环境必需）

```bash
ssh -N -L 3306:127.0.0.1:3306 -p 15022 root@www.followman.com
```

数据库连接配置在 `backend/src/main/resources/application.yml`。

### 3. 启动后端（端口 8080）

```bash
cd backend
export DB_PASSWORD='<数据库密码，见服务器 /opt/user-admin/backend/prod.yml>'
mvn spring-boot:run
# 自动化测试可临时加：-Dspring-boot.run.jvmArguments="-Dapp.auth.captcha-dev-mode=true"
```

### 4. 启动前端（端口 5173，/api 代理到 8080）

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 账号与角色

| 账号 | 密码 | 角色 | 权限 |
|------|------|------|------|
| admin | admin123 | 超级管理员 | 全部菜单 + 全部操作 |
| ops01 | ops123456 | 运营 | 用户管理、码表管理，无管理员管理 |
| — | — | 只读角色 | 仅查看，无写权限（在管理员管理中分配） |

## 功能清单

### 模块1 管理员账号及密码登录
- 图形验证码登录（60 秒有效、点击刷新），错误提示区分：账号不存在 / 密码错误 / 验证码错误
- 连续失败 5 次锁定 15 分钟（可配置 `app.auth.max-fail-count` / `lock-minutes`）
- JWT 30 分钟过期 + 滑动续期；前端 30 分钟无操作自动登出
- 登录日志（账号、IP、时间、成功/失败、原因）
- 管理员管理（仅超管）：列表/新增/编辑/重置密码/启用禁用（禁用优先不物理删除）

### 模块2 用户基本信息管理
- 用户列表：ID/手机号（脱敏 138\*\*\*\*5678）/微信 QQ 绑定/昵称/头像/状态/注册时间/最后登录/来源
- 筛选：用户ID、手机号、昵称、注册时间范围、状态；导出 Excel
- 用户详情：基础信息（完整手机号）+ 登录历史 + 后台操作记录
- 冻结/解冻、重置手机号（全部留痕）
- 注销管理：申请列表（冷却中/已完成/已撤销，冷静期默认 7 天）

### 模块3 股票码表管理
- 列表筛选：代码/名称/市场(SH/SZ/BJ/HK/US)/状态；分页
- 新增/编辑（**代码+市场 组合唯一**）、启用/禁用（标记状态，不物理删除）
- Excel 批量导入（模板下载、逐行校验、成功/失败明细报告）、批量导出
- **从行情 API 一键同步**（stock.followman.vip，POST JSON，批量写入约 3 秒/4563 条）
- 码表变更日志（操作人、动作、变更前后数据）

### 公共能力
- 全列表统一分页；删除/冻结/导入等危险操作二次确认
- 操作日志全量留痕（只增不删），可按操作人/模块/动作/时间筛选
- 角色权限：后端接口级校验（403）+ 前端动态菜单（无权限菜单隐藏）

## 接口清单（对应需求文档）

| 需求接口 | 实际 REST 接口 | 说明 |
|----------|---------------|------|
| adminLogin | POST /api/admin/auth/login | 账号+密码+验证码 |
| adminLogout | POST /api/admin/auth/logout | |
| adminUserList | GET /api/admin/users | 分页+筛选 |
| adminUserSave | POST/PUT /api/admin/users | 新增/编辑 |
| cuserList | GET /api/cuser/list | 分页+筛选，手机号脱敏 |
| cuserDetail | GET /api/cuser/{id} | 含登录历史、操作记录 |
| cuserStatusUpdate | PUT /api/cuser/{id}/status | 冻结/解冻 |
| stockCodeList | GET /api/stock/list | 分页+筛选 |
| stockCodeSave | POST/PUT /api/stock | code+market 唯一 |
| stockImport | POST /api/stock/import | Excel 批量导入 |
| operateLogList | GET /api/log/operate/list | 操作日志查询 |

补充接口：验证码 GET /api/admin/auth/captcha、重置密码 PUT /api/admin/users/{id}/password、
重置手机号 PUT /api/cuser/{id}/phone、导出 GET /api/cuser/export、/api/stock/export、/api/stock/template、
同步 POST /api/stock/sync、码表变更日志 GET /api/stock/log、登录日志 GET /api/log/login/list、
注销管理 GET /api/cuser/cancel/list、菜单 GET /api/admin/menus、角色 GET /api/admin/roles。

统一响应 `{code, message, data}`：code=0 成功、401 未登录、403 无权限、500 业务错误。

## 配置项（application.yml）

| 配置 | 默认值 | 说明 |
|------|--------|------|
| app.jwt.expire-minutes | 30 | token 有效期 |
| app.auth.max-fail-count | 5 | 连续失败锁定阈值 |
| app.auth.lock-minutes | 15 | 锁定时长 |
| app.auth.captcha-dev-mode | false | 生产必须 false |
| app.cuser.cancel-cooling-days | 7 | 注销冷静期天数 |
| app.market.base-url | https://stock.followman.vip | 行情 API 地址 |

## 安全说明

- 密码 BCrypt 加密存储；验证码内存缓存（生产建议换 Redis）
- 远程数据库仅监听 127.0.0.1，通过 SSH 隧道访问，不暴露公网
- 生产部署请修改：JWT secret、数据库密码、关闭 captcha-dev-mode、改用 HTTPS + Nginx
