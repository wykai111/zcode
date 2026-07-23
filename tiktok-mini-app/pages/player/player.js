// pages/player/player.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    id: '',
    drama: null,
    episodes: [],          // 全部剧集列表
    total: 0,

    currentEp: 1,          // 当前集数
    swiperIndex: 0,        // swiper 当前索引（与 currentEp 联动）
    currentVideoUrl: '',   // 当前集的视频地址
    showLock: false,       // 当前集是否锁定（锁定则不渲染 video）

    // 播放控制
    isPlaying: false,
    progress: 0,           // 当前播放进度 0-100
    currentTime: '0:00',
    totalTime: '0:00',
    duration: 0,           // 视频总时长（秒）
    isDragging: false,
    controlsVisible: true,
    centerIconVisible: false,
    centerIconType: 'play',

    // 剧集面板
    showEpPanel: false,
    loadError: false,

    // 手势状态（用于手动驱动 swiper 切集）
    touchStartY: 0,
    touchStartX: 0,
    touchStartTime: 0,
    isSwiping: false,      // 是否正在触发切集（避免重复）
  },

  onLoad(opts) {
    const app = getApp();
    const id = opts.id || 'drama_001';
    const ep = Number(opts.ep) || 1;

    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      id,
    });

    Promise.all([api.fetchDramaDetail(id), api.fetchEpisodes(id)])
      .then(([drama, epData]) => {
        const episodes = epData.episodes;
        const total = epData.total || drama.episodes || episodes.length || 1;
        const safeEp = Math.min(Math.max(ep, 1), total);
        const safeIdx = safeEp - 1;
        const curEpData = episodes[safeIdx] || {};

        this.setData({
          drama,
          episodes,
          total,
          currentEp: safeEp,
          swiperIndex: safeIdx,
          currentVideoUrl: curEpData.videoUrl || '',
          showLock: !curEpData.free,
          isPlaying: !!curEpData.free,  // 锁定集不自动播放
        });
        // 初始化真实播放状态（实例变量，供 onTapScreen 同步判断）
        this._actualPlaying = !!curEpData.free;
        tt.setNavigationBarTitle({ title: drama.title });
        this._startAutoHide();

        // 上报观看记录
        api.reportHistory({ dramaId: id, epNumber: safeEp, progress: 0 }).catch(() => {});
      })
      .catch(() => {
        this.setData({ loadError: true });
        util.showToast('Failed to load', 'none');
      });
  },

  onUnload() {
    this._clearAutoHide();
    this._clearCenterTimer();
  },

  /* =========================================
     视频事件回调（真实播放驱动）
     ========================================= */

  // 播放进度更新（video 每秒触发）
  onTimeUpdate(e) {
    if (this.data.isDragging) return;  // 拖拽中不覆盖
    const { currentTime, duration } = e.detail;
    const ratio = duration > 0 ? (currentTime / duration) * 100 : 0;
    this.setData({
      progress: ratio,
      currentTime: this._formatTime(currentTime),
      totalTime: this._formatTime(duration),
      duration: duration || 0,
    });

    // 每 10 秒上报一次进度
    if (Math.floor(currentTime) % 10 === 0 && currentTime > 0) {
      api.reportHistory({
        dramaId: this.data.id,
        epNumber: this.data.currentEp,
        progress: Math.floor(ratio),
      }).catch(() => {});
    }
  },

  // 视频播放结束 → 自动下一集
  onVideoEnded() {
    this._actualPlaying = false;
    if (this.data.currentEp < this.data.total) {
      this._switchToEp(this.data.currentEp + 1);
    } else {
      this.setData({ isPlaying: false });
      util.showToast('Finished all episodes 🎉', 'none');
    }
  },

  onVideoPlay() {
    this._actualPlaying = true;   // 同步实例变量（同步，无异步延迟）
    this.setData({ isPlaying: true });
  },

  onVideoPause() {
    this._actualPlaying = false;
    this.setData({ isPlaying: false });
  },

  onVideoError(e) {
    console.error('[player] video error', e);
    util.showToast('Video failed to load', 'none');
  },

  /* =========================================
     1. 上下滑切换集数
     ========================================= */
  onSwiperChange(e) {
    const index = e.detail.current;
    const ep = index + 1;
    util.vibrate();
    this._switchToEp(ep);
  },

  // 统一的切集方法
  _switchToEp(ep) {
    const epData = this.data.episodes[ep - 1];
    if (!epData) return;

    // VIP 锁定集
    if (!epData.free) {
      this._actualPlaying = false;
      this.setData({
        swiperIndex: ep - 1,
        currentEp: ep,
        currentVideoUrl: '',
        showLock: true,
        isPlaying: false,
        progress: 0,
        currentTime: '0:00',
      });
      util.showToast('🔒 Unlock with VIP', 'none');
      return;
    }

    this._actualPlaying = true;  // 切到新集后会自动播放
    this.setData({
      swiperIndex: ep - 1,
      currentEp: ep,
      currentVideoUrl: epData.videoUrl || '',
      showLock: false,
      isPlaying: true,
      progress: 0,
      currentTime: '0:00',
    });

    // 上报观看
    api.reportHistory({ dramaId: this.data.id, epNumber: ep, progress: 0 }).catch(() => {});
  },

  /* =========================================
     2. 进度拖拽（通过 videoContext seek）
     ========================================= */
  onProgressTap(e) {
    this._seekTo(this._calcRatio(e));
  },

  onProgressTouchStart() {
    this._clearAutoHide();
    this.setData({ isDragging: true });
  },

  onProgressTouchMove(e) {
    const ratio = this._calcRatio(e);
    this.setData({
      progress: ratio * 100,
      currentTime: this._formatTime(ratio * (this.data.duration || 0)),
    });
  },

  onProgressTouchEnd(e) {
    this._seekTo(this._calcRatio(e));
    this.setData({ isDragging: false });
    this._startAutoHide();
  },

  _seekTo(ratio) {
    const ctx = tt.createVideoContext('player-video', this);
    const sec = ratio * (this.data.duration || 0);
    if (ctx && ctx.seek) ctx.seek(sec);
    this.setData({
      progress: ratio * 100,
      currentTime: this._formatTime(sec),
    });
  },

  _calcRatio(e) {
    const touches = e.touches && e.touches[0];
    const changed = e.changedTouches && e.changedTouches[0];
    const x = (touches && touches.clientX) || (changed && changed.clientX) || 0;
    const w = tt.getSystemInfoSync().windowWidth || 375;
    return Math.min(Math.max(x / w, 0), 1);
  },

  /* =========================================
     3. 点击屏幕 = 切换播放/暂停
     ========================================= */
  onTapScreen() {
    if (this.data.showLock) return;  // 锁定集点击不响应
    // 正在切集滑动手势中，忽略点击
    if (this.data.isSwiping) return;

    util.vibrate();
    const ctx = tt.createVideoContext('player-video', this);

    // 用实例变量判断真实状态（避免 setData 异步导致判断错误）
    const isPlaying = this._actualPlaying;
    if (isPlaying) {
      if (ctx && ctx.pause) ctx.pause();
      this._actualPlaying = false;
      this.setData({ isPlaying: false, centerIconType: 'pause' });
    } else {
      if (ctx && ctx.play) ctx.play();
      this._actualPlaying = true;
      this.setData({ isPlaying: true, centerIconType: 'play' });
    }
    this.setData({ centerIconVisible: true });
    this._startAutoHide();
    this._clearCenterTimer();
    this._centerTimer = setTimeout(() => {
      this.setData({ centerIconVisible: false });
    }, 800);
  },

  /* =========================================
     3.5 上下滑手势 → 手动驱动 swiper 切集
     （video 原生组件会吞掉竖向滑动，swiper 收不到，需手动处理）
     ========================================= */
  onGestureStart(e) {
    const touch = e.touches[0];
    this._touchStartY = touch.clientY;
    this._touchStartX = touch.clientX;
    this._touchStartTime = Date.now();
    this.setData({ isSwiping: false });
  },

  onGestureMove(e) {
    // 移动中不做处理，在 end 时判断方向
  },

  onGestureEnd(e) {
    const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    if (!touch) return;

    const dy = touch.clientY - this._touchStartY;  // 下滑为正
    const dx = touch.clientX - this._touchStartX;
    const dt = Date.now() - this._touchStartTime;

    // 水平位移大于垂直 → 当作点击，不切集（让 bindtap 处理）
    if (Math.abs(dx) > Math.abs(dy)) return;
    // 垂直滑动距离不足 → 当作点击
    if (Math.abs(dy) < 50) return;
    // 滑动太慢 → 忽略
    if (dt > 800) return;

    // 防止切集期间重复触发
    if (this.data.isSwiping) return;
    this.setData({ isSwiping: true });

    const cur = this.data.swiperIndex;
    const total = this.data.total;

    if (dy < 0) {
      // 上滑 → 下一集
      if (cur < total - 1) {
        const next = cur + 1;
        this.setData({ swiperIndex: next });
        this._switchToEp(next + 1);
      }
    } else {
      // 下滑 → 上一集
      if (cur > 0) {
        const prev = cur - 1;
        this.setData({ swiperIndex: prev });
        this._switchToEp(prev + 1);
      }
    }

    // 500ms 后重置标志，允许下次切集
    setTimeout(() => this.setData({ isSwiping: false }), 500);
  },

  /* =========================================
     4. 全剧集集数面板
     ========================================= */
  onShowEpPanel() {
    util.vibrate();
    this.setData({ showEpPanel: true });
    this._clearAutoHide();
  },

  onHideEpPanel() {
    this.setData({ showEpPanel: false });
    this._startAutoHide();
  },

  onEpTap(e) {
    const { ep } = e.currentTarget.dataset;
    this._switchToEp(Number(ep));
    this.setData({ showEpPanel: false });
  },

  /* =========================================
     5. 返回
     ========================================= */
  onBack() {
    tt.navigateBack({
      fail: () => tt.switchTab({ url: '/pages/index/index' }),
    });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.drama.title} - EP ${this.data.currentEp}`,
      path: `/pages/player/player?id=${this.data.id}&ep=${this.data.currentEp}`,
    };
  },

  /* =========================================
     工具方法
     ========================================= */
  _startAutoHide() {
    this._clearAutoHide();
    this.setData({ controlsVisible: true });
    this._hideTimer = setTimeout(() => {
      if (!this.data.isDragging && !this.data.showEpPanel) {
        this.setData({ controlsVisible: false });
      }
    }, 4000);
  },

  _clearAutoHide() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  },

  _clearCenterTimer() {
    if (this._centerTimer) {
      clearTimeout(this._centerTimer);
      this._centerTimer = null;
    }
  },

  _formatTime(sec) {
    sec = Math.floor(sec || 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
});
