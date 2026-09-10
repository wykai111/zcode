import { episodeApi } from "@/api/episodes";
import { loginApi } from "@/api/login";
import SKU from "@/components/sku";
import { useIsFocused } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useScreenProtection } from "@/hooks/useScreenProtection";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { storage } from "@/utils/storage";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Adjust, AdjustEvent } from 'react-native-adjust';
import { ADJUST_EVENT_PAY_DIALOG_PV, ADJUST_EVENT_PAY_DIALOG_UV, ADJUST_EVENT_Paywalls_Retention_PV, ADJUST_EVENT_Paywalls_Retention_UV } from "@/constants/adjust";
import RetentionModal from "@/components/RetentionModal";
import { MergedProduct, useIAPContext } from "@/hooks/useIAP";
import { useDictionary } from "@/hooks/useDictionary";

const { width } = Dimensions.get("window");
const { height: screenHeight } = Dimensions.get("screen");
const rem = (n: number) => n * (width / 750);

interface VideoPart {
  block_key: number;
  installment_idx: number;
  area: string;
  agree_figure: number;
  perks: number;
  allowance: number;
  range: number;
  outline: string;
  minutiae: string;
  details: string;
  intro: string;
  watch_wave: string;
  dynamic_brook: string;
  watch_stats: number;
  entry: boolean;
  unlocked?: boolean; // Custom field for UI
}

interface Drama {
  block_key: number;
  area: string;
  rubric: string;
  minutiae: string;
  cherished: boolean;
  dossier_view_timestamp: number;
  cluster?: VideoPart[];
  balance?: number;
  bonus?: number
}

