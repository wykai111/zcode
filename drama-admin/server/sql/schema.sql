-- ============================================================
-- ShortDrama 短剧后台数据库建表脚本
-- 数据库: drama_admin
-- 字符集: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS drama_admin
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE drama_admin;

-- ------------------------------------------------------------
-- 1. 分类表 categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`         VARCHAR(32)  NOT NULL COMMENT 'slug 主键，如 romance',
  `name`       VARCHAR(64)  NOT NULL COMMENT '显示名',
  `icon`       VARCHAR(16)  DEFAULT NULL COMMENT 'emoji 图标',
  `sort_order` INT          DEFAULT 0 COMMENT '排序权重',
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短剧分类';

-- ------------------------------------------------------------
-- 2. 短剧表 dramas（核心表）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `dramas`;
CREATE TABLE `dramas` (
  `id`          VARCHAR(32)   NOT NULL COMMENT '统一 ID',
  `title`       VARCHAR(128)  NOT NULL COMMENT '剧名',
  `cover`       VARCHAR(512)  DEFAULT NULL COMMENT '封面图 URL',
  `description` TEXT          COMMENT '剧情简介',
  `category_id` VARCHAR(32)   DEFAULT NULL COMMENT '分类 ID',
  `episodes`    INT           DEFAULT 0   COMMENT '总集数',
  `rating`      DECIMAL(2,1)  DEFAULT 0.0 COMMENT '评分 0-10',
  `views`       BIGINT        DEFAULT 0   COMMENT '播放量（存数字，前端格式化）',
  `tag`         ENUM('NEW','HOT','FEATURED','') DEFAULT '' COMMENT '状态标识',
  `board`       JSON          DEFAULT NULL COMMENT '出现板块 ["gallery","new","trending","topshort"]',
  `tags`        JSON          DEFAULT NULL COMMENT '题材标签 ["Betrayal","Revenge"]',
  `duration`    VARCHAR(8)    DEFAULT NULL COMMENT '单集时长 0:58',
  `sort_order`  INT           DEFAULT 0   COMMENT '排序权重',
  `status`      TINYINT       DEFAULT 1   COMMENT '1=上架 0=下架',
  `created_at`  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort_order`),
  CONSTRAINT `fk_drama_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短剧主表';

-- ------------------------------------------------------------
-- 3. 剧集表 episodes（新增实体）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `episodes`;
CREATE TABLE `episodes` (
  `id`         VARCHAR(32)  NOT NULL COMMENT '剧集 ID',
  `drama_id`   VARCHAR(32)  NOT NULL COMMENT '所属短剧 ID',
  `ep_number`  INT          NOT NULL COMMENT '集数序号 1-based',
  `label`      VARCHAR(16)  DEFAULT NULL COMMENT '显示标签 EP 5',
  `free`       TINYINT      DEFAULT 0   COMMENT '1=免费 0=VIP',
  `duration`   VARCHAR(8)   DEFAULT NULL COMMENT '单集时长',
  `video_url`  VARCHAR(512) DEFAULT NULL COMMENT '实际播放地址',
  `sort_order` INT          DEFAULT 0,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drama_ep` (`drama_id`, `ep_number`),
  KEY `idx_drama` (`drama_id`),
  CONSTRAINT `fk_ep_drama` FOREIGN KEY (`drama_id`) REFERENCES `dramas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剧集表';

-- ------------------------------------------------------------
-- 4. 用户表 users
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`         VARCHAR(32)  NOT NULL COMMENT '用户 ID',
  `openid`     VARCHAR(64)  DEFAULT NULL COMMENT '微信/TikTok openid',
  `nickname`   VARCHAR(64)  DEFAULT NULL,
  `username`   VARCHAR(64)  DEFAULT NULL COMMENT '@用户名',
  `avatar`     VARCHAR(512) DEFAULT NULL,
  `vip`        TINYINT      DEFAULT 0   COMMENT '1=VIP 0=普通',
  `following`  INT          DEFAULT 0   COMMENT '关注数',
  `followers`  BIGINT       DEFAULT 0   COMMENT '粉丝数',
  `likes`      BIGINT       DEFAULT 0   COMMENT '获赞总数',
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ------------------------------------------------------------
-- 5. 观看历史 watch_history
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `watch_history`;
CREATE TABLE `watch_history` (
  `id`         VARCHAR(32)  NOT NULL,
  `user_id`    VARCHAR(32)  NOT NULL,
  `drama_id`   VARCHAR(32)  NOT NULL,
  `ep_number`  INT          DEFAULT 1 COMMENT '看到第几集',
  `progress`   INT          DEFAULT 0 COMMENT '0-100 百分比',
  `watched_at` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '绝对时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_user_drama` (`user_id`, `drama_id`),
  CONSTRAINT `fk_hist_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_hist_drama` FOREIGN KEY (`drama_id`) REFERENCES `dramas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='观看历史';

-- ------------------------------------------------------------
-- 6. 管理员表 admins
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(64)  NOT NULL,
  `password`   VARCHAR(128) NOT NULL COMMENT 'bcrypt 加密',
  `nickname`   VARCHAR(64)  DEFAULT NULL,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员';

-- 提示：种子数据见 seed.sql，管理员密码由后端首次启动时用 bcrypt 生成
