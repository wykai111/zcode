-- ============================================================
-- 用户管理中心（后台管理系统）数据库建表脚本
-- 数据库: user_admin   字符集: utf8mb4
-- 目标服务器: 172.16.30.150 (MariaDB, 本地通过 SSH 隧道连接)
-- ============================================================

CREATE DATABASE IF NOT EXISTS user_admin
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE user_admin;

-- ------------------------------------------------------------
-- 1. 后台管理员表 sys_admin（禁用优先，不物理删除）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sys_admin`;
CREATE TABLE `sys_admin` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT,
  `username`        VARCHAR(64)  NOT NULL COMMENT '登录账号',
  `password`        VARCHAR(100) NOT NULL COMMENT 'bcrypt 加密密码',
  `real_name`       VARCHAR(64)  DEFAULT NULL COMMENT '姓名',
  `role_id`         BIGINT       DEFAULT NULL COMMENT '角色ID',
  `is_super`        TINYINT      DEFAULT 0 COMMENT '1=超级管理员 0=普通',
  `status`          TINYINT      DEFAULT 1 COMMENT '1=启用 0=禁用',
  `fail_count`      INT          DEFAULT 0 COMMENT '连续登录失败次数',
  `lock_until`      DATETIME     DEFAULT NULL COMMENT '锁定截止时间',
  `last_login_time` DATETIME     DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip`   VARCHAR(64)  DEFAULT NULL COMMENT '最后登录IP',
  `created_at`      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted`         TINYINT      DEFAULT 0 COMMENT '逻辑删除 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台管理员';

-- ------------------------------------------------------------
-- 2. 角色表 sys_role
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `code`       VARCHAR(32)  NOT NULL COMMENT '角色编码',
  `name`       VARCHAR(64)  NOT NULL COMMENT '角色名称',
  `menu_ids`   TEXT         COMMENT '菜单ID集合，逗号分隔',
  `perms`      TEXT         COMMENT '操作权限标识集合，逗号分隔（如 cuser:status,stock:save）',
  `remark`     VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台角色';

-- ------------------------------------------------------------
-- 3. 菜单表 sys_menu（含接口权限标识 perm）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id`        BIGINT       NOT NULL,
  `parent_id` BIGINT       DEFAULT 0 COMMENT '父菜单ID，0=顶级',
  `name`      VARCHAR(64)  NOT NULL COMMENT '菜单名称',
  `path`      VARCHAR(128) DEFAULT NULL COMMENT '前端路由路径',
  `component` VARCHAR(128) DEFAULT NULL COMMENT '前端组件路径',
  `icon`      VARCHAR(64)  DEFAULT NULL COMMENT '图标',
  `sort`      INT          DEFAULT 0 COMMENT '排序',
  `type`      TINYINT      DEFAULT 1 COMMENT '1=目录 2=菜单',
  `perm`      VARCHAR(128) DEFAULT NULL COMMENT '接口权限标识，如 stock:save',
  `status`    TINYINT      DEFAULT 1 COMMENT '1=启用 0=禁用',
  `created_at` DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单与权限';

