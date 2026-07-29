// pages/profile/profile.js
const api = require('../../utils/api');
const util = require('../../utils/util');

// 用户信息（LuckyShort 无用户体系，本地固定展示）
const userProfile = {
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&q=80',
  nickname: 'Drama Lover',
  username: 'luckyshort_user',
};

Page({
  data: {
    statusBarHeight: 20,
    user: userProfile,
    activeTab: 0,           // 0: 历史 ♥ / 1: 短剧 ▦
    videos: [],
    emptyIcon: '',
    emptyTitle: '',
    emptyDesc: '',
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      user: userProfile,
    });
    this._loadTabData(0);
  },

  onShow() {
    // 从播放页返回时刷新历史
    if (this.data.activeTab === 0) this._loadTabData(0);
  },

  /**
   * 按当前 Tab 加载数据
   * Tab 0（♥）：本地观看历史
   * Tab 1（▦）：LuckyShort 短剧列表
   */
  _loadTabData(tab) {
    if (tab === 0) {
      // 观看历史（本地存储）
      api.fetchHistory()
        .then((list) => {
          this.setData({
            videos: list.map((h) => ({
              id: h.drama_id,
              cover: h.cover,
              plays: `EP ${h.ep_number}`,
              locked: false,
            })),
            emptyIcon: '📺',
            emptyTitle: 'No Watch History',
            emptyDesc: 'Start watching to see history here',
          });
        })
        .catch(() => this._setEmpty());
    } else if (tab === 1) {
      // 短剧列表
      api.fetchDramaList({ page: 1, pageSize: 30 })
        .then((res) => {
          this.setData({
            videos: res.list.map((d) => ({
              id: d.id,
              cover: d.cover,
              plays: `${d.episodes} EP`,
              locked: false,
            })),
            emptyIcon: '🎬',
            emptyTitle: 'No Dramas',
            emptyDesc: 'Dramas will appear here',
          });
        })
        .catch(() => this._setEmpty());
    }
  },

  _setEmpty() {
    this.setData({
      videos: [],
      emptyIcon: '🎬',
      emptyTitle: 'Nothing here yet',
      emptyDesc: 'Content will appear here',
    });
  },

  /**
   * Tab 切换
   */
  onTabTap(e) {
    const { index } = e.currentTarget.dataset;
    util.vibrate();
    this.setData({ activeTab: Number(index), videos: [] });
    this._loadTabData(Number(index));
  },

  /**
   * 顶部右侧菜单按钮（三点）
   */
  onMenuTap() {
    tt.showActionSheet({
      itemList: ['Share profile', 'Copy link', 'Settings'],
      success: (res) => {
        util.showToast(['Shared ✓', 'Link copied ✓', 'Opening Settings'][res.tapIndex], 'none');
      },
    });
  },

  onEditTap() {
    util.showToast('Edit profile coming soon');
  },

  onAddTap() {
    util.showToast('Find friends');
  },

  onAvatarTap() {
    util.showToast('View avatar');
  },

  /**
   * 视频/网格项点击 → 跳转播放器
   */
  onVideoTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    tt.navigateTo({ url: `/pages/player/player?id=${id}&ep=1` });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.user.nickname} (@${this.data.user.username})`,
      path: '/pages/profile/profile',
    };
  },
});
