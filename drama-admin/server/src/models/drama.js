// Drama 数据访问层
const pool = require('../config/db');

/**
 * 查询短剧列表（支持按 board/category/关键字筛选 + 分页）
 */
async function findAll({ board, categoryId, keyword, status, page = 1, pageSize = 20 } = {}) {
  const where = ['1=1'];
  const params = [];

  if (board) {
    where.push('JSON_CONTAINS(board, ?)');
    params.push(JSON.stringify(board));
  }
  if (categoryId) {
    where.push('category_id = ?');
    params.push(categoryId);
  }
  if (keyword) {
    where.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status !== undefined && status !== '') {
    where.push('status = ?');
    params.push(Number(status));
  }

  const offset = (page - 1) * pageSize;
  const sql = `
    SELECT * FROM dramas
    WHERE ${where.join(' AND ')}
    ORDER BY sort_order DESC, created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(sql, [...params, Number(pageSize), Number(offset)]);

  // 查询总数
  const countSql = `SELECT COUNT(*) AS total FROM dramas WHERE ${where.join(' AND ')}`;
  const [countRows] = await pool.query(countSql, params);

  return { list: rows.map(parseDrama), total: countRows[0].total };
}

/**
 * 根据 ID 查询单个短剧
 */
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM dramas WHERE id = ?', [id]);
  return rows.length ? parseDrama(rows[0]) : null;
}

/**
 * 按 board 查询（首页各板块专用）
 */
async function findByBoard(board, limit = 10) {
  const [rows] = await pool.query(
    `SELECT * FROM dramas
     WHERE status = 1 AND JSON_CONTAINS(board, ?)
     ORDER BY sort_order DESC, created_at DESC
     LIMIT ?`,
    [JSON.stringify(board), Number(limit)]
  );
  return rows.map(parseDrama);
}

/**
 * 创建短剧
 */
async function create(data) {
  const { id, title, cover, description, category_id, episodes, rating, views, tag, board, tags, duration, sort_order, status } = data;
  await pool.query(
    `INSERT INTO dramas (id, title, cover, description, category_id, episodes, rating, views, tag, board, tags, duration, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, title, cover, description, category_id,
      episodes || 0, rating || 0, views || 0, tag || '',
      JSON.stringify(board || []), JSON.stringify(tags || []),
      duration, sort_order || 0, status === undefined ? 1 : status,
    ]
  );
  return findById(id);
}

/**
 * 更新短剧
 */
async function update(id, data) {
  const fields = [];
  const params = [];
  const allowed = ['title', 'cover', 'description', 'category_id', 'episodes', 'rating', 'views', 'tag', 'duration', 'sort_order', 'status'];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  // JSON 字段特殊处理
  if (data.board !== undefined) {
    fields.push('board = ?');
    params.push(JSON.stringify(data.board));
  }
  if (data.tags !== undefined) {
    fields.push('tags = ?');
    params.push(JSON.stringify(data.tags));
  }

  if (fields.length === 0) return findById(id);

  params.push(id);
  await pool.query(`UPDATE dramas SET ${fields.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

/**
 * 删除短剧（级联删除剧集）
 */
async function remove(id) {
  await pool.query('DELETE FROM dramas WHERE id = ?', [id]);
}

/**
 * 统计总数和总播放量
 */
async function getStats() {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(views), 0) AS total_views FROM dramas WHERE status = 1'
  );
  return rows[0];
}

/**
 * 解析 DB 行（JSON 字段转 JS 对象）
 */
function parseDrama(row) {
  if (!row) return null;
  return {
    ...row,
    board: typeof row.board === 'string' ? JSON.parse(row.board) : (row.board || []),
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
  };
}

module.exports = { findAll, findById, findByBoard, create, update, remove, getStats };
