// utils/request.js - tt.request 的 Promise 封装
const { BASE_URL } = require('./config');

/**
 * 统一请求函数
 * @param {Object} options - { url, method, data, header, loading }
 * @returns {Promise<any>} resolve 后端 data 字段；reject Error 对象
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data,
    header = { 'Content-Type': 'application/json' },
    loading = false,
  } = options;

  if (loading) {
    tt.showLoading({ title: '加载中', mask: true });
  }

  return new Promise((resolve, reject) => {
    tt.request({
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      method,
      data,
      header,
      success(res) {
        if (loading) tt.hideLoading();
        // HTTP 层成功
        const body = res.data || {};
        if (body.code === 0) {
          resolve(body.data);
        } else {
          // 业务错误
          tt.showToast({ title: body.message || '请求失败', icon: 'none' });
          reject(new Error(body.message || `code=${body.code}`));
        }
      },
      fail(err) {
        if (loading) tt.hideLoading();
        tt.showToast({ title: '网络异常', icon: 'none' });
        reject(new Error(err.errMsg || 'network error'));
      },
    });
  });
}

// 便捷方法
const get = (url, data, opts = {}) =>
  request({ ...opts, url, method: 'GET', data });

const post = (url, data, opts = {}) =>
  request({ ...opts, url, method: 'POST', data });

module.exports = { request, get, post };
