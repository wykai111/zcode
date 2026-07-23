// utils/api.js - 接口封装 + 字段归一化层
// 所有接口返回的字段结构对齐 mock.js，页面层无需改动
const { get, post } = require('./request');
const { USER_ID } = require('./config');

/* =========================================
   工具：数字/时间格式化
   ========================================= */

// 数字 → '1.2M' / '1.5K'
function formatNum(n) {
  if (n === null || n === undefined) return '';
  if (typeof n === 'string') return n; // 后端 /api/home 已格式化
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// MySQL DATETIME → '2 hours ago'
function timeAgo(dateStr) {
  if (!dateStr) return '';
  // MySQL 返回 'YYYY-MM-DD HH:mm:ss'，Safari/iOS 解析要替换成 ISO
  const t = new Date(String(dateStr).replace(/-/g, '/'));
  if (isNaN(t.getTime())) return '';
  const diff = Date.now() - t.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hours ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} days ago`;
  return `${Math.floor(day / 7)} weeks ago`;
}

/* =========================================
   字段归一化：后端 drama → 前端各板块需要的结构
   ========================================= */

// 画廊轮播
function toGallery(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episodes || 0,
    tags: d.tags || [],
  };
}

// 卡片（Top Shorts / Trending）
function toCard(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episodes || 0,
    rating: Number(d.rating) || 0,
    views: formatNum(d.views),
    tag: d.tag || '',
    duration: d.duration || '',
  };
}

// 新上架卡片（New Arrivals）
function toNewCard(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    description: d.description || '',
    episodes: d.episodes || 0,
    rating: Number(d.rating) || 0,
    tags: d.tags || [],
    duration: d.duration || '',
  };
}

// 列表页项
function toListItem(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episodes || 0,
    rating: Number(d.rating) || 0,
    views: formatNum(d.views),
    tag: d.tag || '',
    tags: d.tags || [],
  };
}

/* =========================================
   接口函数
   ========================================= */

/**
 * 首页聚合：gallery / topShorts / newArrivals / trending
 * GET /api/home
 */
function fetchHome() {
  return get('/api/home').then((data) => ({
    gallery: (data.gallery || []).map(toGallery),
    topShorts: (data.topShorts || []).map(toCard),
    newArrivals: (data.newArrivals || []).map(toNewCard),
    trending: (data.trending || []).map(toCard),
  }));
}

/**
 * 短剧列表（See All 页 / 分类筛选页）
 * GET /api/dramas?board=xxx&categoryId=yyy
 */
function fetchDramaList({ board, categoryId, page = 1, pageSize = 20 }) {
  const params = { page, pageSize };
  if (board) params.board = board;
  if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
  return get('/api/dramas', params).then((data) => ({
    list: (data.list || []).map(toListItem),
    total: data.total || 0,
  }));
}

/**
 * 短剧详情
 * GET /api/dramas/:id
 */
function fetchDramaDetail(id) {
  return get(`/api/dramas/${id}`).then((d) => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    description: d.description || '',
    episodes: d.episodes || 0,
    rating: Number(d.rating) || 0,
    views: d.views,
    tag: d.tag || '',
    tags: d.tags || [],
    board: d.board || [],
    duration: d.duration || '',
  }));
}

/**
 * 短剧的剧集列表
 * GET /api/dramas/:id/episodes
 */
function fetchEpisodes(id) {
  return get(`/api/dramas/${id}/episodes`).then((data) => ({
    total: data.total || 0,
    episodes: (data.episodes || []).map((ep) => ({
      id: ep.id,
      ep: ep.ep,
      label: ep.label,
      free: !!ep.free,
      duration: ep.duration || '',
      videoUrl: ep.video_url || '',
    })),
  }));
}

/**
 * 分类列表
 * GET /api/categories
 */
function fetchCategories() {
  return get('/api/categories').then((list) =>
    (list || []).map((c) => ({ id: c.id, name: c.name, icon: c.icon }))
  );
}

/**
 * 推荐流
 * GET /api/foryou
 */
function fetchForYou() {
  return get('/api/foryou').then((list) => (list || []).map(toForYou));
}

// 推荐流归一化（后端从 dramas 表包装）
function toForYou(d) {
  return {
    id: d.id,
    title: d.title,
    author: d.author || '@shortdrama',
    avatar: d.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80',
    cover: d.cover,
    likes: formatNum(d.likes || Math.floor(d.views / 10)),
    comments: formatNum(d.comments || Math.floor(d.views / 100)),
    shares: formatNum(d.shares || Math.floor(d.views / 200)),
    duration: d.duration || '0:58',
    description: d.description || d.title,
    tags: d.tags || [],
  };
}

/**
 * 观看历史
 * GET /api/history?userId=xxx
 */
function fetchHistory(userId = USER_ID) {
  return get('/api/history', { userId }).then((list) =>
    (list || []).map((h) => ({
      id: h.id,
      drama_id: h.drama_id, // 跳转播放用
      title: h.title,
      cover: h.cover,
      progress: h.progress || 0,
      episode: h.ep_number ? `EP ${h.ep_number}` : 'EP 1',
      watchedAt: timeAgo(h.watched_at),
      duration: h.duration || '',
    }))
  );
}

/**
 * 上报观看进度
 * POST /api/history
 */
function reportHistory({ dramaId, epNumber = 1, progress = 0, userId = USER_ID }) {
  return post('/api/history', {
    user_id: userId,
    drama_id: dramaId,
    ep_number: epNumber,
    progress,
  });
}

module.exports = {
  fetchHome,
  fetchDramaList,
  fetchDramaDetail,
  fetchEpisodes,
  fetchCategories,
  fetchForYou,
  fetchHistory,
  reportHistory,
};
