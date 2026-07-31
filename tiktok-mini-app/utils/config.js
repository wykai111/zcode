// utils/config.js - 全局配置（对接 LuckyShort API）

// LuckyShort API 基址
const BASE_URL = 'https://api.sparkeak.shop';

// 鉴权密钥（HMAC-SHA256 签名用）
const AK = 'mDLr7gq2hdIQ';
const SK = 'xQgAEVcvVf7nq0kXOJ2OlUH8kBsWl0Yq';

// 默认语言（LuckyShort 所有接口需要 language 参数）
const LANGUAGE = 'en';

module.exports = {
  BASE_URL,
  AK,
  SK,
  LANGUAGE,
};
