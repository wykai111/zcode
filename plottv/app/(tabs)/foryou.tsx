import { episodeApi } from "@/api/episodes";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { storage } from "@/utils/storage";
import { useDictionary } from "@/hooks/useDictionary";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  DeviceEventEmitter
} from "react-native";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get("window");
const { height: screenHeight } = Dimensions.get("screen");
const rem = (n: number) => n * (width / 750);

const ASSETS = {
  playIcon: require("../../assets/icons/icon_play.png"),
  followActiveIcon: require("../../assets/icons/icon_follow_active.png"),
  followIcon: require("../../assets/icons/icon_follow.png"),
  foryouEpisodesIcon: require("../../assets/icons/icon_foryou_episodes.png"),
};


interface Episode {
  block_key: number;
  area: string;
  rubric: string;
  outline: string;
  cherished: boolean;
  dossier_view_timestamp: number;
  cluster?: {
    unique_mark: number;
    block_key: number;
    installment_idx: number;
    area: string;
    allowance: number;
    range: number;
    outline: string;
    details: string;
    preview: string;
    watch_wave: string;
    dynamic_brook: string;
    watch_stats: number;
    entry: boolean;
    minutiae: string;
    intro: string;
  }[];
}

export default function ForYou() {
  const tabBarHeight = useBottomTabBarHeight();
  const TAB_BAR_HEIGHT = tabBarHeight - 1;
  const isFocused = useIsFocused();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const VIDEO_HEIGHT = screenHeight - TAB_BAR_HEIGHT;
  const flatListRef = useRef<FlashListRef<Episode>>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const dict = useDictionary();

  useEffect(() => {
    fetchData();
    const sub = DeviceEventEmitter.addListener('LANGUAGE_CHANGED_EVENT', () => {
      fetchData();
    });
    return () => sub.remove();
  }, []);


  const fetchData = async () => {
    try {
      setLoading(true);
      const lang = await storage.getLanguage() || "en";
      const result = await episodeApi.getForyouTheatre(lang);
      const data = result.endorsement_collection || [];
      setEpisodes(data);
    } catch (error) {
      console.error("Error fetching for you data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavored = useCallback(async (block_key: number) => {
    const lang = await storage.getLanguage() || "en";
    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.block_key === block_key) {
          const newFavored = !ep.cherished;
          if (newFavored) {
            episodeApi.favoredEpisode(block_key.toString(), lang);
          } else {
            episodeApi.unfavoredEpisode(block_key.toString(), lang);
          }
          return { ...ep, cherished: newFavored };
        }
        return ep;
      })
    );
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setHasStartedPlaying(false);
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const episodesLengthRef = useRef(episodes.length);
  episodesLengthRef.current = episodes.length;

  const handlePlayEnd = useCallback(() => {
    setActiveIndex((prev) => {
      const next = prev + 1;
      if (next < episodesLengthRef.current) {
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      }
      return prev;
    });
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;


  const renderItem = useCallback(({ item, index }: { item: Episode; index: number }) => (
    <VideoItem
      item={item}
      isActive={index === activeIndex}
      isFocused={isFocused}
      isNear={Math.abs(index - activeIndex) <= 1}
      hasStartedPlaying={hasStartedPlaying}
      onSetHasStartedPlaying={setHasStartedPlaying}
      onOpenDialog={() => router.push(`/video/${item.block_key}?index=1&openEpisodeDialog=true`)}
      onToggleFavored={() => handleToggleFavored(item.block_key)}
      videoHeight={VIDEO_HEIGHT}
      onPlayEnd={handlePlayEnd}
      dict={dict}
    />
  ), [activeIndex, isFocused, hasStartedPlaying, handleToggleFavored, VIDEO_HEIGHT, handlePlayEnd, dict]);

  const listFooter = useMemo(() => <View style={{ height: TAB_BAR_HEIGHT }} />, [TAB_BAR_HEIGHT]);

  if (loading && episodes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FFF" />
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

        <FlashList
          ref={flatListRef}
          data={episodes}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.block_key}-${index}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={VIDEO_HEIGHT}
          drawDistance={VIDEO_HEIGHT}
          snapToAlignment="start"
          decelerationRate={Platform.OS === 'ios' ? 'fast' : 'normal'}
          disableIntervalMomentum={true}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListFooterComponent={listFooter}
        />
    </View>
  );
}

