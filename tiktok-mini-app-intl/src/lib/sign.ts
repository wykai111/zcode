// lib/sign.ts - LuckyShort API 签名工具(Web Crypto API)
// 等价移植自原 utils/sign.js 的手写 HMAC-SHA256,产出完全相同的签名。
//
// 原算法(来自 utils/sign.js signHeader):
//   timestamp = Math.floor(Date.now()/1000).toString()
//   nonce     = Math.random().toString(36).slice(2,14)  // 12 位 base36
//   queryString = query 的 key 经默认排序后,取「值」用 ':' 连接(空则为 '')
//   signStr   = timestamp + AK + path + nonce + queryString + SK  (无分隔符)
//   signature = HMAC-SHA256(key=SK, msg=signStr),hex 小写
//   headers   = { timestamp, account:AK, nonce, signature, 'X-Side':'A' }
import { AK, SK } from './config';

/** HMAC-SHA256(key, msg) → hex 小写。 */
async function hmacSha256Hex(keyStr: string, msgStr: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msgStr));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 生成 12 位 base36 随机 nonce,与原 Math.random().toString(36).slice(2,14) 一致。
 */
function makeNonce(): string {
  return Math.random().toString(36).slice(2, 14);
}

export interface SignedHeaders {
  timestamp: string;
  account: string;
  nonce: string;
  signature: string;
  'X-Side': string;
}

/**
 * 按 LuckyShort 规则生成 5 个签名头(异步,Web Crypto 为异步 API)。
 * @param path  请求路径,如 /v1/languages/en/episodes
 * @param query 查询参数对象(GET 用 data,POST 用 {})
 */
export async function signHeader(
  path: string,
  query: Record<string, unknown> = {},
): Promise<SignedHeaders> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = makeNonce();

  // queryString:key 默认排序后取「值」用 ':' 连接
  let queryString = '';
  const keys = Object.keys(query);
  if (keys.length) {
    queryString = keys.sort().map((k) => query[k]).join(':');
  }

  const signStr = timestamp + AK + path + nonce + queryString + SK;
  const signature = await hmacSha256Hex(SK, signStr);

  return {
    timestamp,
    account: AK,
    nonce,
    signature,
    'X-Side': 'A',
  };
}
