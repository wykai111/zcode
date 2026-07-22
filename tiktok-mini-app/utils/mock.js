// utils/mock.js - 模拟数据

/**
 * 顶部搜索栏配置
 */
const searchConfig = {
  placeholder: 'Search dramas, actors, directors',
};

/**
 * Gallery 画廊轮播区（搜索框下方的主推位）
 * 大幅居中封面海报 + 右下角白色 Play 按钮
 */
const gallery = [
  {
    id: 'g1',
    title: "The Stepmother's Empire",
    cover: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=900&q=85',
    episodes: 30,
    tags: ['Betrayal', 'Revenge', 'Family'],
  },
  {
    id: 'g2',
    title: "Married to the Devil in Disguise",
    cover: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=900&q=85',
    episodes: 24,
    tags: ['Romance', 'Wealthy Family', 'Drama'],
  },
  {
    id: 'g3',
    title: "Maid's Lost Memory",
    cover: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=900&q=85',
    episodes: 18,
    tags: ['Amnesia', 'Kickass Heroine', 'Revenge'],
  },
  {
    id: 'g4',
    title: 'Out of Control',
    cover: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&q=85',
    episodes: 22,
    tags: ['Action', 'Suspense', 'Dual Male Leads'],
  },
];

/**
 * 顶部热门短剧标题横向滚动词条
 */
const hotTitles = [
  '🔥 Out of Control',
  '💔 Married to the Devil',
  '👑 The Stepmother\'s Empire',
  '💎 Owned by My Ex\'s Uncle',
  '🧠 Maid\'s Lost Memory',
  '🎭 A Single Report',
  '⚔️ Dragon Throne',
];

/**
 * 主推视频（Banner）
 */
const featuredVideo = {
  id: 'f001',
  title: 'Secrets of the Phoenix',
  subtitle: 'Season 2 · Episode 5',
  description: 'A legendary warrior returns to reclaim her kingdom from darkness. New episode every Friday.',
  cover: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&q=80',
  tag: 'FEATURED',
  rating: 9.2,
  duration: '12:45',
  views: '2.4M',
  likes: '186K',
  isNew: true,
  genre: ['Action', 'Drama', 'Fantasy'],
};

/**
 * Top Shorts 短剧列表
 */
const topShorts = [
  {
    id: 's001',
    title: 'Midnight in Tokyo',
    cover: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
    duration: '08:32',
    views: '1.2M',
    rating: 8.9,
    tag: 'NEW',
    episodes: 24,
    genre: 'Romance',
  },
  {
    id: 's002',
    title: 'The Last Heist',
    cover: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
    duration: '15:20',
    views: '3.5M',
    rating: 9.4,
    tag: 'HOT',
    episodes: 16,
    genre: 'Crime',
  },
  {
    id: 's003',
    title: 'Love in Paris',
    cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    duration: '10:15',
    views: '892K',
    rating: 8.5,
    tag: 'NEW',
    episodes: 12,
    genre: 'Romance',
  },
  {
    id: 's004',
    title: 'Dragon Throne',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&q=80',
    duration: '18:42',
    views: '5.1M',
    rating: 9.6,
    tag: 'HOT',
    episodes: 30,
    genre: 'Historical',
  },
  {
    id: 's005',
    title: 'Cyber Heart',
    cover: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=600&q=80',
    duration: '09:58',
    views: '2.0M',
    rating: 8.7,
    tag: 'NEW',
    episodes: 20,
    genre: 'Sci-Fi',
  },
  {
    id: 's006',
    title: 'Royal Betrayal',
    cover: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&q=80',
    duration: '14:30',
    views: '1.8M',
    rating: 9.1,
    tag: 'HOT',
    episodes: 18,
    genre: 'Drama',
  },
];

/**
 * For You 推荐流（竖屏短视频）
 */
