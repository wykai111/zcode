import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useCallback, useState, useRef } from "react";
import { loginApi } from "@/api/login";
import { subscriptionApi } from "@/api/subscription";
import { useDictionary } from "@/hooks/useDictionary";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Switch,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ASSETS = {
  arrowLeft: require("@/assets/icons/icon_arrow_left.png"),
  arrowRight: require("@/assets/icons/icon_user_arrow_right.png"),
  iconCoins: require("@/assets/icons/icon_coins.png"),
};

type PageType = "wallet" | "transaction" | "consumption";

const formatDate = (timestamp: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function MyWallet() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState<PageType>("wallet");
  const [autoUnlock, setAutoUnlock] = useState(true);
  const [allowance, setAllowance] = useState(0);
  const [perks, setPerks] = useState(0);
  const dict = useDictionary();
  const [transactionRecord, setTransactionRecord] = useState<any[]>([]);
  const [consumptionRecord, setConsumptionRecord] = useState<any[]>([]);

  const transactionRef = useRef({ hasMore: true, isLoading: false, cursor: undefined as string | undefined });
  const consumptionRef = useRef({ hasMore: true, isLoading: false, cursor: undefined as string | undefined });

  const rem = useCallback((size: number) => (width / 750) * size, [width]);

  const getUserCash = useCallback(async () => {
    try {
      const result = await loginApi.getUserCash();
      console.log("getUserCash result:", result);
      if (result) {
        setAllowance(result.allowance || 0);
        setPerks(result.perks || 0);
        setAutoUnlock(result.machine_admission_setup);
      }
    } catch (err) {
      console.warn('[MyWallet] Failed to fetch user cash:', err);
    }
  }, []);

  const getTransactionRecord = useCallback(async (isLoadMore = false) => {
    const ref = transactionRef.current;
    if (isLoadMore && (!ref.hasMore || ref.isLoading)) return;

    ref.isLoading = true;
    try {
      const params: Record<string, any> = { amount_calc: 20 };
      if (isLoadMore && ref.cursor) params.immediate = ref.cursor;

      const result = await subscriptionApi.getTransactionRecord(params);

      const list = result.profile_achievements || [];

      if (isLoadMore) {
        setTransactionRecord(prev => [...prev, ...list]);
      } else {
        setTransactionRecord(list);
      }

      ref.hasMore = list.length >= 20;
      if (list.length > 0) {
        ref.cursor = list[list.length - 1].unique_mark;
      }
    } catch (err) {
      console.warn('[MyWallet] Failed to fetch transaction record:', err);
    } finally {
      ref.isLoading = false;
    }
  }, []);

  const getConsumptionRecord = useCallback(async (isLoadMore = false) => {
    const ref = consumptionRef.current;
    if (isLoadMore && (!ref.hasMore || ref.isLoading)) return;

    ref.isLoading = true;
    try {
      const params: Record<string, any> = { amount_calc: 20 };
      if (isLoadMore && ref.cursor) params.immediate = ref.cursor;

      const result = await subscriptionApi.getConsumptionRecord(params);

      const list = result.dossier_usage || [];

      if (isLoadMore) {
        setConsumptionRecord(prev => [...prev, ...list]);
      } else {
        setConsumptionRecord(list);
      }

      ref.hasMore = list.length >= 20;
      if (list.length > 0) {
        ref.cursor = list[list.length - 1].unique_mark;
      }
    } catch (err) {
      console.warn('[MyWallet] Failed to fetch consumption record:', err);
    } finally {
      ref.isLoading = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getUserCash();
    }, [getUserCash])
  );

  useEffect(() => {
    getTransactionRecord();
    getConsumptionRecord();
  }, [getTransactionRecord, getConsumptionRecord]);

  const handleSwitchAutoUnlock = useCallback(async () => {
    const newValue = !autoUnlock;
    setAutoUnlock(newValue);
    try {
      await loginApi.switchAutoUnlock();
    } catch (err) {
      setAutoUnlock(autoUnlock);
      console.warn('[MyWallet] Failed to switch auto unlock:', err);
    }
  }, [autoUnlock]);

  const renderHeader = (title: string) => (
    <View style={[styles.headerContainer, { marginTop: insets.top + rem(10) }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (currentPage === "wallet") {
            router.back();
          } else {
            setCurrentPage("wallet");
          }
        }}
      >
        <Image
          source={ASSETS.arrowLeft}
          style={{ width: rem(48), height: rem(48) }}
        />
      </TouchableOpacity>
      <Text style={[styles.headerText, { fontSize: rem(40) }]}>{title}</Text>
    </View>
  );

  const renderWallet = () => (
    <View style={styles.content}>
      {renderHeader(dict['My Wallet'] || "My Wallet")}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: rem(40) }}>
        <View style={[styles.walletCard, { marginTop: rem(40) }]}>
          <View style={styles.walletInfoRow}>
            <View>
              <Text style={[styles.walletLabel, { fontSize: rem(24) }]}>{dict['COINS'] || "Coins"}</Text>
              <View style={styles.coinValueRow}>
                <Image
                  source={ASSETS.iconCoins}
                  style={{ width: rem(48), height: rem(48), marginRight: rem(12) }}
                />
                <Text style={[styles.coinValue, { fontSize: rem(48) }]}>{allowance + perks}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.topUpButton}
              activeOpacity={0.7}
              onPress={() => router.push("/store")}
            >
              <Text style={[styles.topUpButtonText, { fontSize: rem(28) }]}>{dict['Top Up'] || "Top Up"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.walletSubInfo}>
            <Text style={[styles.subInfoText, { fontSize: rem(24) }]}>
              {dict['COINS'] || "Coins"} {allowance} | {dict['BONUS'] || "Bonus"} {perks}
            </Text>
          </View>
        </View>

        <View style={[styles.menuList, { marginTop: rem(60) }]}>
          <TouchableOpacity
            style={[styles.menuItem, { height: rem(110) }]}
            onPress={() => setCurrentPage("transaction")}
          >
            <Text style={[styles.menuLabel, { fontSize: rem(32) }]}>{dict['Transaction record'] || "Transaction record"}</Text>
            <Image
              source={ASSETS.arrowRight}
              style={{ width: rem(48), height: rem(48), opacity: 0.6 }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, { height: rem(110) }]}
            onPress={() => setCurrentPage("consumption")}
          >
            <Text style={[styles.menuLabel, { fontSize: rem(32) }]}>{dict['Consumption record'] || "Consumption record"}</Text>
            <Image
              source={ASSETS.arrowRight}
              style={{ width: rem(48), height: rem(48), opacity: 0.6 }}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.autoUnlockRow, { marginTop: rem(40), height: rem(110), paddingBottom: rem(40) }]}>
          <Text style={[styles.menuLabel, { fontSize: rem(32) }]}>{dict['Auto-unlock the next episode'] || "Auto-unlock the next episode"}</Text>
          <Switch
            value={autoUnlock}
            onValueChange={handleSwitchAutoUnlock}
            trackColor={{ false: "#333", true: "#FF0004" }}
            thumbColor={"#fff"}
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderTransactionRecord = () => (
    <View style={styles.content}>
      {renderHeader(dict['Transaction record'] || "Transaction record")}
      <FlatList
        data={transactionRecord}
        keyExtractor={(item: any, index: number) => `${item.unique_mark}_${index}`}
        renderItem={({ item }) => (
          <View style={[styles.recordItem, { paddingVertical: rem(30) }]}>
            <View style={styles.recordMain}>
              <View>
                <Text style={[styles.recordTitle, { fontSize: rem(32) }]}>{dict['Top Up'] || "Top Up"}</Text>
                <Text style={[styles.recordTime, { fontSize: rem(24), marginTop: rem(8) }]}>{formatDate(item.constructed_when)}</Text>
              </View>
              <View>
                <Text style={[styles.recordAmount, { fontSize: rem(32), color: "#40FF56" }]}>+{item.award_volume} {item.award_ref === 1 ? (dict['COINS'] || 'COINS') : (dict['BONUS'] || 'BONUS')}</Text>
                <Text style={[styles.recordPrice, { fontSize: rem(24), marginTop: rem(8) }]}>{item.aim}</Text>
              </View>
            </View>
          </View>
        )}
        style={{ marginTop: rem(20), flex: 1 }}
        contentContainerStyle={{ paddingBottom: rem(40) }}
        onEndReached={() => getTransactionRecord(true)}
        onEndReachedThreshold={0.5}
      />
    </View>
  );

  const renderConsumptionRecord = () => (
    <View style={styles.content}>
      {renderHeader(dict['Consumption record'] || "Consumption record")}
      <FlatList
        data={consumptionRecord}
        keyExtractor={(item: any, index: number) => `${item.unique_mark}_${index}`}
        renderItem={({ item }) => (
          <View style={[styles.recordItem, { paddingVertical: rem(30) }]}>
            <View style={styles.recordMain}>
              <View style={{ flex: 1, marginRight: rem(20) }}>
                <Text style={[styles.recordTitle, { fontSize: rem(32) }]}>{dict['Series unlocked'] || "Series unlocked"}</Text>
                <Text style={[styles.recordTime, { fontSize: rem(24), marginTop: rem(8) }]}>{formatDate(item.constructed_when)}</Text>
              </View>
              <View style={{ flexShrink: 0, alignItems: "flex-end", maxWidth: "50%" }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {item.auth_procedure?.perks?.map((perk: any, index: number) => (
                    <Text key={index} style={[styles.recordAmount, { fontSize: rem(32), color: "#FF4063", marginRight: rem(8) }]}>
                      {index > 0 ? " " : ""}-{perk.award_volume} {perk.award_ref === 1 ? (dict['coins'] || 'coins') : (dict['bonus'] || 'bonus')}
                    </Text>
                  ))}
                </View>
                <Text style={[styles.recordPrice, { fontSize: rem(24), marginTop: rem(8) }]} numberOfLines={1}>EP.{item.installment_idx} - {item.rubric}</Text>
              </View>
            </View>
          </View>
        )}
        style={{ marginTop: rem(20), flex: 1 }}
        contentContainerStyle={{ paddingBottom: rem(40) }}
        onEndReached={() => getConsumptionRecord(true)}
        onEndReachedThreshold={0.5}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {currentPage === "wallet" && renderWallet()}
      {currentPage === "transaction" && renderTransactionRecord()}
      {currentPage === "consumption" && renderConsumptionRecord()}
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
    left: -5,
  },
  headerText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  walletCard: {
    backgroundColor: "#141414",
    borderRadius: 4,
    overflow: "hidden",
  },
  walletInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingHorizontal: 12
  },
  walletLabel: {
    color: "#BFBFBF",
    marginBottom: 8,
  },
  coinValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinValue: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  topUpButton: {
    width: 110,
    height: 32,
    backgroundColor: "#FF0004",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  topUpButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  walletSubInfo: {
    backgroundColor: "#292929",
    marginTop: 12,
    padding: 12

  },
  subInfoText: {
    color: "#BFBFBF",
    fontSize: 12,
  },
  menuList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLabel: {
    color: "#FFFFFF",
    fontWeight: "400",
  },
  autoUnlockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  recordMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  recordTitle: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  recordTime: {
    color: "rgba(255, 255, 255, 0.5)",
  },
  recordAmount: {
    textAlign: "right",
    fontWeight: "600",
  },
  recordPrice: {
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "right",
  },
});
