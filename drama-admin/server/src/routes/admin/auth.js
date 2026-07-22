// 管理后台登录 API
const express = require('express');
const router = express.Router();
const adminModel = require('../../models/admin');
const { signToken } = require('../../middleware/auth');

/**
 * POST /admin/login
 * 管理员登录，返回 JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: '请输入账号和密码', data: null });
    }

    const admin = await adminModel.findByUsername(username);
    if (!admin) {
      return res.json({ code: 401, message: '账号不存在', data: null });
    }

    const ok = await adminModel.verifyPassword(password, admin.password);
    if (!ok) {
      return res.json({ code: 401, message: '密码错误', data: null });
    }

    const token = signToken({ id: admin.id, username: admin.username });
    res.json({
      code: 0,
      message: 'success',
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          nickname: admin.nickname,
        },
      },
    });
  } catch (err) {
    console.error('[admin login]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * GET /admin/profile
 * 获取当前登录管理员信息（需鉴权）
 */
router.get('/profile', require('../../middleware/auth').authRequired, async (req, res) => {
  try {
    const admin = await adminModel.findById(req.user.id);
    if (!admin) return res.json({ code: 404, message: '用户不存在', data: null });
    res.json({ code: 0, message: 'success', data: admin });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
