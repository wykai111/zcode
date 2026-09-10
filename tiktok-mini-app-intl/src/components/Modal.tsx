// components/Modal.tsx - 确认弹窗(替代 tt.showModal)
import { useUIStore } from '@/store/uiStore';
import './Modal.css';

export function Modal() {
  const modal = useUIStore((s) => s.modal);
  const closeModal = useUIStore((s) => s.closeModal);
  if (!modal.visible) return null;
  return (
    <div className="modal-mask" onClick={() => closeModal(false)}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {modal.title && <div className="modal-title">{modal.title}</div>}
        <div className="modal-content">{modal.content}</div>
        <div className="modal-actions">
          <button className="modal-btn modal-cancel" onClick={() => closeModal(false)}>
            {modal.cancelText}
          </button>
          <button
            className="modal-btn modal-confirm"
            style={{ color: modal.confirmColor }}
            onClick={() => closeModal(true)}
          >
            {modal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