const VideoItem = React.memo(({
  item,
  isActive,
  isFocused,
  isNear,
  hasStartedPlaying,
  onSetHasStartedPlaying,
  onOpenDialog,
  onToggleFavored,
  videoHeight,
  dict,
  onPlayEnd,
}: {
  item: Episode;
  isActive: boolean;
  isFocused: boolean;
  isNear: boolean;
  hasStartedPlaying: boolean;
  onSetHasStartedPlaying: (hasStartedPlaying: boolean) => void;
  onOpenDialog: (block_key: number) => void;
  onToggleFavored: () => void;
  onPlayEnd: () => void;
  videoHeight: number;
  dict: Record<string, string>;
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [duration, setDuration] = useState(item.cluster?.[0]?.range || 0);
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  const videoUrl =
    item.cluster?.[0]?.watch_wave || item.cluster?.[0]?.dynamic_brook || "";

  const videoSource = React.useMemo(() => {
    if (!isNear) return null;
    return {
      uri: videoUrl,
      metadata: { artwork: item.cluster?.[0]?.intro || undefined },
    };
  }, [videoUrl, item.cluster, isNear]);

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.timeUpdateEventInterval = 0.3;
    setVideoLoading(true);
    if (isActive && isFocused && videoUrl) {
      player.play();
    }
  });

  useEffect(() => {
    if (!player || !isActive || !isFocused) return;

    const statusSub = player.addListener(
      "statusChange",
      ({ status }) => {
        if (status === "readyToPlay") {
          setVideoLoading(false);
        } else {
          setVideoLoading(true);
        }
      },
    );
    const playChangeSub = player.addListener("playingChange", (event) => {
      setIsPlaying(event.isPlaying);
      const newDuration = player.duration;
      if (newDuration !== duration && newDuration > 0) {
        setDuration(newDuration);
      }
      if (event.isPlaying) {
        setVideoLoading(false);
      }
      if (event.isPlaying && !hasStartedPlaying) {
        onSetHasStartedPlaying(true)
        storage.getLanguage().then(lang => {
          episodeApi.beginPlayEpisode(item.block_key.toString(), 1, lang || "en");
        });
      }
    });
    const playToEndSub = player.addListener("playToEnd", () => {
      onPlayEnd();
      storage.getLanguage().then(lang => {
        episodeApi.endPlayEpisode(item.block_key.toString(), 1, lang || "en");
      });
    });
    return () => {
      statusSub.remove();
      playChangeSub.remove();
      playToEndSub.remove();
    };
  }, [isActive, isFocused, player, duration, item.block_key, hasStartedPlaying, onPlayEnd, onSetHasStartedPlaying]);

  useEffect(() => {
    if (isActive && isFocused && player) {
      if (!isUserPaused) {
        player.play();
      }
    } else {
      player.pause();
      if (!isActive) {
        player.currentTime = 0;
        setIsUserPaused(false);
      }
    }
  }, [isActive, isFocused, player, isUserPaused]);

  const handlePlayPause = () => {
    if (player.playing) {
      player.pause();
      setIsUserPaused(true);
    } else {
      player.play();
      setIsUserPaused(false);
    }
  };

  const openEpisodeDialog = () => {
    onOpenDialog(item.block_key);
  }

  const handleFavored = () => {
    onToggleFavored();
  };

  return (
    <View style={[styles.videoItemContainer, { height: videoHeight }]}>
      {isNear ? (
        <VideoView
          player={player}
          style={styles.fullScreen}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: item.cluster?.[0]?.preview }}
          style={styles.fullScreen}
          contentFit="cover"
        />
      )}

      {isNear && !isPlaying && !videoLoading && (
        <View style={styles.playIconContainer} pointerEvents="none">
          <Image
            source={ASSETS.playIcon}
            style={styles.largePlayIcon}
          />
        </View>
      )}

      {isNear && videoLoading && (
        <View style={styles.videoLoadingContainer}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
        style={styles.bottomOverlay}
        pointerEvents="none"
      />

      <View style={styles.controlBox} pointerEvents="box-none">
        <View style={styles.followBox}>
          <TouchableOpacity style={styles.followAction} activeOpacity={0.7} onPress={handleFavored}>
            <Image
              source={item.cherished ? ASSETS.followActiveIcon : ASSETS.followIcon}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>{dict['Follow'] || 'Follow'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.speedAction}
            activeOpacity={0.7}
            onPress={openEpisodeDialog}
          >
            <Image
              source={ASSETS.foryouEpisodesIcon}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>{dict['Episodes'] || 'Episodes'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlLine} pointerEvents="box-none">
          <Text
            style={styles.videoTitle}
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            {item.rubric}
          </Text>
          <View style={{ position: "relative" }}>
            <Text
              style={styles.videoDesc}
              numberOfLines={expanded ? undefined : 2}
              ellipsizeMode="clip"
              onTextLayout={(e) => {
                setIsTruncated(e.nativeEvent.lines.length > 2);
              }}
              onPress={() => setExpanded(false)}
            >
              {item.outline}
            </Text>
            {isTruncated && !expanded && (
              <Text style={styles.moreText} onPress={() => setExpanded(true)}>
                ... More
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.episodesTab} activeOpacity={0.8} onPress={() => router.push(`/video/${item.block_key}?index=1`)}>
            <Text style={styles.watchNowText}>Watch Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableWithoutFeedback onPress={handlePlayPause}>
        <View style={styles.fullScreenPressable} />
      </TouchableWithoutFeedback>
    </View>
  );
});

