// pages/WatchHistoryPage.tsx - 播放历史子页(无底部 Tab)
// 记录观看剧集、上次看到第几集,点击续播;单条删除、一键清空全部。
// 左上角返回箭头回到 Profile。
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHistory, clearHistory, removeHistory } from '@/lib/storage';
import { goPlayer } from '@/lib/nav';
import { vibrate, showToast } from '@/lib/util';
import { useAppStore } from '@/store/appStore';
import { useUIStore } from '@/store/uiStore';
import type { HistoryRecord } from '@/types';
import './WatchHistoryPage.css';

export function WatchHistoryPage() {
  const navigate = useNavigate();
  const statusBarHeight = useAppStore((s) => s.statusBarHeight);
  const showModal = useUIStore((s) => s.showModal);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const load = useCallback(() => {
    setHistory(fetchHistory());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleContinue = (rec: HistoryRecord) => {
    vibrate();
    goPlayer(navigate, rec.drama_id, rec.ep_number || 1);
  };

  const handleRemoveOne = (rec: HistoryRecord) => {
    vibrate();
    removeHistory(rec.drama_id);
    setHistory(fetchHistory());
    showToast('Removed');
  };

  const handleClearAll = async () => {
    vibrate();
    const ok = await showModal({
      title: 'Clear All History',
      content: 'Are you sure you want to clear all watch history?',
      confirmText: 'Clear',
      confirmColor: '#FE2C55',
    });
    if (ok) {
      clearHistory();
      setHistory([]);
      showToast('History cleared', 'success');
    }
  };

  const handleBack = () => {
    vibrate();
    navigate(-1);
  };

  return (
    <div className="wh-page">
      {/* 顶部栏(含返回箭头) */}
      <div className="wh-top-bar" style={{ paddingTop: statusBarHeight }}>
        <div className="wh-top-row">
          <div className="wh-back-btn" onClick={handleBack}>
            <div className="wh-back-arrow" />
          </div>
          <span className="wh-top-title">Watch History</span>
          <div className="wh-top-right">
            {history.length > 0 && (
              <button className="wh-clear-btn" onClick={handleClearAll}>
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: statusBarHeight + 48 }} />

      {history.length > 0 ? (
        <div className="wh-list">
          {history.map((rec) => (
            <div className="wh-item" key={rec.id}>
              <div className="wh-thumb-box" onClick={() => handleContinue(rec)}>
                <img className="wh-thumb" src={rec.cover} alt="" />
                <div className="wh-thumb-mask" />
                <div className="wh-progress-bar">
                  <div className="wh-progress-fill" style={{ width: `${rec.progress}%` }} />
                </div>
                {rec.progress === 100 ? (
                  <div className="wh-completed-badge"><span>✓ Done</span></div>
                ) : (
                  <div className="wh-resume-btn"><div className="wh-play-tri" /></div>
                )}
              </div>
              <div className="wh-info" onClick={() => handleContinue(rec)}>
                <span className="wh-title text-ellipsis-2">{rec.title}</span>
                <span className="wh-episode">Last watched: EP {rec.ep_number}</span>
                <div className="wh-meta">
                  <span>{rec.watchedAt}</span>
                  {rec.duration && <><span className="wh-dot">·</span><span>{rec.duration}</span></>}
                </div>
                <span className="wh-progress-text">{rec.progress}% watched</span>
              </div>
              <button className="wh-delete-btn" onClick={() => handleRemoveOne(rec)} aria-label="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="wh-empty">
          <div className="wh-empty-icon">📺</div>
          <span className="wh-empty-title">No Watch History</span>
          <span className="wh-empty-desc">Start watching to see your history here</span>
        </div>
      )}
      <div className="wh-bottom-spacer" />
    </div>
  );
}
