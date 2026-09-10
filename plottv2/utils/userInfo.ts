import { loginApi } from "@/api/login";
import { storage } from "@/utils/storage";

let userInfoInProgress: Promise<boolean> | null = null;

export async function getUserInfo(): Promise<any> {

  if (userInfoInProgress) return userInfoInProgress;

  userInfoInProgress = (async () => {
    try {

      const response = await loginApi.login();
      if (!response) return false;

      const { stay_bonus } = response;

      if (stay_bonus) {
        await storage.setGlobalSwitch(stay_bonus);
      }

      return true;
    } catch (e: any) {
      console.warn("getUserInfo failed:", e?.message || e);
      return false;
    } finally {
      userInfoInProgress = null;
    }
  })();

  return userInfoInProgress;
}
