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

    // 单集播放控制
    isPlaying: true,
    progress: 0,           // 当前播放进度 0-100
    currentTime: '0:00',
    totalTime: '0:58',
    isDragging: false,     // 是否正在拖拽进度条
    controlsVisible: true, // 控制 UI 显隐
    centerIconVisible: false,  // 中间大图标反馈（播放/暂停）
    centerIconType: 'play',    // 'play' | 'pause'

    // 剧集面板
    showEpPanel: false,    // 全剧集集数面板显隐
    loadError: false,
  },

  onLoad(opts) {
    const app = getApp();
    const id = opts.id || 'drama_001';
    const ep = Number(opts.ep) || 1;

    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      id,
    });

    // 并行拉取详情 + 剧集
    Promise.all([api.fetchDramaDetail(id), api.fetchEpisodes(id)])
      .then(([drama, epData]) => {
        const episodes = epData.episodes;
        const total = epData.total || drama.episodes || episodes.length || 1;
        this.setData({
          drama,
          episodes,
          total,
          currentEp: Math.min(Math.max(ep, 1), total),
          swiperIndex: Math.min(Math.max(ep - 1, 0), Math.max(total - 1, 0)),
        });
        tt.setNavigationBarTitle({ title: drama.title });

        // 模拟播放进度
        this._startMockProgress();
        // 控制 UI 自动隐藏
        this._startAutoHide();
      })
      .catch(() => {
        this.setData({ loadError: true });
        util.showToast('Failed to load', 'none');
      });
  },

  onUnload() {
    this._stopMockProgress();
    this._clearAutoHide();
  },

  /* =========================================
     1. 上下滑切换集数
     ========================================= */
  onSwiperChange(e) {
    const index = e.detail.current;
    const ep = index + 1;
    util.vibrate();
    this.setData({
      swiperIndex: index,
      currentEp: ep,
      progress: 0,
      currentTime: '0:00',
      isPlaying: true,
    });
    this._restartMockProgress();
    // 上报观看记录（异步，不阻塞交互）
    api.reportHistory({ dramaId: this.data.id, epNumber: ep, progress: 0 }).catch(() => {});
  },

  /* =========================================
     2. 进度拖拽
     ========================================= */
  onProgressTap(e) {
    // 点击进度条某位置 → 跳转
    const ratio = this._calcRatio(e);
    this._applyRatio(ratio);
  },

  onProgressTouchStart(e) {
    this._clearAutoHide();
    this.setData({ isDragging: true });
  },

  onProgressTouchMove(e) {
    const ratio = this._calcRatio(e);
    this.setData({
      progress: ratio * 100,
      currentTime: this._formatTime(ratio * 58),
    });
  },

  onProgressTouchEnd(e) {
    const ratio = this._calcRatio(e);
    this._applyRatio(ratio);
    this.setData({ isDragging: false });
    this._startAutoHide();
  },

  _calcRatio(e) {
    const touches = e.touches && e.touches[0];
    const changed = e.changedTouches && e.changedTouches[0];
    const x = (touches && touches.clientX) || (changed && changed.clientX) || 0;
    const w = tt.getSystemInfoSync().windowWidth || 375;
    // 进度条左右各留 32rpx，简单按全宽近似
    return Math.min(Math.max(x / w, 0), 1);
  },

  _applyRatio(ratio) {
    const sec = ratio * 58;
    this.setData({
      progress: ratio * 100,
      currentTime: this._formatTime(sec),
    });
  },

  /* =========================================
     3. 点击屏幕 = 切换播放/暂停（中间显示大图标反馈）
     ========================================= */
  onTogglePlay() {
    util.vibrate();
    const isPlaying = !this.data.isPlaying;
    this.setData({
      isPlaying,
      centerIconType: isPlaying ? 'play' : 'pause',
      centerIconVisible: true,
    });
    this._startAutoHide();
    // 800ms 后隐藏大图标
    if (this._centerTimer) clearTimeout(this._centerTimer);
    this._centerTimer = setTimeout(() => {
      this.setData({ centerIconVisible: false });
    }, 800);
  },

  onTapScreen() {
    // 点击屏幕 = 切换播放/暂停（核心交互）
    this.onTogglePlay();
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
    const { ep, free } = e.currentTarget.dataset;
    if (!free) {
      util.showToast('🔒 Unlock with VIP', 'none');
      return;
    }
    util.vibrate();
    this.setData({
      currentEp: ep,
      swiperIndex: ep - 1,
      showEpPanel: false,
      progress: 0,
      currentTime: '0:00',
      isPlaying: true,
    });
    this._restartMockProgress();
  },

  /* =========================================
     5. 上一集 / 下一集
     ========================================= */
  onPrevEp() {
    if (this.data.currentEp <= 1) {
      util.showToast('Already first episode', 'none');
      return;
    }
    this.setData({
      currentEp: this.data.currentEp - 1,
      swiperIndex: this.data.currentEp - 2,
      progress: 0,
      currentTime: '0:00',
    });
    this._restartMockProgress();
  },

  onNextEp() {
    if (this.data.currentEp >= this.data.total) {
      util.showToast('Already last episode', 'none');
      return;
    }
    const next = this.data.currentEp + 1;
    if (next > 2) {
      util.showToast('🔒 Unlock with VIP', 'none');
      return;
    }
    this.setData({
      currentEp: next,
      swiperIndex: next - 1,
      progress: 0,
      currentTime: '0:00',
    });
    this._restartMockProgress();
  },

  /* =========================================
     6. 返回
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
     工具方法：模拟播放进度 + UI 自动隐藏
     ========================================= */
  _startMockProgress() {
    this._stopMockProgress();
    this._timer = setInterval(() => {
      if (!this.data.isPlaying || this.data.isDragging) return;
      let p = this.data.progress + (100 / 58); // 每秒前进
      if (p >= 100) {
        p = 100;
        this.setData({ isPlaying: false });
      }
      this.setData({
        progress: p,
        currentTime: this._formatTime((p / 100) * 58),
      });
    }, 1000);
  },

  _stopMockProgress() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  _restartMockProgress() {
    this._stopMockProgress();
    this._startMockProgress();
  },

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

  _formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
});
