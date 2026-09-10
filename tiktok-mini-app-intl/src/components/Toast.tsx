// components/Toast.tsx - 全局 toast(替代 tt.showToast)
import { useUIStore } from '@/store/uiStore';
import './Toast.css';

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  if (!toast.visible) return null;
  return (
    <div className="toast-mask">
      <div className={`toast-box ${toast.icon !== 'none' ? `toast-${toast.icon}` : ''}`}>
        {toast.icon === 'success' && <div className="toast-check">✓</div>}
        {toast.icon === 'error' && <div className="toast-x">✕</div>}
        <div className="toast-text">{toast.message}</div>
      </div>
    </div>
  );
}
