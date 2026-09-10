// types.ts - 业务领域类型定义

/** 原始短剧(LuckyShort 字段) */
export interface RawEpisode {
  id: string;
  title: string;
  intro?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  episode_count?: number;
  cover: string;
  episode_part?: {
    stream_hls?: string;
    duration?: number;
  };
}

/** 单集(playlist 项) */
export interface RawEpisodeItem {
  id: string;
  part_index: number;
  duration?: number;
  stream_hls?: string;
}

/* ============ 归一化后的卡片类型(对应 api.js 的 toXxx)============ */

export interface GalleryItem {
  id: string;
  title: string;
  cover: string;
  episodes: number;
  tags: string[];
  videoUrl: string;
}

export interface CardItem {
  id: string;
  title: string;
  cover: string;
  episodes: number;
  tags: string[];
  duration: string;
}

export interface NewCardItem {
  id: string;
  title: string;
  cover: string;
  description: string;
  episodes: number;
  tags: string[];
}

export interface ListItem {
  id: string;
  title: string;
  cover: string;
  episodes: number;
  tags: string[];
}

export interface ForYouItem {
  id: string;
  title: string;
  cover: string;
  duration: string;
  description: string;
  tags: string[];
}

/** 首页聚合数据 */
export interface HomeData {
  gallery: GalleryItem[];
  topShorts: CardItem[];
  newArrivals: NewCardItem[];
  trending: CardItem[];
}

/** 短剧详情 */
export interface DramaDetail {
  id: string;
  title: string;
  cover: string;
  description: string;
  episodes: number;
  tags: string[];
}

/** 单集(归一化) */
export interface Episode {
  id: string;
  ep: number;
  label: string;
  free: boolean;
  duration: string;
  videoUrl: string;
}

export interface EpisodeList {
  total: number;
  episodes: Episode[];
}

/** 分类 */
export interface Category {
  id: string;
  name: string;
  icon: string;
}

/* ============ 收藏夹(localStorage / 登录后同步服务端)============ */
export interface CollectItem {
  id: string;
  title: string;
  cover: string;
  episodes: number;
  tags: string[];
  addedAt: number; // 加入收藏的时间戳
}

/* ============ 观看历史(localStorage)============ */
export interface HistoryRecord {
  id: string;
  drama_id: string;
  title: string;
  cover: string;
  duration: string;
  ep_number: number;
  episode: string;
  progress: number; // 0-100
  watchedAt_ts: number;
  watchedAt: string;
}

export interface ReportHistoryParams {
  dramaId: string;
  epNumber?: number;
  progress?: number;
  title?: string;
  cover?: string;
  duration?: string;
}
