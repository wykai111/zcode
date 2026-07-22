// 文件上传 API（需鉴权）
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authRequired } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|gif)$/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/png/webp/gif'));
    }
  },
});

router.use(authRequired);

/**
 * POST /admin/upload
 * 单文件上传，返回可访问的 URL
 */
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ code: 400, message: '未收到文件', data: null });
  const url = `/uploads/${req.file.filename}`;
  res.json({ code: 0, message: '上传成功', data: { url, filename: req.file.filename } });
});

module.exports = router;
