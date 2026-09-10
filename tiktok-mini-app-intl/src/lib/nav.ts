// lib/nav.ts - 导航辅助(集中管理跳转路径,对应原 tt.navigateTo)
import type { NavigateFunction } from 'react-router-dom';

/** 跳转播放器 */
export function goPlayer(navigate: NavigateFunction, id: string, ep = 1): void {
  navigate(`/player/${id}?ep=${ep}`);
}

/** 跳转列表页(See All) */
export function goList(navigate: NavigateFunction, type: string): void {
  navigate(`/list?type=${type}`);
}

/** 跳转观看历史子页 */
export function goWatchHistory(navigate: NavigateFunction): void {
  navigate('/profile/watch-history');
}
