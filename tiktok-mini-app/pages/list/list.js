// pages/list/list.js
const { getListData } = require('../../utils/mock');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    type: 'new',       // 'new' | 'topshort' | 'trending'
    title: '',
    subtitle: '',
    list: [],          // 归一化列表数据
    isEmpty: false,
  },

  onLoad(opts) {
    const app = getApp();
    const type = opts.type || 'new';
    this._loadData(type);
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      type,
    });
    tt.setNavigationBarTitle({ title: this.data.title });
  },

  /**
   * 加载数据
   */
  _loadData(type) {
    const { title, subtitle, list } = getListData(type);
    this.setData({
      title,
      subtitle,
      list,
      isEmpty: list.length === 0,
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
