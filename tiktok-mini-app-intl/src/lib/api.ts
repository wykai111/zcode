// lib/api.ts - 接口封装 + 字段归一化(对接 LuckyShort API)
// 等价移植自 utils/api.js 的网络部分(历史相关已挪到 lib/storage.ts)。
// 所有函数返回结构对齐前端页面期望,页面层无需改动。
import { get } from './request';
import { LANGUAGE } from './config';
import {
  MOCK_HOME,
  MOCK_DRAMA_LIST,
  mockDramaDetail,
  mockEpisodes,
  MOCK_CATEGORIES,
  MOCK_FORYOU,
} from './mock';
import type {
  RawEpisode,
  RawEpisodeItem,
  GalleryItem,
  CardItem,
  NewCardItem,
  ListItem,
  ForYouItem,
  HomeData,
  DramaDetail,
  EpisodeList,
  Category,
} from '@/types';

/* ============ 资源 URL 域名修复 ============ */
// API 返回的资源链接(封面/缩略图/HLS 流)指向旧域名 *.qlaryline.xyz,
// 而该域名资源服务器已宕机(530/522)。新数据接口在 api.sparkeak.shop,
// 资源也已迁移到 *.sparkeak.shop,故统一替换域名。
// 已验证:替换后封面图 200、HLS 域名可达。
const DEPRECATED_HOST = 'qlaryline.xyz';
const ACTIVE_HOST = 'sparkeak.shop';

/** 把资源 URL 的旧域名替换为新域名;非资源链接原样返回。 */
function fixAssetUrl(url: string | undefined | null): string {
  if (!url) return '';
  return url.includes(DEPRECATED_HOST) ? url.split(DEPRECATED_HOST).join(ACTIVE_HOST) : url;
}

/* ============ 字段归一化 ============ */

function toGallery(d: RawEpisode): GalleryItem {
  return {
    id: d.id,
    title: d.title,
    cover: fixAssetUrl(d.cover),
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
    videoUrl: fixAssetUrl(d.episode_part && d.episode_part.stream_hls),
  };
}

function toCard(d: RawEpisode): CardItem {
  return {
    id: d.id,
    title: d.title,
    cover: fixAssetUrl(d.cover),
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
    duration: d.episode_part && d.episode_part.duration ? String(d.episode_part.duration) : '',
  };
}

function toNewCard(d: RawEpisode): NewCardItem {
  return {
    id: d.id,
    title: d.title,
    cover: fixAssetUrl(d.cover),
    description: d.intro || d.description || '',
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
  };
}

function toListItem(d: RawEpisode): ListItem {
  return {
    id: d.id,
    title: d.title,
    cover: fixAssetUrl(d.cover),
    episodes: d.episode_count || 0,
    tags: d.categories || d.tags || [],
  };
}

function toForYou(d: RawEpisode): ForYouItem {
  return {
    id: d.id,
    title: d.title,
    cover: fixAssetUrl(d.cover),
    duration: d.episode_part && d.episode_part.duration ? String(d.episode_part.duration) : '0:58',
    description: d.intro || d.description || d.title,
    tags: d.categories || d.tags || [],
  };
}

/* ============ LuckyShort 响应类型 ============ */

interface ListResponse<T> {
  data?: T[];
  total?: number;
}

/* ============ 接口函数 ============ */

/**
 * 首页聚合:gallery + topShorts + newArrivals + trending。
 * LuckyShort 无聚合接口,组合 episodes(列表)+ ranking(排行)。
 */
