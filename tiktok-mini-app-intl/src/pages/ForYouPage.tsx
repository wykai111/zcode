// pages/ForYouPage.tsx - 推荐流(封面竖滑)
// 移植自 pages/foryou/foryou.{js,ttml,ttss}。原项目只展示封面图,非真实视频。
// 滑动优化:跟手(follow finger)+ 速度判定 + 边界阻尼 + 弹性回弹,体验顺滑。
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchForYou } from '@/lib/api';
import { goPlayer } from '@/lib/nav';
import { vibrate } from '@/lib/util';
import { Spinner } from '@/components/Spinner';
import type { ForYouItem } from '@/types';
import './ForYouPage.css';

// 切换判定阈值
const SWIPE_DISTANCE_RATIO = 0.18; // 滑动距离超过屏高 18% → 切换
const SWIPE_VELOCITY = 0.5;        // 速度超过 0.5 px/ms → 切换(快滑)
const BOUNDARY_DAMP = 0.35;        // 边界阻尼系数(橡皮筋)

export function ForYouPage() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<ForYouItem[]>([]);
  // currentIndex 仅用于触发重渲染(实际逻辑读 currentIndexRef)。
  // eslint 会警告未使用,这里保留以驱动 React 重渲染。
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setCurrentIndex] = useState(0);
  // currentIndex 的 ref:原生事件 handler 总能读到最新值,避免闭包陷阱与重新绑定
  const currentIndexRef = useRef(0);

  // 手势状态(ref,避免重渲染抖动)
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const viewHeight = useRef(0);

  useEffect(() => {
    fetchForYou().then(setFeed).catch(() => {});
    viewHeight.current = window.innerHeight;
  }, []);

  /** 实时设置 track 偏移(跟手),isAnim 控制是否带过渡动画 */
  const setOffset = useCallback((deltaPx: number, isAnim: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = isAnim ? 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
    const base = -currentIndexRef.current * viewHeight.current;
    track.style.transform = `translateY(${base + deltaPx}px)`;
  }, []);

  // 全部用原生事件监听({passive:false}):
  // ① 才能调用 preventDefault 阻止页面默认滚动;
  // ② dispatch 的 TouchEvent 能可靠触发(React onTouch* 在合成事件层,dispatch 不一定冒泡到)。
  // 用 currentIndexRef 读取当前索引,handler 只绑定一次,无需随 index 重绑。
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleStart = (e: TouchEvent) => {
      dragging.current = true;
      startY.current = e.touches[0].clientY;
      lastY.current = e.touches[0].clientY;
      lastTime.current = Date.now();
      velocity.current = 0;
    };

    const handleMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const y = e.touches[0].clientY;
      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) velocity.current = (y - lastY.current) / dt;
      lastY.current = y;
      lastTime.current = now;

      const cur = currentIndexRef.current;
      let delta = y - startY.current;
      const atTop = cur === 0 && delta > 0;
      const atBottom = cur === feed.length - 1 && delta < 0;
      if (atTop || atBottom) delta *= BOUNDARY_DAMP;
      setOffset(delta, false);
      e.preventDefault();
    };

    const handleEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      const cur = currentIndexRef.current;
      const dist = lastY.current - startY.current;
      const ratio = Math.abs(dist) / viewHeight.current;
      const fast = Math.abs(velocity.current) > SWIPE_VELOCITY;
      let next = cur;
      if (dist > 0 && (ratio > SWIPE_DISTANCE_RATIO || fast) && cur > 0) {
        next = cur - 1;
      } else if (dist < 0 && (ratio > SWIPE_DISTANCE_RATIO || fast) && cur < feed.length - 1) {
        next = cur + 1;
      }
      if (next !== cur) vibrate();
      currentIndexRef.current = next; // 立即同步 ref
      setCurrentIndex(next);
      setOffset(0, true);
    };

    el.addEventListener('touchstart', handleStart, { passive: false });
    el.addEventListener('touchmove', handleMove, { passive: false });
    el.addEventListener('touchend', handleEnd);
    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove', handleMove);
      el.removeEventListener('touchend', handleEnd);
    };
  }, [feed.length, setOffset]);

  if (!feed.length) {
    return (
      <div className="foryou-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="foryou-page" ref={containerRef}>
      <div className="foryou-track" ref={trackRef}>
        {feed.map((item) => (
          <div
            className="feed-item"
            key={item.id}
            onClick={() => { vibrate(); goPlayer(navigate, item.id, 1); }}
          >
            <img className="feed-cover" src={item.cover} alt="" />
            <div className="feed-mask" />
            <div className="feed-info">
              <span className="feed-title">{item.title}</span>
              <span className="feed-desc">{item.description}</span>
              {item.tags.length > 0 && (
                <div className="tag-row">
                  {item.tags.map((tag, i) => (
                    <span className="feed-tag" key={i}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
