-- ============================================================
-- 用户管理中心 种子数据：角色 + 菜单
-- 超级管理员账号由后端首次启动时自动创建（admin / admin123）
-- ============================================================

USE user_admin;

-- ---------- 角色 ----------
INSERT INTO `sys_role` (`id`, `code`, `name`, `menu_ids`, `perms`, `remark`) VALUES
(1, 'super_admin', '超级管理员', '100,200,201,202,300,301,302,400', 'admin:user:save,admin:user:pwd,admin:user:status,cuser:status,cuser:phone,cuser:export,stock:save,stock:import,stock:export,stock:sync,stock:status', '全部菜单与操作权限'),
(2, 'operator',    '运营',       '200,201,202,300,301,302,400', 'cuser:status,cuser:phone,cuser:export,stock:save,stock:import,stock:export,stock:sync,stock:status', '可管理用户与码表，不可管理管理员'),
(3, 'viewer',      '只读',       '200,201,202,300,301,302,400', '', '仅查看，无任何写权限');

-- ---------- 菜单（perm 为接口权限标识） ----------
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `icon`, `sort`, `type`, `perm`, `status`) VALUES
-- 管理员管理（仅超级管理员可见）
(100, 0, '管理员管理', '/admin-users', 'admin-user/index', 'UserFilled', 1, 2, 'admin:user:view', 1),
-- 用户管理
(200, 0, '用户管理', '/cusers', NULL, 'Avatar', 2, 1, NULL, 1),
(201, 200, '用户列表', '/cusers/list', 'cuser/list', NULL, 1, 2, 'cuser:view', 1),
(202, 200, '注销管理', '/cusers/cancel', 'cuser/cancel', NULL, 2, 2, 'cuser:cancel:view', 1),
-- 股票码表
(300, 0, '股票码表', '/stocks', NULL, 'Coin', 3, 1, NULL, 1),
(301, 300, '码表列表', '/stocks/list', 'stock/index', NULL, 1, 2, 'stock:view', 1),
(302, 300, '变更日志', '/stocks/log', 'stock/log', NULL, 2, 2, 'stock:log:view', 1),
-- 操作日志
(400, 0, '操作日志', '/op-logs', 'oplog/index', 'Document', 4, 2, 'log:view', 1);
