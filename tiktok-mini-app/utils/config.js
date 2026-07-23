// utils/config.js - 全局配置

// 后端 API 基础地址（生产环境）
// 上线前需改为 HTTPS + 域名
const BASE_URL = 'http://47.239.49.251';

// 临时写死的测试用户 ID（种子用户 user_001）
// 后续接入 tt.login 真登录后，由 /api/auth/login 返回真实 userId 替换
const USER_ID = 'user_001';

module.exports = {
  BASE_URL,
  USER_ID,
};
