// pages/list/list.js
const api = require('../../utils/api');
const util = require('../../utils/util');

// board 和板块标题的映射（type 和 board 取值一致：new/topshort/trending）
const BOARD_TITLE = {
  new: { title: 'New Arrivals', subtitle: 'Latest updated dramas' },
  topshort: { title: 'Top Shorts', subtitle: 'Most popular short dramas' },
  trending: { title: 'Trending', subtitle: 'What everyone is watching' },
};

Page({
  data: {
    statusBarHeight: 20,
    type: 'new',       // 'new' | 'topshort' | 'trending'
    title: '',
    subtitle: '',
    list: [],          // 归一化列表数据
    isEmpty: false,
    isLoading: false,
  },

  onLoad(opts) {
    const app = getApp();
    const type = opts.type || 'new';
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      type,
      ...(BOARD_TITLE[type] || BOARD_TITLE.new),
    });
    tt.setNavigationBarTitle({ title: this.data.title });
    this._loadData(type);
  },

  /**
   * 从后端加载数据
   */
  _loadData(type) {
    this.setData({ isLoading: true });
    api.fetchDramaList({ board: type, page: 1, pageSize: 50 })
      .then((res) => {
        this.setData({
          list: res.list,
          isEmpty: res.list.length === 0,
          isLoading: false,
        });
      })
      .catch(() => {
        this.setData({ list: [], isEmpty: true, isLoading: false });
      });
  },

  /**
   * 返回
   */
  onBack() {
    tt.navigateBack({
      fail: () => tt.switchTab({ url: '/pages/index/index' }),
    });
  },

  /**
   * 点击卡片 → 跳转播放器
   */
  onItemTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    setTimeout(() => {
      this._loadData(this.data.type);
      tt.stopPullDownRefresh();
      util.showToast('Refreshed ✓', 'success', 1000);
    }, 1000);
  },

  onShareAppMessage() {
    return {
      title: `${this.data.title} - ShortDrama`,
      path: `/pages/list/list?type=${this.data.type}`,
    };
  },
});
