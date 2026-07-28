// utils/api.js - 接口封装 + 字段归一化（对接 LuckyShort API）
// 所有函数返回结构对齐前端页面期望，页面层无需改动
const { get, post } = require('./request');
const { LANGUAGE } = require('./config');

/* =========================================
   字段归一化：LuckyShort 短剧 → 前端各页面需要结构
   LuckyShort 字段：id, title, intro, description, categories[], episode_count, cover, tags[], episode_part{...}
   LuckyShort 没有：rating / views / tag(HOT/NEW) / board → 对应 UI 已移除
   ========================================= */

// 画廊轮播（首页 Gallery）
function toGallery(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
    // 首集播放地址（gallery 的 Play 按钮用）
    videoUrl: (d.episode_part && d.episode_part.stream_hls) || '',
  };
}

// 卡片（Top Shorts / Trending / ForYou）
function toCard(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
    duration: (d.episode_part && d.episode_part.duration) ? String(d.episode_part.duration) : '',
  };
}

// 新上架卡片（New Arrivals）
function toNewCard(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    description: d.intro || d.description || '',
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
  };
}

// 列表页项
function toListItem(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
  };
}

// 推荐流（For You）— LuckyShort 无作者体系，移除 author/avatar
function toForYou(d) {
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    duration: (d.episode_part && d.episode_part.duration) ? String(d.episode_part.duration) : '0:58',
    description: d.intro || d.description || d.title,
    tags: d.categories || d.tags || [],
  };
}

/* =========================================
   接口函数
   ========================================= */

/**
 * 首页聚合：gallery + topShorts + newArrivals + trending
 * LuckyShort 无聚合接口，组合 episodes（列表）+ ranking（排行）
 */
function fetchHome() {
  const lang = LANGUAGE;
  // episodes 接口取列表（gallery + topShorts + newArrivals），ranking 取 trending
  return Promise.all([
    get(`/v1/languages/${lang}/episodes`, { page: 1, pageSize: 30 }),
    get(`/v1/languages/${lang}/episodes/ranking`, { page: 1, pageSize: 10 }),
  ]).then(([listRes, rankRes]) => {
    const all = (listRes.data || []);
    const ranked = (rankRes.data || []);

    // gallery：取前 4 部（带首集地址，用于 Play）
    const gallery = all.slice(0, 4).map(toGallery);
    // topShorts：取第 5-10 部
    const topShorts = all.slice(4, 10).map(toCard);
    // newArrivals：取第 11-13 部
    const newArrivals = all.slice(10, 13).map(toNewCard);
    // trending：用排行榜前 6 部
    const trending = ranked.slice(0, 6).map(toCard);

    return { gallery, topShorts, newArrivals, trending };
  });
}

/**
 * 短剧列表（See All 页 / 分类筛选）
 * GET /v1/languages/{lang}/episodes 或 /v1/languages/{lang}/categories/{cat}/episodes
 */
function fetchDramaList({ categoryId, page = 1, pageSize = 20 } = {}) {
  const lang = LANGUAGE;
  let path = `/v1/languages/${lang}/episodes`;
  if (categoryId && categoryId !== 'all') {
    path = `/v1/languages/${lang}/categories/${encodeURIComponent(categoryId)}/episodes`;
  }
  return get(path, { page, pageSize }).then((res) => ({
    list: (res.data || []).map(toListItem),
    total: res.total || 0,
  }));
}

/**
 * 短剧详情
 * GET /v1/languages/{lang}/episodes/{id}
 */
function fetchDramaDetail(id) {
  return get(`/v1/languages/${LANGUAGE}/episodes/${id}`).then((d) => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    description: d.intro || d.description || '',
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
  }));
}

/**
 * 短剧的剧集列表
 * GET /v1/languages/{lang}/episodes/{id}/playlist
 */
function fetchEpisodes(id) {
  return get(`/v1/languages/${LANGUAGE}/episodes/${id}/playlist`).then((list) => {
    const eps = (list || []).map((ep) => ({
      id: ep.id,
      ep: ep.part_index,
      label: `EP ${ep.part_index}`,
      free: true,  // LuckyShort 无付费锁概念，统一免费
      duration: ep.duration ? String(ep.duration) : '',
      videoUrl: ep.stream_hls || '',
    }));
    return { total: eps.length, episodes: eps };
  });
}

/**
 * 分类列表
 * GET /v1/languages/{lang}/categories
 */
function fetchCategories() {
  return get(`/v1/languages/${LANGUAGE}/categories`, { page: 1, pageSize: 50 }).then((res) => {
    // LuckyShort 分类只有 name，用 name 作 id
    const cats = (res.data || []).map((c) => ({ id: c.name, name: c.name, icon: '' }));
    // 头部加 All
    return [{ id: 'all', name: 'All', icon: '🎯' }].concat(cats);
  });
}

/**
 * 推荐流（For You）
 * 复用排行榜接口
 */
function fetchForYou() {
  return get(`/v1/languages/${LANGUAGE}/episodes/ranking`, { page: 1, pageSize: 20 })
    .then((res) => (res.data || []).map(toForYou));
}

/* =========================================
   观看历史 - 本地存储（LuckyShort 无此接口）
   ========================================= */
const HISTORY_KEY = 'watch_history';
const HISTORY_MAX = 50;

function fetchHistory() {
  return Promise.resolve().then(() => {
    const list = tt.getStorageSync(HISTORY_KEY) || [];
    // 按时间倒序，并计算相对时间
    return list
      .sort((a, b) => (b.watchedAt_ts || 0) - (a.watchedAt_ts || 0))
      .map((h) => ({
        ...h,
        watchedAt: _timeAgo(h.watchedAt_ts),
      }));
  });
}

// 时间戳 → 'just now' / 'x minutes ago'
function _timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hours ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} days ago`;
  return `${Math.floor(day / 7)} weeks ago`;
}

/**
 * 上报观看记录（写本地存储）
 * @param {object} param0 { dramaId, epNumber, progress, title, cover, duration }
 */
function reportHistory({ dramaId, epNumber = 1, progress = 0, title, cover, duration }) {
  return Promise.resolve().then(() => {
    const list = tt.getStorageSync(HISTORY_KEY) || [];
    // 去重：同剧更新，不同剧新增
    const idx = list.findIndex((h) => h.drama_id === dramaId);
    const record = {
      id: `hist_${dramaId}`,
      drama_id: dramaId,
      title: title || (idx >= 0 ? list[idx].title : ''),
      cover: cover || (idx >= 0 ? list[idx].cover : ''),
      duration: duration || (idx >= 0 ? list[idx].duration : ''),
      ep_number: epNumber,
      episode: `EP ${epNumber}`,
      progress,
      watchedAt_ts: Date.now(),
      watchedAt: 'just now',
    };
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    // 限制最多 HISTORY_MAX 条
    const trimmed = list.slice(0, HISTORY_MAX);
    tt.setStorageSync(HISTORY_KEY, trimmed);
    return record.id;
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
