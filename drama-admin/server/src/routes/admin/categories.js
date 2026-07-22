// 管理后台分类 CRUD API（需鉴权）
const express = require('express');
const router = express.Router();
const categoryModel = require('../../models/category');
const { authRequired } = require('../../middleware/auth');

router.use(authRequired);

/**
 * GET /admin/categories
 */
router.get('/', async (req, res) => {
  try {
    const list = await categoryModel.findAll();
    res.json({ code: 0, message: 'success', data: list });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * POST /admin/categories
 */
router.post('/', async (req, res) => {
  try {
    const { id, name, icon, sort_order } = req.body;
    if (!id || !name) return res.json({ code: 400, message: 'id 和 name 必填', data: null });
    const cat = await categoryModel.create({ id, name, icon, sort_order });
    res.json({ code: 0, message: '创建成功', data: cat });
  } catch (err) {
    console.error('[admin category create]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * PUT /admin/categories/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const cat = await categoryModel.update(req.params.id, req.body);
    if (!cat) return res.json({ code: 404, message: '不存在', data: null });
    res.json({ code: 0, message: '更新成功', data: cat });
  } catch (err) {
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * DELETE /admin/categories/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await categoryModel.remove(req.params.id);
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) {
    res.json({ code: 400, message: err.message || '服务器错误', data: null });
  }
});

module.exports = router;