const formatTime = (s: number) => {
  const time = Math.max(0, s);
  const m = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const ASSETS = {
  iconArrowLeft: require("../../assets/icons/icon_arrow_left.png"),
  iconClose: require("../../assets/icons/icon_close.png"),
  iconCoins: require("../../assets/icons/icon_coins.png"),
  iconBouns: require("../../assets/icons/icon_bouns.png"),
  iconLike: require("../../assets/icons/icon_like.png"),
  iconFollowActive: require("../../assets/icons/icon_follow_active.png"),
  iconFollow: require("../../assets/icons/icon_follow.png"),
  iconForyouEpisodes: require("../../assets/icons/icon_foryou_episodes.png"),
  iconPlay: require("../../assets/icons/icon_play.png"),
  iconEpisodesClose: require("../../assets/icons/icon_episodes_close.png"),
  iconLock: require("../../assets/icons/icon_lock.png"),
  iconEpisodesActiveBg: require("../../assets/icons/icon_episodes_active_bg.png"),
  iconShare: require("../../assets/icons/icon_user_id_copy.png"),
  iconVip: require("../../assets/icons/icon_payDialog_video_vip.png"),
};

export default function VideoPage() {
  const { id, index, openEpisodeDialog } = useLocalSearchParams<{ id: string; index?: string; openEpisodeDialog?: string }>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { isRecording } = useScreenProtection();
  const [drama, setDrama] = useState<Drama | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(parseInt(index || "1") - 1);
  const [showEpisodeDialog, setShowEpisodeDialog] = useState(openEpisodeDialog === "true");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showControl, setShowControl] = useState(true);
  const controlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userCash, setUserCash] = useState<any>(null);
  const [autoUnlock, setAutoUnlock] = useState(false);
  const flatListRef = useRef<FlashListRef<VideoPart>>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const isUnlockingRef = useRef(false);
  const pendingEpisodeRef = useRef<number | null>(null);
  const [payDialogData, setPayDialogData] = useState<any>(null);
  const { setOnUserCancelled } = useIAPContext();
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

  const watchTimeRef = useRef(0);
  const hasStartedPlayingRef = useRef(false);
  const endEventFiredRef = useRef(false);
  const dramaRef = useRef<Drama | null>(null);
  const activeIndexRef = useRef(activeIndex);
  dramaRef.current = drama;
  activeIndexRef.current = activeIndex;

  const resetControlTimer = useCallback((isPlaying: boolean = true) => {
    if (controlTimer.current) clearTimeout(controlTimer.current);
    if (isPlaying) {
      controlTimer.current = setTimeout(() => {
        setShowControl(false);
      }, 2000);
    } else {
      setShowControl(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const lang = await storage.getLanguage() || "en";
      const result = await episodeApi.getEpisodeDetail(id, lang as string);
      setDrama(result);

      if (index) {
        const idx = parseInt(index) - 1;
        setActiveIndex(idx);
      }
    } catch (error) {
      console.error("Error fetching drama data:", error);
    } finally {
      setLoading(false);
    }
  }, [id, index]);

  const refreshDrama = useCallback(async () => {
    if (!id) return;
    try {
      const lang = await storage.getLanguage() || "en";
      const result = await episodeApi.getEpisodeDetail(id, lang as string);
      setDrama(result);
    } catch (error) {
      console.error("Error refreshing drama data:", error);
    }
  }, [id]);

  const getUserCash = useCallback(async () => {
    try {
      const result = await loginApi.getUserCash();
      setUserCash(result);
      setAutoUnlock(result?.machine_admission_setup || false);
    } catch (err) {
      console.warn('[VideoPage] Failed to fetch user cash:', err);
    }
  }, []);

  const getPayDialogVideos = useCallback(async () => {
    try {
      const result = await episodeApi.getPayDialogProducts();
      setPayDialogData(result);
    } catch (err) {
      console.warn('[VideoPage] Failed to fetch pay dialog videos:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    getUserCash();
    getPayDialogVideos();
  }, [fetchData, getUserCash, getPayDialogVideos]);

  useEffect(() => {
    setOnUserCancelled((product: MergedProduct) => {
      if (!globalSwitch?.trigger_paywall) {
        return;
      }
      setRetentionProduct(product);
      setShowRetentionModal(true);
      const retentionEventPv = new AdjustEvent(ADJUST_EVENT_Paywalls_Retention_PV);
      const retentionEventUv = new AdjustEvent(ADJUST_EVENT_Paywalls_Retention_UV);
      Adjust.trackEvent(retentionEventPv);
      Adjust.trackEvent(retentionEventUv);
    });
    return () => setOnUserCancelled(null);
  }, [setOnUserCancelled, globalSwitch]);

  useEffect(() => {
    return () => {
      if (controlTimer.current) {
        clearTimeout(controlTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    endEventFiredRef.current = false;
    watchTimeRef.current = 0;
    hasStartedPlayingRef.current = false;
  }, [activeIndex]);


  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setHasStartedPlaying(false);
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleEpisodeSelect = (part: VideoPart) => {
    if (!part.entry) {
      if (userCash && (userCash.perks + userCash.allowance) > 0 && (userCash.perks + userCash.allowance) >= part.allowance) {
        const newIndex = part.installment_idx - 1;
        setActiveIndex(newIndex);
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: false });
        handleUnlockEpisode(newIndex);
        setShowEpisodeDialog(false);
        return;
      }
      pendingEpisodeRef.current = part.installment_idx - 1;
      setShowEpisodeDialog(false);
      setShowPayDialog(true);
      const payDialogEventPv = new AdjustEvent(ADJUST_EVENT_PAY_DIALOG_PV);
      const payDialogEventUv = new AdjustEvent(ADJUST_EVENT_PAY_DIALOG_UV);
      Adjust.trackEvent(payDialogEventPv);
      Adjust.trackEvent(payDialogEventUv);
    } else {
      setShowEpisodeDialog(false);
      const newIndex = part.installment_idx - 1;
      setActiveIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: false });
    }
  };

  useEffect(() => {
    setShowControl(true);
    if (controlTimer.current) {
      clearTimeout(controlTimer.current);
      controlTimer.current = null;
    }
  }, [activeIndex]);

  const episodes = React.useMemo(() => drama?.cluster || [], [drama]);

  const episodesLengthRef = useRef(episodes.length);
  episodesLengthRef.current = episodes.length;

  const onPlayEnd = useCallback(() => {
    setActiveIndex((prev) => {
      const next = prev + 1;
      if (next < episodesLengthRef.current) {
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      }
      return prev;
    });
  }, []);

  const handleCurrentTimeUpdate = useCallback((time: number) => {
    watchTimeRef.current = time;
  }, []);

  const handleToggleFavored = useCallback(async () => {
    if (!drama) return;
    const newFavored = !drama.cherished;
    setDrama({ ...drama, cherished: newFavored });
    try {
      const lang = await storage.getLanguage() || "en";
      if (newFavored) {
        await episodeApi.favoredEpisode(drama.block_key.toString(), lang as string);
      } else {
        await episodeApi.unfavoredEpisode(drama.block_key.toString(), lang as string);
      }
    } catch (error) {
      console.error("Error toggling favored:", error);
      setDrama({ ...drama, cherished: !newFavored });
    }
  }, [drama]);

  const handleUnlockEpisode = useCallback(async (indexToUnlock?: number) => {
    if (!drama || !isFocused || isUnlockingRef.current) return;
    const targetIndex = indexToUnlock !== undefined ? indexToUnlock : activeIndex;
    const currentEpisode = episodes[targetIndex];
    if (!currentEpisode || currentEpisode.entry) return;

    try {
      isUnlockingRef.current = true;
      const lang = await storage.getLanguage() || "en";
      const result = await episodeApi.unlockEpisode(
        drama.block_key.toString(),
        lang as string,
        currentEpisode.installment_idx
      );

      if (result) {
        setDrama((prev) => {
          if (!prev || !prev.cluster) return prev;
          const newCluster = prev.cluster.map((ep) => {
            // Find the episode to update, using installment_idx from response or current one
            if (ep.installment_idx === (result.installment_idx || currentEpisode.installment_idx)) {
              return {
                ...ep,
                entry: true,
                watch_wave: result.watch_wave || ep.watch_wave,
                dynamic_brook: result.dynamic_brook || ep.dynamic_brook,
              };
            }
            return ep;
          });
          return { ...prev, cluster: newCluster };
        });
        
        // Close pay dialog and refresh user cash balance
        setShowPayDialog(false);
        getUserCash();
      }
    } catch (error) {
      console.error("Error unlocking episode:", error);
    } finally {
      isUnlockingRef.current = false;
    }
  }, [drama, activeIndex, episodes, getUserCash, isFocused]);

  useEffect(() => {
    if (!isFocused || !drama || episodes.length === 0 || isUnlockingRef.current) return;
    const currentEpisode = episodes[activeIndex];
    if (currentEpisode && !currentEpisode.entry) {
      if (autoUnlock) {
        if (userCash && (userCash.perks + userCash.allowance) > 0 && userCash.perks + userCash.allowance >= currentEpisode.allowance) {
          handleUnlockEpisode(activeIndex);
          return;
        }
      } else {
        if (userCash && (userCash.perks + userCash.allowance) > 0 && userCash.perks + userCash.allowance >= currentEpisode.allowance) {
          return;
        }
      }
      pendingEpisodeRef.current = activeIndex;
      setShowPayDialog(true);
      const payDialogEventPv = new AdjustEvent(ADJUST_EVENT_PAY_DIALOG_PV);
      const payDialogEventUv = new AdjustEvent(ADJUST_EVENT_PAY_DIALOG_UV);
      Adjust.trackEvent(payDialogEventPv);
      Adjust.trackEvent(payDialogEventUv);
      if (activeIndex > 0) {
        const prevIndex = activeIndex - 1;
        setActiveIndex(prevIndex);
        flatListRef.current?.scrollToIndex({
          index: prevIndex,
          animated: false,
        });
      }
    }
  }, [activeIndex, drama, isFocused, episodes, autoUnlock, userCash, handleUnlockEpisode]);

  const handlePurchaseSuccess = useCallback(async () => {
    setShowPayDialog(false);

    const pendingIndex = pendingEpisodeRef.current;
    pendingEpisodeRef.current = null;

    if (pendingIndex === null || !id) {
      getUserCash();
      refreshDrama();
      return;
    }

    try {
      const lang = await storage.getLanguage() || "en";
      const [cashResult, dramaResult] = await Promise.all([
        loginApi.getUserCash(),
        episodeApi.getEpisodeDetail(id, lang as string),
      ]);

      if (cashResult) {
        setUserCash(cashResult);
        setAutoUnlock(cashResult.machine_admission_setup || false);
      }
      if (dramaResult) {
        setDrama(dramaResult);
      }

      const pendingEpisode = dramaResult?.cluster?.[pendingIndex];
      if (!pendingEpisode) return;

      if (pendingEpisode.entry) {
        setActiveIndex(pendingIndex);
        flatListRef.current?.scrollToIndex({ index: pendingIndex, animated: false });
      } else if (cashResult && (cashResult.perks + cashResult.allowance) > 0 && (cashResult.perks + cashResult.allowance) >= pendingEpisode.allowance) {
        isUnlockingRef.current = true;
        setActiveIndex(pendingIndex);
        flatListRef.current?.scrollToIndex({ index: pendingIndex, animated: false });
        try {
          const result = await episodeApi.unlockEpisode(
            dramaResult.block_key.toString(),
            lang as string,
            pendingEpisode.installment_idx
          );
          if (result) {
            setDrama((prev) => {
              if (!prev || !prev.cluster) return prev;
              const newCluster = prev.cluster.map((ep) => {
                if (ep.installment_idx === (result.installment_idx || pendingEpisode.installment_idx)) {
                  return {
                    ...ep,
                    entry: true,
                    watch_wave: result.watch_wave || ep.watch_wave,
                    dynamic_brook: result.dynamic_brook || ep.dynamic_brook,
                  };
                }
                return ep;
              });
              return { ...prev, cluster: newCluster };
            });
            getUserCash();
          }
        } catch (error) {
          console.error("Error unlocking episode after purchase:", error);
        } finally {
          isUnlockingRef.current = false;
        }
      }
    } catch (error) {
      console.error("Error handling purchase success:", error);
      getUserCash();
      refreshDrama();
    }
  }, [id, getUserCash, refreshDrama]);

  const renderItem = useCallback(({ item, index }: { item: VideoPart; index: number }) => (
    <VideoItem
      item={item}
      drama={drama}
      isActive={index === activeIndex}
      isFocused={isFocused}
      isNear={Math.abs(index - activeIndex) <= 1}
      onOpenEpisodeDialog={() => setShowEpisodeDialog(true)}
      onToggleFavored={handleToggleFavored}
      videoHeight={screenHeight}
      showControl={showControl}
      showPayDialog={showPayDialog}
      isRecording={isRecording}
      hasStartedPlaying={hasStartedPlaying}
      autoUnlock={autoUnlock}
      dict={dict}
      onSetHasStartedPlaying={setHasStartedPlaying}
      onResetControlTimer={resetControlTimer}
      onPlayEnd={onPlayEnd}
      handleUnlockEpisode={handleUnlockEpisode}
      onCurrentTimeUpdate={handleCurrentTimeUpdate}
    />
  ), [activeIndex, isFocused, drama, handleToggleFavored, showControl, showPayDialog, isRecording, hasStartedPlaying, resetControlTimer, onPlayEnd, handleUnlockEpisode, autoUnlock, handleCurrentTimeUpdate, dict]);

  if (loading) {
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

      {episodes.length > 0 && (
        <FlashList
          ref={flatListRef}
          data={episodes}
          renderItem={renderItem}
          keyExtractor={(item, idx) => `${item.block_key}-${idx}`}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate={Platform.OS === 'ios' ? 'fast' : 'normal'}
          drawDistance={screenHeight}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={activeIndex > 0 ? activeIndex : 0}
          snapToInterval={screenHeight}
          disableIntervalMomentum={true}
        />
      )}

      {showControl && (
        <View style={[styles.backContainer, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.8)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Image
              source={ASSETS.iconArrowLeft}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <View style={styles.dramaHeader}>
            <Text style={styles.dramaTitle} numberOfLines={1}>
              {drama?.rubric}
            </Text>
            <Text style={styles.dramaEpisode}>
              {"Episode"}
              {activeIndex + 1}
              {"/"}
              {episodes.length}
            </Text>
          </View>
        </View>
      )}

      <EpisodeDialog
        visible={showEpisodeDialog}
        onClose={() => setShowEpisodeDialog(false)}
        drama={drama}
        episodes={episodes}
        activeIndex={activeIndex}
        onSelectEpisode={handleEpisodeSelect}
      />

      <PayDialog
        visible={showPayDialog}
        drama={drama}
        userCash={userCash}
        payDialogData={payDialogData}
        onClose={() => {
          setShowPayDialog(false);
          setShowRetentionModal(false);
          setRetentionProduct(null);
          pendingEpisodeRef.current = null;
        }}
        onPurchaseSuccess={handlePurchaseSuccess}
        showRetentionModal={showRetentionModal}
        retentionProduct={retentionProduct}
        onRetentionClose={() => {
          setShowRetentionModal(false);
          setRetentionProduct(null);
        }}
        onRetentionPurchaseSuccess={() => {
          setShowRetentionModal(false);
          setRetentionProduct(null);
          handlePurchaseSuccess();
        }}
      />
    </View>
  );
}

const VideoItem = React.memo(({
  item,
  drama,
  isActive,
  isFocused,
  isNear,
  onOpenEpisodeDialog,
  onToggleFavored,
  videoHeight,
  showControl,
  showPayDialog,
  isRecording,
  hasStartedPlaying,
  autoUnlock,
  dict,
  onSetHasStartedPlaying,
  onResetControlTimer,
  onPlayEnd,
  handleUnlockEpisode,
  onCurrentTimeUpdate,
}: {
  item: VideoPart;
  drama: Drama | null;
  isActive: boolean;
  isFocused: boolean;
  isNear: boolean;
  onOpenEpisodeDialog: () => void;
  onToggleFavored: () => void;
  videoHeight: number;
  showControl: boolean;
  showPayDialog: boolean;
  isRecording: boolean;
  hasStartedPlaying: boolean;
  autoUnlock: boolean;
  onSetHasStartedPlaying: (hasStartedPlaying: boolean) => void;
  onResetControlTimer: (isPlaying?: boolean) => void;
  onPlayEnd: () => void;
  handleUnlockEpisode: (installment_idx: number) => void;
  onCurrentTimeUpdate: (time: number) => void;
  dict: any;
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.range || 0);
  const [showSpeedBox, setShowSpeedBox] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [videoLoading, setVideoLoading] = useState(false);

  const videoUrl = item.watch_wave || item.dynamic_brook || "";
  
  const videoSource = React.useMemo(() => {
    if (!isNear || !videoUrl) return null;
    return {
      uri: videoUrl,
      metadata: { artwork: item.intro || undefined },
    };
  }, [videoUrl, item.intro, isNear]);

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
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
    const timeUpdateSub = player.addListener("timeUpdate", (event) => {
      setCurrentTime(event.currentTime);
      if (player.duration > 0) setDuration(player.duration);
      if (isActive) onCurrentTimeUpdate(event.currentTime);
    });

    const playingSub = player.addListener("playingChange", (event) => {
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) {
        setVideoLoading(false);
      }
      if (event.isPlaying && !showSpeedBox) {
        onResetControlTimer(true);
      }
      if (event.isPlaying && !hasStartedPlaying) {
        onSetHasStartedPlaying(true);
        storage.getLanguage().then(lang => {
          episodeApi.beginPlayEpisode(item.block_key.toString(), item.installment_idx, (lang || "en") as string);
        });
      }
    });

    const playToEndSub = player.addListener("playToEnd", () => {
      onPlayEnd();
      storage.getLanguage().then(lang => {
        episodeApi.endPlayEpisode(item.block_key.toString(), item.installment_idx, (lang || "en") as string);
      });
    });

    return () => {
      statusSub.remove();
      timeUpdateSub.remove();
      playingSub.remove();
      playToEndSub.remove();
    };
  }, [
    isActive,
    isFocused,
    player,
    videoLoading,
    onResetControlTimer,
    onPlayEnd,
    showSpeedBox,
    item.block_key,
    item.installment_idx,
    hasStartedPlaying,
    onSetHasStartedPlaying,
    onCurrentTimeUpdate,
  ]);

  useEffect(() => {
    const isLocked = !item.entry;
    if (isActive && isFocused && player && !isLocked && !showPayDialog && !isRecording) {
      if (player.duration > 0 && player.currentTime >= player.duration) {
        player.currentTime = 0;
        setCurrentTime(0);
      }
      player.play();
    } else if (player) {
      player.pause();
    }
  }, [
    isActive,
    isFocused,
    player,
    item.installment_idx,
    item.entry,
    showPayDialog,
    isRecording,
  ]);

  const handlePlayPause = () => {
    if (!showControl) {
      onResetControlTimer(false);
      setTimeout(() => {
        onResetControlTimer(true);
      }, 50);
      return;
    }
    if (!player) return;
    if (player.playing) {
      onResetControlTimer(false);
      player.pause();
      setIsPlaying(false);
    } else {
      if (!showSpeedBox) {
        onResetControlTimer(true);
      }
      player.play();
      setIsPlaying(true);
    }
    if (showSpeedBox) {
      setShowSpeedBox(false);
    }
  };

  const handleProgressPress = (e: any) => {
    const { locationX } = e.nativeEvent;
    if (duration > 0) {
      const seekTime = (locationX / width) * duration;
      player.currentTime = seekTime;
      setVideoLoading(true);
    }
  };

  const handleSpeed = (speed: number) => {
    setSpeed(speed);
    setShowSpeedBox(false);
    player.playbackRate = speed;
    onResetControlTimer(true);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.videoItem, { height: videoHeight }]}>
      {isNear && item.entry ? (
        <>
          <Image
            source={{ uri: item.intro }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <VideoView
            key={videoUrl}
            player={player}
            style={[StyleSheet.absoluteFill, { opacity: videoLoading ? 0 : 1 }]}
            contentFit="cover"
            nativeControls={false}
          />
        </>
      ) : !item.entry && !autoUnlock ? <View style={styles.unlockContainer}>
        <TouchableWithoutFeedback onPress={() => handleUnlockEpisode(item.installment_idx - 1)}>
          <Text style={styles.unlockText}>Unlock to watch</Text>
        </TouchableWithoutFeedback>
      </View>: ( 
          <Image
            source={{ uri: item.intro }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}

      <TouchableWithoutFeedback onPress={handlePlayPause}>
        <View style={StyleSheet.absoluteFill}>
          {isNear && !isPlaying && !videoLoading && (
            <View style={styles.playOverlay}>
              <Image
                source={ASSETS.iconPlay}
                style={styles.playIcon}
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
      {isNear && videoLoading && (
        <View style={styles.videoLoadingContainer} pointerEvents="none">
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        {showControl && (
          <>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.bottomOverlay}
              pointerEvents="none"
            />

            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={onToggleFavored}>
                <Image
                  source={drama?.cherished ? ASSETS.iconFollowActive : ASSETS.iconFollow}
                  style={styles.actionIcon}
                />
                <Text style={styles.actionText}>
                  {dict['Follow'] || 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={onOpenEpisodeDialog}
              >
                <Image
                  source={ASSETS.iconForyouEpisodes}
                  style={styles.actionIcon}
                />
                <Text style={styles.actionText}>
                  {dict['Episodes'] || 'Episodes'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showControl && (
          <View style={styles.bottomControls}>
            <View style={styles.progressTimeBox}>
              <Text style={styles.progressTimeText}>
                {formatTime(currentTime)}
              </Text>
              <Text style={styles.progressTimeText}>{formatTime(duration)}</Text>
            </View>
            <Pressable
              style={styles.progressBarContainer}
              onPress={handleProgressPress}
            >
              <View style={styles.progressBarBackground}>
                <View
                  style={[styles.progressBarFill, { width: `${progress}%` }]}
                />
              </View>
            </Pressable>
            <Pressable onPress={() => {
              setShowSpeedBox(false);
              if (isPlaying) {
                onResetControlTimer(false);
              }
            }}>
              <View style={styles.bottomControlBox}>
                <BlurView
                  intensity={30}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                {showSpeedBox && (
                  <View style={styles.speedBox}>
                    <TouchableOpacity
                      style={[
                        styles.speedButton,
                        speed === 2.0 && styles.activeSpeedButton,
                      ]}
                      onPress={() => handleSpeed(2.0)}
                    >
                      <Text style={styles.speedButtonText}>2.0x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.speedButton,
                        speed === 1.5 && styles.activeSpeedButton,
                      ]}
                      onPress={() => handleSpeed(1.5)}
                    >
                      <Text style={styles.speedButtonText}>1.5x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.speedButton,
                        speed === 1.25 && styles.activeSpeedButton,
                      ]}
                      onPress={() => handleSpeed(1.25)}
                    >
                      <Text style={styles.speedButtonText}>1.25x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.speedButton,
                        speed === 1.0 && styles.activeSpeedButton,
                      ]}
                      onPress={() => handleSpeed(1.0)}
                    >
                      <Text style={styles.speedButtonText}>1.0x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.speedButton,
                        speed === 0.75 && styles.activeSpeedButton,
                      ]}
                      onPress={() => handleSpeed(0.75)}
                    >
                      <Text style={styles.speedButtonText}>0.75x</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.speed}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowSpeedBox(!showSpeedBox);
                    if (isPlaying) {
                      onResetControlTimer(false);
                    }
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.speedButtonText}>{speed}x</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
});

VideoItem.displayName = "VideoItem";

function EpisodeDialog({
  visible,
  onClose,
  drama,
  episodes,
  activeIndex,
  onSelectEpisode,
}: {
  visible: boolean;
  onClose: () => void;
  drama: Drama | null;
  episodes: VideoPart[];
  activeIndex: number;
  onSelectEpisode: (part: VideoPart) => void;
}) {
  if (!drama) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.modalMask} onPress={onClose} />
        <View style={styles.dialogContent}>
          <View style={styles.dialogHeader}>
            <View style={styles.dialogHeaderTop}>
              <Text style={styles.episodeDialogTitle}>
                {"EP"}
                {activeIndex + 1}
                {"/"}
                {episodes.length}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Image
                  source={ASSETS.iconEpisodesClose}
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dialogBody}>
            <FlashList
              data={episodes}
              numColumns={6}
              keyExtractor={(item, idx) => `${item.block_key}-${idx}`}
              renderItem={({ item }) => {
                const isCurrent = activeIndex === item.installment_idx - 1;
                const isLocked = !item.entry;
                return (
                  <TouchableOpacity
                    style={[
                      styles.episodeItem,
                      isCurrent && styles.activeEpisodeItem,
                    ]}
                    onPress={() => onSelectEpisode(item)}
                  >
                    {isCurrent && (
                      <Image
                        source={ASSETS.iconEpisodesActiveBg}
                        style={styles.activeEpIcon}
                      />
                    )}
                    {isLocked && (
                      <View style={styles.lockIconContainer}>
                        <Image
                          source={ASSETS.iconLock}
                          style={styles.lockIcon}
                        />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.episodeItemText,
                        isCurrent && styles.activeEpisodeItemText,
                      ]}
                    >
                      {item.installment_idx}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.episodeGrid}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const PromoPlayer = React.memo(({ video, isActive }: { video: any; isActive: boolean }) => {
  const videoUrl = video.watch_wave || '';
  const [videoReady, setVideoReady] = useState(false);

  const videoSource = React.useMemo(() => {
    if (!videoUrl) return null;
    return { uri: videoUrl, metadata: { artwork: video.intro || undefined } };
  }, [videoUrl, video.intro]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    if (isActive && videoUrl) p.play();
  });

  useEffect(() => {
    if (!player) return;
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  useEffect(() => {
    if (videoReady && isActive && player) {
      player.play();
    }
  }, [videoReady, isActive, player]);

  useEffect(() => {
    if (!player || !isActive) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') player.play();
    });
    return () => sub.remove();
  }, [player, isActive]);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") setVideoReady(true);
    });
    return () => sub.remove();
  }, [player]);

  return (
    <>
      <Image
        source={{ uri: video.intro }}
        style={[styles.promoVideo, StyleSheet.absoluteFill]}
        contentFit="cover"
      />
      <VideoView
        player={player}
        style={[styles.promoVideo, { opacity: videoReady ? 1 : 0 }]}
        contentFit="cover"
        nativeControls={false}
      />
    </>
  );
});

