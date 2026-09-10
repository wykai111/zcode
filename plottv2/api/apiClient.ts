import { Platform } from "react-native";
import { storage } from "../utils/storage";
import * as Device from "expo-device";
import * as Localization from "expo-localization";
import * as Network from "expo-network";
import appJson from "../app.json";

const BASE_URL = "https://api.plottv.xyz";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type RequestConfig = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
};

let cachedImplementBase: Record<string, any> | null = null;

const getDefaultImplement = () => {
  const package_id = Platform.OS === "ios"
    ? appJson.expo.ios?.bundleIdentifier
    : appJson.expo.android?.package;
  const locales = Localization.getLocales();
  const locale = locales[0];

  const getLanguageTag = (locale?: Localization.Locale) => {
    if (!locale) return "English";
    const { languageCode, languageScriptCode, regionCode } = locale;
  
    if (languageCode === "zh") {
      if (
        languageScriptCode === "Hant" ||
        regionCode === "TW" ||
        regionCode === "HK" ||
        regionCode === "MO"
      ) {
        return "ChineseTraditional";
      }
      return "ChineseSimplified";
    }
  
    return "English";
  };


  return {
    package_id: package_id || "",
    version: appJson.expo.version || "",
    ip: "",
    country: locale?.regionCode || "",
    language: getLanguageTag(locale),
    vpn_user: false,
    dev_type: Platform.OS,
    os_version: Device.osVersion || "",
    device_model: Device.modelName || "",
    network_type: "",
  };
};

export const initImplementHeader = () => {
  cachedImplementBase = getDefaultImplement();

  Promise.all([
    Network.getNetworkStateAsync().catch(() => null),
    Network.getIpAddressAsync().catch(() => ""),
  ]).then(([networkState, ip]) => {
    const base = getDefaultImplement();
    base.ip = ip;
    base.vpn_user = networkState?.type === Network.NetworkStateType.VPN;
    base.network_type = networkState?.type || "UNKNOWN";
    cachedImplementBase = base;
  }).catch(() => {});
};

const getImplementHeader = () => {
  if (!cachedImplementBase) {
    cachedImplementBase = getDefaultImplement();
  }
  return JSON.stringify({
    ...cachedImplementBase,
    client_time: new Date().toISOString(),
  });
};

export const apiClient = async (
  endpoint: string,
  config: RequestConfig = {},
) => {
  const { method = "GET", headers, body, params } = config;
  const token = await storage.getToken();
  const causeCategory = await storage.getCauseCategory();
  const implementHeader = getImplementHeader();

  let url = `${BASE_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }
  const defaultHeaders: Record<string, string> = {
    login_proof: token ? token : "",
    location: Platform.OS === "ios" ? "ios" : "android",
    implement: implementHeader,
    cause_category: causeCategory ? 'other' : '',
    ...headers,
  };
  const needsBody = body !== undefined && body !== null;
  if (needsBody && !defaultHeaders["Content-Type"]) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: defaultHeaders,
      signal: controller.signal,
    };
    if (needsBody) {
      if (typeof body === "string") {
        fetchOptions.body = body;
      } else if (body instanceof FormData) {
        fetchOptions.body = body;
        // FormData 会自动设置 Content-Type，删除我们设置的
        delete defaultHeaders["Content-Type"];
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }
    const response = await fetch(url, fetchOptions);
    clearTimeout(id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.message ||
        `HTTP ${response.status}: ${response.statusText || "Request failed"}`;
      throw new Error(String(errorMessage));
    }

    // 处理空响应
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    // 如果不是 JSON，返回文本
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("Request timeout, please check the network");
    }
    throw error;
  }
};
