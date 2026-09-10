// pages/MyListPage.tsx - 我的收藏夹(底部第 2 个 tab)
// 原 History 页空状态插画在此复用。两种状态:空收藏 / 收藏列表。
// 数据源:useCollectStore(订阅式,详情页 ⭐ 操作实时响应)。
// 长按进入批量多选模式,可批量取消收藏。
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { goPlayer } from '@/lib/nav';
import { vibrate, showToast } from '@/lib/util';
import { useCollectStore } from '@/store/collectStore';
import { useAppStore } from '@/store/appStore';
import { useUIStore } from '@/store/uiStore';
import './MyListPage.css';

export function MyListPage() {
  const navigate = useNavigate();
  const statusBarHeight = useAppStore((s) => s.statusBarHeight);
  const showModal = useUIStore((s) => s.showModal);

  const items = useCollectStore((s) => s.items);
  const removeMany = useCollectStore((s) => s.removeMany);
  const removeCollect = useCollectStore((s) => s.removeCollect);

  // 批量多选模式
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterSelectMode = useCallback((id: string) => {
    vibrate();
    setSelectMode(true);
    setSelected(new Set([id]));
  }, []);

  const startLongPress = (id: string) => {
    if (selectMode) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => enterSelectMode(id), 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleSelect = (id: string) => {
    if (!selectMode) return;
    vibrate();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleItemTap = (id: string) => {
    if (selectMode) {
      toggleSelect(id);
    } else {
      vibrate();
      goPlayer(navigate, id, 1);
    }
  };

  const handleRemoveSelected = async () => {
    if (selected.size === 0) return;
    const ok = await showModal({
      title: 'Remove from My List',
      content: `Remove ${selected.size} drama${selected.size > 1 ? 's' : ''} from My List?`,
      confirmText: 'Remove',
      confirmColor: '#FE2C55',
    });
    if (ok) {
      removeMany(Array.from(selected));
      showToast('Removed', 'success');
      setSelected(new Set());
      setSelectMode(false);
    }
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  return (
    <div className="mylist-page">
      <div className="mylist-header" style={{ paddingTop: statusBarHeight }}>
        <div className="mylist-header-content">
          {selectMode ? (
            <button className="mylist-cancel-btn" onClick={handleCancelSelect}>
              <span>Cancel</span>
            </button>
          ) : (
            <span className="mylist-header-title">My List</span>
          )}
          {selectMode && (
            <span className="mylist-count">{selected.size} selected</span>
          )}
          {!selectMode && items.length > 0 && (
            <button className="mylist-edit-btn" onClick={() => { vibrate(); setSelectMode(true); }}>
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
      <div style={{ height: statusBarHeight + 44 }} />

      {items.length > 0 ? (
        <div className="mylist-list">
          {items.map((item) => (
            <div
              className={`mylist-item ${selectMode && selected.has(item.id) ? 'selected' : ''}`}
              key={item.id}
              onClick={() => handleItemTap(item.id)}
              onTouchStart={() => startLongPress(item.id)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
            >
              <div className="mylist-cover-wrap">
                <img className="mylist-cover" src={item.cover} alt="" />
                <div className="mylist-cover-overlay" />
                <div className="mylist-eps"><span>{item.episodes} EPS</span></div>
                {selectMode && (
                  <div className={`mylist-check ${selected.has(item.id) ? 'checked' : ''}`}>
                    {selected.has(item.id) && <span className="mylist-check-mark">✓</span>}
                  </div>
                )}
              </div>
              <div className="mylist-info">
                <span className="mylist-title text-ellipsis-2">{item.title}</span>
                <div className="mylist-tags">
                  {item.tags.slice(0, 3).map((tag, i) => (
                    <span className="mylist-tag" key={i}>{tag}</span>
                  ))}
                </div>
                {!selectMode && (
                  <button
                    className="mylist-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      vibrate();
                      removeCollect(item.id);
                      showToast('Removed from My List');
                    }}
                  >
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mylist-empty">
          <div className="mylist-empty-illustration">
            <div className="empty-clock">
              <div className="clock-ring" />
              <div className="clock-hand-h" />
              <div className="clock-hand-m" />
              <div className="clock-center" />
              <div className="clock-play" />
            </div>
          </div>
          <span className="mylist-empty-title">No Favorites Yet</span>
          <span className="mylist-empty-desc">Tap ★ on a drama to save it here</span>
          <button className="mylist-watch-now-btn" onClick={() => { vibrate(); navigate('/'); }}>
            <span className="mylist-watch-now-text">Watch Now</span>
          </button>
        </div>
      )}

      {/* 批量操作底栏 */}
      {selectMode && (
        <div className="mylist-batch-bar">
          <button
            className="mylist-batch-remove"
            disabled={selected.size === 0}
            onClick={handleRemoveSelected}
          >
            <span>Remove ({selected.size})</span>
          </button>
        </div>
      )}

      <div className="bottom-spacer" />
    </div>
  );
}
