// 小程序短剧 API
const express = require('express');
const router = express.Router();
const dramaModel = require('../../models/drama');
const episodeModel = require('../../models/episode');

/**
 * GET /api/dramas
 * 查询短剧列表（支持 board / categoryId / keyword / 分页）
 */
router.get('/', async (req, res) => {
  try {
    const { board, categoryId, keyword, page, pageSize } = req.query;
    const { list, total } = await dramaModel.findAll({
      board, categoryId, keyword,
      status: 1,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        list: list.map((d) => ({
          id: d.id,
          title: d.title,
          cover: d.cover,
          category_id: d.category_id || '',
          episodes: d.episodes,
          rating: Number(d.rating),
          views: d.views,
          tag: d.tag,
          tags: d.tags,
        })),
        total,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 20,
      },
    });
  } catch (err) {
    console.error('[dramas list]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * GET /api/dramas/:id
 * 短剧详情
 */
router.get('/:id', async (req, res) => {
  try {
    const drama = await dramaModel.findById(req.params.id);
    if (!drama) {
      return res.json({ code: 404, message: '短剧不存在', data: null });
    }

    // 增加播放量
    await require('../../config/db').query(
      'UPDATE dramas SET views = views + 1 WHERE id = ?', [req.params.id]
    );

    res.json({
      code: 0,
      message: 'success',
      data: {
        ...drama,
        rating: Number(drama.rating),
      },
    });
  } catch (err) {
    console.error('[drama detail]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * GET /api/dramas/:id/episodes
 * 某短剧的所有剧集列表
 */
router.get('/:id/episodes', async (req, res) => {
  try {
    const episodes = await episodeModel.findByDramaId(req.params.id);
    res.json({
      code: 0,
      message: 'success',
      data: {
        total: episodes.length,
        episodes: episodes.map((ep) => ({
          id: ep.id,
          ep: ep.ep_number,
          label: ep.label,
          free: !!ep.free,
          duration: ep.duration,
        })),
      },
    });
  } catch (err) {
    console.error('[episodes]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
