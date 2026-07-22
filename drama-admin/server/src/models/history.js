// History 数据访问层
const pool = require('../config/db');

/**
 * 查询用户观看历史
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT h.*, d.title, d.cover, d.duration
     FROM watch_history h
     JOIN dramas d ON h.drama_id = d.id
     WHERE h.user_id = ?
     ORDER BY h.watched_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    drama_id: row.drama_id,
    title: row.title,
    cover: row.cover,
    duration: row.duration,
    ep_number: row.ep_number,
    progress: row.progress,
    watched_at: row.watched_at,
  }));
}

/**
 * 记录/更新观看进度（同用户+同剧则 upsert）
 */
async function upsert({ user_id, drama_id, ep_number, progress }) {
  // 查找是否已存在
  const [existing] = await pool.query(
    'SELECT id FROM watch_history WHERE user_id = ? AND drama_id = ?',
    [user_id, drama_id]
  );

  if (existing.length) {
    const id = existing[0].id;
    await pool.query(
      'UPDATE watch_history SET ep_number = ?, progress = ?, watched_at = NOW() WHERE id = ?',
      [ep_number, progress, id]
    );
    return id;
  }

  const id = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(
    `INSERT INTO watch_history (id, user_id, drama_id, ep_number, progress, watched_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [id, user_id, drama_id, ep_number, progress]
  );
  return id;
}

module.exports = { findByUserId, upsert };