VideoItem.displayName = "VideoItem";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040404",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#040404",
    justifyContent: "center",
    alignItems: "center",
  },
  videoItemContainer: {
    width: width,
  },
  videoPressable: {
    flex: 1,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  fullScreenPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  videoLoadingContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  largePlayIcon: {
    width: rem(112),
    height: rem(112),
    opacity: 0.8,
  },
  controlBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 10,
  },
  bottomOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  followBox: {
    position: "absolute",
    right: rem(24),
    bottom: rem(360),
    zIndex: 10,
  },
  followAction: {
    alignItems: "center",
    marginBottom: rem(24),
  },
  speedAction: {
    alignItems: "center",
  },
  actionIcon: {
    width: rem(56),
    height: rem(56),
    marginBottom: rem(12),
  },
  actionText: {
    color: "#fff",
    fontSize: rem(22),
    fontFamily: Platform.OS === "ios" ? "System" : "MiSansLatin-Medium",
  },
  controlLine: {
    width: "70%",
    paddingLeft: rem(24),
    zIndex: 9,
  },
  episodesTab: {
    width: rem(500),
    height: rem(72),
    marginTop: rem(24),
    marginBottom: rem(24),
    borderRadius: rem(24),
    backgroundColor: "#FFFFFF66",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  watchNowText: {
    fontSize: rem(28),
    color: "#fff",
  },
  tabContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rem(24),
  },
  epIcon: {
    width: rem(30),
    height: rem(30),
    marginRight: rem(6),
  },
  epText: {
    color: "#fff",
    fontSize: rem(22),
    paddingHorizontal: rem(4),
  },
  epSeparator: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: rem(22),
    paddingHorizontal: rem(4),
  },
  epTotal: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: rem(22),
    paddingHorizontal: rem(4),
  },
  epDot: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: rem(22),
    paddingHorizontal: rem(4),
  },
  videoTitle: {
    color: "#fff",
    fontSize: rem(30),
  },
  videoDesc: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: rem(24),
    marginTop: rem(10),
  },
  moreText: {
    color: "#fff",
    fontSize: rem(24),
    zIndex: 10,
  },
  arrowIcon: {
    width: rem(48),
    height: rem(48),
    position: "absolute",
    right: 0,
  },
  episodeLoading: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalContainer: {
    flex: 1,
  },
  modalMask: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dialogBox: {
    height: '50%',
    width: "100%",
    backgroundColor: "#13161D",
    borderTopLeftRadius: rem(24),
    borderTopRightRadius: rem(24),
    overflow: "hidden",
  },
  dialogHeader: {
    padding: rem(24),
    paddingBottom: 0,
  },
  dialogHeaderTop: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: rem(12),
  },
  episodeDialogTitle: {
    color: "#fff",
    fontSize: rem(28),
  },
  dialogTitle: {
    color: "#fff",
    fontSize: rem(38),
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    right: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rem(10),
  },
  closeIcon: {
    width: rem(48),
    height: rem(48),
  },
  epCountText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: rem(24),
    marginBottom: rem(24),
  },
  synopsisTab: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  tabItem: {
    paddingVertical: rem(24),
    marginRight: rem(30),
    position: "relative",
  },
  tabText: {
    color: "#fff",
    fontSize: rem(30),
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFB02",
  },
  tabActiveIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: rem(4),
    backgroundColor: "#FFFB02",
  },
  episodeList: {
    padding: rem(32),
  },
  activeEpisodeItem: {
    backgroundColor: "#EE0000",
  },
  episodeItemText: {
    color: "#fff",
    fontSize: rem(28),
    fontWeight: "500",
  },
  activeEpisodeItemText: {
    display: "none",
  },
  synopsisPanel: {
    padding: rem(32),
  },
  synopsisText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: rem(24),
    lineHeight: rem(36),
  },
  activeIndicator: {
    width: rem(40),
    height: rem(4),
    backgroundColor: "#fff",
    borderRadius: rem(2),
    marginTop: rem(10),
  },
  dialogBody: {
    flex: 1,
    paddingHorizontal: rem(30),
    paddingTop: rem(10),
  },
  descriptionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: rem(24),
    lineHeight: rem(36),
  },
  episodeGrid: {
    paddingBottom: rem(40),
  },
  episodeItem: {
    width: (width - rem(60) - 5 * rem(24)) / 6,
    height: (width - rem(60) - 5 * rem(24)) / 6,
    backgroundColor: "#202531",
    borderRadius: rem(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: rem(24),
    marginBottom: rem(24),
    position: "relative",
    borderWidth: 1,
    borderColor: "#202531",
  },
  activeEpIcon: {
    alignContent: "center",
    alignItems: "center",
    width: rem(36),
    height: rem(44),
  },
  lockIconContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EE0000",
    width: rem(32),
    height: rem(32),
    borderTopRightRadius: rem(12),
    borderBottomLeftRadius: rem(6),
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    width: rem(24),
    height: rem(24),
  },
});
