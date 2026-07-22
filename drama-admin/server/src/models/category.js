// Category 数据访问层
const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows.length ? rows[0] : null;
}

async function create(data) {
  const { id, name, icon, sort_order } = data;
  await pool.query(
    'INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
    [id, name, icon || '', sort_order || 0]
  );
  return findById(id);
}

async function update(id, data) {
  const fields = [];
  const params = [];
  for (const key of ['name', 'icon', 'sort_order']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (fields.length === 0) return findById(id);
  params.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function remove(id) {
  // 'all' 是内置分类，禁止删除
  if (id === 'all') throw new Error('Cannot delete built-in category "all"');
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
}

module.exports = { findAll, findById, create, update, remove };
