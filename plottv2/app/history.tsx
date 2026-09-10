import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect,useState } from "react";
import { episodeApi } from "@/api/episodes";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDictionary } from "@/hooks/useDictionary";

interface HistoryItem {
  block_key: string | number;
  rubric: string;
  tiny_img: string;
  installment_idx: number;
  block_aggregate: number;
}

const ASSETS = {
  defaultCover: require("@/assets/icons/cover.png"),
  emptyIcon: require("@/assets/icons/icon_nodata.png"),
  iconArrowLeft: require("@/assets/icons/icon_arrow_left.png"),
};



export default function History() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dict = useDictionary();
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const rem = (n: number) => n * (width / 750);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const result = await episodeApi.getUseHistory();
      setHistoryList(result?.seen || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error loading history", error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const EmptyView = () => (
    <View style={styles.emptyContainer}>
    { !loading && (
        <View style={styles.emptyContainer}>
          <Image
            source={ASSETS.emptyIcon}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>{dict['no content'] || 'Sorry, no results found~'}</Text>
        </View>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={{ width: rem(220) }}
      activeOpacity={0.7}
      onPress={() => router.push(`/video/${item.block_key}?index=${item.installment_idx || 1}`)}
    >
      <View style={[styles.coverContainer, { height: rem(294) }]}>
        <Image
          source={item.tiny_img ? { uri: item.tiny_img } : ASSETS.defaultCover}
          style={styles.cover}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.6)"]}
          style={styles.coverGradient}
        />
      </View>
      <Text
        style={[styles.title, { fontSize: rem(28), marginTop: rem(12) }]}
        numberOfLines={1}
      >
        {item.rubric}
      </Text>
      <View style={[styles.epContainer, { marginTop: rem(4) }]}>
        <Text style={[styles.epTextActive, { fontSize: rem(24) }]}>
          EP.{item.installment_idx || 1}
        </Text>
        <Text style={[styles.epTextTotal, { fontSize: rem(24) }]}>
          {" "}
          / {item.block_aggregate}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      { loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}
      <View style={[styles.headerContainer, { marginTop: insets.top }]}>
        <TouchableOpacity
          style={{ position: "absolute", left: 10 }}
          onPress={() => router.back()}
        >
          <Image
            source={ASSETS.iconArrowLeft}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <Text style={styles.headerText}>{dict['History'] || 'Watch History'}</Text>
      </View>
      <FlatList
        data={historyList}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.block_key}-${index}`}
        numColumns={3}
        columnWrapperStyle={[
          styles.columnWrapper,
          { paddingHorizontal: rem(30) },
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040404",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  listContent: {
    flex: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  columnWrapper: {
    gap: 10,
    paddingTop: 12,
  },
  coverContainer: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  coverGradient: {
    position: "absolute",
    height: 50,
    bottom: 0,
    left: 0,
    right: 0,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  epContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  epTextActive: {
    color: "#FF3B30",
    fontWeight: "500",
  },
  epTextTotal: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#040404",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#040404",
  },
  emptyIcon: {
    width: 120,
    height: 120,
    marginBottom: 10,
    marginTop: -100,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
  },
});