export async function fetchHome(): Promise<HomeData> {
  try {
    const lang = LANGUAGE;
    const [listRes, rankRes] = await Promise.all([
      get<ListResponse<RawEpisode>>(`/v1/languages/${lang}/episodes`, { page: 1, pageSize: 30 }),
      get<ListResponse<RawEpisode>>(`/v1/languages/${lang}/episodes/ranking`, { page: 1, pageSize: 10 }),
    ]);
    const all = listRes.data || [];
    const ranked = rankRes.data || [];

    return {
      gallery: all.slice(0, 8).map(toGallery),
      topShorts: all.slice(8, 14).map(toCard),
      newArrivals: all.slice(14, 17).map(toNewCard),
      trending: ranked.slice(0, 6).map(toCard),
    };
  } catch {
    console.warn('[api] fetchHome 失败,使用 Mock 数据兜底');
    return MOCK_HOME;
  }
}

/**
 * 短剧列表(See All 页 / 分类筛选)。
 * 注意:原 list 页传 board 参数但此函数忽略之(与原项目一致),三个 board 返回相同数据。
 */
export async function fetchDramaList({
  categoryId,
  page = 1,
  pageSize = 20,
}: {
  categoryId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ list: ListItem[]; total: number }> {
  try {
    const lang = LANGUAGE;
    let path = `/v1/languages/${lang}/episodes`;
    if (categoryId && categoryId !== 'all') {
      path = `/v1/languages/${lang}/categories/${encodeURIComponent(categoryId)}/episodes`;
    }
    const res = await get<ListResponse<RawEpisode>>(path, { page, pageSize });
    return {
      list: (res.data || []).map(toListItem),
      total: res.total || 0,
    };
  } catch {
    console.warn('[api] fetchDramaList 失败,使用 Mock 数据兜底');
    return MOCK_DRAMA_LIST;
  }
}

/** 短剧详情 */
export async function fetchDramaDetail(id: string): Promise<DramaDetail> {
  try {
    const d = await get<RawEpisode>(`/v1/languages/${LANGUAGE}/episodes/${id}`);
    return {
      id: d.id,
      title: d.title,
      cover: fixAssetUrl(d.cover),
      description: d.intro || d.description || '',
      episodes: d.episode_count || 0,
      tags: d.categories || d.tags || [],
    };
  } catch {
    console.warn('[api] fetchDramaDetail 失败,使用 Mock 数据兜底');
    return mockDramaDetail(id);
  }
}

/** 短剧的剧集列表 */
export async function fetchEpisodes(id: string): Promise<EpisodeList> {
  try {
    const list = await get<RawEpisodeItem[]>(`/v1/languages/${LANGUAGE}/episodes/${id}/playlist`);
    const eps = (list || []).map((ep) => ({
      id: ep.id,
      ep: ep.part_index,
      label: `EP ${ep.part_index}`,
      free: true, // LuckyShort 无付费锁概念,统一免费
      duration: ep.duration ? String(ep.duration) : '',
      videoUrl: fixAssetUrl(ep.stream_hls),
    }));
    return { total: eps.length, episodes: eps };
  } catch {
    console.warn('[api] fetchEpisodes 失败,使用 Mock 数据兜底');
    return mockEpisodes(id);
  }
}

/** 分类列表 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await get<ListResponse<{ name: string }>>(`/v1/languages/${LANGUAGE}/categories`, {
      page: 1,
      pageSize: 50,
    });
    const cats = (res.data || []).map((c) => ({ id: c.name, name: c.name, icon: '' }));
    return [{ id: 'all', name: 'All', icon: '🎯' }, ...cats];
  } catch {
    console.warn('[api] fetchCategories 失败,使用 Mock 数据兜底');
    return MOCK_CATEGORIES;
  }
}

/** 推荐流(For You),复用排行榜接口 */
export async function fetchForYou(): Promise<ForYouItem[]> {
  try {
    const res = await get<ListResponse<RawEpisode>>(`/v1/languages/${LANGUAGE}/episodes/ranking`, {
      page: 1,
      pageSize: 20,
    });
    return (res.data || []).map(toForYou);
  } catch {
    console.warn('[api] fetchForYou 失败,使用 Mock 数据兜底');
    return MOCK_FORYOU;
  }
}