-- ------------------------------------------------------------
-- 4. 登录日志表 sys_login_log（管理员每次登录尝试都记录）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sys_login_log`;
CREATE TABLE `sys_login_log` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT,
  `admin_id`   BIGINT      DEFAULT NULL,
  `username`   VARCHAR(64) DEFAULT NULL COMMENT '尝试登录的账号',
  `ip`         VARCHAR(64) DEFAULT NULL,
  `result`     TINYINT     DEFAULT 0 COMMENT '1=成功 0=失败',
  `reason`     VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
  `created_at` DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员登录日志';

-- ------------------------------------------------------------
-- 5. 操作日志表 sys_operate_log（不可删除，用于溯源）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sys_operate_log`;
CREATE TABLE `sys_operate_log` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `admin_id`    BIGINT       DEFAULT NULL,
  `admin_name`  VARCHAR(64)  DEFAULT NULL COMMENT '操作人账号',
  `module`      VARCHAR(64)  DEFAULT NULL COMMENT '模块：管理员/用户/码表',
  `action`      VARCHAR(64)  DEFAULT NULL COMMENT '动作：新增/编辑/冻结/导入...',
  `content`     VARCHAR(500) DEFAULT NULL COMMENT '操作内容描述',
  `before_data` TEXT         COMMENT '变更前数据(JSON)',
  `after_data`  TEXT         COMMENT '变更后数据(JSON)',
  `ip`          VARCHAR(64)  DEFAULT NULL,
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_module` (`module`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台操作日志（只增不删）';

-- ------------------------------------------------------------
-- 6. C 端用户表 c_user（APP 前台注册用户）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `c_user`;
CREATE TABLE `c_user` (
  `id`                BIGINT       NOT NULL AUTO_INCREMENT,
  `phone`             VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
  `wx_openid`         VARCHAR(64)  DEFAULT NULL COMMENT '微信 openid',
  `qq_openid`         VARCHAR(64)  DEFAULT NULL COMMENT 'QQ openid',
  `nickname`          VARCHAR(64)  DEFAULT NULL COMMENT '昵称',
  `avatar`            VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
  `status`            TINYINT      DEFAULT 1 COMMENT '1=正常 2=冻结 3=注销',
  `register_time`     DATETIME     DEFAULT NULL COMMENT '注册时间',
  `last_login_time`   DATETIME     DEFAULT NULL COMMENT '最后登录时间',
  `last_login_source` TINYINT      DEFAULT NULL COMMENT '1=手机号 2=微信 3=QQ',
  `created_at`        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_wx_openid` (`wx_openid`),
  UNIQUE KEY `uk_qq_openid` (`qq_openid`),
  KEY `idx_status` (`status`),
  KEY `idx_register` (`register_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='C端业务用户';

-- ------------------------------------------------------------
-- 7. C 端用户登录历史表 c_user_login_log
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `c_user_login_log`;
CREATE TABLE `c_user_login_log` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT      NOT NULL,
  `source`     TINYINT     DEFAULT NULL COMMENT '1=手机号 2=微信 3=QQ',
  `ip`         VARCHAR(64) DEFAULT NULL,
  `login_time` DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='C端用户登录历史';

-- ------------------------------------------------------------
-- 8. 用户注销管理表 c_user_cancel
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `c_user_cancel`;
CREATE TABLE `c_user_cancel` (
  `id`              BIGINT   NOT NULL AUTO_INCREMENT,
  `user_id`         BIGINT   NOT NULL,
  `apply_time`      DATETIME DEFAULT NULL COMMENT '注销申请时间',
  `cooling_end_time` DATETIME DEFAULT NULL COMMENT '冷静期截止时间',
  `status`          TINYINT  DEFAULT 1 COMMENT '1=冷却中 2=已完成 3=已撤销',
  `cancel_time`     DATETIME DEFAULT NULL COMMENT '实际注销时间',
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户注销申请';

-- ------------------------------------------------------------
-- 9. 股票码表 stock_code（code+market 唯一）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_code`;
CREATE TABLE `stock_code` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `code`          VARCHAR(32)  NOT NULL COMMENT '码表代码，如 sz000001',
  `exchange_code` VARCHAR(32)  DEFAULT NULL COMMENT '交易代码，如 000001',
  `name`          VARCHAR(128) NOT NULL COMMENT '股票名称',
  `market`        VARCHAR(16)  NOT NULL COMMENT '市场：SH/SZ/BJ/HK/US',
  `industry`      VARCHAR(64)  DEFAULT NULL COMMENT '行业分类',
  `category`      TINYINT      DEFAULT 1 COMMENT '1=股票 2=期货 3=期权 4=基金',
  `status`        TINYINT      DEFAULT 1 COMMENT '1=正常 2=停牌 3=退市',
  `remark`        VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `created_by`    BIGINT       DEFAULT NULL COMMENT '创建管理员ID',
  `created_at`    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code_market` (`code`, `market`),
  KEY `idx_name` (`name`),
  KEY `idx_market` (`market`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='股票码表';

-- ------------------------------------------------------------
-- 10. 码表变更日志 stock_change_log
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stock_change_log`;
CREATE TABLE `stock_change_log` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `admin_id`    BIGINT       DEFAULT NULL,
  `admin_name`  VARCHAR(64)  DEFAULT NULL,
  `action`      VARCHAR(32)  NOT NULL COMMENT '新增/编辑/导入/启用/禁用/同步',
  `stock_code`  VARCHAR(32)  DEFAULT NULL COMMENT '涉及的码表代码',
  `before_data` TEXT         COMMENT '变更前(JSON)',
  `after_data`  TEXT         COMMENT '变更后(JSON)',
  `remark`      VARCHAR(255) DEFAULT NULL,
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`stock_code`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='码表变更日志';
