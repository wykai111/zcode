import { loginApi } from "@/api/login";
import { storage } from "@/utils/storage";
import { Adjust, AdjustEvent } from 'react-native-adjust';
import { ADJUST_EVENT_REGISTER } from "@/constants/adjust";

let loginInProgress: Promise<boolean> | null = null;

/**
 * Ensures user is logged in. Uses a lock to prevent concurrent/duplicate
 * login calls and duplicate Adjust registration event tracking.
 */
export async function ensureLogin(): Promise<boolean> {
  const savedToken = await storage.getToken();
  if (savedToken) return true;

  if (loginInProgress) return loginInProgress;

  loginInProgress = (async () => {
    try {
      const tokenCheck = await storage.getToken();
      if (tokenCheck) return true;

      const response = await loginApi.login();
      if (!response) return false;

      const adjustEvent = new AdjustEvent(ADJUST_EVENT_REGISTER);
      Adjust.trackEvent(adjustEvent);

      const {
        door_ticket,
        expiry_instant,
        fresh_user,
        visitor_mode,
        machine_admission_setup,
      } = response;

      if (door_ticket) {
        await storage.setToken(door_ticket);
      }

      await storage.setUserConfig({
        expiry_instant,
        fresh_user,
        visitor_mode,
        machine_admission_setup,
      });

      return true;
    } catch (e: any) {
      console.warn("ensureLogin failed:", e?.message || e);
      return false;
    } finally {
      loginInProgress = null;
    }
  })();

  return loginInProgress;
}