const forYouFeed = [
  {
    id: 'v001',
    title: 'When the CEO Falls in Love 💕',
    author: '@dramaqueen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    cover: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&q=80',
    likes: '125K',
    comments: '3.2K',
    shares: '8.5K',
    duration: '00:45',
    description: 'He never saw it coming... 😱 #shortdrama #ceo #romance',
    tags: ['ceo', 'romance', 'plotwist'],
  },
  {
    id: 'v002',
    title: 'The Maid Was Actually a Billionaire!',
    author: '@plotmaster',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
    cover: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
    likes: '342K',
    comments: '12K',
    shares: '25K',
    duration: '01:12',
    description: 'The ultimate revenge plot unfolds 🔥 #billionaire #revenge',
    tags: ['billionaire', 'revenge', 'shocking'],
  },
  {
    id: 'v003',
    title: 'My Husband\'s Secret Twin',
    author: '@twindrama',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    cover: 'https://images.unsplash.com/photo-1543168256-418811576931?w=600&q=80',
    likes: '89K',
    comments: '5.4K',
    shares: '12K',
    duration: '00:58',
    description: 'Which one is the real one? 🤔 #mystery #twins',
    tags: ['mystery', 'twins', 'suspense'],
  },
];

/**
 * 历史观看记录
 */
const historyList = [
  {
    id: 'h001',
    title: 'Secrets of the Phoenix',
    cover: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&q=80',
    progress: 75,
    episode: 'S2 E5',
    watchedAt: '2 hours ago',
    duration: '12:45',
  },
  {
    id: 'h002',
    title: 'Midnight in Tokyo',
    cover: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
    progress: 40,
    episode: 'S1 E12',
    watchedAt: 'Yesterday',
    duration: '08:32',
  },
  {
    id: 'h003',
    title: 'The Last Heist',
    cover: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
    progress: 100,
    episode: 'S1 E16',
    watchedAt: '3 days ago',
    duration: '15:20',
  },
  {
    id: 'h004',
    title: 'Love in Paris',
    cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    progress: 15,
    episode: 'S1 E3',
    watchedAt: '1 week ago',
    duration: '10:15',
  },
];

/**
 * 用户信息（经典 TikTok Profile）
 */
const userProfile = {
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&q=80',
  nickname: 'Alex Chen',
  username: 'dramafan_2024',
  following: 128,
  followers: '12.5K',
  likes: '1.2M',
};

/**
 * Profile 页 - 我的作品网格（9宫格）
 * locked: 是否为私密视频（显示锁图标）
 */
