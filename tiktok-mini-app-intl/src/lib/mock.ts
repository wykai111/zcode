// lib/mock.ts - Mock 数据兜底(数据来自 LuckyShort API 文档的真实示例)
// 当 LuckyShort API 不可达(如服务端宕机返回 530)时,各接口回退到这些数据,
// 让 UI / 播放器 / 导航 / 历史等功能可独立验证。API 恢复后自动切回真实数据。
//
// 数据来源:长沙风园-2-api-doc.pdf 中的 Response 示例(真实短剧标题、分类、字段结构)。
// ⚠️ 占位用,API 恢复后无需改动——请求成功就用真实数据,失败才用 Mock。
import type {
  HomeData,
  ListItem,
  DramaDetail,
  EpisodeList,
  Category,
  ForYouItem,
} from '@/types';

// 公开测试 HLS 流(用于验证播放器解码/播放/切集,真实流地址需 API 恢复)
const TEST_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

// API 文档示例中的真实短剧(标题/分类来自文档 Response 示例)
const SAMPLE_DRAMAS = [
  {
    id: 'LK_17439565',
    title: 'Adoro o tio de seu noivo',
    intro: 'Ela é forçada a se comprometer',
    description: 'Ela é forçada a se comprometer',
    categories: ['F', 'V', 'E'],
    episode_count: 94,
    cover: 'https://picsum.photos/seed/adoro/400/600',
  },
  {
    id: 'kuril_MqKQymKk',
    title: 'Munchkin Takes Me to My Husband',
    intro: 'ER Romance: From One Night to Forever',
    description: 'ER Romance: From One Night to Forever During a',
    categories: ['One night stand', 'Romantic Drama', 'Messy love', 'Contract marriage', 'True love', 'Billionaire'],
    episode_count: 72,
    cover: 'https://picsum.photos/seed/munchkin/400/600',
  },
  {
    id: 'LK_17438490',
    title: 'Billionaire Secret Love',
    intro: 'A hidden romance that changes everything',
    description: 'A hidden romance that changes everything',
    categories: ['Billionaire', 'Romantic Drama', 'True love'],
    episode_count: 85,
    cover: 'https://picsum.photos/seed/billionaire/400/600',
  },
  {
    id: 'LK_17440001',
    title: 'Forbidden Vows',
    intro: 'She married the wrong brother',
    description: 'She married the wrong brother by mistake',
    categories: ['F', 'V', 'Contract marriage'],
    episode_count: 60,
    cover: 'https://picsum.photos/seed/forbidden/400/600',
  },
  {
    id: 'LK_17450002',
    title: 'The Temptation of the Governess',
    intro: 'A forbidden romance in a noble house',
    description: 'A forbidden romance in a noble house',
    categories: ['Romantic Drama', 'Forbidden love', 'True love'],
    episode_count: 80,
    cover: 'https://picsum.photos/seed/governess/400/600',
  },
  {
    id: 'LK_17450003',
    title: 'My Secret CEO Husband',
    intro: 'She never knew her husband was a billionaire',
    description: 'She never knew her husband was a billionaire',
    categories: ['Billionaire', 'Contract marriage', 'True love'],
    episode_count: 70,
    cover: 'https://picsum.photos/seed/ceo/400/600',
  },
  {
    id: 'LK_17450004',
    title: 'Revenge of the Exiled Heiress',
    intro: 'Betrayed and cast out, she returns for vengeance',
    description: 'Betrayed and cast out, she returns for vengeance',
    categories: ['Revenge', 'Billionaire', 'True love'],
    episode_count: 90,
    cover: 'https://picsum.photos/seed/heires/400/600',
  },
  {
    id: 'LK_17450005',
    title: 'Love in the Storm',
    intro: 'Two hearts collide in a raging tempest',
    description: 'Two hearts collide in a raging tempest',
    categories: ['Romantic Drama', 'True love'],
    episode_count: 55,
    cover: 'https://picsum.photos/seed/storm/400/600',
  },
  {
    id: 'LK_17450006',
    title: 'The Double Life of Anna',
    intro: 'By day a clerk, by night a mogul',
    description: 'By day a clerk, by night a mogul',
    categories: ['Billionaire', 'Messy love'],
    episode_count: 65,
    cover: 'https://picsum.photos/seed/anna/400/600',
  },
  {
    id: 'LK_17450007',
    title: 'Married to My Boss',
    intro: 'An office romance that turns into marriage',
    description: 'An office romance that turns into marriage',
    categories: ['Romantic Drama', 'One night stand', 'True love'],
    episode_count: 48,
    cover: 'https://picsum.photos/seed/boss/400/600',
  },
  {
    id: 'LK_17450008',
    title: 'Crown of Thorns',
    intro: 'To wear the crown, she must survive the throne',
    description: 'To wear the crown, she must survive the throne',
    categories: ['Revenge', 'Contract marriage'],
    episode_count: 75,
    cover: 'https://picsum.photos/seed/crown/400/600',
  },
];

