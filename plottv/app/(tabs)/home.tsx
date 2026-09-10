import { episodeApi } from "@/api/episodes";
import { ensureLogin } from "@/utils/auth";
import { storage } from "@/utils/storage";
import { getUserInfo } from "@/utils/userInfo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { waitForNetwork } from "@/utils/network";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDictionary } from "@/hooks/useDictionary";

const { width } = Dimensions.get("window");
const rem = (n: number) => n * (width / 750);

const BANNER_ITEM_WIDTH = width * 0.6;
const BANNER_HORIZONTAL_PADDING = (width - BANNER_ITEM_WIDTH) / 2;
const BANNER_CONTENT_CONTAINER_STYLE = { paddingHorizontal: BANNER_HORIZONTAL_PADDING };

// 虚拟无限轮播：使用适量数组避免跳转闪烁
const VIRTUAL_BANNER_COUNT = 50;
const VIRTUAL_INITIAL_INDEX = Math.floor(VIRTUAL_BANNER_COUNT / 2);

const getStableRandom = (seed: string | number, min: number, max: number): number => {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const normalized = Math.abs(hash) / 2147483647;
  return min + normalized * (max - min);
};

interface Episode {
  code: string | number;
  header: string;
  image: string;
  keywords?: string[];
  overview?: string;
}

const ASSETS = {
  homeNameIcon: require("../../assets/icons/icon_home_name.png"),
  homeVipIcon: require("../../assets/icons/icon_home_vip.png"),
  homeBannerPlayIcon: require("../../assets/icons/icon_home_banner_play.png"),
  homeItemCollectIcon: require("../../assets/icons/icon_item_collect.png"),
  homeItemViewIcon: require("../../assets/icons/icon_item_view.png"),
};


