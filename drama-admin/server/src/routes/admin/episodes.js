// 管理后台剧集 CRUD API（需鉴权）
const express = require('express');
const router = express.Router();
const episodeModel = require('../../models/episode');
const { authRequired } = require('../../middleware/auth');

router.use(authRequired);

/**
 * GET /admin/episodes?dramaId=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { dramaId } = req.query;
    if (!dramaId) return res.json({ code: 400, message: '缺少 dramaId', data: null });
    const list = await episodeModel.findByDramaId(dramaId);
    res.json({ code: 0, message: 'success', data: list });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * PUT /admin/episodes/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const ep = await episodeModel.update(req.params.id, req.body);
    if (!ep) return res.json({ code: 404, message: '不存在', data: null });
    res.json({ code: 0, message: '更新成功', data: ep });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * DELETE /admin/episodes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await episodeModel.remove(req.params.id);
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
