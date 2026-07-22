// Admin 数据访问层
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
  return rows.length ? rows[0] : null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT id, username, nickname, created_at FROM admins WHERE id = ?', [id]);
  return rows.length ? rows[0] : null;
}

async function create({ username, password, nickname }) {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO admins (username, password, nickname) VALUES (?, ?, ?)',
    [username, hash, nickname || username]
  );
  return findById(result.insertId);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

module.exports = { findByUsername, findById, create, verifyPassword };
