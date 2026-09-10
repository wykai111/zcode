// lib/request.ts - fetch 封装(对接 LuckyShort API)
// 等价移植自 utils/request.js。唯一差异:Web Crypto 签名为异步,故 request 为 async。
import { BASE_URL } from './config';
import { signHeader } from './sign';

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST';
  data?: Record<string, unknown>;
  header?: Record<string, string>;
  loading?: boolean;
}

/**
 * 统一请求函数。
 * LuckyShort 用 HTTP 200-299 表示成功,错误返回 {code,message,status}
 */
export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, loading = false } = options;

  // GET:data 作为 query string,参与签名
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  if (method === 'GET' && data && Object.keys(data).length) {
    const queryStr = Object.keys(data)
      .map((k) => `${k}=${encodeURIComponent(String(data[k]))}`)
      .join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryStr;
  }

  // 从完整 URL 提取 path(用于签名)
  let path = url;
  if (url.startsWith('http')) {
    try {
      path = new URL(url).pathname;
    } catch {
      /* 忽略 */
    }
  }
  // 签名用 query:GET 用 data,POST 用空
  const signQuery = method === 'GET' ? data || {} : {};

  // 注入 LuckyShort 签名头
  const signedHeader = {
    'Content-Type': 'application/json',
    ...(await signHeader(path, signQuery)),
    ...header,
  };

  if (loading) {
    // 简化:H5 不做全局 loading 遮罩,由各页面自行控制
  }

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method,
      headers: signedHeader,
      body: method === 'POST' ? JSON.stringify(data) : undefined,
    });
  } catch (err) {
    // 网络层失败:不弹 toast,让调用方(api 层)决定是否回退 Mock 或提示
    throw new Error(err instanceof Error ? err.message : 'network error');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* 非 JSON 响应 */
  }

  // HTTP 200-299 为成功
  if (res.status >= 200 && res.status < 300) {
    return body as T;
  }
  const errBody = (body || {}) as { message?: string };
  const msg = errBody.message || `HTTP ${res.status}`;
  // 业务错误:不弹 toast,交由调用方处理(避免 Mock 兜底时刷屏)
  void msg;
  throw new Error(msg);
}

export const get = <T = unknown>(url: string, data?: Record<string, unknown>, opts?: Partial<RequestOptions>) =>
  request<T>({ header: opts?.header, loading: opts?.loading, url, method: 'GET', data });

export const post = <T = unknown>(url: string, data?: Record<string, unknown>, opts?: Partial<RequestOptions>) =>
  request<T>({ header: opts?.header, loading: opts?.loading, url, method: 'POST', data });
