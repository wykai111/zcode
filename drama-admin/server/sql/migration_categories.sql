-- ============================================================
-- 迁移脚本：补全分类 + 给短剧打 category_id
-- 执行前数据库已有 schema.sql + seed.sql 的初始数据
-- ============================================================

USE drama_admin;

-- ------------------------------------------------------------
-- 1. 新增 2 个分类：Mystery / Anime
--    （删除 Commedy，因为当前 13 部短剧里没有喜剧题材）
-- ------------------------------------------------------------
INSERT IGNORE INTO `categories` (`id`, `name`, `icon`, `sort_order`) VALUES
('mystery', 'Mystery', '🔍', 6),
('anime',   'Anime',   '🌸', 7);

-- 删除用不上的 comedy（如果存在）
DELETE FROM `categories` WHERE id = 'comedy';

-- ------------------------------------------------------------
-- 2. 给 13 部短剧按题材打 category_id
--    映射规则（按首要题材）：
--      Romance  💕  → romance
--      Action   💥  → action
--      Drama    🎭  → drama
--      Mystery  🔍  → mystery
--      Anime    🌸  → anime
-- ------------------------------------------------------------

-- Romance（4 部）
UPDATE `dramas` SET category_id = 'romance'
WHERE id IN ('drama_002', 'drama_006', 'drama_008', 'drama_010');

-- Action（3 部）
UPDATE `dramas` SET category_id = 'action'
WHERE id IN ('drama_004', 'drama_009', 'drama_011');

-- Drama（2 部）
UPDATE `dramas` SET category_id = 'drama'
WHERE id IN ('drama_001', 'drama_013');

-- Mystery（2 部）
UPDATE `dramas` SET category_id = 'mystery'
WHERE id IN ('drama_003', 'drama_005');

-- Anime（2 部）
UPDATE `dramas` SET category_id = 'anime'
WHERE id IN ('drama_007', 'drama_012');

-- ------------------------------------------------------------
-- 3. 验证
-- ------------------------------------------------------------
SELECT category_id, COUNT(*) AS cnt FROM dramas GROUP BY category_id ORDER BY cnt DESC;
