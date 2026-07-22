// pages/profile/profile.js
const { userProfile, myVideos } = require('../../utils/mock');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    user: null,
    activeTab: 0,           // 0: liked ♥ / 1: posts 🎦 / 2: saved 🔖
    videos: [],
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      user: userProfile,
      videos: myVideos,
    });
  },

  /**
   * Tab 切换
   */
  onTabTap(e) {
    const { index } = e.currentTarget.dataset;
    util.vibrate();
    this.setData({ activeTab: Number(index) });
  },

  /**
   * 顶部右侧菜单按钮（三点）
   */
  onMenuTap() {
    tt.showActionSheet({
      itemList: ['Share profile', 'Copy link', 'QR code', 'Settings', 'Privacy'],
      success: (res) => {
        util.showToast(['Shared ✓', 'Link copied ✓', 'QR shown', 'Opening Settings', 'Privacy'][res.tapIndex], 'none');
      },
    });
  },

  /**
   * 编辑资料
   */
  onEditTap() {
    util.showToast('Edit profile coming soon');
  },

  /**
   * 第二个按钮（下拉切换账号 / 添加好友）
   */
  onAddTap() {
    util.showToast('Find friends');
  },

  /**
   * 头像点击
   */
  onAvatarTap() {
    util.showToast('View avatar');
  },

  /**
   * 视频/网格项点击
   */
  onVideoTap(e) {
    const { id, locked } = e.currentTarget.dataset;
    if (locked === true || locked === 'true') {
      util.showToast('🔒 Private video', 'none');
      return;
    }
    util.showToast(`▶ Playing ${id}`, 'none');
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: `${this.data.user.nickname} (@${this.data.user.username})`,
      path: '/pages/profile/profile',
    };
  },
});
