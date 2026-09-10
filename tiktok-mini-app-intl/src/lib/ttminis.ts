// lib/ttminis.ts - TikTok Minis JS-SDK 封装
// index.html 已通过 <script src=".../minis.js"> 引入并 TTMinis.init。
// 此处集中封装 login / 激励广告等调用,并做环境检测(本地浏览器无 SDK 时降级)。
// 所有方法 try-catch,绝不抛异常影响业务。

/** TTMinis 登录返回的用户信息 */
export interface TTUserInfo {
  openId?: string;
  unionId?: string;
  nickname?: string;
  avatarUrl?: string;
  openid?: string; // 不同版本字段名容错
}

/** 检测 SDK 是否可用(本地浏览器调试时 window.TTMinis 不存在) */
export function isTTMinisReady(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { TTMinis?: unknown }).TTMinis !== 'undefined';
}

/**
 * TikTok 登录。返回用户信息(openId 等)。
 * 本地浏览器无 SDK 时抛出 'NO_SDK',调用方自行降级。
 */
export function ttLogin(): Promise<TTUserInfo> {
  return new Promise((resolve, reject) => {
    if (!isTTMinisReady()) {
      reject(new Error('NO_SDK'));
      return;
    }
    const TTMinis = (window as unknown as {
      TTMinis: { login: (cb: (e: { code?: number; msg?: string; data?: TTUserInfo }) => void) => void };
    }).TTMinis;
    try {
      TTMinis.login((res) => {
        if (res && (res.code === undefined || res.code === 0 || res.code === 200)) {
          resolve(res.data || {});
        } else {
          reject(new Error(res?.msg || 'TTMinis login failed'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 展示激励视频广告解锁剧集。
 * 成功播放完毕 resolve(true);用户中途关闭 resolve(false);不可用 reject。
 * 预留封装:具体广告单元 ID 待 TikTok 平台配置。
 */
export function ttShowRewardAd(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isTTMinisReady()) {
      reject(new Error('NO_SDK'));
      return;
    }
    const TTMinis = (window as unknown as {
      TTMinis: {
        rewardVideoAd?: {
          show: (opts: {
            onClose?: (r: { isEnded?: boolean }) => void;
            onError?: (e: { msg?: string }) => void;
          }) => void;
        };
      };
    }).TTMinis;
    try {
      const ad = TTMinis.rewardVideoAd;
      if (!ad || typeof ad.show !== 'function') {
        reject(new Error('NO_REWARD_AD'));
        return;
      }
      ad.show({
        onClose: (r) => resolve(!!r?.isEnded),
        onError: (e) => reject(new Error(e?.msg || 'reward ad error')),
      });
    } catch (e) {
      reject(e);
    }
  });
}