function withFirstEpisode(d: (typeof SAMPLE_DRAMAS)[number]) {
  return {
    ...d,
    episode_part: {
      id: d.id,
      language: 'en',
      thumbnail: d.cover,
      duration: 103.61,
      part_index: 1,
      stream_hls: TEST_HLS,
    },
  };
}

const DRAMAS = SAMPLE_DRAMAS.map(withFirstEpisode);

export const MOCK_HOME: HomeData = {
  gallery: DRAMAS.slice(0, 8).map((d) => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episode_count || 0,
    tags: d.categories || [],
    videoUrl: d.episode_part?.stream_hls || TEST_HLS,
  })),
  topShorts: DRAMAS.slice(0, 6).map((d) => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episode_count || 0,
    tags: d.categories || [],
    duration: String(d.episode_part?.duration || 103),
  })),
  newArrivals: DRAMAS.slice(6, 9).map((d) => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    description: d.intro || '',
    episodes: d.episode_count || 0,
    tags: d.categories || [],
  })),
  trending: DRAMAS.slice(0, 6).map((d) => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episode_count || 0,
    tags: d.categories || [],
    duration: String(d.episode_part?.duration || 103),
  })),
};

export const MOCK_DRAMA_LIST: { list: ListItem[]; total: number } = {
  list: DRAMAS.map((d) => ({
    id: d.id,
    title: d.title,
    cover: d.cover,
    episodes: d.episode_count || 0,
    tags: d.categories || [],
  })),
  total: DRAMAS.length,
};

export function mockDramaDetail(id: string): DramaDetail {
  const d = DRAMAS.find((x) => x.id === id) || DRAMAS[0];
  return {
    id: d.id,
    title: d.title,
    cover: d.cover,
    description: d.intro || d.description || '',
    episodes: d.episode_count || 8,
    tags: d.categories || [],
  };
}

export function mockEpisodes(id: string): EpisodeList {
  void id;
  // 文档示例短剧 episode_count 多为 60-94,Mock 用 12 集避免面板过长
  const count = 12;
  const eps = Array.from({ length: count }, (_, i) => ({
    id: `${id}_ep${i + 1}`,
    ep: i + 1,
    label: `EP ${i + 1}`,
    free: true,
    duration: '103',
    videoUrl: TEST_HLS,
  }));
  return { total: eps.length, episodes: eps };
}

// 文档示例分类
export const MOCK_CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: '🎯' },
  { id: 'Billionaire', name: 'Billionaire', icon: '' },
  { id: 'Romantic Drama', name: 'Romantic Drama', icon: '' },
  { id: 'One night stand', name: 'One night stand', icon: '' },
  { id: 'Messy love', name: 'Messy love', icon: '' },
  { id: 'Contract marriage', name: 'Contract marriage', icon: '' },
  { id: 'True love', name: 'True love', icon: '' },
  { id: 'F', name: 'F', icon: '' },
  { id: 'V', name: 'V', icon: '' },
  { id: 'E', name: 'E', icon: '' },
];

export const MOCK_FORYOU: ForYouItem[] = DRAMAS.map((d) => ({
  id: d.id,
  title: d.title,
  cover: d.cover,
  duration: '1:43',
  description: d.intro || d.title,
  tags: d.categories || [],
}));
