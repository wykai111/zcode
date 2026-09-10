// store/uiStore.ts - UI 状态(toast / modal),替代 tt.showToast / tt.showModal
import { create } from 'zustand';

export type ToastIcon = 'none' | 'success' | 'error';

export interface ToastState {
  visible: boolean;
  message: string;
  icon: ToastIcon;
}

interface ModalConfig {
  visible: boolean;
  title: string;
  content: string;
  confirmText: string;
  cancelText: string;
  confirmColor: string;
  resolve?: (v: boolean) => void;
}

interface UIState {
  toast: ToastState;
  modal: ModalConfig;
  showToast: (message: string, icon?: ToastIcon, duration?: number) => void;
  showModal: (config: Partial<Omit<ModalConfig, 'visible' | 'resolve'>>) => Promise<boolean>;
  closeModal: (result: boolean) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  toast: { visible: false, message: '', icon: 'none' },
  modal: {
    visible: false,
    title: '',
    content: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: '#FE2C55',
  },

  showToast(message, icon = 'none', duration = 1500) {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { visible: true, message, icon } });
    toastTimer = setTimeout(() => {
      set({ toast: { visible: false, message: '', icon: 'none' } });
    }, duration);
  },

  showModal(config) {
    return new Promise<boolean>((resolve) => {
      set({
        modal: {
          visible: true,
          title: config.title || '',
          content: config.content || '',
          confirmText: config.confirmText || 'Confirm',
          cancelText: config.cancelText || 'Cancel',
          confirmColor: config.confirmColor || '#FE2C55',
          resolve,
        },
      });
    });
  },

  closeModal(result) {
    const { resolve } = get().modal;
    set((s) => ({ modal: { ...s.modal, visible: false, resolve: undefined } }));
    resolve?.(result);
  },
}));

/** 便捷函数:request.ts 用 */
export function toast(message: string, icon: ToastIcon = 'none'): void {
  useUIStore.getState().showToast(message, icon);
}
