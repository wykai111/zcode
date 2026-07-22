// Episode 数据访问层
const pool = require('../config/db');

/**
 * 查询某短剧的所有剧集
 */
async function findByDramaId(dramaId) {
  const [rows] = await pool.query(
    'SELECT * FROM episodes WHERE drama_id = ? ORDER BY ep_number ASC',
    [dramaId]
  );
  return rows;
}

/**
 * 根据 ID 查询
 */
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM episodes WHERE id = ?', [id]);
  return rows.length ? rows[0] : null;
}

/**
 * 创建剧集
 */
async function create(data) {
  const { id, drama_id, ep_number, label, free, duration, video_url, sort_order } = data;
  await pool.query(
    `INSERT INTO episodes (id, drama_id, ep_number, label, free, duration, video_url, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, drama_id, ep_number, label, free ? 1 : 0, duration, video_url, sort_order || ep_number]
  );
  return findById(id);
}

/**
 * 批量生成剧集（用于管理后台「一键生成 N 集」）
 * 前 2 集自动设为免费
 */
async function bulkGenerate(dramaId, count, duration = '0:58') {
  // 先删除旧的
  await pool.query('DELETE FROM episodes WHERE drama_id = ?', [dramaId]);

  const values = [];
  for (let i = 1; i <= count; i++) {
    const id = `ep_${dramaId}_${String(i).padStart(2, '0')}`;
    values.push([id, dramaId, i, `EP ${i}`, i <= 2 ? 1 : 0, duration, null, i]);
  }
  await pool.query(
    'INSERT INTO episodes (id, drama_id, ep_number, label, free, duration, video_url, sort_order) VALUES ?',
    [values]
  );
  // 同步更新 dramas 表的总集数
  await pool.query('UPDATE dramas SET episodes = ? WHERE id = ?', [count, dramaId]);
  return findByDramaId(dramaId);
}

/**
 * 更新剧集
 */
async function update(id, data) {
  const fields = [];
  const params = [];
  const allowed = ['ep_number', 'label', 'free', 'duration', 'video_url', 'sort_order'];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(key === 'free' ? (data[key] ? 1 : 0) : data[key]);
    }
  }
  if (fields.length === 0) return findById(id);

  params.push(id);
  await pool.query(`UPDATE episodes SET ${fields.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

/**
 * 删除剧集
 */
async function remove(id) {
  await pool.query('DELETE FROM episodes WHERE id = ?', [id]);
}

module.exports = { findByDramaId, findById, create, bulkGenerate, update, remove };
