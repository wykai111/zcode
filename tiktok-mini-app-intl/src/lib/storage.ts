// lib/storage.ts - 观看历史(localStorage)
// 等价移植自 utils/api.js 的 fetchHistory / reportHistory / _timeAgo。
// LuckyShort 无历史接口,纯本地存储,key 为 watch_history,上限 50 条。
import type { HistoryRecord, ReportHistoryParams } from '@/types';

const HISTORY_KEY = 'watch_history';
const HISTORY_MAX = 50;

/** 读取历史数组(原始存储结构) */
export function readHistoryRaw(): HistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as HistoryRecord[];
  } catch {
    return [];
  }
}

/** 写入历史数组 */
function writeHistoryRaw(list: HistoryRecord[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
}

/** 时间戳 → 相对时间 */
function timeAgo(ts: number): string {
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
 * 获取观看历史:按时间倒序,并计算相对时间。
 * 对应原 api.fetchHistory。watchedAt 字段被实时计算的相对时间覆盖。
 */
export function fetchHistory(): HistoryRecord[] {
  return readHistoryRaw()
    .slice()
    .sort((a, b) => (b.watchedAt_ts || 0) - (a.watchedAt_ts || 0))
    .map((h) => ({ ...h, watchedAt: timeAgo(h.watchedAt_ts) }));
}

/**
 * 清空历史(真正清除 localStorage)。原 history 页只清内存,这里提供彻底清空。
 */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * 删除单条历史记录(按 drama_id)。WatchHistory 子页单条删除用。
 */
export function removeHistory(dramaId: string): void {
  const list = readHistoryRaw().filter((h) => h.drama_id !== dramaId);
  writeHistoryRaw(list);
}

/**
 * 上报观看记录(写本地存储)。
 * 对应原 api.reportHistory。去重:同剧更新,不同剧新增。
 */
export function reportHistory(params: ReportHistoryParams): string {
  const { dramaId, epNumber = 1, progress = 0, title, cover, duration } = params;
  const list = readHistoryRaw();
  const idx = list.findIndex((h) => h.drama_id === dramaId);
  const record: HistoryRecord = {
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
  writeHistoryRaw(list);
  return record.id;
}
