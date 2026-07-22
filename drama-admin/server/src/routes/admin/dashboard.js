// 数据概览 API（需鉴权）
const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const dramaModel = require('../../models/drama');
const { authRequired } = require('../../middleware/auth');

router.use(authRequired);

/**
 * GET /admin/dashboard
 */
router.get('/', async (req, res) => {
  try {
    const stats = await dramaModel.getStats();

    const [recentDramas] = await pool.query(
      'SELECT id, title, cover, views, created_at FROM dramas ORDER BY created_at DESC LIMIT 5'
    );

    const [topPlayed] = await pool.query(
      'SELECT id, title, cover, views FROM dramas WHERE status = 1 ORDER BY views DESC LIMIT 5'
    );

    const [categoryCount] = await pool.query('SELECT COUNT(*) AS total FROM categories');

    res.json({
      code: 0,
      message: 'success',
      data: {
        dramaTotal: stats.total,
        totalViews: stats.total_views,
        categoryTotal: categoryCount[0].total,
        recentDramas,
        topPlayed,
      },
    });
  } catch (err) {
    console.error('[dashboard]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
