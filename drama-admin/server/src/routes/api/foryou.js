// 小程序推荐流 API
// 从 dramas 表按播放量降序取若干条，包装成 forYouFeed 结构
const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

/**
 * GET /api/foryou?limit=6
 * 返回竖屏推荐流（不鉴权）
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    // 按播放量降序取 top N
    const [rows] = await pool.query(
      `SELECT id, title, cover, description, views, likes, duration, tags
       FROM dramas
       WHERE status = 1
       ORDER BY views DESC
       LIMIT ?`,
      [limit]
    );

    // 包装成 forYouFeed 字段结构
    const list = rows.map((d) => {
      const tags = typeof d.tags === 'string' ? JSON.parse(d.tags) : (d.tags || []);
      return {
        id: d.id,
        title: d.title,
        // 短剧表暂无 author/avatar 字段，用默认值
        author: '@shortdrama',
        avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80',
        cover: d.cover,
        // 后端无 likes/comments/shares 真实数据，按播放量派生
        likes: Math.floor(d.views / 10),
        comments: Math.floor(d.views / 100),
        shares: Math.floor(d.views / 200),
        duration: d.duration || '0:58',
        description: d.description || d.title,
        tags,
      };
    });

    res.json({
      code: 0,
      message: 'success',
      data: list,
    });
  } catch (err) {
    console.error('[foryou]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
