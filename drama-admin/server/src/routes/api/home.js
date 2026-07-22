// 小程序首页聚合 API
const express = require('express');
const router = express.Router();
const dramaModel = require('../../models/drama');

/**
 * GET /api/home
 * 返回首页所有板块数据（gallery + topShorts + newArrivals 前3 + trending）
 */
router.get('/', async (req, res) => {
  try {
    const [gallery, topShorts, newArrivals, trending] = await Promise.all([
      dramaModel.findByBoard('gallery', 4),
      dramaModel.findByBoard('topshort', 6),
      dramaModel.findByBoard('new', 3),
      dramaModel.findByBoard('trending', 6),
    ]);

    res.json({
      code: 0,
      message: 'success',
      data: {
        gallery,
        topShorts: topShorts.map(formatForCard),
        newArrivals: newArrivals.map(formatForNewCard),
        trending: trending.map(formatForCard),
      },
    });
  } catch (err) {
    console.error('[home]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

// 格式化为 Top Shorts / Trending 卡片
function formatForCard(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episodes,
    rating: Number(d.rating),
    views: formatNumber(d.views),
    tag: d.tag,
    duration: d.duration,
  };
}

// 格式化为 New Arrivals 卡片
function formatForNewCard(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    description: d.description,
    episodes: d.episodes,
    rating: Number(d.rating),
    tags: d.tags,
    duration: d.duration,
  };
}

// 数字格式化：1200000 → '1.2M'
function formatNumber(num) {
  if (typeof num !== 'number') return num;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

module.exports = router;
