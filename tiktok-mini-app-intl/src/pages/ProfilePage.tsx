// pages/ProfilePage.tsx - 个人中心(第 3 个 tab)
// 用户信息区 + Bind TikTok Account + 功能菜单列表 + Top Shorts 推荐
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHome } from '@/lib/api';
import { goPlayer, goWatchHistory } from '@/lib/nav';
import { vibrate, showToast } from '@/lib/util';
import { useAppStore } from '@/store/appStore';
import { useUserStore } from '@/store/userStore';
import type { CardItem } from '@/types';
import './ProfilePage.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const statusBarHeight = useAppStore((s) => s.statusBarHeight);

  const { isAnonymous, userId, nickname, avatar, bindTikTok } = useUserStore();
  const [topShorts, setTopShorts] = useState<CardItem[]>([]);
  const [binding, setBinding] = useState(false);

  const loadTopShorts = useCallback(() => {
    fetchHome()
      .then((home) => setTopShorts(home.topShorts))
      .catch(() => setTopShorts([]));
  }, []);

  useEffect(() => {
    loadTopShorts();
  }, [loadTopShorts]);

  const handleCopyId = async () => {
    vibrate();
    try {
      await navigator.clipboard.writeText(userId);
      showToast('ID copied', 'success');
    } catch {
      showToast('Copy failed');
    }
  };

  const handleBindTikTok = async () => {
    vibrate();
    setBinding(true);
    await bindTikTok();
    setBinding(false);
  };

  return (
    <div className="profile-page">
      {/* 顶部导航栏 */}
      <div className="top-bar" style={{ paddingTop: statusBarHeight }}>
        <div className="top-row">
          <span className="profile-top-title">Profile</span>
        </div>
      </div>
      <div style={{ height: statusBarHeight + 44 }} />

      {/* 用户信息区 */}
      <div className="user-section">
        <div className="avatar-ring">
          <img className="avatar" src={avatar} alt="" />
        </div>
        <div className="user-meta">
          <span className="nickname">{nickname}</span>
          <button className="user-id-row" onClick={handleCopyId}>
            <span className="user-id-text">{userId}</span>
            <span className="copy-icon">⧉</span>
          </button>
        </div>
      </div>

      {/* Bind TikTok Account */}
      <div className="profile-actions">
        <button
          className={`bind-btn ${isAnonymous ? '' : 'bound'}`}
          onClick={handleBindTikTok}
          disabled={!isAnonymous || binding}
        >
          <span className="bind-icon">{isAnonymous ? '🔗' : '✓'}</span>
          <span className="bind-text">
            {binding ? 'Linking…' : isAnonymous ? 'Bind TikTok Account' : 'TikTok Linked'}
          </span>
        </button>
      </div>

      {/* 功能菜单列表 */}
      <div className="menu-group">
        <div className="menu-item" onClick={() => { vibrate(); goWatchHistory(navigate); }}>
          <span className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <span className="menu-label">Watch History</span>
          <span className="menu-arrow">›</span>
        </div>
      </div>

      {/* Top Shorts 为你推荐 */}
      <div className="profile-topshorts">
        <div className="ts-header">
          <span className="ts-title">Top Shorts</span>
          <div className="ts-accent" />
        </div>
        <div className="ts-scroll">
          <div className="ts-list">
            {topShorts.length > 0 ? (
              topShorts.map((item) => (
                <div
                  className="ts-item"
                  key={item.id}
                  onClick={() => { vibrate(); goPlayer(navigate, item.id, 1); }}
                >
                  <div className="ts-cover-wrap">
                    <img className="ts-cover" src={item.cover} alt="" />
                    <div className="ts-cover-overlay" />
                    <div className="ts-eps"><span>{item.episodes} EP</span></div>
                  </div>
                  <span className="ts-name text-ellipsis">{item.title}</span>
                </div>
              ))
            ) : (
              <span className="ts-loading">Loading…</span>
            )}
          </div>
        </div>
      </div>

      <div className="bottom-spacer" />
    </div>
  );
}
