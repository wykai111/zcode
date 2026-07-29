// pages/foryou/foryou.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    feed: [],
    currentIndex: 0,
    isActive: false, // 视频是否正在播放（仅在当前页可见时）
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
    });
    this._loadFeed();
  },

  /**
   * 从后端拉取推荐流
   */
  _loadFeed() {
    api.fetchForYou()
      .then((list) => {
        this.setData({ feed: list });
      })
      .catch(() => {});
  },

  onShow() {
    this.setData({ isActive: true });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onHide() {
    this.setData({ isActive: false });
  },

  /**
   * swiper 切换
   */
  onSwiperChange(e) {
    const currentIndex = e.detail.current;
    util.vibrate();
    this.setData({ currentIndex });
  },

  onShareAppMessage() {
    const current = this.data.feed[this.data.currentIndex];
    return {
      title: current ? current.title : 'ShortDrama',
      path: '/pages/foryou/foryou',
    };
  },

  /**
   * 点击视频 → 跳转播放器
   */
  onFeedTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },
});
