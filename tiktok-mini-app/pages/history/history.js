// pages/history/history.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    history: [],
    filter: 'all', // all | watching | completed
    isLoading: false,
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
    });
    this._loadHistory();
  },

  onShow() {
    // 播放页返回时刷新进度
    if (this.data.history.length) this._loadHistory();
  },

  /**
   * 从后端拉取观看历史
   */
  _loadHistory() {
    this.setData({ isLoading: true });
    api.fetchHistory()
      .then((list) => {
        this.setData({ history: list, isLoading: false });
      })
      .catch(() => {
        this.setData({ history: [], isLoading: false });
      });
  },

  /**
   * 继续观看 → 跳转播放器
   */
  onContinueTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    // id 是历史记录 id，但跳转播放器需要 drama_id。
    // 这里从 history 列表里查 drama_id
    const item = this.data.history.find((h) => h.id === id);
    const dramaId = (item && item.drama_id) || id;
    tt.navigateTo({
      url: `/pages/player/player?id=${dramaId}&ep=1`,
    });
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
   * 清空历史（后端暂无清空接口，前端本地隐藏）
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
    this._loadHistory();
    setTimeout(() => tt.stopPullDownRefresh(), 800);
  },
});
