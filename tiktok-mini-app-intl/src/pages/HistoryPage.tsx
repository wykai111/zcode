// pages/HistoryPage.tsx - 观看历史
// 移植自 pages/history/history.{js,ttml,ttss}
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHistory, clearHistory } from '@/lib/storage';
import { goPlayer } from '@/lib/nav';
import { vibrate, showToast } from '@/lib/util';
import { useUIStore } from '@/store/uiStore';
import { useAppStore } from '@/store/appStore';
import type { HistoryRecord } from '@/types';
import './HistoryPage.css';

export function HistoryPage() {
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

  // 页面再次可见时刷新(从播放器返回)
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const handleContinue = (rec: HistoryRecord) => {
    vibrate();
    goPlayer(navigate, rec.drama_id, 1);
  };

  const handleClear = async () => {
    const ok = await showModal({
      title: 'Clear History',
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

  return (
    <div className="history-page">
      <div className="history-header" style={{ paddingTop: statusBarHeight }}>
        <div className="header-content">
          <span className="header-title">Watch History</span>
          {history.length > 0 && (
            <button className="clear-btn" onClick={handleClear}>
              <span className="clear-text">Clear All</span>
            </button>
          )}
        </div>
      </div>
      <div style={{ height: statusBarHeight + 44 }} />

      {history.length > 0 ? (
        <div className="history-list">
          {history.map((rec) => (
            <div
              className="history-item"
              key={rec.id}
              onClick={() => handleContinue(rec)}
            >
              <div className="thumb-box">
                <img className="thumb" src={rec.cover} alt="" />
                <div className="thumb-mask" />
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${rec.progress}%` }} />
                </div>
                {rec.progress === 100 ? (
                  <div className="completed-badge"><span className="completed-text">✓ Done</span></div>
                ) : (
                  <div className="resume-btn"><div className="play-triangle" /></div>
                )}
              </div>
              <div className="item-info">
                <span className="item-title text-ellipsis-2">{rec.title}</span>
                <span className="item-episode">{rec.episode}</span>
                <div className="item-meta">
                  <span className="meta-time">{rec.watchedAt}</span>
                  {rec.duration && <>
                    <span className="meta-dot">·</span>
                    <span className="meta-dur">{rec.duration}</span>
                  </>}
                </div>
                <div className="progress-text">{rec.progress}% watched</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="empty-clock">
              <div className="clock-ring" />
              <div className="clock-hand-h" />
              <div className="clock-hand-m" />
              <div className="clock-center" />
              <div className="clock-play" />
            </div>
          </div>
          <span className="empty-title">No Watch History</span>
          <span className="empty-desc">Start watching to see your history here</span>
        </div>
      )}
      <div className="bottom-spacer" />
    </div>
  );
}
