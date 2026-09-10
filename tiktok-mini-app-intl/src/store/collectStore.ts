// store/collectStore.ts - 收藏夹(useCollectStore)
// 对应需求里的 useCollectStore。
// 匿名访客模式:收藏存 localStorage(key=my_list)。
// 登录 TikTok 后:userStore 调用 syncToServer() 把本地收藏上传(预留 stub)。
// 订阅式:详情页 ⭐ 切换收藏后,My List 页面通过 Zustand 订阅实时响应更新。
import { create } from 'zustand';
import type { CollectItem } from '@/types';

const STORAGE_KEY = 'my_list';

/** 从 localStorage 读取收藏数组 */
function loadFromStorage(): CollectItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CollectItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** 写入 localStorage */
function saveToStorage(items: CollectItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 容量满或隐私模式:静默降级,内存态仍可用
  }
}

interface CollectState {
  items: CollectItem[];
  /** 是否已收藏某剧 */
  isCollected: (id: string) => boolean;
  /** 加入收藏(已存在则忽略) */
  addCollect: (item: Omit<CollectItem, 'addedAt'>) => void;
  /** 取消收藏 */
  removeCollect: (id: string) => void;
  /** 批量取消收藏 */
  removeMany: (ids: string[]) => void;
  /** 清空全部 */
  clearAll: () => void;
  /** 切换收藏状态,返回切换后的布尔(是否已收藏) */
  toggleCollect: (item: Omit<CollectItem, 'addedAt'>) => boolean;
  /** 登录后同步本地收藏到服务端(预留 stub) */
  syncToServer: () => Promise<void>;
}

export const useCollectStore = create<CollectState>((set, get) => ({
  items: loadFromStorage(),

  isCollected(id) {
    return get().items.some((it) => it.id === id);
  },

  addCollect(item) {
    const list = get().items;
    if (list.some((it) => it.id === item.id)) return;
    const next = [{ ...item, addedAt: Date.now() }, ...list];
    saveToStorage(next);
    set({ items: next });
  },

  removeCollect(id) {
    const next = get().items.filter((it) => it.id !== id);
    saveToStorage(next);
    set({ items: next });
  },

  removeMany(ids) {
    const idset = new Set(ids);
    const next = get().items.filter((it) => !idset.has(it.id));
    saveToStorage(next);
    set({ items: next });
  },

  clearAll() {
    saveToStorage([]);
    set({ items: [] });
  },

  toggleCollect(item) {
    const collected = get().isCollected(item.id);
    if (collected) {
      get().removeCollect(item.id);
    } else {
      get().addCollect(item);
    }
    return !collected;
  },

  async syncToServer() {
    // 预留:TikTok 登录后,把本地收藏上传到服务端。
    // 当前无收藏服务端接口,仅记录日志,数据保留在 localStorage。
    const items = get().items;
    console.info('[collectStore] syncToServer: 准备上传', items.length, '条收藏(待对接服务端)');
  },
}));
