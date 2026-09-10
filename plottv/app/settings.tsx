import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import appJson from "../app.json";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDictionary } from "@/hooks/useDictionary";

const ASSETS = {
  arrowLeft: require("@/assets/icons/icon_arrow_left.png"),
  arrowRight: require("@/assets/icons/icon_user_arrow_right.png"),
};

export default function Settings() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [cacheSize, setCacheSize] = useState("0.0B");
  const dict = useDictionary();

  const rem = useCallback((size: number) => (width / 750) * size, [width]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0.0B";
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "K";
    return (bytes / (1024 * 1024)).toFixed(1) + "M";
  };

  const calculateCacheSize = useCallback(async () => {
    try {
      // In newer expo-file-system (v19+), use Paths, Directory, File classes
      const cacheDir = FileSystem.Paths.cache;
      const items = cacheDir.list();
      let totalSize = 0;

      for (const item of items) {
        if (item instanceof FileSystem.File) {
          totalSize += item.size;
        } else if (item instanceof FileSystem.Directory) {
          totalSize += item.size || 0;
        }
      }

      setCacheSize(formatSize(totalSize));
    } catch {
      // Fallback to legacy API if new API fails or is not available as expected
      try {
        const cacheDir = (FileSystem as any).cacheDirectory;
        if (cacheDir) {
          const files = await (FileSystem as any).readDirectoryAsync(cacheDir);
          let total = 0;
          for (const file of files) {
            const info = await (FileSystem as any).getInfoAsync(
              `${cacheDir}${file}`,
              { size: true },
            );
            if (info.exists) {
              total += info.size || 0;
            }
          }
          setCacheSize(formatSize(total));
        }
      } catch {
        setCacheSize("0.0B");
      }
    }
  }, []);

  useEffect(() => {
    calculateCacheSize();
  }, [calculateCacheSize]);

  const handleClearCache = async () => {
    try {
      // Clear expo-image cache
      await Image.clearDiskCache();
      await Image.clearMemoryCache();

      // Clear FileSystem cache directory
      try {
        const cacheDir = FileSystem.Paths.cache;
        const items = cacheDir.list();
        for (const item of items) {
          item.delete();
        }
      } catch {
        // Fallback to legacy API
        const cacheDir = (FileSystem as any).cacheDirectory;
        if (cacheDir) {
          const files = await (FileSystem as any).readDirectoryAsync(cacheDir);
          for (const file of files) {
            try {
              await (FileSystem as any).deleteAsync(`${cacheDir}${file}`, {
                idempotent: true,
              });
            } catch {
              // Ignore errors for individual files
            }
          }
        }
      }

      await calculateCacheSize();
      Alert.alert(dict['Success'] || "Success", dict['Cache cleared successfully'] || "Cache cleared successfully");
    } catch {
      console.log("Failed to clear cache");
    }
  };

  const settingsItems = [
    {
      label: dict['Manage Subscription'] || "Manage Subscription",
      type: "arrow",
      onPress: () => {
        router.push("/manageSubscription");
      },
    },
    {
      label: dict['Privacy Policy'] || "Privacy Policy",
      type: "arrow",
      onPress: () => {
        router.push("/privacyPolicy");
      },
    },
    {
      label: dict['Clear Cache'] || "Clear Cache",
      type: "value",
      value: cacheSize,
      onPress: handleClearCache,
    },
    {
      label: dict['App Version'] || "App Version",
      type: "value",
      value: Platform.OS === "ios"
        ? `V${appJson.expo.version} (${appJson.expo.ios.buildNumber})`
        : `V${appJson.expo.version} (${appJson.expo.android.versionCode})`,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { marginTop: insets.top + rem(10) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Image
            source={ASSETS.arrowLeft}
            style={{ width: rem(48), height: rem(48) }}
          />
        </TouchableOpacity>

        <Text style={[styles.headerText, { fontSize: rem(40) }]}>{dict['Settings'] || 'Settings'}</Text>
      </View>

      <View style={[styles.contentContainer, { marginTop: rem(40) }]}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.itemRow, { height: rem(110) }]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.itemLabel, { fontSize: rem(32) }]}>
              {item.label}
            </Text>
            {item.type === "arrow" ? (
              <Image
                source={ASSETS.arrowRight}
                style={{ width: rem(48), height: rem(48), opacity: 0.6 }}
              />
            ) : (
              <Text style={[styles.itemValue, { fontSize: rem(28) }]}>
                {item.value}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040404",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 10,
  },
  headerText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLabel: {
    color: "#FFFFFF",
    fontWeight: "400",
  },
  itemValue: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "400",
  },
});
