import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useDictionary } from "@/hooks/useDictionary";

const ASSETS = {
  arrowLeft: require("@/assets/icons/icon_arrow_left.png"),
};

export default function PrivacyPolicy() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const dict = useDictionary();

  const rem = useCallback((size: number) => (width / 750) * size, [width]);

  return (
    <View style={styles.container}>
      {/* Header */}
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

        <Text style={[styles.headerText, { fontSize: rem(40) }]}>
          {dict['Privacy Policy'] || 'Privacy Policy'}
        </Text>
      </View>

      {/* WebView Container */}
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: "https://plottv.xyz/privacy" }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          backgroundColor="transparent"
        />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFF" />
          </View>
        )}
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
  webviewContainer: {
    flex: 1,
    marginTop: 10,
  },
  webview: {
    flex: 1,
    backgroundColor: "#040404",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#040404",
    justifyContent: "center",
    alignItems: "center",
  },
});