const RecommendSection = memo(
  ({
    list,
    title,
    onItemPress,
  }: {
    list: Episode[];
    title: string;
    onItemPress: (item: Episode) => void;
  }) => (
    <View style={styles.recommendSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.gridRow}>
        {list.map((item, index) => {
          if (!item) return null;
          return (
            <TouchableOpacity
              key={`recom-${item.code}-${index}`}
              style={styles.recomItem}
              activeOpacity={0.8}
              onPress={() => onItemPress(item)}
            >
              <View style={styles.imgContainer}>
                <Image
                  source={{ uri: item.image }}
                  contentFit="cover"
                  style={styles.fullImg}
                />
              </View>
              <Text style={styles.recomTitle} numberOfLines={2}>
                {item.header}
              </Text>
              <Text style={styles.recomCategory}>{item.keywords?.[0] || ""}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ),
);
const BottomHorizontalSection = memo(
  ({
    list,
    title,
    onItemPress,
  }: {
    list: Episode[];
    title: string;
    onItemPress: (item: Episode) => void;
  }) => {
    const chunkedList = useMemo(() => {
      const chunks = [];
      for (let i = 0; i < list.length; i += 2) {
        chunks.push(list.slice(i, i + 2));
      }
      return chunks;
    }, [list]);

    if (!list.length) return null;

    return (
      <View style={styles.bottomSection}>
        <View style={styles.bottomHeader}>
          <Text style={styles.bottomTitle} numberOfLines={1}>{title}</Text>
        </View>

        <FlatList
          horizontal
          data={chunkedList}
          keyExtractor={(_, index) => `bottom-group-${index}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomListContent}
          snapToInterval={width - rem(40)}
          decelerationRate="fast"
          initialNumToRender={2}
          removeClippedSubviews={Platform.OS === "android"}
          renderItem={({ item: pair, index: pairIndex }) => (
            <View style={styles.bottomGroup}>
              {pair.map((item, index) => {
                if (!item) return null;
                return (
                  <TouchableOpacity
                    key={`bottom-${item.code}-${pairIndex}-${index}`}
                    style={styles.bottomItem}
                    activeOpacity={0.8}
                    onPress={() => onItemPress(item)}
                  >
                    <View style={styles.bottomImgWrapper}>
                      <Image
                        source={{ uri: item.image }}
                        contentFit="cover"
                        style={styles.fullImg}
                      />
                      <LinearGradient
                        colors={[
                          "transparent",
                          "rgba(0, 0, 0, 0)",
                          "rgba(0, 0, 0, 0.6)",
                        ]}
                        style={StyleSheet.absoluteFill}
                      />
                    </View>
                    <View style={styles.bottomItemInfo}>
                      <Text style={styles.bottomItemTitle} numberOfLines={1}>
                        {item.header}
                      </Text>
                      <Text
                        style={styles.bottomItemDescription}
                        numberOfLines={4}
                      >
                        {item.overview || ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      </View>
    );
  },
);

const RenderHotItem = memo(
  ({
    list,
    title,
    onItemPress,
  }: {
    list: Episode[];
    title: string;
    onItemPress: (item: Episode) => void;
  }) => (
    <View style={styles.recommendSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.gridRow}>
        {list.map((item, index) => {
          if (!item) return null;
          const likes = getStableRandom(`${item.code}-likes`, 100, 999).toFixed(1);
          const views = getStableRandom(`${item.code}-views`, 100, 999).toFixed(1);
          return (
            <TouchableOpacity
              key={`hot-${item.code}-${index}`}
              style={styles.hotItem}
              activeOpacity={0.8}
              onPress={() => onItemPress(item)}
            >
              <View style={styles.cardContainer}>
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: item.image }}
                    contentFit="cover"
                    style={styles.fullImg}
                  />
                  <LinearGradient
                    colors={[
                      "transparent",
                      "rgba(0, 0, 0, 0)",
                      "rgba(0, 0, 0, 0.6)",
                    ]}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
                <View style={styles.detailsContainer}>
                  <View style={styles.tagRow}>
                    <View style={styles.statTag}>
                      <Image
                        source={ASSETS.homeItemCollectIcon}
                        style={styles.collectImg}
                      />
                      <Text style={styles.tagText}>{`${likes}k`}</Text>
                    </View>
                    <View style={styles.statTag}>
                      <Image
                        source={ASSETS.homeItemViewIcon}
                        style={styles.viewImg}
                      />
                      <Text style={styles.tagText}>{`${views}k`}</Text>
                    </View>
                  </View>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.header}
                  </Text>
                  <Text style={styles.description} numberOfLines={4}>
                    {item.overview || ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ),
);
RenderHotItem.displayName = "RenderHotItem";
RecommendSection.displayName = "RecommendSection";
BottomHorizontalSection.displayName = "BottomHorizontalSection";

export default function Home() {
  const [bannerList, setBannerList] = useState<Episode[]>([]);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [romance, setRomance] = useState<Episode[]>([]);
  const [romanceTitle, setRomanceTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdateDots] = useState(0);
  const activeIndexRef = useRef(0);

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);
  const indexRef = useRef(VIRTUAL_INITIAL_INDEX);
  const bannerListRef = useRef<Episode[]>([]);
  const scrollX = useRef(new Animated.Value(VIRTUAL_INITIAL_INDEX * BANNER_ITEM_WIDTH)).current;
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const dict = useDictionary();

  const virtualBannerData = useMemo(() => {
    return Array.from({ length: VIRTUAL_BANNER_COUNT }, (_, i) => i);
  }, []);

  const getRealIndex = useCallback((virtualIndex: number) => {
    const len = bannerListRef.current.length;
    if (len === 0) return 0;
    return ((virtualIndex % len) + len) % len;
  }, []);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (bannerListRef.current.length <= 1) return;
    timerRef.current = setInterval(() => {
      let nextIndex = indexRef.current + 1;
      
      // 边界检查：如果接近末尾，重置到中间位置
      if (nextIndex >= VIRTUAL_BANNER_COUNT - 1) {
        nextIndex = VIRTUAL_INITIAL_INDEX;
        indexRef.current = nextIndex;
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * BANNER_ITEM_WIDTH,
          animated: false,
        });
        return;
      }
      
      indexRef.current = nextIndex;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);
  }, [stopAutoplay]);

  const getList = useCallback(async (): Promise<boolean> => {
    try {
      await ensureLogin();
      setLoading(true);
      setError(null);
      const lang = await storage.getLanguage() || "en";
      const result = await episodeApi.getHomeLayoutTheatre("home", lang);
      const data = result.streamer || [];
      const banners = data.find((item: any) => item.kind === "home_carousel" && item.information);
      const romances: Episode[] = [];
      const romancesTitles: string[] = [];
      data.forEach((item: any) => {
        if (item.kind === "home_2_2" && item.information) {
          romances.push(...item.information);
          romancesTitles.push(item.header);
        }
      })
      setLayoutData(data)
      setBannerList(banners?.information || []);
      bannerListRef.current = banners?.information || [];
      setRomance(romances);
      setRomanceTitle(romancesTitles.join(", "));

      getUserInfo();
      return true;
    } catch (error) {
      console.error("Fetch home data failed:", error);
      setError("Failed to load content. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const success = await getList();

      if (!success && !cancelled) {
        const hasNetwork = await waitForNetwork();
        if (hasNetwork && !cancelled) {
          getList();
        }
      }
    })();

    return () => { cancelled = true; };
  }, [getList]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('LANGUAGE_CHANGED_EVENT', () => {
      getList();
    });
    return () => {
      subscription.remove();
    };
  }, [getList]);

  useEffect(() => {
    if (bannerList.length > 0) {
      const initialOffset = BANNER_ITEM_WIDTH * VIRTUAL_INITIAL_INDEX;
      scrollX.setValue(initialOffset);
    }
  }, [bannerList.length, scrollX]);

  useEffect(() => {
    if (bannerList.length > 0 && isFocused) {
      startAutoplay();
    }
    return () => stopAutoplay();
  }, [bannerList.length, startAutoplay, stopAutoplay, isFocused]);

  const handleItem = useCallback(
    (item: any) => {
      if (item?.code) {
        router.push(`/video/${item.code}`);
      }
    },
    [router],
  );

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      let index = Math.round(x / BANNER_ITEM_WIDTH);
      
      // 边界检查：如果接近边界，重置到中间位置
      if (index <= 10 || index >= VIRTUAL_BANNER_COUNT - 10) {
        const realIndex = getRealIndex(index);
        const newIndex = VIRTUAL_INITIAL_INDEX + realIndex;
        indexRef.current = newIndex;
        activeIndexRef.current = realIndex;
        flatListRef.current?.scrollToOffset({
          offset: newIndex * BANNER_ITEM_WIDTH,
          animated: false,
        });
        startAutoplay();
        return;
      }
      
      // 虚拟无限列表：通过取模获取真实显示索引
      const realIndex = getRealIndex(index);
      const needsDotsUpdate = activeIndexRef.current !== realIndex;
      
      activeIndexRef.current = realIndex;
      indexRef.current = index;

      if (needsDotsUpdate) {
        forceUpdateDots(prev => prev + 1);
      }
      startAutoplay();
    },
    [getRealIndex, startAutoplay],
  );

  // 使用原生驱动的滚动事件处理，确保动画流畅
  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
      ),
    [scrollX],
  );

  const renderBanner = () => {
    return (
      <View style={styles.bannerPanel}>
        <LinearGradient
          colors={["#8F020F", "rgba(143, 2, 15, 0)", "#000000"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerHeader}>
          <Image
            source={ASSETS.homeNameIcon}
            style={styles.glowReelText}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/store")}
          >
            <Image
              source={ASSETS.homeVipIcon}
              style={styles.vipIcon}
            />
          </TouchableOpacity>
          
        </View>
        <Animated.FlatList
          ref={flatListRef as any}
          data={virtualBannerData}
          keyExtractor={(_, i) => `banner-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={BANNER_CONTENT_CONTAINER_STYLE}
          snapToInterval={BANNER_ITEM_WIDTH}
          decelerationRate="fast"
          onScrollBeginDrag={stopAutoplay}
          onMomentumScrollEnd={handleScrollEnd}
          initialScrollIndex={bannerList.length > 0 ? VIRTUAL_INITIAL_INDEX : 0}
          getItemLayout={(_, index) => ({
            length: BANNER_ITEM_WIDTH,
            offset: BANNER_ITEM_WIDTH * index,
            index,
          })}
          removeClippedSubviews={Platform.OS === "android"}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          renderItem={({ index: virtualIndex }) => {
            // 通过虚拟索引获取真实数据
            const realIndex = getRealIndex(virtualIndex);
            const item = bannerList[realIndex];
            
            if (!item) return <View style={{ width: BANNER_ITEM_WIDTH }} />;

            const inputRange = [
              (virtualIndex - 1) * BANNER_ITEM_WIDTH,
              virtualIndex * BANNER_ITEM_WIDTH,
              (virtualIndex + 1) * BANNER_ITEM_WIDTH,
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.78, 1, 0.78],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.6, 1, 0.6],
              extrapolate: "clamp",
            });

            const playIconOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0, 1, 0],
              extrapolate: "clamp",
            });

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleItem(item)}
                style={{
                  width: BANNER_ITEM_WIDTH,
                  height: rem(606),
                  marginRight: 0,
                }}
              >
                <Animated.View
                  style={{
                    flex: 1,
                    transform: [{ scale }],
                    opacity,
                    borderRadius: rem(40),
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.bannerImg}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["rgba(4, 4, 4, 0)", "rgba(4, 4, 4, 0.6)"]}
                    style={styles.bannerBg}
                  />
                  <Animated.View
                    style={[
                      styles.playIconContainer,
                      { opacity: playIconOpacity },
                    ]}
                  >
                    <Image
                      source={ASSETS.homeBannerPlayIcon}
                      style={styles.playIconBanner}
                    />
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            );
          }}
        />
        <View style={styles.paginationContainer}>
          {bannerList.map((_, i) => (
            <View
              key={i}
              style={[
                styles.paginationDot,
                activeIndexRef.current === i && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#FFF" />
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getList}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (
    !bannerList.length &&
    !layoutData.length
  ) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{dict['no content']}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={() => null}
        keyExtractor={(_, i) => `hot-${i}`}
        numColumns={2}
        ListHeaderComponent={
          <>
            {renderBanner()}
            {layoutData?.map((item: any, index: number) => (
              <React.Fragment key={index}>
                {item.kind === "home_3_3" && (<RecommendSection list={item.information} title={item.header} onItemPress={handleItem} />)}
                {item.kind === "home_1_3" && (<RenderHotItem list={item.information} title={item.header} onItemPress={handleItem} />)}
              </React.Fragment>
            ))}
          </>
        }
        ListFooterComponent={
          <BottomHorizontalSection list={romance} title={romanceTitle} onItemPress={handleItem} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 65 }}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040404" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#040404",
  },
  errorText: {
    color: "#E0E0E0",
    fontSize: rem(28),
    marginBottom: rem(40),
    textAlign: "center",
    paddingHorizontal: rem(40),
  },
  retryButton: {
    backgroundColor: "#DF0016",
    paddingHorizontal: rem(60),
    paddingVertical: rem(24),
    borderRadius: rem(8),
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: rem(28),
    fontWeight: "600",
  },
  emptyText: {
    color: "#8E8E8E",
    fontSize: rem(28),
    textAlign: "center",
  },
  bannerPanel: { width: "100%", position: "relative", paddingTop: rem(50) },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rem(40),
    marginTop: rem(40),
    marginBottom: rem(40),
    zIndex: 10,
  },
  glowReelText: {
    width: rem(155),
    height: rem(31),
  },
  vipIcon: {
    width: rem(70),
    height: rem(64),
  },
  bannerImg: { width: "100%", height: "100%" },
  bannerBg: {
    width: '100%',
    height: rem(240),
    position: "absolute",
    left: 0,
    bottom: 0,
    zIndex: 1,
  },
  playIconContainer: {
    position: "absolute",
    bottom: rem(40),
    right: rem(40),
    width: rem(64),
    height: rem(64),
    borderRadius: rem(32),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  playIconBanner: {
    width: rem(64),
    height: rem(64),
    tintColor: "#FFF",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: rem(30),
    marginBottom: rem(20),
  },
  paginationDot: {
    width: rem(10),
    height: rem(10),
    borderRadius: rem(5),
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: rem(6),
  },
  paginationDotActive: {
    width: rem(36),
    backgroundColor: "#FFF",
  },
  recommendSection: { paddingHorizontal: rem(6) },
  gridRow: { flexDirection: "row", flexWrap: "wrap" },
  recomItem: { width: "33.33%", padding: rem(8) },
  imgContainer: { height: rem(295), borderRadius: 10, overflow: "hidden" },
  fullImg: { width: "100%", height: "100%" },
  recomTitle: { color: "#E0E0E0", fontSize: rem(24), marginTop: rem(12) },
  recomCategory: {
    color: "rgba(255,255,255,0.5)",
    fontSize: rem(24),
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: rem(36),
    fontWeight: "700",
    color: "#E0E0E0",
    paddingHorizontal: rem(10),
    marginBottom: rem(20),
  },
  hotItem: {
    width: "100%",
    flexDirection: "row",
    paddingLeft: rem(8),
    paddingRight: rem(8),
  },
  cardContainer: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: rem(20),
    paddingTop: rem(8),
  },
  imageWrapper: {
    width: rem(230),
    height: rem(304),
    alignSelf: "flex-start",
    borderRadius: rem(8),
    overflow: "hidden",
  },
  detailsContainer: {
    flex: 1,
    height: rem(304),
    padding: rem(24),
    paddingTop: 0,
  },
  tagRow: { flexDirection: "row", marginBottom: 8 },
  collectImg: { width: rem(28), height: rem(28), marginTop: rem(2) },
  viewImg: { width: rem(28), height: rem(28), marginTop: rem(2) },
  statTag: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: rem(24),
    paddingVertical: rem(8),
    borderRadius: rem(28),
    marginRight: rem(16),
  },
  tagText: {
    marginLeft: rem(8),
    color: "#E3E3E3",
    fontSize: rem(22),
    fontWeight: "500",
  },
  title: {
    color: "#E0E0E0",
    fontSize: rem(28),
    marginTop: rem(10),
    marginBottom: rem(16),
    fontWeight: "400",
  },
  description: { color: "#8E8E8E", fontSize: rem(26), lineHeight: rem(40) },
  bottomSection: { marginTop: rem(40), paddingBottom: rem(60) },
  bottomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rem(30),
    marginBottom: rem(24),
  },
  bottomTitle: { fontSize: rem(36), fontWeight: "bold", color: "#FFF" },
  bottomListContent: { paddingHorizontal: rem(30) },
  bottomGroup: { width: width - rem(110), marginRight: rem(24) },
  bottomItem: { flexDirection: "row", marginBottom: rem(30) },
  bottomImgWrapper: {
    width: rem(230),
    height: rem(304),
    borderRadius: rem(20),
    overflow: "hidden",
  },
  bottomItemInfo: {
    flex: 1,
    marginLeft: rem(24),
    paddingVertical: rem(12),
  },
  bottomItemTitle: {
    color: "#E3E3E3",
    fontSize: rem(28),
    fontWeight: "bold",
    lineHeight: rem(44),
    paddingTop: rem(28)
  },
  bottomItemDescription: {
    color: "#E3E3E380",
    fontSize: rem(26),
    lineHeight: rem(36),
    marginTop: rem(24),
  },
  bottomItemTag: {
    backgroundColor: "#262626",
    alignSelf: "flex-start",
    paddingHorizontal: rem(20),
    paddingVertical: rem(8),
    borderRadius: rem(30),
    marginTop: rem(16),
  },
  bottomItemTagText: { color: "#8E8E8E", fontSize: rem(22) },
});