const myVideos = [
  { id: 'm1', cover: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&q=80', plays: '125K', locked: false },
  { id: 'm2', cover: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80', plays: '342K', locked: false },
  { id: 'm3', cover: 'https://images.unsplash.com/photo-1543168256-418811576931?w=400&q=80', plays: '89K', locked: false },
  { id: 'm4', cover: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80', plays: '1.2M', locked: false },
  { id: 'm5', cover: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80', plays: '567K', locked: false },
  { id: 'm6', cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80', plays: '234K', locked: true },
  { id: 'm7', cover: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&q=80', plays: '92K', locked: false },
  { id: 'm8', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80', plays: '445K', locked: true },
  { id: 'm9', cover: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&q=80', plays: '78K', locked: false },
];

/**
 * 分类标签
 */
const categories = [
  { id: 'all', name: 'All', icon: '🎯' },
  { id: 'romance', name: 'Romance', icon: '💕' },
  { id: 'action', name: 'Action', icon: '💥' },
  { id: 'drama', name: 'Drama', icon: '🎭' },
  { id: 'comedy', name: 'Comedy', icon: '😂' },
  { id: 'vip', name: 'VIP', icon: '👑' },
];

/**
 * New Arrivals 新上架专区（竖向卡片列表）
 * 每条卡片：封面 + NEW 标识 + 标题 + 题材标签 + Play 按钮
 */
const newArrivals = [
  {
    id: 'n1',
    title: "The Stepmother's Empire",
    cover: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&q=80',
    episodes: 30,
    tags: ['Betrayal', 'Revenge', 'Family'],
    rating: 9.2,
    description: 'A betrayed wife rebuilds her empire to seek revenge.',
  },
  {
    id: 'n2',
    title: "Maid's Lost Memory",
    cover: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&q=80',
    episodes: 24,
    tags: ['Amnesia', 'Revenge', 'Kickass Heroine'],
    rating: 8.9,
    description: 'After losing her memory, a maid discovers her true identity.',
  },
  {
    id: 'n3',
    title: 'A Single Report Uncovers Her Secret',
    cover: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80',
    episodes: 18,
    tags: ['Mystery', 'Wealthy Family', 'Suspense'],
    rating: 9.4,
    description: 'One report exposes a powerful family\'s darkest secret.',
  },
  {
    id: 'n4',
    title: 'Cinderella\'s Revenge Plan',
    cover: 'https://images.unsplash.com/photo-1543168256-418811576931?w=400&q=80',
    episodes: 22,
    tags: ['Romance', 'Revenge', 'Anime'],
    rating: 8.7,
    description: 'A modern Cinderella turns the tables on her oppressors.',
  },
  {
    id: 'n5',
    title: 'The Hidden Heiress',
    cover: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&q=80',
    episodes: 26,
    tags: ['Anime', 'Identity', 'Drama'],
    rating: 9.0,
    description: 'She hid her true identity, until fate forced her hand.',
  },
];

/**
 * Trending 热门趋势专区（横向滑动封面）
 */
const trending = [
  {
    id: 't1',
    title: 'Out of Control',
    cover: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80',
    plays: '4.2M',
    tag: 'HOT',
  },
  {
    id: 't2',
    title: "Owned by My Ex's Uncle",
    cover: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80',
    plays: '3.8M',
    tag: 'HOT',
  },
  {
    id: 't3',
    title: 'Married to the Devil in Disguise',
    cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
    plays: '5.1M',
    tag: 'HOT',
  },
  {
    id: 't4',
    title: 'Dragon Throne',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',
    plays: '2.9M',
    tag: 'HOT',
  },
  {
    id: 't5',
    title: 'Love in Paris',
    cover: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&q=80',
    plays: '1.7M',
    tag: 'HOT',
  },
  {
    id: 't6',
    title: 'Midnight in Tokyo',
    cover: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80',
    plays: '1.4M',
    tag: 'HOT',
  },
];

/**
 * 根据 id 从所有数据源中查找短剧详情
 * 用于播放页统一获取短剧信息（无论从哪个入口点击）
 */
function findDramaById(id) {
  const sources = [gallery, newArrivals, trending, topShorts, forYouFeed];
  for (const src of sources) {
    const found = src.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * 构造播放页剧集列表（Ep1 ~ EpN）
 * 根据 id 查到短剧，用其 episodes 字段生成集数列表
 */
function buildEpisodes(id) {
  const drama = findDramaById(id);
  const total = drama && drama.episodes ? drama.episodes : 24; // 默认 24 集
  const list = [];
  for (let i = 1; i <= total; i++) {
    list.push({
      ep: i,
      label: `EP ${i}`,
      // 前 2 集免费，其余锁定（VIP）
      free: i <= 2,
      duration: '0:58', // 模拟单集时长（海外短剧单集约 1 分钟）
    });
  }
  return { drama, episodes: list, total };
}

/**
 * 根据 type 获取列表页数据（统一数据源）
 * 支持: 'new' | 'topshort' | 'trending'
 * 返回归一化结构: { title, subtitle, list }
 * list 每项: { id, title, cover, episodes, rating, tag, views }
 */
function getListData(type) {
  const map = {
    new: {
      title: 'New Arrivals',
      subtitle: 'Latest updated dramas',
      source: newArrivals,
    },
    topshort: {
      title: 'Top Shorts',
      subtitle: 'Most popular short dramas',
      source: topShorts,
    },
    trending: {
      title: 'Trending',
      subtitle: 'What everyone is watching',
      source: trending,
    },
  };

  const conf = map[type] || map.new;
  const list = conf.source.map((item) => ({
    id: item.id,
    title: item.title,
    cover: item.cover,
    episodes: item.episodes || 0,
    rating: item.rating || 0,
    tag: item.tag || '',
    views: item.views || item.plays || '',
  }));

  return { title: conf.title, subtitle: conf.subtitle, list };
}

module.exports = {
  searchConfig,
  gallery,
  hotTitles,
  featuredVideo,
  topShorts,
  newArrivals,
  trending,
  forYouFeed,
  historyList,
  userProfile,
  myVideos,
  categories,
  findDramaById,
  buildEpisodes,
  getListData,
};
