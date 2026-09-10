import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MergedProduct, useIAPContext } from "../hooks/useIAP";
import { useDictionary } from "@/hooks/useDictionary";

const ASSETS = {
  iconCoins: require("@/assets/icons/icon_coins.png"),
  iconSukSubSelectBg: require("@/assets/icons/icon_suk_sub_select_bg.png"),
  iconSukSubBg: require("@/assets/icons/icon_suk_sub_bg.png"),
};

const CountDown = ({ minutes }: { minutes: number }) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <LinearGradient
          colors={['#FFFFFF', '#FFDAE5']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0, 1]}
          style={{borderRadius: 2}}
        >
          <Text style={styles.badgeTimerText}>{h.toString().padStart(2, '0')}</Text>
        </LinearGradient>
        <Text style={{color: '#FFFFFF', marginHorizontal: 2, marginTop: -2, fontSize: 12, fontWeight: 'bold'}}>:</Text>
        <LinearGradient
          colors={['#FFFFFF', '#FFDAE5']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0, 1]}
          style={{borderRadius: 2}}
        >
          <Text style={styles.badgeTimerText}>{m.toString().padStart(2, '0')}</Text>
        </LinearGradient>
        <Text style={{color: '#FFFFFF', marginHorizontal: 2, marginTop: -2, fontSize: 12, fontWeight: 'bold'}}>:</Text>
        <LinearGradient
          colors={['#FFFFFF', '#FFDAE5']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0, 1]}
          style={{borderRadius: 2}}
        >
          <Text style={styles.badgeTimerText}>{s.toString().padStart(2, '0')}</Text>
        </LinearGradient>
      </View>
    );
  };

  return <View>{formatTime(timeLeft)}</View>;
};

const SubscriptionItem = ({
  item,
  selectedSubscription,
  loading,
  onSelect,
  dict,
}: {
  item: MergedProduct;
  selectedSubscription: string | undefined;
  loading: boolean;
  onSelect: (item: MergedProduct) => void;
  dict: Record<string, string>;
}) => {
  const { serverData } = item;
  const coinsAmount = serverData.money_gross || '0';
  const bonusAmount = serverData.reward_gross;
  const giftRatio = (Number(serverData.premium_grade) * 100).toFixed(0);
  const intervalType = serverData.interval_genre;

  const originalPrice = parseFloat(serverData.expense || '0');
  const currentPrice = parseFloat(serverData.deduction || serverData.expense || '0');
  const isSpecial = serverData.section === "vip";
  const discountPercent = isSpecial ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  const getDisplayPrice = (product: MergedProduct) => {
    if (product.localizedPrice) return product.localizedPrice;
    const price = product.serverData.deduction || product.serverData.expense;
    return price ? `$${price}` : '';
  };

  const getOriginalPrice = () => {
    if (isSpecial && item.platformProduct) {
      return item.platformProduct.displayPrice;
    }
    return `$${serverData.expense}`;
  };

  const getDiscountDescription = () => {
    let template = intervalType === 'weekly' ? dict['FirstWeek'] : intervalType === 'monthly' ? dict['FirstMonth'] : dict['FirstYear'];
    if (!template) {
      return ''
    }
    return template.replace('{0}', getDisplayPrice(item)).replace('{1}', getOriginalPrice());
  };

  return (
    <TouchableOpacity
      key={serverData.unique_mark}
      style={[styles.subItem, loading && { opacity: 0.5 }]}
      activeOpacity={0.7}
      disabled={loading}
      onPress={() => onSelect(item)}
    >
      {selectedSubscription === serverData.unique_mark ? (
        <Image
          source={ASSETS.iconSukSubSelectBg}
          style={StyleSheet.absoluteFillObject}
          contentFit="fill"
        />
      ) : (
        <Image
          source={ASSETS.iconSukSubBg}
          style={StyleSheet.absoluteFillObject}
          contentFit="fill"
        />
      )}

      <View style={styles.subLeftContent}>
        {isSpecial ? (
          <>
            <View style={styles.subTitleRow}>
              <Text style={styles.subTitleText}>
                {intervalType === 'yearly' ? (dict['Yearly VIP'] || 'Yearly VIP') : intervalType === 'weekly' ? (dict['Weekly VIP'] || 'Weekly VIP') : (dict['Monthly VIP'] || 'Monthly VIP')}
              </Text>
            </View>

            <View style={styles.subMainRow}>
              <Text style={styles.subPriceTextLarge}>{getDisplayPrice(item)}</Text>
              { originalPrice > currentPrice && <Text style={styles.subOriginalPriceText}>{getOriginalPrice()}</Text> }
            </View>

            <Text style={styles.subAutoRenewText}>
              {dict['AutoRenew'] || 'Auto renew . Cancel anytime'}
            </Text>
            { originalPrice > currentPrice && <Text style={styles.subDescriptionText}>
              {getDiscountDescription()}
            </Text> }
          </>
        ) : (
          <>
            <Text style={styles.subPriceText}>{getDisplayPrice(item)}/{intervalType === 'yearly' ? dict['Year'] || 'year' : intervalType === 'weekly' ? dict['Week'] || 'week' : dict['Month'] || 'month'}</Text>
            <View style={styles.subMainRow}>
              <Text style={styles.subAmountText}>{coinsAmount}</Text>
              <Text style={styles.subAmountUnitText}>{dict['COINS'] || 'Coins'}</Text>
              {Number(bonusAmount) > 0 && (
                <Text style={styles.subBonusAmountText}>+ {bonusAmount} {dict['BONUS'] || 'Bonus'}</Text>
              )}
            </View>
            <Text style={styles.subAutoRenewText}>
              {dict['AutoRenew'] || 'Auto renew. Cancel anytime.'}
            </Text>
          </>
        )}
      </View>

      {isSpecial && originalPrice > currentPrice ? (
        <View style={styles.specialBadgeContainer}>
          <Text style={styles.specialBadgeText}>{discountPercent}% OFF</Text>
          <CountDown minutes={Number(serverData.rebate_timer || 360)} />
        </View>
      ) : (
        Number(giftRatio) > 0 && (
          <View style={styles.subBadgeContainer}>
            <Text style={styles.subBadgeText}>+{giftRatio}%</Text>
          </View>
        )
      )}
    </TouchableOpacity>
  );
};

