// pages/index/index.js
const {
  gallery,
  topShorts,
  newArrivals,
  trending,
} = require('../../utils/mock');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,

    // 搜索
    searchText: '',
    placeholder: 'Search dramas, actors, directors',

    // 数据
    gallery: [],           // Gallery 画廊轮播（主推位）
    galleryIndex: 0,       // 当前画廊索引
    topShorts: [],         // Top Shorts 热门短剧
    newArrivals: [],       // New Arrivals 新上架
    trending: [],          // Trending 热门趋势

    isLoading: false,
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      gallery,
      topShorts,
      newArrivals: newArrivals.slice(0, 3),  // 只展示前 3 条
      trending,
    });
  },

  /**
   * Gallery 画廊轮播切换
   */
  onGalleryChange(e) {
    this.setData({ galleryIndex: e.detail.current });
  },

  /**
   * Gallery 卡片整体点击 → 跳转播放器（从第1集）
   */
  onGalleryTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  /**
   * 搜索框点击 - 跳转搜索页
   */
  onSearchTap() {
    util.showToast('Opening search...', 'none', 800);
    // tt.navigateTo({ url: '/pages/search/search' });
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
  },

  onSearchConfirm() {
    const q = this.data.searchText.trim();
    if (!q) return;
    util.showToast(`Searching: ${q}`, 'none');
    // tt.navigateTo({ url: `/pages/search/search?q=${encodeURIComponent(q)}` });
  },

  /**
   * New Arrivals / Gallery 的 Play 按钮 → 跳转播放器（从第1集开始）
   */
  onPlayTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  /**
   * New Arrivals - 卡片整体点击 → 跳转播放器
   */
  onNewArrivalTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  /**
   * Trending - 封面点击 → 跳转播放器
   */
  onTrendingTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  /**
   * Top Shorts - 封面点击 → 跳转播放器
   */
  onTopShortTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: 'ShortDrama - Watch trending mini dramas',
      path: '/pages/index/index',
    };
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ isLoading: true });
    setTimeout(() => {
      tt.stopPullDownRefresh();
      this.setData({ isLoading: false });
      util.showToast('Refreshed ✓', 'success', 1000);
    }, 1200);
  },

  /**
   * 查看全部 → 跳转列表页（data-type 区分板块）
   */
  onViewAllTap(e) {
    const { type } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/list/list?type=${type || 'new'}` });
  },
});
