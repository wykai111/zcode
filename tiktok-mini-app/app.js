// app.js - TikTok Mini App 入口
App({
  globalData: {
    userInfo: null,
    systemInfo: null,
    statusBarHeight: 20,
    navBarHeight: 44,
    screenRatio: 2.0,
  },

  onLaunch() {
    // 获取系统信息（状态栏高度、屏幕尺寸等）
    const systemInfo = tt.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight || 20;

    // 计算 Navbar 高度（兼容各机型）
    // 胶囊按钮位置，需要自定义顶部栏时使用
    const menuButton = tt.getMenuButtonBoundingClientRect
      ? tt.getMenuButtonBoundingClientRect()
      : null;

    if (menuButton) {
      this.globalData.navBarHeight =
        (menuButton.top - this.globalData.statusBarHeight) * 2 + menuButton.height;
    }

    console.log('[App] 系统信息:', systemInfo);
    console.log('[App] 状态栏高度:', this.globalData.statusBarHeight);
    console.log('[App] 导航栏高度:', this.globalData.navBarHeight);
  },

  /**
   * 模拟登录检查
   */
  checkLogin() {
    return new Promise((resolve, reject) => {
      tt.login({
        success: (res) => {
          console.log('[App] tt.login 成功:', res.code);
          resolve(res);
        },
        fail: (err) => {
          console.error('[App] tt.login 失败:', err);
          reject(err);
        },
      });
    });
  },
});
