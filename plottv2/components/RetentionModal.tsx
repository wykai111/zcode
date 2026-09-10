import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MergedProduct, useIAPContext } from "../hooks/useIAP";
import { useDictionary } from "@/hooks/useDictionary";

const { width: screenWidth } = Dimensions.get("window");
const rem = (n: number) => n * (screenWidth / 750);

const CARD_WIDTH = rem(750);
const BG_HEIGHT = CARD_WIDTH * (1004 / 750);

const ASSETS = {
  iconClose: require("@/assets/icons/icon_store_sku_bg_close.png"),
  iconReatinProductBg: require("@/assets/icons/icon_retain_products_bg.png"),
  iconVipWeekly: require("@/assets/icons/icon_retain_products_vip_weekly.png"),
  iconVipMonthly: require("@/assets/icons/icon_retain_products_vip_monthly.png"),
  iconVipYearly: require("@/assets/icons/icon_retain_products_vip_yearly.png"),
  iconSubBtn: require("@/assets/icons/icon_retain_products_sub_btn.png"),
};

const VIP_ICONS: Record<string, any> = {
  weekly: ASSETS.iconVipWeekly,
  monthly: ASSETS.iconVipMonthly,
  yearly: ASSETS.iconVipYearly,
};

interface RetentionModalProps {
  visible: boolean;
  retentionProduct: MergedProduct | null;
  episodeId?: string;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

function CountdownTimer({ minutes, dict }: { minutes: number; dict: Record<string, string> }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    setTimeLeft(minutes * 60);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [minutes]);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  return (
    <View style={styles.countdownRow}>
      <Text style={styles.countdownText}>{dict["LimitedTime"] || "Limited Time"}</Text>
      <View style={styles.timeTextContainer}>
        <Text style={styles.timeText}>{h.toString().padStart(2, "0")}</Text>
      </View>
      <Text style={styles.countdownColon}>:</Text>
      <View style={styles.timeTextContainer}>
        <Text style={styles.timeText}>{m.toString().padStart(2, "0")}</Text>
      </View>
      <Text style={styles.countdownColon}>:</Text>
      <View style={styles.timeTextContainer}>
        <Text style={styles.timeText}>{s.toString().padStart(2, "0")}</Text>
      </View>
    </View>
  );
}

