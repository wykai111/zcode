// utils/sign.js - LuckyShort API 签名工具
// 纯 JS 实现 HMAC-SHA256（抖音 tt 环境无 crypto 模块）
const { AK, SK } = require('./config');

/* =========================================
   SHA-256 纯 JS 实现（基于 byte 数据）
   ========================================= */
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }

function utf8ToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c < 0xd800 || c >= 0xe000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    else {
      // surrogate pair
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return bytes;
}

function sha256Bytes(msg) {
  const bytes = msg instanceof Array ? msg : utf8ToBytes(msg);
  const l = bytes.length;
  // 填充
  const padLen = (((l + 9) >> 6) + 1) << 6;
  const padded = new Array(padLen).fill(0);
  for (let i = 0; i < l; i++) padded[i] = bytes[i];
  padded[l] = 0x80;
  // 原始长度（bit），写入末尾 8 字节大端
  const bitLen = l * 8;
  padded[padLen - 4] = (bitLen >>> 24) & 0xff;
  padded[padLen - 3] = (bitLen >>> 16) & 0xff;
  padded[padLen - 2] = (bitLen >>> 8) & 0xff;
  padded[padLen - 1] = bitLen & 0xff;

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  for (let off = 0; off < padLen; off += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = (padded[off + i * 4] << 24) | (padded[off + i * 4 + 1] << 16) | (padded[off + i * 4 + 2] << 8) | padded[off + i * 4 + 3];
      w[i] >>>= 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7];
}

function toHex(ints) {
  return ints.map(n => ('00000000' + (n >>> 0).toString(16)).slice(-8)).join('');
}

/* =========================================
   HMAC-SHA256
   ========================================= */
function hmacSha256Hex(keyStr, msgStr) {
  let keyBytes = utf8ToBytes(keyStr);
  // 密钥 > 64 字节则先 hash
  if (keyBytes.length > 64) keyBytes = [].concat.apply([], sha256Bytes(keyBytes).map(n => [
    (n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff
  ]));
  // 补齐到 64 字节
  while (keyBytes.length < 64) keyBytes.push(0);

  const ipad = keyBytes.map(b => b ^ 0x36);
  const opad = keyBytes.map(b => b ^ 0x5c);

  const innerInput = ipad.concat(utf8ToBytes(msgStr));
  const innerHashInts = sha256Bytes(innerInput);
  const innerHashBytes = [].concat.apply([], innerHashInts.map(n => [
    (n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff
  ]));

  const outerInput = opad.concat(innerHashBytes);
  return toHex(sha256Bytes(outerInput));
}

/* =========================================
   生成请求签名头
   ========================================= */
/**
 * 按 LuckyShort 规则生成 4 个签名头
 * @param {string} path - 请求路径，如 /v1/languages/en/episodes
 * @param {object} query - 查询参数对象
 * @returns {object} 含 timestamp/account/nonce/signature/X-Side 的 header
 */
function signHeader(path, query) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // 12 位随机值
  const nonce = Math.random().toString(36).slice(2, 14);

  // queryString：按 key 自然排序，值以 : 拼接
  let queryString = '';
  if (query && Object.keys(query).length) {
    const sortedKeys = Object.keys(query).sort();
    queryString = sortedKeys.map(k => query[k]).join(':');
  }

  // 待签名字符串：timestamp + account + path + nonce + queryString + sk
  const signStr = timestamp + AK + path + nonce + queryString + SK;
  const signature = hmacSha256Hex(SK, signStr);

  return {
    timestamp,
    account: AK,
    nonce,
    signature,
    'X-Side': 'A',
  };
}

module.exports = { signHeader, hmacSha256Hex };
