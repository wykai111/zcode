// components/video-card/video-card.js
Component({
  properties: {
    // 视频数据对象
    video: {
      type: Object,
      value: {},
    },
    // 卡片样式：'grid' | 'list'
    mode: {
      type: String,
      value: 'grid',
    },
  },

  methods: {
    onTap() {
      const { id } = this.data.video;
      this.triggerEvent('tap', { id });
      tt.navigateTo({
        url: `/pages/index/detail?id=${id}`,
        fail: () => {
          tt.showToast({ title: 'Coming soon', icon: 'none' });
        },
      });
    },
  },
});
