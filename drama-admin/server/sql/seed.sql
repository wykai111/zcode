-- ============================================================
-- 种子数据（从 tiktok-mini-app/utils/mock.js 导入）
-- 执行前请先执行 schema.sql
-- ============================================================

USE drama_admin;

-- ------------------------------------------------------------
-- 管理员（密码 admin123，bcrypt hash）
-- 如 hash 失效，请用 server/src/utils/initAdmin.js 重新生成
-- ------------------------------------------------------------
INSERT INTO `admins` (`username`, `password`, `nickname`) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '超级管理员');

-- ------------------------------------------------------------
-- 分类
-- ------------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `icon`, `sort_order`) VALUES
('all',      'All',      '🎯', 0),
('romance',  'Romance',  '💕', 1),
('action',   'Action',   '💥', 2),
('drama',    'Drama',    '🎭', 3),
('comedy',   'Comedy',   '😂', 4),
('vip',      'VIP',      '👑', 5);

-- ------------------------------------------------------------
-- 短剧（合并 mock.js 的 5 个数据源，统一 ID）
-- board 字段标识出现在哪些板块
-- ------------------------------------------------------------
INSERT INTO `dramas` (`id`, `title`, `cover`, `description`, `category_id`, `episodes`, `rating`, `views`, `tag`, `board`, `tags`, `duration`, `sort_order`, `status`) VALUES

-- Gallery 主推（同时也在 New Arrivals）
('drama_001', 'The Stepmother''s Empire',
  'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=900&q=85',
  'A betrayed wife rebuilds her empire to seek revenge.',
  'drama', 30, 9.2, 1250000, 'NEW',
  '["gallery","new","topshort"]', '["Betrayal","Revenge","Family"]', '0:58', 100, 1),

('drama_002', 'Married to the Devil in Disguise',
  'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=900&q=85',
  'A secret marriage unravels a web of lies.',
  'romance', 24, 9.0, 5100000, 'HOT',
  '["gallery","trending"]', '["Romance","Wealthy Family","Drama"]', '0:58', 95, 1),

('drama_003', 'Maid''s Lost Memory',
  'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=900&q=85',
  'After losing her memory, a maid discovers her true identity.',
  'drama', 18, 8.9, 892000, 'NEW',
  '["gallery","new"]', '["Amnesia","Revenge","Kickass Heroine"]', '0:58', 90, 1),

('drama_004', 'Out of Control',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&q=85',
  'Two men bound by fate spiral out of control.',
  'action', 22, 9.1, 4200000, 'HOT',
  '["gallery","trending","topshort"]', '["Action","Suspense","Dual Male Leads"]', '0:58', 88, 1),

-- New Arrivals 专属
('drama_005', 'A Single Report Uncovers Her Secret',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=85',
  'One report exposes a powerful family''s darkest secret.',
  'drama', 18, 9.4, 678000, 'NEW',
  '["new"]', '["Mystery","Wealthy Family","Suspense"]', '0:58', 85, 1),

('drama_006', 'Cinderella''s Revenge Plan',
  'https://images.unsplash.com/photo-1543168256-418811576931?w=900&q=85',
  'A modern Cinderella turns the tables on her oppressors.',
  'romance', 22, 8.7, 445000, 'NEW',
  '["new"]', '["Romance","Revenge","Anime"]', '0:58', 80, 1),

('drama_007', 'The Hidden Heiress',
  'https://images.unsplash.com/photo-1568667256549-094345857637?w=900&q=85',
  'She hid her true identity, until fate forced her hand.',
  'drama', 26, 9.0, 920000, 'NEW',
  '["new"]', '["Anime","Identity","Drama"]', '0:58', 75, 1),

-- Top Shorts
('drama_008', 'Midnight in Tokyo',
  'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'A romance that blooms in the neon streets of Tokyo.',
  'romance', 24, 8.9, 1200000, 'NEW',
  '["topshort"]', '["Romance"]', '8:32', 70, 1),

('drama_009', 'The Last Heist',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
  'One last job that changes everything.',
  'action', 16, 9.4, 3500000, 'HOT',
  '["topshort"]', '["Crime"]', '15:20', 68, 1),

('drama_010', 'Love in Paris',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'A love story set against the City of Light.',
  'romance', 12, 8.5, 892000, 'NEW',
  '["topshort"]', '["Romance"]', '10:15', 65, 1),

('drama_011', 'Dragon Throne',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&q=80',
  'The battle for the imperial throne.',
  'action', 30, 9.6, 5100000, 'HOT',
  '["topshort","trending"]', '["Historical"]', '18:42', 62, 1),

