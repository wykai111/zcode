// 管理后台短剧 CRUD API（需鉴权）
const express = require('express');
const router = express.Router();
const dramaModel = require('../../models/drama');
const episodeModel = require('../../models/episode');
const { authRequired } = require('../../middleware/auth');

// 所有管理接口都需要鉴权
router.use(authRequired);

/**
 * GET /admin/dramas
 * 管理列表（含下架内容、带分页）
 */
router.get('/', async (req, res) => {
  try {
    const { board, categoryId, keyword, status, page, pageSize } = req.query;
    const result = await dramaModel.findAll({
      board, categoryId, keyword, status,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    });
    res.json({ code: 0, message: 'success', data: result });
  } catch (err) {
    console.error('[admin dramas list]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * GET /admin/dramas/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const drama = await dramaModel.findById(req.params.id);
    if (!drama) return res.json({ code: 404, message: '不存在', data: null });
    res.json({ code: 0, message: 'success', data: drama });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * POST /admin/dramas
 * 创建短剧（如未提供 id，自动生成）
 */
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.title) return res.json({ code: 400, message: 'title 必填', data: null });
    if (!data.id) data.id = `drama_${Date.now()}`;
    if (await dramaModel.findById(data.id)) {
      return res.json({ code: 409, message: 'ID 已存在', data: null });
    }

    const drama = await dramaModel.create(data);

    // 如果传了 episodes(数量)，批量生成剧集
    if (data.autoEpisodes && data.episodes > 0) {
      await episodeModel.bulkGenerate(data.id, data.episodes, data.duration || '0:58');
    }

    res.json({ code: 0, message: '创建成功', data: drama });
  } catch (err) {
    console.error('[admin dramas create]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * PUT /admin/dramas/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const drama = await dramaModel.update(req.params.id, req.body);
    if (!drama) return res.json({ code: 404, message: '不存在', data: null });
    res.json({ code: 0, message: '更新成功', data: drama });
  } catch (err) {
    console.error('[admin dramas update]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * DELETE /admin/dramas/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await dramaModel.remove(req.params.id);
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) {
    console.error('[admin dramas delete]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * POST /admin/dramas/:id/episodes/generate
 * 批量生成剧集
 * body: { count: 30 }
 */
router.post('/:id/episodes/generate', async (req, res) => {
  try {
    const { count } = req.body;
    if (!count || count < 1) {
      return res.json({ code: 400, message: 'count 必须大于 0', data: null });
    }
    const episodes = await episodeModel.bulkGenerate(req.params.id, count);
    res.json({ code: 0, message: `已生成 ${count} 集`, data: episodes });
  } catch (err) {
    console.error('[admin episodes generate]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
