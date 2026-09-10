// pages/HomePage.tsx - 首页(gallery 轮播 + 3 rails + 分页加载)
// 移植自 pages/index/index.{js,ttml,ttss}
// 改动:
//  - Banner 封面点击 → 剧集详情页;Play 按钮 → 播放第1集
//  - 卡片点击 → 剧集详情页(不再直接进播放器)
//  - 下拉刷新 + 底部分页加载更多
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHome, fetchDramaList } from '@/lib/api';
import { goPlayer, goList } from '@/lib/nav';
import { vibrate, showToast } from '@/lib/util';
import { Spinner } from '@/components/Spinner';
import type { HomeData, ListItem } from '@/types';
import './HomePage.css';

const PAGE_SIZE = 20;

export function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<HomeData | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // 分页"Popular"列表(在 rails 之下,可加载更多)
  const [popular, setPopular] = useState<ListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const totalRef = useRef(0);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // 下拉刷新状态
  const [refreshing, setRefreshing] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const startScrollTop = useRef(0);

  // Gallery 横向滑动手势
  const galleryStartX = useRef(0);
  const galleryStartY = useRef(0);
  const galleryMoved = useRef(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const home = await fetchHome();
      setData(home);
      // 初始化 Popular 列表(复用 home 的 topShorts 数据)
      setPopular(
        home.topShorts.map((c) => ({
          id: c.id,
          title: c.title,
          cover: c.cover,
          episodes: c.episodes,
          tags: c.tags,
        })),
      );
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Gallery 自动定时滚动:每 4 秒切换到下一张,循环。
  useEffect(() => {
    const count = data?.gallery.length || 0;
    if (count <= 1) return;
    const timer = setTimeout(() => {
      setGalleryIndex((i) => (i + 1) % count);
    }, 4000);
    return () => clearTimeout(timer);
  }, [data?.gallery, galleryIndex]);

  // ===== 分页加载更多 =====
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetchDramaList({ page: nextPage, pageSize: PAGE_SIZE });
      totalRef.current = res.total;
      setPopular((prev) => [...prev, ...res.list]);
      setPage(nextPage);
      const loaded = popular.length + res.list.length;
      setHasMore(loaded < res.total && res.list.length > 0);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, popular.length]);

  // 滚动到底部触发分页
  const onScroll = useCallback(() => {
    const el = scrollContentRef.current;
    if (!el || loadingMore || !hasMore) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 200) {
      loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  // ===== 下拉刷新 =====
  const onTouchStart = (e: React.TouchEvent) => {
    const el = scrollContentRef.current;
    if (!el || el.scrollTop > 0) return;
    pulling.current = true;
    touchStartY.current = e.touches[0].clientY;
    startScrollTop.current = el.scrollTop;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current) return;
    const el = scrollContentRef.current;
    if (!el) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && el.scrollTop <= 0) {
      // 下拉阻尼:位移 = 拉动距离的 0.5
      setPullDist(Math.min(delta * 0.5, 70));
    }
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDist >= 55) {
      setRefreshing(true);
      setPullDist(0);
      await load();
      // 刷新后焦点回到第1部 + 重置分页
      setGalleryIndex(0);
      setPage(1);
      setHasMore(true);
      setRefreshing(false);
      showToast('Refreshed ✓', 'success', 1000);
    } else {
      setPullDist(0);
    }
  };

  // Gallery 横向滑动:touchstart 记录起点,touchend 判断方向切卡
  const onGalleryTouchStart = (e: React.TouchEvent) => {
    galleryStartX.current = e.touches[0].clientX;
    galleryStartY.current = e.touches[0].clientY;
    galleryMoved.current = false;
  };

  const onGalleryTouchMove = (e: React.TouchEvent) => {
    // 水平位移 > 垂直位移 → 标记为横向滑动(阻止冒泡,避免触发下拉刷新)
    const dx = Math.abs(e.touches[0].clientX - galleryStartX.current);
    const dy = Math.abs(e.touches[0].clientY - galleryStartY.current);
    if (dx > 10 && dx > dy) {
      galleryMoved.current = true;
      e.stopPropagation();
    }
  };

  const onGalleryTouchEnd = (e: React.TouchEvent) => {
    if (!galleryMoved.current) return;
    const dx = e.changedTouches[0].clientX - galleryStartX.current;
    const threshold = 40; // 横向滑动 > 40px 触发切卡
    if (dx < -threshold) {
      // 左滑 → 下一张
      setGalleryIndex((i) => Math.min(i + 1, (data?.gallery.length || 1) - 1));
    } else if (dx > threshold) {
      // 右滑 → 上一张
      setGalleryIndex((i) => Math.max(i - 1, 0));
    }
    galleryMoved.current = false;
  };

  /**
   * Cover-flow 横向轮播:计算每张卡片的样式。
   * @param offset 相对当前索引的偏移(0=居中,>0=右侧,<0=左侧)
   * 居中卡正常大小、全显示;相邻卡左右错开、缩小、降透明度,露出边缘形成视差。
   */
  const getStackStyle = (offset: number): React.CSSProperties => {
    // 基础居中:translateX(-50%) 把卡片(absolute left:50%)中心对齐容器中心
    if (offset === 0) {
      return { transform: 'translateX(-50%) scale(1)', zIndex: 10, opacity: 1 };
    }
    const level = Math.abs(offset);
    if (level > 2) {
      // 超出两侧第2张:完全隐藏
      const dir = offset > 0 ? 1 : -1;
      return { transform: `translateX(calc(-50% + ${dir * 100}%)) scale(0.5)`, zIndex: 0, opacity: 0 };
    }
    // 相邻卡:左右偏移(百分比,相对卡片宽度),缩小,降透明度
    const dir = offset > 0 ? 1 : -1;
    const shift = dir * (40 + (level - 1) * 10); // 第1层偏移40%卡片宽,第2层再+10%
    const scale = 1 - level * 0.2; // 每层缩小20%
    const opacity = level >= 2 ? 0.5 : 0.85;
    return {
      transform: `translateX(calc(-50% + ${shift}%)) scale(${scale})`,
      zIndex: 10 - level,
      opacity,
    };
  };

  if (loadError) {
    return (
      <div className="home-empty">
        <div className="home-empty-icon">📺</div>
        <div className="home-empty-title">Failed to load</div>
        <button className="home-retry" onClick={load}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="home-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      className="home-scroll"
      ref={scrollContentRef}
      onScroll={onScroll}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 下拉刷新指示 */}
      <div className="home-refresh-zone" style={{ height: pullDist + (refreshing ? 40 : 0) }}>
        <span className="home-refresh-text">
          {refreshing ? '🔄 Refreshing…' : pullDist >= 55 ? '↑ Release to refresh' : '↓ Pull to refresh'}
        </span>
      </div>

      <div className="home-page">
        <div className="home-content">
          {/* Gallery Cover-flow 焦点图轮播 */}
          <div className="gallery-section">
            <div
              className="gallery-stack"
              onTouchStart={onGalleryTouchStart}
              onTouchMove={onGalleryTouchMove}
              onTouchEnd={onGalleryTouchEnd}
            >
              {data.gallery.map((item, i) => {
                const offset = i - galleryIndex;
                return (
                  <div
                    className={`gallery-card ${offset === 0 ? 'is-active' : ''}`}
                    key={item.id}
                    style={getStackStyle(offset)}
                    onClick={() => {
                      vibrate();
                      // 当前卡:点击封面 → 播放器;非当前卡:切到该卡
                      if (offset === 0) goPlayer(navigate, item.id, 1);
                      else setGalleryIndex(i);
                    }}
                  >
                    <img className="gallery-cover" src={item.cover} alt="" />
                    <div className="gallery-eps">
                      <span className="gallery-eps-text">{item.episodes} EPS</span>
                    </div>
                    <div className="gallery-info">
                      <span className="gallery-title">{item.title}</span>
                      <span className="gallery-slogan">
                        {item.tags[0] ? item.tags[0] : 'Binge-worthy short drama'}
                      </span>
                    </div>
                    <button
                      className="gallery-play-btn"
                      onClick={(e) => { e.stopPropagation(); vibrate(); goPlayer(navigate, item.id, 1); }}
                      aria-label="Play"
                    >
                      <span className="gallery-play-tri" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="gallery-dots">
              {data.gallery.map((_, i) => (
                <div
                  key={i}
                  className={`gallery-dot ${galleryIndex === i ? 'active' : ''}`}
                  onClick={() => setGalleryIndex(i)}
                />
              ))}
            </div>
          </div>

          {/* Top Shorts */}
          <RailSection
            title="Top Shorts"
            accent="topshort-line"
            onViewAll={() => { vibrate(); goList(navigate, 'topshort'); }}
            items={data.topShorts}
            onItemTap={(id) => { vibrate(); goPlayer(navigate, id, 1); }}
            badge={(it) => <span className="trend-hot-text topshort-badge-text">{it.episodes} EP</span>}
            badgeClass="topshort-badge"
          />

          {/* New Arrivals */}
          <div className="section">
            <div className="section-header">
              <div className="section-title-wrap">
                <span className="section-title">New Arrivals</span>
                <div className="section-accent-line" />
              </div>
              <div className="view-all" onClick={() => { vibrate(); goList(navigate, 'new'); }}>
                <span className="view-all-text">See All</span>
                <span className="view-all-arrow">›</span>
              </div>
            </div>
            <div className="new-arrivals-list">
              {data.newArrivals.map((item) => (
                <div
                  className="new-card"
                  key={item.id}
                  onClick={() => { vibrate(); goPlayer(navigate, item.id, 1); }}
                >
                  <div className="new-cover-wrap">
                    <img className="new-cover" src={item.cover} alt="" />
                    <div className="new-badge"><span className="new-badge-text">NEW</span></div>
                    <div className="new-eps"><span className="new-eps-text">{item.episodes} EPS</span></div>
                  </div>
                  <div className="new-info">
                    <span className="new-title">{item.title}</span>
                    <span className="new-desc text-ellipsis-2">{item.description}</span>
                    <div className="new-tags">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span className="new-tag" key={i}>{tag}</span>
                      ))}
                    </div>
                    <div className="new-bottom">
                      <button
                        className="new-play-btn"
                        onClick={(e) => { e.stopPropagation(); vibrate(); goPlayer(navigate, item.id, 1); }}
                      >
                        <span className="play-tri-sm" />
                        <span className="new-play-text">Play</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular 分页列表 */}
          <div className="section">
            <div className="section-header">
              <div className="section-title-wrap">
                <span className="section-title">Popular</span>
                <div className="section-accent-line trend-line" />
              </div>
              <div className="view-all" onClick={() => { vibrate(); goList(navigate, 'trending'); }}>
                <span className="view-all-text">See All</span>
                <span className="view-all-arrow">›</span>
              </div>
            </div>
            <div className="popular-grid">
              {popular.map((item) => (
                <div
                  className="grid-item"
                  key={item.id}
                  onClick={() => { vibrate(); goPlayer(navigate, item.id, 1); }}
                >
                  <div className="cover-wrap">
                    <img className="cover" src={item.cover} alt="" />
                    {item.episodes > 0 && (
                      <div className="cover-eps">
                        <span className="cover-eps-text">{item.episodes} EPS</span>
                      </div>
                    )}
                  </div>
                  <span className="item-title text-ellipsis-2">{item.title}</span>
                </div>
              ))}
            </div>

            <div className="list-footer">
              {loadingMore && (
                <div className="list-footer-loading">
                  <Spinner />
                  <span>Loading more…</span>
                </div>
              )}
              {!loadingMore && !hasMore && (
                <span className="list-no-more">No more dramas</span>
              )}
            </div>
          </div>

          <div className="bottom-spacer" />
        </div>
      </div>
    </div>
  );
}

/** 横向滑动 rail(Top Shorts / Trending 共用) */
function RailSection({
  title,
  accent,
  onViewAll,
  items,
  onItemTap,
  badge,
  badgeClass,
}: {
  title: string;
  accent: string;
  onViewAll: () => void;
  items: { id: string; cover: string; episodes: number; title: string }[];
  onItemTap: (id: string) => void;
  badge: (it: { episodes: number }) => React.ReactNode;
  badgeClass: string;
}) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title-wrap">
          <span className="section-title">{title}</span>
          <div className={`section-accent-line ${accent}`} />
        </div>
        <div className="view-all" onClick={onViewAll}>
          <span className="view-all-text">See All</span>
          <span className="view-all-arrow">›</span>
        </div>
      </div>
      <div className="trend-scroll">
        <div className="trend-list">
          {items.map((item) => (
            <div className="trend-item" key={item.id} onClick={() => onItemTap(item.id)}>
              <div className="trend-cover-wrap">
                <img className="trend-cover" src={item.cover} alt="" />
                <div className={`trend-hot-badge ${badgeClass}`}>{badge(item)}</div>
              </div>
              <span className="trend-title text-ellipsis">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