('drama_012', 'Cyber Heart',
  'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=600&q=80',
  'A cyberpunk tale of love and identity.',
  'drama', 20, 8.7, 2000000, 'NEW',
  '["topshort"]', '["Sci-Fi"]', '9:58', 60, 1),

('drama_013', 'Royal Betrayal',
  'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&q=80',
  'Betrayal at the heart of the kingdom.',
  'drama', 18, 9.1, 1800000, 'HOT',
  '["topshort"]', '["Drama"]', '14:30', 58, 1);

-- ------------------------------------------------------------
-- 剧集（为 drama_001 批量生成 30 集，前 2 集免费）
-- 其余短剧的剧集由后端 API 动态生成或管理后台批量创建
-- ------------------------------------------------------------
INSERT INTO `episodes` (`id`, `drama_id`, `ep_number`, `label`, `free`, `duration`, `sort_order`) VALUES
('ep_001_01', 'drama_001', 1,  'EP 1',  1, '0:58', 1),
('ep_001_02', 'drama_001', 2,  'EP 2',  1, '0:58', 2),
('ep_001_03', 'drama_001', 3,  'EP 3',  0, '0:58', 3),
('ep_001_04', 'drama_001', 4,  'EP 4',  0, '0:58', 4),
('ep_001_05', 'drama_001', 5,  'EP 5',  0, '0:58', 5),
('ep_001_06', 'drama_001', 6,  'EP 6',  0, '0:58', 6),
('ep_001_07', 'drama_001', 7,  'EP 7',  0, '0:58', 7),
('ep_001_08', 'drama_001', 8,  'EP 8',  0, '0:58', 8),
('ep_001_09', 'drama_001', 9,  'EP 9',  0, '0:58', 9),
('ep_001_10', 'drama_001', 10, 'EP 10', 0, '0:58', 10),
('ep_001_11', 'drama_001', 11, 'EP 11', 0, '0:58', 11),
('ep_001_12', 'drama_001', 12, 'EP 12', 0, '0:58', 12),
('ep_001_13', 'drama_001', 13, 'EP 13', 0, '0:58', 13),
('ep_001_14', 'drama_001', 14, 'EP 14', 0, '0:58', 14),
('ep_001_15', 'drama_001', 15, 'EP 15', 0, '0:58', 15),
('ep_001_16', 'drama_001', 16, 'EP 16', 0, '0:58', 16),
('ep_001_17', 'drama_001', 17, 'EP 17', 0, '0:58', 17),
('ep_001_18', 'drama_001', 18, 'EP 18', 0, '0:58', 18),
('ep_001_19', 'drama_001', 19, 'EP 19', 0, '0:58', 19),
('ep_001_20', 'drama_001', 20, 'EP 20', 0, '0:58', 20),
('ep_001_21', 'drama_001', 21, 'EP 21', 0, '0:58', 21),
('ep_001_22', 'drama_001', 22, 'EP 22', 0, '0:58', 22),
('ep_001_23', 'drama_001', 23, 'EP 23', 0, '0:58', 23),
('ep_001_24', 'drama_001', 24, 'EP 24', 0, '0:58', 24),
('ep_001_25', 'drama_001', 25, 'EP 25', 0, '0:58', 25),
('ep_001_26', 'drama_001', 26, 'EP 26', 0, '0:58', 26),
('ep_001_27', 'drama_001', 27, 'EP 27', 0, '0:58', 27),
('ep_001_28', 'drama_001', 28, 'EP 28', 0, '0:58', 28),
('ep_001_29', 'drama_001', 29, 'EP 29', 0, '0:58', 29),
('ep_001_30', 'drama_001', 30, 'EP 30', 0, '0:58', 30);

-- ------------------------------------------------------------
-- 测试用户
-- ------------------------------------------------------------
INSERT INTO `users` (`id`, `openid`, `nickname`, `username`, `avatar`, `vip`, `following`, `followers`, `likes`) VALUES
('user_001', 'test_openid_001', 'Alex Chen', 'dramafan_2024',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&q=80',
  1, 128, 12500, 1200000);

-- ------------------------------------------------------------
-- 观看历史
-- ------------------------------------------------------------
INSERT INTO `watch_history` (`id`, `user_id`, `drama_id`, `ep_number`, `progress`, `watched_at`) VALUES
('hist_001', 'user_001', 'drama_001', 5, 75, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('hist_002', 'user_001', 'drama_008', 12, 40, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('hist_003', 'user_001', 'drama_009', 16, 100, DATE_SUB(NOW(), INTERVAL 3 DAY));
