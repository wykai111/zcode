// 小程序观看历史 API
const express = require('express');
const router = express.Router();
const historyModel = require('../../models/history');

/**
 * GET /api/history?userId=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.json({ code: 400, message: '缺少 userId', data: null });
    }
    const list = await historyModel.findByUserId(userId);
    res.json({ code: 0, message: 'success', data: list });
  } catch (err) {
    console.error('[history list]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

/**
 * POST /api/history
 * 上报观看进度
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, drama_id, ep_number, progress } = req.body;
    if (!user_id || !drama_id) {
      return res.json({ code: 400, message: '缺少 user_id 或 drama_id', data: null });
    }
    const id = await historyModel.upsert({
      user_id,
      drama_id,
      ep_number: ep_number || 1,
      progress: progress || 0,
    });
    res.json({ code: 0, message: 'success', data: { id } });
  } catch (err) {
    console.error('[history upsert]', err);
    res.json({ code: 500, message: '服务器错误', data: null });
  }
});

module.exports = router;
