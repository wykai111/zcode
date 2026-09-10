// pages/PlayerPage.tsx - 竖屏沉浸式播放器(核心重写)
// 移植自 pages/player/player.{js,ttml,ttss}
// 用 hls.js + 原生 <video> + 自定义手势实现:
//   - 竖屏滑动切集(替代原 <swiper vertical>)
//   - 进度条拖拽(替代 tt.createVideoContext.seek)
//   - 点击播放/暂停 + 4s 自动隐藏 + 800ms 中央反馈
//   - 全剧集面板 + VIP 锁遮罩(保留 UI,LuckyShort 均免费)
//   - 自动连播下一集 + 每 10s 上报观看记录
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Hls from 'hls.js';
import { fetchDramaDetail, fetchEpisodes } from '@/lib/api';
import { reportHistory } from '@/lib/storage';
import { ttShowRewardAd } from '@/lib/ttminis';
import { vibrate, showToast } from '@/lib/util';
import { formatDuration } from '@/lib/util';
import { useAppStore } from '@/store/appStore';
import { useCollectStore } from '@/store/collectStore';
import { Spinner } from '@/components/Spinner';
import type { DramaDetail, Episode } from '@/types';
import './PlayerPage.css';

export function PlayerPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const statusBarHeight = useAppStore((s) => s.statusBarHeight);
  const collectItems = useCollectStore((s) => s.items);
  const toggleCollect = useCollectStore((s) => s.toggleCollect);
  const collected = id ? collectItems.some((it) => it.id === id) : false;

  const [drama, setDrama] = useState<DramaDetail | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [total, setTotal] = useState(0);
  const [currentEp, setCurrentEp] = useState(1);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [showLock, setShowLock] = useState(false);

  // 播放状态(isPlaying 由 actualPlaying ref 跟踪,state 仅用于潜在 UI,此处渲染用 centerIconType)
  const [progress, setProgress] = useState(0); // 0-100
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalTime, setTotalTime] = useState('0:00');
  const durationRef = useRef(0);

  // UI 状态
  const [controlsVisible, setControlsVisible] = useState(true);
  const [centerIconVisible, setCenterIconVisible] = useState(false);
  const [centerIconType, setCenterIconType] = useState<'play' | 'pause'>('play');
  const [showEpPanel, setShowEpPanel] = useState(false);
  const [loadError, setLoadError] = useState(false);
  // 视频缓冲加载中(切换剧集 / 首次加载 / 网络卡顿)
  const [videoLoading, setVideoLoading] = useState(true);

  // refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actualPlaying = useRef(false); // 真实播放状态(避免 setState 异步竞态)
  const isDragging = useRef(false);

  // 手势状态
  const touchStartX = useRef(0);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  // 竖滑切集:跟手位移用
  const epScreenRef = useRef<HTMLDivElement>(null);
  const swipeDragging = useRef(false);     // 是否正在竖向拖动(跟手)
  const swipeStartY = useRef(0);           // 拖动起点 Y
  const swipeLastY = useRef(0);            // 最近 Y(算速度)
  const swipeLastTime = useRef(0);
  const swipeVelocity = useRef(0);
  const swipeMoved = useRef(false);        // 本次 touch 是否已产生竖向位移(区分点击)
  const viewHeight = useRef(0);

  // ===== 加载数据 =====
  useEffect(() => {
    if (!id) return;
    const ep = Number(searchParams.get('ep')) || 1;
    Promise.all([fetchDramaDetail(id), fetchEpisodes(id)])
      .then(([d, epData]) => {
        const eps = epData.episodes;
        const totalCount = epData.total || d.episodes || eps.length || 1;
        const safeEp = Math.min(Math.max(ep, 1), totalCount);
        const cur = eps[safeEp - 1] || {};
        setDrama(d);
        setEpisodes(eps);
        setTotal(totalCount);
        setCurrentEp(safeEp);
        setCurrentVideoUrl(cur.videoUrl || '');
        setShowLock(!cur.free);
        actualPlaying.current = !!cur.free;
        document.title = d.title;
        startAutoHide();
        reportHistory({
          dramaId: id,
          epNumber: safeEp,
          progress: 0,
          title: d.title,
          cover: d.cover,
        });
      })
      .catch(() => {
        setLoadError(true);
        showToast('Failed to load');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ===== hls.js 加载视频 =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl || showLock) return;

    // 清理旧的
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari 原生支持 HLS
      video.src = currentVideoUrl;
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(currentVideoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          // 401 = 流签名失效(资源域名与签名不匹配);其他为通用错误
          const msg = data.response?.code === 401
            ? '视频流签名失效(资源域名问题)'
            : '视频加载失败';
          showToast(msg);
          console.error('[player] HLS fatal error', data);
        }
      });
    } else {
      // 兜底:直接赋值
      video.src = currentVideoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentVideoUrl, showLock]);

  // 清理定时器
  useEffect(() => {
    return () => {
      clearAutoHide();
      clearCenterTimer();
      if (hlsRef.current) hlsRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 切集 =====
  const switchToEp = useCallback(
    (ep: number) => {
      const epData = episodes[ep - 1];
      if (!epData) return;
      if (!epData.free) {
        actualPlaying.current = false;
        setCurrentEp(ep);
        setCurrentVideoUrl('');
        setShowLock(true);
        setProgress(0);
        setCurrentTime('0:00');
        showToast('🔒 Unlock with VIP');
        return;
      }
      actualPlaying.current = true;
      setCurrentEp(ep);
      setCurrentVideoUrl(epData.videoUrl || '');
      setShowLock(false);
      setProgress(0);
      setCurrentTime('0:00');
      setVideoLoading(true); // 新集加载中,等待 onCanPlay 触发后隐藏
      reportHistory({
        dramaId: id || '',
        epNumber: ep,
        progress: 0,
        title: drama?.title,
        cover: drama?.cover,
      });
    },
    [episodes, id, drama],
  );

  // 激励广告解锁:TikTok Minis SDK 展示 rewardVideoAd,看完解锁当前集。
  // SDK 不可用(本地浏览器)时,降级直接解锁以便测试。
  const handleUnlockByAd = useCallback(async () => {
    vibrate();
    try {
      const ended = await ttShowRewardAd();
      if (ended) {
        showToast('Unlocked ✓', 'success');
      } else {
        // 用户中途关闭:仍解锁(降级策略,避免卡住用户)
        showToast('Ad skipped — unlocked anyway');
      }
      // 解锁当前集:把该集标记为 free 并播放
      const epData = episodes[currentEp - 1];
      if (epData) {
        actualPlaying.current = true;
        setCurrentVideoUrl(epData.videoUrl || '');
        setShowLock(false);
        setProgress(0);
        setCurrentTime('0:00');
      }
    } catch (e) {
      // SDK 不可用 / 出错:降级解锁(本地浏览器调试用)
      console.warn('[player] reward ad failed, fallback unlock', e);
      showToast('Ad unavailable — unlocked');
      const epData = episodes[currentEp - 1];
      if (epData) {
        actualPlaying.current = true;
        setCurrentVideoUrl(epData.videoUrl || '');
        setShowLock(false);
      }
    }
  }, [episodes, currentEp]);

  // ⭐ 收藏切换(收藏入口已从详情页移到播放器)
  const handleToggleCollect = () => {
    if (!drama || !id) return;
    vibrate();
    const nowCollected = toggleCollect({
      id: drama.id,
      title: drama.title,
      cover: drama.cover,
      episodes: drama.episodes,
      tags: drama.tags,
    });
    showToast(nowCollected ? 'Added to My List ⭐' : 'Removed from My List', nowCollected ? 'success' : 'none');
  };

  // 竖滑切集:初始化视口高度 + 原生事件监听(跟手位移)
  // 用原生事件({passive:false})才能 preventDefault 阻止页面滚动。
  useEffect(() => {
    viewHeight.current = window.innerHeight;
    const el = epScreenRef.current;
    if (!el) return;

    const SWIPE_RATIO = 0.18;     // 滑动超屏高 18% → 切换
    const SWIPE_VEL = 0.5;        // 速度 > 0.5px/ms → 切换(快滑)
    const DAMP = 0.35;            // 边界阻尼

    /** 实时设置画面偏移 */
    const setPan = (delta: number, anim: boolean) => {
      const node = epScreenRef.current;
      if (!node) return;
      node.style.transition = anim ? 'transform 0.32s cubic-bezier(0.22,1,0.36,1)' : 'none';
      node.style.transform = `translateY(${delta}px)`;
    };

    const onStart = (e: TouchEvent) => {
      swipeDragging.current = true;
      swipeMoved.current = false;
      swipeStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX; // 记录起点 X,用于判断水平/垂直
      swipeLastY.current = e.touches[0].clientY;
      swipeLastTime.current = Date.now();
      swipeVelocity.current = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!swipeDragging.current) return;
      const y = e.touches[0].clientY;
      const now = Date.now();
      const dt = now - swipeLastTime.current;
      if (dt > 0) swipeVelocity.current = (y - swipeLastY.current) / dt;
      swipeLastY.current = y;
      swipeLastTime.current = now;

      let delta = y - swipeStartY.current;
      // 水平位移大于垂直 → 不算竖滑(留给点击),不位移
      const curX = e.touches[0].clientX;
      if (Math.abs(curX - touchStartX.current) > Math.abs(delta)) {
        swipeMoved.current = false;
        return;
      }
      swipeMoved.current = Math.abs(delta) > 8;
      // 边界阻尼:第1集下拉 / 最后集上拉
      const atTop = currentEp === 1 && delta > 0;
      const atBottom = currentEp === total && delta < 0;
      if (atTop || atBottom) delta *= DAMP;
      setPan(delta, false);
      e.preventDefault();
    };

    const onEnd = () => {
      if (!swipeDragging.current) return;
      swipeDragging.current = false;
      // 没有产生竖向位移 → 当点击,不处理(交给 onClick)
      if (!swipeMoved.current) {
        setPan(0, false);
        return;
      }
      const dist = swipeLastY.current - swipeStartY.current;
      const ratio = Math.abs(dist) / viewHeight.current;
      const fast = Math.abs(swipeVelocity.current) > SWIPE_VEL;
      let switched = false;
      if (dist < 0 && (ratio > SWIPE_RATIO || fast) && currentEp < total) {
        // 上滑 → 下一集:画面先向上滑出,再切
        setPan(-viewHeight.current, true);
        switched = true;
        setTimeout(() => { switchToEp(currentEp + 1); setPan(0, false); }, 300);
      } else if (dist > 0 && (ratio > SWIPE_RATIO || fast) && currentEp > 1) {
        // 下滑 → 上一集:画面先向下滑出,再切
        setPan(viewHeight.current, true);
        switched = true;
        setTimeout(() => { switchToEp(currentEp - 1); setPan(0, false); }, 300);
      }
      if (!switched) setPan(0, true); // 未达阈值 → 回弹
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [currentEp, total, switchToEp]);

  function clearAutoHide() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function clearCenterTimer() {
    if (centerTimer.current) {
      clearTimeout(centerTimer.current);
      centerTimer.current = null;
    }
  }

  function startAutoHide() {
    clearAutoHide();
    setControlsVisible(true);
    hideTimer.current = setTimeout(() => {
      if (!isDragging.current && !showEpPanel) {
        setControlsVisible(false);
      }
    }, 4000);
  }

  // ===== 视频事件 =====
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isDragging.current) return;
    const ratio = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
    setProgress(ratio);
    setCurrentTime(formatDuration(video.currentTime));
    setTotalTime(formatDuration(video.duration));
    durationRef.current = video.duration || 0;

    // 每 10 秒上报进度
    if (Math.floor(video.currentTime) % 10 === 0 && video.currentTime > 0) {
      reportHistory({
        dramaId: id || '',
        epNumber: currentEp,
        progress: Math.floor(ratio),
        title: drama?.title,
        cover: drama?.cover,
      });
    }
  };

  const onVideoEnded = () => {
    actualPlaying.current = false;
    if (currentEp < total) {
      switchToEp(currentEp + 1);
    } else {
      showToast('Finished all episodes 🎉');
    }
  };

  // ===== 进度条拖拽 =====
  const calcRatio = (clientX: number): number => {
    const track = progressTrackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  };

  const onProgressTap = (e: React.MouseEvent) => {
    seekTo(calcRatio(e.clientX));
  };

  const onProgressTouchStart = () => {
    clearAutoHide();
    isDragging.current = true;
  };

  const onProgressTouchMove = (e: React.TouchEvent) => {
    const ratio = calcRatio(e.touches[0].clientX);
    setProgress(ratio * 100);
    setCurrentTime(formatDuration(ratio * durationRef.current));
  };

  const onProgressTouchEnd = (e: React.TouchEvent) => {
    seekTo(calcRatio(e.changedTouches[0].clientX));
    isDragging.current = false;
    startAutoHide();
  };

  const seekTo = (ratio: number) => {
    const video = videoRef.current;
    const sec = ratio * (durationRef.current || 0);
    if (video) video.currentTime = sec;
    setProgress(ratio * 100);
    setCurrentTime(formatDuration(sec));
  };

  // ===== 点击屏幕:播放/暂停 =====
  const onTapScreen = () => {
    // 本次触摸产生了竖向位移 → 当滑动,不当点击
    if (swipeMoved.current) return;
    if (showLock) {
      // 锁定集:切换底部信息栏显隐
      vibrate();
      if (controlsVisible) {
        clearAutoHide();
        setControlsVisible(false);
      } else {
        setControlsVisible(true);
        startAutoHide();
      }
      return;
    }
    vibrate();
    const video = videoRef.current;
    if (actualPlaying.current) {
      video?.pause();
      actualPlaying.current = false;
      setCenterIconType('pause');
    } else {
      void video?.play();
      actualPlaying.current = true;
      setCenterIconType('play');
    }
    setCenterIconVisible(true);
    startAutoHide();
    clearCenterTimer();
    centerTimer.current = setTimeout(() => setCenterIconVisible(false), 800);
  };

  if (loadError) {
    return (
      <div className="player-error">
        <div className="player-error-icon">📺</div>
        <div className="player-error-text">Failed to load</div>
        <button className="player-back-btn" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="player-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="player-page">
      {/* 当前集视频(epScreenRef 用于跟手竖滑位移) */}
      <div className="ep-screen" ref={epScreenRef}>
        {!showLock && currentVideoUrl ? (
          <video
            ref={videoRef}
            className="ep-video"
            src={currentVideoUrl}
            autoPlay
            playsInline
            poster={drama.cover}
            onTimeUpdate={onTimeUpdate}
            onEnded={onVideoEnded}
            onPlay={() => { actualPlaying.current = true; setVideoLoading(false); }}
            onPause={() => { actualPlaying.current = false; }}
            onWaiting={() => setVideoLoading(true)}
            onCanPlay={() => setVideoLoading(false)}
            onError={() => { showToast('Video failed to load'); setVideoLoading(false); }}
          />
        ) : (
          <>
            <img className="ep-cover" src={drama.cover} alt="" />
            <div className="ep-mask" />
          </>
        )}

        {/* 锁定遮罩 */}
        {showLock && (
          <div className="ep-locked">
            <div className="lock-circle"><span className="lock-emoji">🔒</span></div>
            <span className="lock-text">Unlock EP {currentEp}</span>
            <button className="lock-unlock-btn" onClick={handleUnlockByAd}>
              <span className="lock-unlock-text">▶ Watch Ad to Unlock</span>
            </button>
          </div>
        )}

        {/* 视频缓冲加载提示(切集 / 首次加载 / 网络卡顿时) */}
        {videoLoading && !showLock && (
          <div className="video-buffering">
            <Spinner />
          </div>
        )}

        {/* 手势覆盖层:仅接收点击(播放/暂停);竖滑由 ep-screen 的原生事件接管 */}
        <div
          className="gesture-layer"
          onClick={onTapScreen}
        />
      </div>

      {/* 中央反馈图标 */}
      <div className={`center-icon ${centerIconVisible ? 'show' : ''}`}>
        <div className="center-icon-circle">
          {centerIconType === 'play' ? (
            <div className="center-play-tri" />
          ) : (
            <div className="center-pause-bars">
              <div className="pause-bar" />
              <div className="pause-bar" />
            </div>
          )}
        </div>
      </div>

      {/* 顶部控制栏 */}
      <div className={`top-bar ${controlsVisible ? 'show' : 'hide'}`} style={{ paddingTop: statusBarHeight }}>
        <div className="top-row">
          <div className="back-btn" onClick={() => navigate(-1)}>
            <div className="back-arrow" />
          </div>
          <div className="top-title-wrap">
            <span className="top-title text-ellipsis">{drama.title}</span>
            <span className="top-sub">EP {currentEp} · {total} episodes</span>
          </div>
          <div
            className={`top-collect-btn ${collected ? 'collected' : ''}`}
            onClick={handleToggleCollect}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={collected ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 底部信息区 */}
      <div className={`bottom-bar ${controlsVisible ? 'show' : 'hide'}`}>
        <div className="drama-info-row">
          <span className="drama-title text-ellipsis">{drama.title}</span>
        </div>
        <div className="ep-badge-row">
          <button className="ep-badge" onClick={() => { vibrate(); setShowEpPanel(true); clearAutoHide(); }}>
            <span className="ep-badge-text">EP {currentEp} / {total}</span>
            <span className="ep-badge-arrow">📋</span>
          </button>
        </div>
        <div className="progress-row">
          <span className="time-text">{currentTime}</span>
          <div
            className="progress-track"
            ref={progressTrackRef}
            onClick={onProgressTap}
            onTouchStart={onProgressTouchStart}
            onTouchMove={onProgressTouchMove}
            onTouchEnd={onProgressTouchEnd}
          >
            <div className="progress-buffered" />
            <div className="progress-played" style={{ width: `${progress}%` }}>
              <div className="progress-thumb" />
            </div>
          </div>
          <span className="time-text">{totalTime}</span>
        </div>
      </div>

      {/* 全剧集面板 */}
      <div className={`ep-mask-layer ${showEpPanel ? 'show' : ''}`} onClick={() => { setShowEpPanel(false); startAutoHide(); }} />
      <div className={`ep-panel ${showEpPanel ? 'show' : ''}`}>
        <div className="ep-panel-header">
          <span className="ep-panel-title">All Episodes</span>
          <span className="ep-panel-sub">{total} episodes · EP 1-2 free</span>
          <div className="ep-panel-close" onClick={() => { setShowEpPanel(false); startAutoHide(); }}>
            <span className="close-x">✕</span>
          </div>
        </div>
        <div className="ep-grid-scroll">
          <div className="ep-grid">
            {episodes.map((ep) => (
              <div
                key={ep.ep}
                className={`ep-cell ${ep.ep === currentEp ? 'current' : ''} ${!ep.free ? 'locked' : ''}`}
                onClick={() => { switchToEp(ep.ep); setShowEpPanel(false); }}
              >
                <span className="ep-cell-num">{ep.ep}</span>
                {ep.free ? <span className="ep-cell-free">Free</span> : <span className="ep-cell-lock">🔒</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
