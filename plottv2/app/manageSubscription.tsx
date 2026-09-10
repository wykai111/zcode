import { Image, ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loginApi } from "@/api/login";
import * as RNIap from "react-native-iap";
import { useIAPContext } from "@/hooks/useIAP";
import { useDictionary } from "@/hooks/useDictionary";

interface UserContract {
  deal_type: string;
  interval_genre: string;
  term_finish_time: string;
  prestige_flag: string | boolean;
  pledged: string | boolean;
  gold_unit_tag: string;
  money_gross: string;
  added_good_marker: string;
  reward_gross: string;
  credential_id: string;
  section: string;
  total_logins: string;
  logged_days: string;
  third_party_uid: string;
}

interface SubscriptionDisplay {
  id: string;
  title: string;
  price: string;
  description: string;
}

const ASSETS = {
  arrowLeft: require("@/assets/icons/icon_arrow_left.png"),
  subBg: require("@/assets/icons/icon_suk_sub_select_bg.png"),
  arrowRight: require("@/assets/icons/icon_sub_arrow_right.png"),
  noData: require("@/assets/icons/icon_nodata.png"),
};

export default function ManageSubscription() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rem = useCallback((size: number) => (width / 750) * size, [width]);
  const { isInitialized, initIAP } = useIAPContext();

  const [subscriptions, setSubscriptions] = useState<SubscriptionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const dict = useDictionary();

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);

      const userInfo = await loginApi.getUserInfo();
      const contracts: UserContract[] = userInfo?.beginning_contracts || [];

      const platformKey = Platform.OS === "ios" ? "apple" : "google";
      const subscribedContracts = contracts.filter(
        (c) =>
          (c.pledged === "true" || c.pledged === true) &&
          c.deal_type === platformKey
      );

      if (subscribedContracts.length === 0) {
        setSubscriptions([]);
        return;
      }

      const subsSkus = subscribedContracts
        .filter((c) => c.section === "vip" || c.section === "coins_package")
        .map((c) => c.third_party_uid)
        .filter(Boolean);

      const iapSkus = subscribedContracts
        .filter((c) => c.section === "gift_radio")
        .map((c) => c.third_party_uid)
        .filter(Boolean);

      const [subsProducts, iapProducts] = await Promise.all([
        subsSkus.length > 0
          ? RNIap.fetchProducts({ skus: subsSkus, type: "subs" }).catch(() => [])
          : Promise.resolve([]),
        iapSkus.length > 0
          ? RNIap.fetchProducts({ skus: iapSkus, type: "in-app" }).catch(() => [])
          : Promise.resolve([]),
      ]);

      const allStoreProducts = [
        ...(Array.isArray(subsProducts) ? subsProducts : []),
        ...(Array.isArray(iapProducts) ? iapProducts : []),
      ];

      const merged: SubscriptionDisplay[] = subscribedContracts.map((contract) => {
        const storeProduct = allStoreProducts.find(
          (p) => p.id === contract.third_party_uid
        );

        const intervalName =
          contract.interval_genre === "weekly"
            ? "Weekly"
            : contract.interval_genre === "monthly"
              ? "Monthly"
              : contract.interval_genre === "yearly"
                ? "Yearly"
                : "";

        const sectionName =
          contract.section === "vip"
            ? "VIP"
            : contract.section === "coins_package"
              ? "Coins Package"
              : "Gift";

        const title = [intervalName, sectionName].filter(Boolean).join(" ");
        const price = storeProduct?.displayPrice ?? "";

        return {
          id: contract.third_party_uid || contract.gold_unit_tag || String(Math.random()),
          title,
          price,
          description: dict['AutoRenew'] || "Auto renew . Cancel anytime",
        };
      });

      setSubscriptions(merged);
    } catch (err) {
      console.warn("[ManageSubscription] Failed to fetch subscriptions:", err);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [dict]);

  useEffect(() => {
    if (!isInitialized) {
      initIAP();
      return;
    }
    fetchSubscriptions();
  }, [isInitialized, initIAP, fetchSubscriptions]);

  const hasData = subscriptions.length > 0;

  const openGeneralSubscriptions = () => {
    if (Platform.OS === "ios") {
      Linking.openSettings();
    } else {
      Linking.openURL("https://play.google.com/store/account/subscriptions");
    }
  };

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
        <Text style={[styles.headerText, { fontSize: rem(34) }]}>
          {dict['Manage Subscription'] || 'Manage Subscription'}
        </Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color="#FFF" />
          </View>
        ) : hasData ? (
          <View>
            {subscriptions.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                activeOpacity={0.8}
                onPress={openGeneralSubscriptions}
              >
                <ImageBackground
                  source={ASSETS.subBg}
                  style={[
                    styles.subCard,
                    { height: rem(246), marginTop: rem(40) },
                  ]}
                  contentFit="fill"
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardLeft}>
                      <Text
                        style={[styles.titleText, { fontSize: rem(26) }]}
                        numberOfLines={1}
                      >
                        {sub.title}
                      </Text>
                      <Text
                        style={[
                          styles.priceText,
                          { fontSize: rem(56), marginTop: rem(8) },
                        ]}
                      >
                        {sub.price}
                      </Text>
                      <Text
                        style={[
                          styles.descText,
                          { fontSize: rem(22), marginTop: rem(12) },
                        ]}
                        numberOfLines={1}
                      >
                        {sub.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.arrowCircle,
                        {
                          width: rem(56),
                          height: rem(56),
                          borderRadius: rem(28),
                        },
                      ]}
                    >
                      <Image
                        source={ASSETS.arrowRight}
                        style={{ width: rem(32), height: rem(32) }}
                      />
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Image
              source={ASSETS.noData}
              style={{ width: rem(240), height: rem(240) }}
            />
            <Text
              style={[
                styles.emptyText,
                { fontSize: rem(28), marginTop: rem(30) },
              ]}
            >
              {dict['no content'] || 'Sorry, no results found~'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { fontSize: rem(22) }]}>
          {dict['PlotTV_AN_Cancel Sub'] || 'please via Google Play Store > Payments & subscriptions > Subscriptions > PlotTV, 24 hours before renewal.'}
        </Text>
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
    zIndex: 1,
  },
  headerText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subCard: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    color: "#D4B08C",
    fontWeight: "500",
  },
  priceText: {
    color: "#FCD191",
    fontWeight: "700",
  },
  descText: {
    color: "#D4B08C",
    opacity: 0.6,
  },
  arrowCircle: {
    backgroundColor: "#FCD191",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.4)",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.3)",
    lineHeight: 16,
    textAlign: "center",
  },
});