const SKU = ({ onPurchaseSuccess, episodeId }: { onPurchaseSuccess?: () => void; episodeId?: string }) => {
  const { mergedProducts, loading, productLoading, isInitialized, initIAP, requestPurchaseByMergedProduct, refreshEffects } = useIAPContext();
  const [selectedSubscription, setSelectedSubscription] = useState<
    string | undefined
  >(undefined);
  const dict = useDictionary();
  const hasRetriedRef = useRef(false);

  useEffect(() => { initIAP(); }, [initIAP]);

  useEffect(() => {
    if (isInitialized && mergedProducts.length === 0 && !productLoading && !hasRetriedRef.current) {
      hasRetriedRef.current = true;
      refreshEffects();
    }
  }, [isInitialized, mergedProducts.length, productLoading, refreshEffects]);

  if (!isInitialized) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#EE0000" />
        <Text style={styles.loadingText}>{dict['Initializing Store...'] || 'Initializing Store...'}</Text>
      </View>
    );
  }

  // 充值商品 (gift_radio)
  const coinProducts = mergedProducts.filter(
    (p) => p.serverData.section === "gift_radio",
  );
  // 订阅商品 (vip, coins_package)
  const subscriptionProducts = mergedProducts.filter(
    (p) => p.serverData.section === "vip" || p.serverData.section === "coins_package",
  );

  const getDisplayPrice = (item: MergedProduct) => {
    if (item.localizedPrice) return item.localizedPrice;
    const price = item.serverData.deduction || item.serverData.expense;
    return price ? `$${price}` : '';
  };

  const renderCoinItem = (item: MergedProduct) => {
    const { serverData } = item;
    const coinsAmount = serverData.money_gross || '0';
    const bonusAmount = serverData.reward_gross;
    const giftRatio = (Number(serverData.premium_grade) * 100).toFixed(0);

    return (
      <TouchableOpacity
        key={serverData.unique_mark}
        style={[styles.coinItem, loading && { opacity: 0.5 }]}
        activeOpacity={0.8}
        disabled={loading}
        onPress={() => requestPurchaseByMergedProduct(item, episodeId, onPurchaseSuccess)}
      >
        <View style={styles.coinMainContent}>
          <View style={styles.coinTitleRow}>
            <Image
              source={ASSETS.iconCoins}
              style={styles.coinIcon}
            />
            <Text style={styles.coinAmountText}>{coinsAmount}</Text>
          </View>
          {Number(bonusAmount) > 0 && (
            <Text style={styles.bonusAmountText}>
              +{bonusAmount}
              <Text style={styles.bonusLabelText}> {dict['BONUS'] || 'Bonus'}</Text>
            </Text>
          )}
        </View>

        <View style={styles.coinPriceContainer}>
          <Text style={styles.coinPriceText}>{getDisplayPrice(item)}</Text>
        </View>

        {Number(giftRatio) > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>+{giftRatio}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
      {mergedProducts.length === 0 && productLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#EE0000" />
          <Text style={styles.loadingText}>{dict['Loading...'] || 'Loading...'}</Text>
        </View>
      ) : mergedProducts.length === 0 ? (
        <Text style={styles.emptyText}>{dict['No plans available.'] || 'No plans available.'}</Text>
      ) : (
        <>
          <View style={styles.subscriptionList}>
            {subscriptionProducts.map((item) => (
              <SubscriptionItem
                key={item.serverData.unique_mark}
                item={item}
                selectedSubscription={selectedSubscription}
                loading={loading}
                dict={dict}
                onSelect={(i) => {
                  setSelectedSubscription(i.serverData.unique_mark);
                  requestPurchaseByMergedProduct(i, episodeId, onPurchaseSuccess);
                }}
              />
            ))}
          </View>
          <View style={styles.coinGrid}>
            {coinProducts.map(renderCoinItem)}
          </View>
        </>
      )}

      {mergedProducts.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsText}>Tips</Text>
            <Text style={styles.tipsText}>
            {dict['By subscribing, you agree to our']} {dict['Terms of Use']}, <Text style={styles.linkText} onPress={() => Linking.openURL('https://glidetv.xyz/privacy')}>{dict['Privacy Policy']}</Text>.
            </Text>
            <Text style={styles.tipsText}>
              {dict['GlideTV_SubscriptionsTips']}
            </Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    paddingHorizontal: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    marginTop: -100,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    minHeight: 260,
    marginTop: -100,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  coinGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    marginTop: 15,
    justifyContent: "space-between",
  },
  coinItem: {
    width: "48.5%",
    height: 100,
    backgroundColor: "#202531",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#3D4556",
  },
  coinMainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    textAlign: "center",
  },
  coinTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  coinAmountText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 4,
  },
  bonusAmountText: {
    color: "#FFFFFFB2",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 2,
  },
  bonusLabelText: {
    color: "#FFFFFFB2",
    fontSize: 12,
  },
  coinPriceContainer: {
    height: 32,
    backgroundColor: "#313743",
    justifyContent: "center",
    alignItems: "center",
  },
  coinPriceText: {
    color: "#FFFFFFB2",
    fontSize: 13,
  },
  badgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  subscriptionList: {
    paddingHorizontal: 8,
    gap: 12,
  },
  subItem: {
    width: "100%",
    height: 103,
    borderRadius: 12,
    overflow: "hidden",
    padding: 16,
  },
  subLeftContent: {
    flex: 1,
    justifyContent: "center",
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subTitleText: {
    color: '#FCD191',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  subOriginalPriceText: {
    marginLeft: 8,
    marginTop: 4,
    color: '#FCD19199',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  subPriceText: {
    color: "#FCD191",
    fontSize: 14,
    marginBottom: 4,
  },
  subPriceTextLarge: {
    color: "#FCD191",
    fontSize: 20,
    fontWeight: "bold",
  },
  subMainRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  coinIconSmall: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  subAmountText: {
    color: "#FCD191",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 4,
  },
  subAmountUnitText: {
    color: "#FCD191",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 8,
  },
  subBonusAmountText: {
    backgroundColor: "#FCD191",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    color: "#544B3C",
    fontSize: 14,
    marginRight: 4,
  },
  subAutoRenewText: {
    color: "#FCD191B2",
    fontSize: 12,
  },
  subDescriptionText: {
    color: "#FCD191B2",
    fontSize: 12,
    marginTop: 2,
  },
  subBadgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  subBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  specialBadgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#E53130",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  specialBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginRight: 8,
  },
  badgeTimerText: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    color: '#E53130',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subDecorativeLines: {
    position: "absolute",
    right: -20,
    top: 0,
    bottom: 0,
    width: 150,
    flexDirection: "row",
    opacity: 0.1,
  },
  decorLine: {
    width: 1,
    height: "200%",
    backgroundColor: "#FFFFFF",
    position: "absolute",
  },
  restoreBtn: {
    marginTop: 20,
    padding: 10,
    alignItems: "center",
  },
  restoreText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  emptyText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    width: "100%",
    marginTop: 40,
  },
  tipsContainer: {
    padding: 10,
    paddingTop: 14,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  tipsText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  linkText: {
    color: "#FCD191",
    textDecorationLine: "underline",
  },
});

export default SKU;
