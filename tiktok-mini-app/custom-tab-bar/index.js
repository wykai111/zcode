// custom-tab-bar/index.js - 自定义底部导航栏（无白线）
Component({
  data: {
    selected: 0,
    color: '#8A8A8E',
    selectedColor: '#FFFFFF',
    list: [
      {
        pagePath: '/pages/index/index',
        text: 'Home',
        iconPath: '/images/tab-home.png',
        selectedIconPath: '/images/tab-home-active.png',
      },
      {
        pagePath: '/pages/foryou/foryou',
        text: 'For You',
        iconPath: '/images/tab-foryou.png',
        selectedIconPath: '/images/tab-foryou-active.png',
      },
      {
        pagePath: '/pages/history/history',
        text: 'History',
        iconPath: '/images/tab-history.png',
        selectedIconPath: '/images/tab-history-active.png',
      },
      {
        pagePath: '/pages/profile/profile',
        text: 'Profile',
        iconPath: '/images/tab-profile.png',
        selectedIconPath: '/images/tab-profile-active.png',
      },
    ],
  },

  methods: {
    /**
     * 点击 tab → 切换页面
     */
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset;
      this.setData({ selected: index });
      tt.switchTab({ url: path });
    },
  },
});
