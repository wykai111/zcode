// 修复 Release 模式下图片不显示的问题（必须在最顶部导入）
import "@/utils/fixAssets";

import { loginApi } from "@/api/login";
import { initImplementHeader } from "@/api/apiClient";
import { storage } from "@/utils/storage";
import { ensureLogin } from "@/utils/auth";
import { getUserInfo } from "@/utils/userInfo";
import { IAPProvider } from "@/hooks/useIAP";
import { ADJUST_APP_TOKEN } from "@/constants/adjust";
import { ThemeProvider } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { StatusBar, View, Platform, InteractionManager, AppState } from "react-native";
import * as SystemUI from "expo-system-ui";
import "react-native-reanimated";
import { Adjust, AdjustConfig } from 'react-native-adjust';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { waitForNetwork } from '@/utils/network';

// 自定义深色主题，与 SplashScreen 背景色一致
const DarkTheme = {
  dark: true,
  colors: {
    primary: "#ffffff",
    background: "#040404",
    card: "#040404",
    text: "#ffffff",
    border: "#333333",
    notification: "#ff453a",
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" as const },
    medium: { fontFamily: "System", fontWeight: "500" as const },
    bold: { fontFamily: "System", fontWeight: "700" as const },
    heavy: { fontFamily: "System", fontWeight: "900" as const },
  },
};

// 在原生层面设置根视图背景色，防止白屏闪烁
SystemUI.setBackgroundColorAsync("#040404");

// 防止自动隐藏 SplashScreen 
SplashScreen.preventAutoHideAsync();

// 设置初始路由为 (tabs)
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

let lastFetchedLang: string | null = null;

const fetchDictionary = async (lang: string) => {
  if (lastFetchedLang === lang) return;
  try {
    const data = await loginApi.getDictionary(lang);
    // 转换字典格式
    const dictionaryObj: Record<string, string> = {};
    if (data?.glossaries && Array.isArray(data.glossaries)) {
      data.glossaries.forEach((item: any) => {
        if (item.lexeme && item.locale) {
          dictionaryObj[item.lexeme] = item.locale;
        }
      });
    }
    
    await storage.setDictionary(dictionaryObj);
    
    lastFetchedLang = lang;
  } catch (e) {
    console.warn("Failed to get dictionary:", e);
  }
};

const getLang = async (url: string): Promise<string | null> => {
  try {
    const parsed = new URL(url);
    const urlLang = parsed.searchParams.get('lang');
    let lang = urlLang;

    if (!lang) {
      // 深度链接没有lang时，优先使用本地缓存的语言，否则默认为en
      lang = await storage.getLanguage() || 'en';
    } else {
      // 只有当深度链接上有lang参数时，才更新本地缓存
      storage.setLanguage(lang);
    }
    
    await fetchDictionary(lang);
    
    return lang;
  } catch (e) {
    console.warn("getLang parse error:", e);
    return null;
  }
};

const extractVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const theatreId = parsed.searchParams.get('theatre_id');
    if (theatreId) return theatreId;
    const pathMatch = parsed.pathname?.match(/\/video\/(\d+)/);
    return pathMatch?.[1] || null;
  } catch {
    return null;
  }
};


