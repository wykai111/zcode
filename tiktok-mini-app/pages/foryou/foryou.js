// pages/foryou/foryou.js
const { forYouFeed } = require('../../utils/mock');
const util = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 20,
    feed: [],
    currentIndex: 0,
    isActive: false, // 视频是否正在播放（仅在当前页可见时）
    // 互动状态
    likedMap: {},
    followedMap: {},
  },

  onLoad() {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      feed: forYouFeed,
    });
  },

  onShow() {
    this.setData({ isActive: true });
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

  /**
   * 点赞
   */
  onLikeTap(e) {
    const { id } = e.currentTarget.dataset;
    util.vibrate();
    const likedMap = { ...this.data.likedMap };
    likedMap[id] = !likedMap[id];
    this.setData({ likedMap });
    if (likedMap[id]) {
      util.showToast('♥ Liked', 'none', 800);
    }
  },

  /**
   * 关注
   */
  onFollowTap(e) {
    const { author } = e.currentTarget.dataset;
    util.vibrate();
    const followedMap = { ...this.data.followedMap };
    followedMap[author] = !followedMap[author];
    this.setData({ followedMap });
    util.showToast(
      followedMap[author] ? `Following ${author}` : 'Unfollowed',
      'none',
      800,
    );
  },

  /**
   * 评论
   */
  onCommentTap() {
    util.vibrate();
    util.showToast('Comments coming soon');
  },

  /**
   * 分享
   */
  onShareTap() {
    tt.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  },

  onShareAppMessage() {
    const current = this.data.feed[this.data.currentIndex];
    return {
      title: current ? current.title : 'ShortDrama',
      path: '/pages/foryou/foryou',
    };
  },

  /**
   * 点击作者头像
   */
  onAvatarTap(e) {
    const { author } = e.currentTarget.dataset;
    util.showToast(`View ${author}'s profile`);
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
