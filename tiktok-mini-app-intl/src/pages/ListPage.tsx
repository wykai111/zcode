// pages/ListPage.tsx - 列表/See All 页(全屏,无 TabBar)
// 移植自 pages/list/list.{js,ttml,ttss}
// 新增:滚动到底部自动加载下一页(infinite scroll)
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchDramaList } from '@/lib/api';
import { goPlayer } from '@/lib/nav';
import { vibrate, showToast } from '@/lib/util';
import { useAppStore } from '@/store/appStore';
import { Spinner } from '@/components/Spinner';
import type { ListItem } from '@/types';
import './ListPage.css';

const PAGE_SIZE = 20;

const BOARD_TITLE: Record<string, { title: string; subtitle: string }> = {
  new: { title: 'New Arrivals', subtitle: 'Latest updated dramas' },
  topshort: { title: 'Top Shorts', subtitle: 'Most popular short dramas' },
  trending: { title: 'Trending', subtitle: 'What everyone is watching' },
};

export function ListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusBarHeight = useAppStore((s) => s.statusBarHeight);
  const type = searchParams.get('type') || 'new';
  const meta = BOARD_TITLE[type] || BOARD_TITLE.new;

  const [list, setList] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);       // 正在加载某一页
  const [hasMore, setHasMore] = useState(true);        // 是否还有更多
  const pageRef = useRef(1);
  const totalRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  /** 加载指定页(追加到列表) */
  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetchDramaList({ page, pageSize: PAGE_SIZE });
      setList((prev) => (page === 1 ? res.list : [...prev, ...res.list]));
      totalRef.current = res.total;
      // 是否还有下一页:已加载数量 < total
      const loaded = page === 1 ? res.list.length : list.length + res.list.length;
      setHasMore(loaded < res.total && res.list.length > 0);
      pageRef.current = page;
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [list.length]);

  // 首次加载第 1 页
  useEffect(() => {
    document.title = meta.title;
    setList([]);
    pageRef.current = 1;
    setHasMore(true);
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  /** 滚动监听:接近底部时加载下一页 */
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    // 距底部小于 200px 触发预加载
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 200) {
      loadPage(pageRef.current + 1);
    }
  }, [loading, hasMore, loadPage]);

  const handleBack = () => navigate(-1);

  const handleRefresh = () => {
    loadPage(1);
    showToast('Refreshed ✓', 'success', 1000);
  };

  return (
    <div className="list-page">
      <div className="list-top-bar" style={{ paddingTop: statusBarHeight }}>
        <div className="top-row">
          <div className="back-btn" onClick={handleBack}>
            <div className="back-arrow" />
          </div>
          <div className="top-title-wrap">
            <span className="top-title text-ellipsis">{meta.title}</span>
            <span className="top-sub">{meta.subtitle}</span>
          </div>
          <div className="refresh-btn" onClick={handleRefresh}>
            <span className="refresh-icon">↻</span>
          </div>
        </div>
      </div>
      <div style={{ height: statusBarHeight + 65 }} />

      <div className="list-scroll" ref={scrollRef} onScroll={onScroll}>
        {list.length > 0 ? (
          <>
            <div className="list-grid">
              {list.map((item) => (
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

            {/* 底部加载状态 */}
            <div className="list-footer">
              {loading && (
                <div className="list-footer-loading">
                  <Spinner />
                  <span>Loading more…</span>
                </div>
              )}
              {!loading && !hasMore && list.length > 0 && (
                <span className="list-no-more">No more dramas</span>
              )}
            </div>
          </>
        ) : loading ? (
          <div className="list-empty">
            <Spinner />
          </div>
        ) : (
          <div className="list-empty">
            <span className="empty-icon">🎬</span>
            <span className="empty-title">No content yet</span>
            <span className="empty-desc">Check back later for more dramas</span>
          </div>
        )}
      </div>
    </div>
  );
}
