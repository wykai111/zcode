// utils/request.js - tt.request 封装（对接 LuckyShort API）
const { BASE_URL } = require('./config');
const { signHeader } = require('./sign');

/**
 * 统一请求函数
 * LuckyShort 用 HTTP 状态码（200-299）表示成功，错误返回 {code,message,status}
 * @param {Object} options - { url, method, data, header, loading }
 * @returns {Promise<any>} resolve 响应 body；reject Error
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    loading = false,
  } = options;

  // GET 请求：data 作为 query string，参与签名
  let queryStr = '';
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  if (method === 'GET' && data && Object.keys(data).length) {
    queryStr = Object.keys(data).map(k => `${k}=${encodeURIComponent(data[k])}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryStr;
  }

  // 从完整 URL 提取 path（用于签名）
  let path = url;
  if (url.startsWith('http')) {
    try { path = new URL(url).pathname; } catch (e) {}
  }
  // 签名用的 query 参数对象（GET 用 data，POST 用空）
  const signQuery = method === 'GET' ? (data || {}) : {};

  // 注入 LuckyShort 签名头
  const signedHeader = Object.assign(
    { 'Content-Type': 'application/json' },
    signHeader(path, signQuery),
    header
  );

  if (loading) {
    tt.showLoading({ title: '加载中', mask: true });
  }

  return new Promise((resolve, reject) => {
    tt.request({
      url: fullUrl,
      method,
      data: method === 'POST' ? data : undefined,
      header: signedHeader,
      success(res) {
        if (loading) tt.hideLoading();
        // HTTP 200-299 为成功
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          // 错误响应
          const errBody = res.data || {};
          const msg = errBody.message || `HTTP ${res.statusCode}`;
          tt.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
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