export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const isReady = useRef(false);

  const markReady = () => {
    if (!isReady.current) {
      isReady.current = true;
      setAppIsReady(true);
    }
  };

  useEffect(() => {
    let timedOut = false;

    async function prepare() {
      try {
        initImplementHeader();

        const environment = AdjustConfig.EnvironmentProduction;
        const adjustConfig = new AdjustConfig(ADJUST_APP_TOKEN, environment);
        adjustConfig.setLogLevel(AdjustConfig.LogLevelVerbose);
        adjustConfig.setAttConsentWaitingInterval(120);
        Adjust.initSdk(adjustConfig);

        await storage.clearOnReinstall();

        if (!timedOut) {
          await ensureLogin();
          await getUserInfo();
          
          const lang = await storage.getLanguage() || 'en';
          await fetchDictionary(lang);
        }
      } catch (e: any) {
        console.warn("Initialization check failed:", e?.message || e);
      } finally {
        markReady();
      }
    }

    const timeout = setTimeout(() => {
      console.warn("Initialization timeout, proceeding without login.");
      timedOut = true;
      markReady();
    }, 8000);

    prepare().finally(() => {
      clearTimeout(timeout);
    });

    return () => {
      Adjust.componentWillUnmount();
    };
  }, []);

  useEffect(() => {
    if (!appIsReady) return;

    let cancelled = false;

    const handleAttribution = async (alreadyRouted: boolean) => {
      try {
        const adid = await new Promise<string | null>((resolve) => {
          Adjust.getAdidWithTimeout(5000, (id: string | null) => {
            resolve(id);
          });
        });

        if (!adid || cancelled) return;

        const result = await loginApi.getAdjustInfo(adid);

        if (result?.block_key && result.block_key !== '0' && result.block_key !== 0) {
          router.push(`/video/${result.block_key}` as any);
          return;
        }

        if (alreadyRouted) return;

        const deeplink = await new Promise<string | null>((resolve) => {
          let resolved = false;
          const done = (url: string | null) => {
            if (!resolved) {
              resolved = true;
              resolve(url);
            }
          };

          const t = setTimeout(() => done(null), 3000);

          Adjust.getLastDeeplink((url: string | null) => {
            clearTimeout(t);
            done(url);
          });
        });

        if (deeplink) {
          const videoId = extractVideoId(deeplink);
          if (videoId) {
            router.push(`/video/${videoId}` as any);
            await storage.setCauseCategory(true);
          }
          getLang(deeplink);
        }
      } catch (e: any) {
        console.warn("handleAdjustAttribution failed:", e?.message || e);
      }
    };

    (async () => {
      await SplashScreen.hideAsync();

      if (cancelled) return;

      // 快速路径：立即解析本地 deep link URL，无需等待网络和 Adjust SDK
      let handledByFastPath = false;
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const videoId = extractVideoId(initialUrl);
          if (videoId) {
            router.push(`/video/${videoId}` as any);
            handledByFastPath = true;
            await storage.setCauseCategory(true);
          }
          getLang(initialUrl);
        }
      } catch {}

      // 等待网络
      const hasNetwork = await waitForNetwork();
      if (!hasNetwork || cancelled) return;
      
      // 网络正常后，再次尝试加载国际化字典（如果在 prepare 阶段因无网络而失败）
      const lang = await storage.getLanguage() || 'en';
      await fetchDictionary(lang);

      // 归因 & deeplink：服务端 block_key 可覆盖快速路径的跳转
      handleAttribution(handledByFastPath);

      // 1. ATT 授权：等待 UI 完全稳定后再弹出系统弹框
      if (Platform.OS === 'ios') {
        await new Promise<void>((resolve) =>
          InteractionManager.runAfterInteractions(() => resolve())
        );
        await new Promise<void>((resolve) => setTimeout(resolve, 800));

        if (cancelled) return;

        if (AppState.currentState !== 'active') {
          await Promise.race([
            new Promise<void>((resolve) => {
              const sub = AppState.addEventListener('change', (state) => {
                if (state === 'active') {
                  sub.remove();
                  resolve();
                }
              });
            }),
            new Promise<void>((resolve) => setTimeout(resolve, 10000)),
          ]);
        }

        if (cancelled) return;

        await Promise.race([
          new Promise<void>((resolve) => {
            Adjust.requestAppTrackingAuthorization((status: number) => {
              console.log('[ATT] Authorization status:', status);
              resolve();
            });
          }),
          new Promise<void>((resolve) => setTimeout(resolve, 60000)),
        ]);
      }

      if (cancelled) return;

      const withTimeout = <T,>(promise: Promise<T>, fallback: T, ms = 5000): Promise<T> =>
        Promise.race([
          promise.catch((e) => {
            console.warn('[DeviceReport] Fetch failed:', e);
            return fallback;
          }),
          new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
        ]);

      try {
        const [adid, googleAdId, idfa, initialUrl, ip] = await Promise.all([
          withTimeout(new Promise<string | null>((resolve) => Adjust.getAdid(resolve)), null),
          withTimeout(new Promise<string | null>((resolve) => Adjust.getGoogleAdId(resolve)), null),
          withTimeout(new Promise<string | null>((resolve) => Adjust.getIdfa(resolve)), null),
          Linking.getInitialURL().catch(() => null),
          withTimeout(
            fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip as string),
            '',
          ),
        ]);

        let rig_serial: string | null = '';
        if (Platform.OS === 'android') {
          rig_serial = Application.getAndroidId();
        } else if (Platform.OS === 'ios') {
          rig_serial = await Application.getIosIdForVendorAsync();
        }

        const deviceData = {
          "rig_serial": rig_serial || '',
          "software_platform": Platform.OS,
          "revision_code": Device.osVersion || '',
          "tune_uuid": adid || '',
          "play_track_id": googleAdId || '',
          "android_origin": '',
          "modify_credit": '',
          "ios_promo_uid": idfa || '',
          "target_href": initialUrl || '',
          "remote_addr": ip || '',
        };

        try {
          await loginApi.reportDevice(deviceData);
        } catch {
          console.warn("reportDevice failed:", deviceData);
        }
      } catch (e: any) {
        console.warn("reportDevice collection failed:", e?.message || e);
      }
    })();

    return () => { cancelled = true; };
  }, [appIsReady]);

  // 监听热启动（从后台恢复）时的 deep link
  useEffect(() => {
    if (!appIsReady) return;

    const handleDeepLinkUrl = (event: { url: string }) => {
      const { url } = event;
      if (!url) return;
      const videoId = extractVideoId(url);
      if (videoId) {
        router.push(`/video/${videoId}` as any);
        storage.setCauseCategory(true);
      }
      getLang(url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLinkUrl);
    return () => subscription.remove();
  }, [appIsReady]);

  if (!appIsReady) {
    // 返回与 SplashScreen 相同背景色的 View，避免白屏闪烁
    return (
      <View style={{ flex: 1, backgroundColor: "#040404" }}>
        <StatusBar barStyle="light-content" backgroundColor="#040404" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <IAPProvider>
        <StatusBar barStyle="light-content" backgroundColor="#040404" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#040404" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="video/[id]" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="history" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="language" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="manageSubscription" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="feedback" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="myWallet" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="store" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="privacyPolicy" options={{ animation: "slide_from_right" }} />
        </Stack>
      </IAPProvider>
    </ThemeProvider>
  );
}
