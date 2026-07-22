// utils/util.js - 通用工具函数

/**
 * 格式化数字（1000 -> 1K, 1000000 -> 1M）
 */
function formatNumber(num) {
  if (typeof num === 'string') return num;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * 格式化时长（秒 -> mm:ss）
 */
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * 相对时间格式化
 */
function timeAgo(dateStr) {
  return dateStr; // mock 直接返回
}

/**
 * 节流函数
 */
function throttle(fn, delay = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 显示 Toast
 */
function showToast(title, icon = 'none', duration = 1500) {
  tt.showToast({ title, icon, duration });
}

/**
 * 显示加载
 */
function showLoading(title = 'Loading...') {
  tt.showLoading({ title, mask: true });
}

function hideLoading() {
  tt.hideLoading();
}

/**
 * 振动反馈（轻）
 */
function vibrate() {
  if (tt.vibrateShort) {
    tt.vibrateShort({ type: 'light' });
  }
}

module.exports = {
  formatNumber,
  formatDuration,
  timeAgo,
  throttle,
  debounce,
  showToast,
  showLoading,
  hideLoading,
  vibrate,
};