export default function RetentionModal({
  visible,
  retentionProduct,
  episodeId,
  onClose,
  onPurchaseSuccess,
}: RetentionModalProps) {
  const router = useRouter();
  const { requestPurchaseByMergedProduct, loading } = useIAPContext();
  const dict = useDictionary();

  const handlePurchase = useCallback(() => {
    if (!retentionProduct) return;
    requestPurchaseByMergedProduct(retentionProduct, episodeId, () => {
      onClose();
      onPurchaseSuccess?.();
    });
  }, [retentionProduct, episodeId, requestPurchaseByMergedProduct, onClose, onPurchaseSuccess]);

  const serverData = retentionProduct?.serverData;

  const displayPrice = useMemo(() => {
    if (!retentionProduct || !serverData) return "";
    if (retentionProduct.localizedPrice) return retentionProduct.localizedPrice;
    const price = serverData.deduction || serverData.expense;
    return price ? `$${price}` : "";
  }, [retentionProduct, serverData]);

  const originalPriceLabel = useMemo(() => {
    if (retentionProduct && retentionProduct.platformProduct) {
      return retentionProduct.platformProduct.displayPrice;
    }
    return `$${serverData?.expense || ""}`;
  }, [retentionProduct, serverData]);

  if (!retentionProduct || !serverData) return null;

  const discountPercent = Math.round(Number(serverData.cut_ratio || 0) * 100);
  const intervalType = serverData.interval_genre;

  const rebateMinutes = Number(serverData.rebate_timer || 1440);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onClose} />

      <View style={styles.cardWrapper}>
        <View style={styles.cardContainer}>
          <Image
            source={ASSETS.iconReatinProductBg}
            style={styles.bgImage}
            contentFit="fill"
          />
          <Image source={VIP_ICONS[intervalType] ?? ASSETS.iconVipMonthly} style={styles.vipImage} />
          <View style={styles.offContent}>
            <Text style={styles.offtext}>{discountPercent}%</Text>
            <Text style={styles.text}>{dict["OFF"] || "OFF"}</Text>
          </View>
          <View style={styles.priceContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#FF2D6A" />
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{displayPrice}</Text>
                {serverData.deduction &&
                  serverData.deduction !== serverData.expense && (
                    <Text style={styles.originalPriceText}>
                      {originalPriceLabel}
                    </Text>
                  )}
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.subButton}
            activeOpacity={0.8}
            onPress={handlePurchase}
            disabled={loading}
          >
            <Image source={ASSETS.iconSubBtn} style={styles.subBtnImage} />
          </TouchableOpacity>

          <CountdownTimer key={visible ? "active" : "inactive"} minutes={rebateMinutes} dict={dict} />
        </View>

        <Text style={styles.renewalText}>
          · Auto-renewal · Cancel anytime
        </Text>

        <Text style={styles.termsText}>
          · By continuing, you agree to our{" "}
          <Text
            style={styles.termsLink}
            onPress={() => router.push("/privacyPolicy")}
          >
            Privacy Policy
          </Text>
        </Text>

        <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={loading}>
          <Image source={ASSETS.iconClose} style={[styles.closeIcon, loading && { opacity: 0.3 }]} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF2D6A" />
            <Text style={styles.loadingText}>{dict["Loading..."] || "Loading..."}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  cardWrapper: {
    alignItems: 'center',
    marginTop: '-18%'
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: BG_HEIGHT,
    alignItems: "center",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: CARD_WIDTH,
    height: BG_HEIGHT,
    borderRadius: 20,
  },
  vipImage: {
    position: "absolute",
    top: BG_HEIGHT * 0.37,
    left: CARD_WIDTH * 0.146,
    width: rem(362),
    height: rem(116),
  },
  offContent: {
    position: "absolute",
    top: BG_HEIGHT * 0.55,
    height: rem(156),
    width: rem(520),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  offtext: {
    fontSize: 60,
    fontWeight: "500",
    textAlign: "center",
    color: "#FFF8EF",
  },
  text: {
    position: "absolute",
    fontSize: 12,
    color: "#FFF8EFCC",
    right: rem(80), 
    marginBottom: rem(18), 
    alignSelf: "flex-end",
  },
  priceContainer: {
    position: "absolute",
    bottom: BG_HEIGHT * 0.138,
    width: CARD_WIDTH * 0.65,
    height: BG_HEIGHT * 0.13,
    borderRadius: BG_HEIGHT * 0.065,
    justifyContent: "center",
    alignItems: "center",
  },
  subButton: {
    position: "absolute",
    bottom: BG_HEIGHT * 0.08,
  },
  subBtnImage: {
    width: rem(496),
    height: rem(88),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FA5154",
  },
  originalPriceText: {
    fontSize: 12,
    color: "#FA515466",
    fontWeight: "500",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  countdownRow: {
    position: "absolute",
    bottom: BG_HEIGHT * 0.018,
    flexDirection: "row",
    alignItems: "center",
  },
  countdownText: {
    fontSize: 12,
    color: "#FA5255",
    marginRight: rem(10),
  },
  countdownColon: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FA7C7E",
    marginHorizontal: rem(4),
  },
  timeTextContainer: {
    width: rem(44),
    height: rem(44),
    backgroundColor: "#FA7C7E",
    borderRadius: rem(10),
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  renewalText: {
    fontSize: 11,
    color: "#FFFFFFB2",
    marginTop: rem(14),
  },
  termsText: {
    fontSize: 10,
    color: "#FFFFFFB2",
    textAlign: "center",
    marginTop: rem(8),
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  termsLink: {
    textDecorationLine: "underline",
    color: "#FFFFFFB2",
  },
  closeButton: {
    marginTop: rem(28),
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "rgba(255,255,255,0.7)",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 12,
  },
});
