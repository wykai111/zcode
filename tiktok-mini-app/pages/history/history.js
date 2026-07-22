// pages/history/history.js
const { historyList } = require('../../utils/mock');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    history: [],
    filter: 'all', // all | watching | completed
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      history: historyList,
    });
  },

  /**
   * 继续观看 → 跳转播放器
   */
  onContinueTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  /**
   * 筛选切换
   */
  onFilterTap(e) {
    const { filter } = e.currentTarget.dataset;
    util.vibrate();
    this.setData({ filter });
  },

  /**
   * 清空历史
   */
  onClearTap() {
    tt.showModal({
      title: 'Clear History',
      content: 'Are you sure you want to clear all watch history?',
      confirmText: 'Clear',
      confirmColor: '#FE2C55',
      success: (res) => {
        if (res.confirm) {
          this.setData({ history: [] });
          util.showToast('History cleared', 'success');
        }
      },
    });
  },

  onPullDownRefresh() {
    setTimeout(() => {
      tt.stopPullDownRefresh();
      this.setData({ history: historyList });
      util.showToast('Refreshed ✓', 'success', 1000);
    }, 1000);
  },
});