PromoPlayer.displayName = "PromoPlayer";

const PromoVideoItem = React.memo(({ video, isActive, enableVideo = true }: { video: any; isActive: boolean; enableVideo?: boolean }) => {
  return (
    <View style={styles.promoItem}>
      <View style={styles.promoClip}>
        {enableVideo && video.watch_wave ? (
          <PromoPlayer video={video} isActive={isActive} />
        ) : (
          <Image
            source={{ uri: video.intro }}
            style={styles.promoVideo}
            contentFit="cover"
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)"]}
          style={styles.promoGradient}
        />
        <View style={styles.promoVipBadge}>
          <Image
            source={ASSETS.iconVip}
            style={styles.promoVipIcon}
          />
        </View>
      </View>
    </View>
  );
});

PromoVideoItem.displayName = "PromoVideoItem";

const PROMO_ITEM_WIDTH = rem(240) + rem(16);

function VerticalMarquee({ height, items }: { height: number; items: React.ReactNode[] }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;

    const runCycle = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(translateY, { toValue: -height, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        if (cancelled) return;
        indexRef.current = (indexRef.current + 1) % items.length;
        setCurrentIndex(indexRef.current);
        translateY.setValue(height);
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          if (!cancelled) runCycle();
        });
      });
    };

    runCycle();
    return () => { cancelled = true; };
  }, [height, translateY, items.length]);

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {items[currentIndex]}
      </Animated.View>
    </View>
  );
}

