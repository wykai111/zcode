import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import SKU from "@/components/store";
import { MergedProduct, useIAPContext } from "@/hooks/useIAP";
import RetentionModal from "@/components/RetentionModal";
import { storage } from "@/utils/storage";
import { useDictionary } from "@/hooks/useDictionary";
import { Adjust, AdjustEvent } from 'react-native-adjust';
import { ADJUST_EVENT_Cashier_Retention_PV, ADJUST_EVENT_Cashier_Retention_UV } from "@/constants/adjust";
const ASSETS = {
  arrowLeft: require("@/assets/icons/icon_arrow_left.png"),
  arrowRight: require("@/assets/icons/icon_user_arrow_right.png"),
};

const Store = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { restorePurchases, loading, isInitialized, setOnUserCancelled } = useIAPContext();
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [retentionProduct, setRetentionProduct] = useState<MergedProduct | null>(null);
  const [globalSwitch, setGlobalSwitch] = useState<any>(null);
  const dict = useDictionary();

  useEffect(() => {
    (async () => {
      const globalSwitch = await storage.getGlobalSwitch();
      setGlobalSwitch(globalSwitch);
    })();
  }, []);

  const rem = useCallback((size: number) => (width / 750) * size, [width]);

  const handleRestore = useCallback(() => {
    if (!isInitialized) return;
    restorePurchases();
  }, [restorePurchases, isInitialized]);

  useEffect(() => {
    setOnUserCancelled((product: MergedProduct) => {
      if (!globalSwitch?.trigger_paywall) {
        return;
      }
      setRetentionProduct(product);
      setShowRetentionModal(true);
      const retentionEventPv = new AdjustEvent(ADJUST_EVENT_Cashier_Retention_PV);
      const retentionEventUv = new AdjustEvent(ADJUST_EVENT_Cashier_Retention_UV);
      Adjust.trackEvent(retentionEventPv);
      Adjust.trackEvent(retentionEventUv);
    });
    return () => setOnUserCancelled(null);
  }, [setOnUserCancelled, globalSwitch]);


  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { marginTop: rem(60) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Image
            source={ASSETS.arrowLeft}
            style={{ width: rem(48), height: rem(48) }}
          />
        </TouchableOpacity>

        <Text style={[styles.headerText, { fontSize: rem(40) }]}>{dict['Store'] || 'Store'}</Text>
          <TouchableOpacity 
            style={styles.restoreButtonContainer} 
            activeOpacity={0.7} 
            onPress={handleRestore}
            disabled={loading}
          >
            <Text style={[styles.restoreButton, { fontSize: rem(28), opacity: loading ? 0.5 : 1 }]}>
              {dict['Restore'] || 'Restore'}
            </Text>
          </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.scrollView}>
        <View>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: rem(32), marginBottom: rem(24), paddingHorizontal: rem(32) },
            ]}
          >
            {dict['Subscription'] || 'Subscription'}
          </Text>
        </View>
        <SKU />
      </View>

      <RetentionModal
        visible={showRetentionModal}
        retentionProduct={retentionProduct}
        onClose={() => {
          setShowRetentionModal(false);
          setRetentionProduct(null);
        }}
        onPurchaseSuccess={() => {
          setShowRetentionModal(false);
          setRetentionProduct(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040404",
    paddingTop: 20,
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
  restoreButtonContainer: {
    position: "absolute",
    right: 12,
    top: 4
  },
  restoreButton: {
    color: "#F2F2F299",
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
    paddingTop: 10
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subscriptionCard: {
    backgroundColor: "#1A1A1A",
    position: "relative",
  },
  discountBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FF0000",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subscriptionPrice: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  subscriptionPeriod: {
    color: "#FFFFFF",
    fontWeight: "400",
  },
  subscriptionCoins: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: 8,
  },
  bonusBadge: {
    color: "#FFFFFF",
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  subscriptionDescription: {
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 28,
  },
  coinPackage: {
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coinPackageLeft: {
    flex: 1,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIcon: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  coinAmount: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  bonusText: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  coinPackageRight: {
    alignItems: "flex-end",
  },
  packageDiscount: {
    color: "#FF0000",
    marginBottom: 4,
  },
  packagePrice: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  termsText: {
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
  },
});

export default Store;
