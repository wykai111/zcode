// store/appStore.ts - 全局状态(模拟 app.globalData)
import { create } from 'zustand';

interface AppState {
  // 状态栏高度(H5 用 CSS env 处理,这里保留给需要 JS 数值的场景)
  statusBarHeight: number;
  // 导航栏高度
  navBarHeight: number;
  // H5 视口宽度(替代原 tt.getSystemInfoSync().windowWidth)
  windowWidth: number;
  setSystemMetrics: (m: { statusBarHeight: number; navBarHeight: number; windowWidth: number }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  statusBarHeight: 20,
  navBarHeight: 44,
  windowWidth: typeof window !== 'undefined' ? window.innerWidth : 375,
  setSystemMetrics: (m) => set(m),
}));
