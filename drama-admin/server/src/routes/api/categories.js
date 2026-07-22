// 小程序分类 API
const express = require('express');
const router = express.Router();
const categoryModel = require('../../models/category');

/**
 * GET /api/categories
 */
router.get('/', async (req, res) => {
  try {
    const list = await categoryModel.findAll();
    res.json({
      code: 0,
      message: 'success',
      data: list.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    });
  } catch (err) {
    console.error('[categories]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
