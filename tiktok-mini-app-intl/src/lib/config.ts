// lib/config.ts - 全局配置(对接 LuckyShort API)

// LuckyShort API 基址
export const BASE_URL = 'https://api.sparkeak.shop';

// 鉴权密钥(HMAC-SHA256 签名用)
// ⚠️ 安全 TODO:SK 写在前端,公开 H5 会完全暴露,他人可伪造请求。
// 上线前必须改为后端代理签名(Secret Key 只能存在于服务端)。
export const AK = 'mDLr7gq2hdIQ';
export const SK = 'xQgAEVcvVf7nq0kXOJ2OlUH8kBsWl0Yq';

// 默认语言(LuckyShort 所有接口需要 language 参数)
export const LANGUAGE = 'en';
