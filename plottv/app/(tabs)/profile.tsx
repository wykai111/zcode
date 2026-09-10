import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useCallback, useState, useRef } from "react";
import { loginApi } from "@/api/login";
import { storage } from "@/utils/storage";
import { useDictionary } from "@/hooks/useDictionary";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const ASSETS = {
  topBg: require("@/assets/icons/icon_user_center_top_bg.png"),
  topSettingIcon: require("@/assets/icons/icon_user_center_top_setting.png"),
  avatar: require("@/assets/icons/icon_user_avatar.png"),
  copy: require("@/assets/icons/icon_user_id_copy.png"),
  iconCoins: require("@/assets/icons/icon_coins.png"),
  arrowRight: require("@/assets/icons/icon_vip_arrow_right.png"),
  userArrowRight: require("@/assets/icons/icon_user_arrow_right.png"),
  historyIcon: require("@/assets/icons/icon_history.png"),
  dashedLine: require("@/assets/icons/icon_user_dashed_line.png"),
  car: require("@/assets/icons/icon_user_car.png"),
  icon_language: require("@/assets/icons/icon_language.png"),
  icon_feedback: require("@/assets/icons/icon_feedback.png"),
};

const Profile = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const [userInfo, setUserInfo] = useState<any>(null);

  const [userId, setUserId] = useState('');
  const [displayUid, setDisplayUid] = useState('');
  const [coins, setCoins] = useState(0);
  const dict = useDictionary();
  const localLoaded = useRef(false);

  const rem = useCallback((size: number) => (width / 750) * size, [width]);

  const copyToClipboard = useCallback(async () => {
    await Clipboard.setStringAsync(userId);
    Alert.alert(dict['copy success'] || "copy success");
  }, [userId, dict]);

  useEffect(() => {
    (async () => {
      const cachedUid = await storage.getUserId();
      if (cachedUid) {
        setUserId(cachedUid);
        setDisplayUid(cachedUid.slice(0, 8));
      }
      localLoaded.current = true;
    })();
  }, []);

  const getUserInfo = useCallback(async () => {
    const result = await loginApi.getUserInfo();
    setUserInfo(result);
    const remoteUid = result?.identity_uuid;
    if (remoteUid && remoteUid !== userId) {
      setUserId(remoteUid);
      setDisplayUid(remoteUid.slice(0, 8));
      await storage.setUserId(remoteUid);
    }
    setCoins((result?.cash_reserve?.allowance || 0) + (result?.cash_reserve?.perks || 0));
  }, [userId]);

  useEffect(() => {
    if (isFocused) {
      getUserInfo();
    }
  }, [isFocused, getUserInfo]);

  return (
    <ScrollView style={styles.container} bounces={false}>
      <Image
        source={ASSETS.topBg}
        style={[styles.topBg, { height: rem(546) }]}
        contentFit="cover"
      />
      <View style={styles.topSettingContainer}>
        <Text
          style={{
            fontSize: rem(40),
            color: "#fff",
            fontWeight: "600",
          }}
        >
          {dict['Profile'] || 'Profile'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/settings")}
        >
          <Image
            source={ASSETS.topSettingIcon}
            style={{ width: rem(48), height: rem(48) }}
          />
        </TouchableOpacity>
      </View>
      {/* User Info */}
      <View
        style={[
          styles.userCenter,
          {
            marginTop: rem(12),
            paddingVertical: rem(48),
          },
        ]}
      >
        <Image
          source={ASSETS.avatar}
          style={{ width: rem(108), height: rem(108), marginRight: rem(24) }}
        />
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              { fontSize: rem(34), marginBottom: rem(10) },
            ]}
          >
            {userInfo?.screenname || dict['GUEST'] || "Guest"}
          </Text>
          <TouchableOpacity
            style={styles.uidContainer}
            onPress={copyToClipboard}
          >
            <Text style={[styles.uidText, { fontSize: rem(24) }]}>
              UID: {displayUid}
            </Text>
            <Image
              source={ASSETS.copy}
              style={{ width: rem(24), height: rem(24), marginLeft: rem(10) }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* VIP Section */}
      <LinearGradient
        colors={["#141312", "#291115"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.vipCard, { borderRadius: rem(24), marginTop: rem(20) }]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.vipMain,
            {
              paddingHorizontal: rem(24),
              paddingTop: rem(40),
              paddingBottom: rem(40),
            },
          ]}
          onPress={() => router.push("/myWallet?type=wallet")}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <Image
              source={ASSETS.iconCoins}
              style={{
                width: rem(40),
                height: rem(40),
                marginRight: rem(12),
              }}
            />
            <Text style={styles.coinsText}>{coins}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontSize: 16,
                color: "#F7F2F2",
                fontWeight: "300",
                marginRight: rem(12),
              }}
            >
              {dict['My Wallet'] || 'My Wallet'}
            </Text>
            <Image
              source={ASSETS.arrowRight}
              style={{ width: rem(32), height: rem(32), marginTop: rem(4) }}
            />
          </View>
        </TouchableOpacity>
        <Image
          source={ASSETS.dashedLine}
          style={{ width: "100%", height: rem(1) }}
        ></Image>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/store")}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: rem(30),
              paddingBottom: rem(30),
            }}
          >
            <Image
              source={ASSETS.car}
              style={{ width: rem(40), height: rem(40), marginRight: rem(16) }}
            />
            
              <Text style={{ fontSize: 14, color: "#FFD209", fontWeight: "500" }}>
                {dict['Top Up'] || 'Top Up'}
              </Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* History Section */}
      <View style={{ marginTop: rem(48) }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.sectionTitle, { marginBottom: rem(20) }]}
          onPress={() => router.push("/history")}
        >
          <Image
            source={ASSETS.historyIcon}
            style={{ width: rem(48), height: rem(48), marginRight: rem(16) }}
          />
          <Text style={[styles.sectionLabel, { fontSize: rem(28) }]}>
            {dict['History'] || 'Watch History'}
          </Text>
          <Image
            source={ASSETS.userArrowRight}
            style={{ width: rem(48), height: rem(48) }}
          />
        </TouchableOpacity>
      </View>

      {/* Setting Section */}
      <View style={{ marginTop: rem(30) }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.sectionTitle, { marginBottom: rem(20) }]}
          onPress={() => router.push("/language")}
        >
          <Image
            source={ASSETS.icon_language}
            style={{ width: rem(48), height: rem(48), marginRight: rem(16) }}
          />
          <Text style={[styles.sectionLabel, { fontSize: rem(28) }]}>
            {dict['Language'] || 'Language'}
          </Text>
          <Image
            source={ASSETS.userArrowRight}
            style={{ width: rem(48), height: rem(48) }}
          />
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: rem(30) }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.sectionTitle, { marginBottom: rem(20) }]}
          onPress={() => router.push("/feedback")}
        >
          <Image
            source={ASSETS.icon_feedback}
            style={{ width: rem(48), height: rem(48), marginRight: rem(16) }}
          />
          <Text style={[styles.sectionLabel, { fontSize: rem(28) }]}>
            {dict['Feedback'] || 'Feedback'}
          </Text>
          <Image
            source={ASSETS.userArrowRight}
            style={{ width: rem(48), height: rem(48) }}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040404",
    paddingHorizontal: 15,
  },
  topBg: {
    position: "absolute",
    top: 0,
    left: -15,
    right: -15,
  },
  topSettingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 60,
  },
  userCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    justifyContent: "center",
  },
  userName: {
    fontWeight: "600",
    color: "#F7F2F2",
  },
  uidContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  uidText: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  vipCard: {
    overflow: "hidden",
  },
  vipMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinsText: {
    fontSize: 14,
    fontWeight: "300",
    color: "#F7F2F2",
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionLabel: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.8)",
  },
});

export default Profile;
