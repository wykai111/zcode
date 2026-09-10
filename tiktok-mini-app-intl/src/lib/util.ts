// lib/util.ts - 通用工具函数(等价移植 utils/util.js,去掉 tt.* 依赖)
import { useUIStore } from '@/store/uiStore';

/** 格式化数字(1000 -> 1K, 1000000 -> 1M) */
export function formatNumber(num: number | string): string {
  if (typeof num === 'string') return num;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

/** 格式化时长(秒 -> mm:ss 或 m:ss) */
export function formatDuration(seconds: number): string {
  const sec = Math.floor(seconds || 0);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** 节流 */
export function throttle<T extends (...args: never[]) => void>(fn: T, delay = 300): T {
  let last = 0;
  return ((...args: never[]) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  }) as T;
}

/** 防抖 */
export function debounce<T extends (...args: never[]) => void>(fn: T, delay = 300): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: never[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/** 显示 Toast(替代 tt.showToast) */
export function showToast(title: string, icon: 'none' | 'success' | 'error' = 'none', duration = 1500): void {
  useUIStore.getState().showToast(title, icon, duration);
}

/** 振动反馈(替代 tt.vibrateShort;环境不支持时静默降级) */
export function vibrate(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    // TikTok Minis 等环境会禁用 vibrate 并抛异常,静默忽略,绝不影响业务逻辑
  }
}
