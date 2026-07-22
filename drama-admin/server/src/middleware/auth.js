// JWT 鉴权中间件
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'drama_admin_secret_2024';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.json({ code: 401, message: '未登录或 token 缺失', data: null });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.json({ code: 401, message: 'token 已失效，请重新登录', data: null });
  }
}

module.exports = { signToken, authRequired, JWT_SECRET };