function PayDialog({ userCash, visible, drama, payDialogData, onClose, onPurchaseSuccess, showRetentionModal, retentionProduct, onRetentionClose, onRetentionPurchaseSuccess }: any) {
  const { loading: iapLoading } = useIAPContext();
  const [activePromoIdx, setActivePromoIdx] = useState(0);

  const handlePromoScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / PROMO_ITEM_WIDTH);
    setActivePromoIdx(Math.max(0, idx));
  }, []);

  if (!drama) return null;
  const promoVideos = payDialogData?.promotional_videos;
  const showPromoVideos = Array.isArray(promoVideos) && promoVideos.length > 0 &&
    payDialogData?.load_video !== false && payDialogData?.load_video !== 0 &&
    payDialogData?.load_video !== '0' && payDialogData?.load_video !== 'false';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, {backgroundColor: showPromoVideos ? 'rgba(0, 0, 0, 0.7)' : 'transparent'}]}>
        <Pressable style={styles.modalMask} onPress={onClose} />
          {payDialogData && payDialogData.load_video && 
            <View style={styles.payDialogVideosContainer}>
              <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: rem(12)}}>
                <LinearGradient
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  colors={[
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.12)', 
                    'rgba(255, 255, 255, 0)'
                  ]}
                  style={{ width: rem(420), height: rem(48)}}
                  locations={[0, 0.5, 1]}
                >
                  <VerticalMarquee
                    height={rem(48)}
                    items={(payDialogData?.figures?.length > 0 ? payDialogData.figures : [null]).map((uri: string | null, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: rem(48) }}>
                        {uri ? (
                          <Image
                            source={{ uri }}
                            style={{ width: rem(36), height: rem(36), borderRadius: rem(18), marginRight: rem(12) }}
                          />
                        ) : null}
                        <Text style={{ color: "#FFFFFFCC", fontSize: rem(24) }}>just became a VIP!</Text>
                      </View>
                    ))}
                  />
                </LinearGradient>
              </View>
              {payDialogData?.brand_messaging ? (
                <Text style={styles.brandMessagingText}>
                  - {payDialogData.brand_messaging} -
                </Text>
              ) : null}

              {showPromoVideos && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.promoScrollView}
                  contentContainerStyle={styles.promoScrollContent}
                  onScroll={handlePromoScroll}
                  scrollEventThrottle={200}
                >
                  {promoVideos.map((video: any, idx: number) => (
                    <PromoVideoItem
                      key={idx}
                      video={video}
                      isActive={visible}
                      enableVideo={Math.abs(idx - activePromoIdx) <= 1}
                    />
                  ))}
                  <View style={[styles.promoItem, styles.promoItemTips]}>
                    <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: rem(20) }]} />
                    <Text style={{ paddingHorizontal: rem(24), color: '#FFFFFF80', fontSize: rem(24), textAlign: 'center'}}>For more content, </Text>
                    <Text style={{ paddingHorizontal: rem(24), color: '#FFFFFF80', fontSize: rem(24), textAlign: 'center'}}>Please subscribe to
                      <Text style={{color: '#FFFFFFCC', fontSize: rem(24)}}> VIP</Text> to watch</Text>
                  </View>
                </ScrollView>
              )}
            </View>
          }
          <View style={styles.dialogPayContent}>
            <View style={styles.dialogHeader}>
              <TouchableOpacity style={styles.payCloseButton} onPress={onClose}>
                <Image
                  source={ASSETS.iconClose}
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.payDialogTitle}>
              <Text style={styles.payDialogTitleText}>Account Balance:</Text>
              <View style={styles.coinsContainer}>
                <Image
                  source={ASSETS.iconCoins}
                  style={styles.iconCoins}
                />
                <Text style={styles.coinsText}>
                  {userCash?.allowance || 0} Coins
                </Text>
              </View>
              <View style={styles.bounsContainer}>
                <Image
                  source={ASSETS.iconBouns}
                  style={styles.iconBouns}
                />
                <Text style={styles.coinsText}>
                  {userCash?.perks || 0} Bonus
                </Text>
              </View>
            </View>
            <SKU episodeId={drama.block_key?.toString()} onPurchaseSuccess={onPurchaseSuccess} />
          </View>
      </View>

      {iapLoading && (
        <View style={styles.iapLoadingOverlay}>
          <View style={styles.iapLoadingBox}>
            <ActivityIndicator size="large" color="#EE0000" />
            <Text style={styles.iapLoadingText}>Loading...</Text>
          </View>
        </View>
      )}

      <RetentionModal
        visible={showRetentionModal}
        retentionProduct={retentionProduct}
        episodeId={drama?.block_key?.toString()}
        onClose={onRetentionClose}
        onPurchaseSuccess={onRetentionPurchaseSuccess}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoLoadingContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoItem: {
    width: width,
  },
  unlockContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  unlockText: {
    height: rem(60),
    width: '80%',
    backgroundColor: "#FF0004",
    borderRadius: rem(16),
    justifyContent: "center",
    alignItems: "center",
    lineHeight: rem(60),
    textAlign: "center",
    color: "#fff",
    fontSize: rem(24),
  },
  backContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: rem(80),
    height: rem(80),
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: rem(48),
    height: rem(48),
  },
  dramaHeader: {
    width: "70%",
    alignItems: "flex-start",
  },
  dramaTitle: {
    color: "#fff",
    fontSize: rem(32),
  },
  dramaEpisode: {
    fontSize: rem(22),
    color: "#FFFFFF80",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  playIcon: {
    width: rem(112),
    height: rem(112),
    opacity: 0.8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 5,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: rem(400),
  },
  rightActions: {
    position: "absolute",
    right: rem(24),
    bottom: rem(360),
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginBottom: rem(24),
  },
  actionIcon: {
    width: rem(52),
    height: rem(52),
    marginBottom: rem(12),
  },
  actionText: {
    color: "#fff",
    fontSize: rem(22),
    fontWeight: "500",
  },
  bottomControls: {
    width: "100%",
  },
  progressTimeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rem(24),
    paddingVertical: rem(20),
  },
  progressTimeText: {
    color: "#FFFFFFCC",
    fontSize: rem(24),
  },
  bottomControlBox: {
    height: 80,
    backgroundColor: "rgba(25, 25, 25, 0.3)",
    justifyContent: "center",
    paddingHorizontal: rem(24),
  },
  progressBarContainer: {
    width: "100%",
    height: 30,
    zIndex: 100,
    position: "absolute",
    bottom: 65,
    left: 0,
    right: 0,
  },
  progressBarBackground: {
    position: "absolute",
    bottom: 15,
    height: rem(8),
    backgroundColor: "rgba(217, 217, 217, 0.4)",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#EE0000",
  },
  speedBox: {
    position: "absolute",
    bottom: 85,
    left: rem(24),
    height: rem(360),
    width: rem(120),
    zIndex: 100,
  },
  speedButton: {
    backgroundColor: "#0000004D",
    justifyContent: "center",
    borderWidth: 1,
    width: rem(116),
    height: rem(60),
    lineHeight: rem(60),
    borderColor: "#FFFFFF33",
    borderRadius: rem(16),
    alignItems: "center",
    marginBottom: rem(12),
  },
  activeSpeedButton: {
    backgroundColor: "#000000",
  },
  speed: {
    position: "absolute",
    left: rem(24),
    height: rem(52),
    width: rem(92),
    marginLeft: rem(12),
    backgroundColor: "#0000004D",
    borderWidth: 1,
    borderColor: "#FFFFFF33",
    borderRadius: rem(16),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  speedButtonText: {
    fontSize: rem(24),
    textAlign: "center",
    color: "#ffffff",
  },
  payDialogVideosContainer: {
    paddingTop: rem(24),
    backgroundColor: "transparent",
  },
  payDialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  dialogContent: {
    height: "50%",
    backgroundColor: "#13161D",
    borderTopLeftRadius: rem(24),
    borderTopRightRadius: rem(24),
    overflow: "hidden",
  },
  dialogPayContent: {
    height: "50%",
    backgroundColor: "#13161D",
    borderTopLeftRadius: rem(24),
    borderTopRightRadius: rem(24),
    overflow: "hidden",
  },
  dialogHeader: {
    padding: rem(20),
    paddingBottom: rem(10),
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
  payCloseButton: {
    position: "absolute",
    right: rem(24),
    top: rem(24),
  },
  closeIcon: {
    width: rem(48),
    height: rem(48),
  },
  brandMessagingText: {
    color: "#FFF0D9",
    fontSize: rem(24),
    textAlign: "center",
    paddingHorizontal: rem(24),
    marginTop: rem(6),
    marginBottom: rem(20),
  },
  promoScrollView: {
    maxHeight: rem(496),
    marginBottom: rem(16),
  },
  promoScrollContent: {
    paddingHorizontal: rem(24),
  },
  promoItem: {
    width: rem(278),
    height: rem(496),
    marginRight: rem(16),
  },
  promoItemTips: {
    width: rem(440),
    backgroundColor: '#3C3C3C80',
    borderColor: '#4B4B4B',
    borderWidth: 1,
    paddingVertical: rem(20),
    borderRadius: rem(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoClip: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 100,
  },
  promoVideo: {
    flex: 1,
  },
  promoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
  },
  promoVipBadge: {
    position: "absolute",
    top: rem(6),
    left: rem(6),
  },
  promoVipIcon: {
    width: rem(94),
    height: rem(48),
  },
  promoVipText: {
    color: "#fff",
    fontSize: rem(20),
    fontWeight: "bold",
  },
  payDialogTitle: {
    flexDirection: "row",
    paddingHorizontal: rem(24),
    paddingBottom: rem(10),
  },
  payDialogTitleText: {
    fontSize: rem(24),
    color: "#FFFFFF80",
  },
  coinsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: rem(12),
  },
  bounsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: rem(12),
  },
  iconCoins: {
    width: rem(40),
    height: rem(40),
    marginRight: rem(8),
  },
  iconBouns: {
    width: rem(40),
    height: rem(40),
    marginRight: rem(8),
  },
  coinsText: {
    color: "#fff",
    fontSize: rem(24),
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: rem(10),
  },
  tab: {
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
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: rem(4),
    backgroundColor: "#FFFB02",
  },
  rangeTabList: {
    marginTop: rem(10),
    marginBottom: rem(10),
  },
  episodeRangeTab: {
    paddingRight: rem(30),
    paddingVertical: rem(10),
  },
  rangeTabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: rem(28),
    fontWeight: "500",
  },
  activeRangeTab: {},
  activeRangeTabText: {
    color: "#FFFB02",
  },
  dialogBody: {
    flex: 1,
    paddingHorizontal: rem(30),
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
  iapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  iapLoadingBox: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iapLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },
});
