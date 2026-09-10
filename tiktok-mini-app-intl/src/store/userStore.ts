// store/userStore.ts - 用户 / TikTok 登录态
// 访客模式:首次进入生成稳定 visitor-xxxx 存 localStorage,匿名收藏存本地。
// 用户在 Profile 页点 Bind TikTok Account → ttLogin() 成功后,本地收藏 syncToServer()。
import { create } from 'zustand';
import { ttLogin, isTTMinisReady } from '@/lib/ttminis';
import { showToast } from '@/lib/util';
import { useCollectStore } from './collectStore';

const USER_KEY = 'tt_user';

/** 默认访客头像 */
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&q=80';

export interface UserInfo {
  isAnonymous: boolean;       // 是否匿名访客
  userId: string;             // visitor-xxxx 或 TikTok openId
  nickname: string;
  avatar: string;
  openId?: string;            // TikTok 登录后的 openId
}

interface UserState extends UserInfo {
  /** 绑定 TikTok 账号(调 TTMinis SDK 登录) */
  bindTikTok: () => Promise<boolean>;
}

/** 生成稳定的访客 ID:visitor- + 8 位随机 */
function genVisitorId(): string {
  // crypto.randomUUID 不可用时降级 Math.random
  let rnd = '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    rnd = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  } else {
    rnd = Math.random().toString(36).slice(2, 10);
  }
  return `visitor-${rnd}`;
}

/** 从 localStorage 加载用户信息;无则生成访客并持久化 */
function loadUser(): UserInfo {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw) as UserInfo;
      if (u && u.userId) return u;
    }
  } catch {
    // 损坏数据忽略
  }
  // 生成新访客
  const visitor: UserInfo = {
    isAnonymous: true,
    userId: genVisitorId(),
    nickname: 'Guest',
    avatar: DEFAULT_AVATAR,
  };
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(visitor));
  } catch {
    // 隐私模式:静默
  }
  return visitor;
}

export const useUserStore = create<UserState>((set, get) => ({
  ...loadUser(),

  async bindTikTok() {
    if (!isTTMinisReady()) {
      // 本地浏览器 / 非小程序环境:降级提示
      showToast('TikTok SDK unavailable in browser');
      console.warn('[userStore] TTMinis SDK 未就绪,无法登录');
      return false;
    }
    try {
      const info = await ttLogin();
      const openId = info.openId || info.openid || '';
      if (!openId) {
        showToast('Login failed: no openid');
        return false;
      }
      const updated: UserInfo = {
        isAnonymous: false,
        userId: openId,
        nickname: info.nickname || 'TikTok User',
        avatar: info.avatarUrl || get().avatar,
        openId,
      };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      } catch {
        // 持久化失败忽略
      }
      set(updated);
      showToast('TikTok linked ✓', 'success');
      // 登录成功后,把本地收藏同步到服务端
      await useCollectStore.getState().syncToServer();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      showToast(msg);
      return false;
    }
  },
}));
