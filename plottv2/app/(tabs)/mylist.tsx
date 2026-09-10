import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useEffect, useState } from "react";
import { episodeApi } from "@/api/episodes";
import { useDictionary } from "@/hooks/useDictionary";
import { storage } from "@/utils/storage";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ListItem {
  block_key: string | number;
  rubric: string;
  tiny_img: string;
  installment_idx: number;
  block_aggregate: number;
  tags: string[];
}

const ASSETS = {
  defaultCover: require("@/assets/icons/cover.png"),
  emptyIcon: require("@/assets/icons/icon_nodata.png"),
  mylistSettingIcon: require("@/assets/icons/icon_mylist_setting.png"),
  mylistSettingCloseIcon: require("@/assets/icons/icon_mylist_setting_close.png"),
  mylistDelIcon: require("@/assets/icons/icon_mylist_del.png"),
};

export default function MyList() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"mylist" | "history">("mylist");
  const [myList, setMyList] = useState<ListItem[]>([]);
  const [historyList, setHistoryList] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(
    new Set()
  );
  const [removeLoading, setRemoveLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dict = useDictionary();
  
  const rem = useCallback((size: number) => (width / 750) * size, [width]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: editMode
        ? { display: "none" }
        : {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(4, 4, 4, 0.7)',
            borderTopWidth: 0,
            elevation: 0,
            zIndex: 9999,
          },
    });
  }, [editMode, navigation]);

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

  const loadMylist = async () => {
    try {
      setLoading(true);
      const result = await episodeApi.getMyList();
      setMyList(result?.appreciated || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error loading mylist", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "mylist") {
      await loadMylist();
    } else {
      await loadHistory();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadMylist();
    loadHistory();
    setEditMode(false);
    setSelectedItems(new Set());
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
    setSelectedItems(new Set());
  }, []);

  const toggleItemSelection = useCallback((id: string | number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleRemove = useCallback(async () => {
    if (selectedItems.size === 0) return;
    try {
      setRemoveLoading(true);
      const idsToRemove = Array.from(selectedItems);
      const currentLang = (await storage.getLanguage()) || "en";
      const params: { block_key: string | number; area: string }[] = idsToRemove.map((id) => ({
        block_key: id,
        area: currentLang as string,
      }));
      if (activeTab === "mylist") {
        const newMyList = myList.filter((item) => !selectedItems.has(item.block_key));
        await episodeApi.deleteMyList(params);
        setRemoveLoading(false);
        setMyList(newMyList);
      } else {
        const newHistory = historyList.filter((item) => !selectedItems.has(item.block_key));
        await episodeApi.deleteHistory(params);
        setRemoveLoading(false);
        setHistoryList(newHistory);
      }

      setSelectedItems(new Set());
      setEditMode(false);
    } catch (e) {
      console.error("Failed to remove items", e);
    } finally {
      setRemoveLoading(false);
    }
  }, [selectedItems, activeTab, historyList, myList]);

  // Render item for MyList (Grid layout)
  const renderMyListItem = useCallback(({ item }: { item: ListItem }) => (
    <TouchableOpacity
      style={[styles.item, { width: rem(220) }]}
      onPress={() => {
        if (editMode) {
          toggleItemSelection(item.block_key);
        } else {
          router.push(`/video/${item.block_key}?index=${item.installment_idx || 1}`);
        }
      }}
      activeOpacity={editMode ? 0.8 : 0.7}
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
        {editMode && (
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                selectedItems.has(item.block_key) && styles.checkboxSelected,
              ]}
            >
            </View>
          </View>
        )}
        {editMode && selectedItems.has(item.block_key) && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(4, 4, 4, 0.5)", zIndex: 10 }]}></View>
        )}
      </View>
      <Text
        style={[styles.title, { marginTop: rem(12) }]}
        numberOfLines={1}
      >
        {item.rubric}
      </Text>
      <View style={[styles.epContainer, { marginTop: rem(4) }]}>
        <Text style={styles.epTextActive}>
          EP.{item.installment_idx || 1}
        </Text>
        <Text style={styles.epTextTotal}>
          {" "}
          / {item.block_aggregate}
        </Text>
      </View>
    </TouchableOpacity>
  ), [editMode, selectedItems, rem, toggleItemSelection, router]);

  // Render item for History (List layout)
  const renderHistoryItem = useCallback(({ item }: { item: ListItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        if (editMode) {
          toggleItemSelection(item.block_key);
        } else {
          router.push(`/video/${item.block_key}?index=${item.installment_idx || 1}`);
        }
      }}
      activeOpacity={editMode ? 0.8 : 0.7}
    >
      {editMode && (
        <View style={styles.historyCheckboxLeft}>
          <View
            style={[
              styles.historyCheckbox,
              selectedItems.has(item.block_key) && styles.historyCheckboxSelected,
            ]}
          />
        </View>
      )}
      <View style={styles.historyCoverContainer}>
        <Image
          source={item.tiny_img ? { uri: item.tiny_img } : ASSETS.defaultCover}
          style={styles.historyCover}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.6)"]}
          style={styles.coverGradient}
        />
        {editMode && selectedItems.has(item.block_key) && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(4, 4, 4, 0.5)", zIndex: 10 }]}></View>
        )}
      </View>
      <View style={{ flex: 1 }}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {item.rubric}
        </Text>
        <Text style={styles.historyGenre} numberOfLines={2}>
          {item.tags.join(", ")}
        </Text>
        <View style={styles.epContainer}>
          <Text style={styles.epTextActive}>
            EP.{item.installment_idx || 1}
          </Text>
          <Text style={styles.epTextTotal}>
            {" "}
            / {item.block_aggregate}
          </Text>
        </View>
      </View>
      </View>
      
    </TouchableOpacity>
  ), [editMode, selectedItems, toggleItemSelection, router]);

  const renderContent = () => {
    const currentList = activeTab === "mylist" ? myList : historyList;

    if (loading && !refreshing) {
      return (
        <View style={[styles.center, { marginTop: -100 }]}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      );
    }

    const EmptyComponent = () => (
      <View style={styles.emptyContainer}>
        <Image
          source={ASSETS.emptyIcon}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyText}>
          {dict['no content'] || 'Sorry, no results found~'}
        </Text>
      </View>
    );

    // Different layouts for MyList and History
    if (activeTab === "history") {
      return (
        <FlashList
          key="history-list"
          data={currentList}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `${item.block_key}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.historyListContent,
            { flexGrow: 1, paddingTop: Platform.OS === 'ios' ? 58 : 8 }
          ]}
          contentInset={{ top: -50 }}
          contentOffset={{ y: 50, x: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#EE0000"
              colors={["#EE0000"]}
              progressBackgroundColor="#fff"
              title={refreshing ? "Loading..." : "Pull to refresh"}
              titleColor="#909090"
            />
          }
          ListEmptyComponent={EmptyComponent}
        />
      );
    }

    return (
      <FlashList
        key="mylist-grid"
        data={currentList}
        renderItem={renderMyListItem}
        keyExtractor={(item, index) => `${item.block_key}-${index}`}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { flexGrow: 1, paddingHorizontal: rem(24), paddingTop: Platform.OS === 'ios' ? 58 : 8 }
        ]}
        contentInset={{ top: -50 }}
        contentOffset={{ y: 50, x: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EE0000"
            colors={["#EE0000"]}
            progressBackgroundColor="#fff"
            title={refreshing ? "Loading..." : "Pull to refresh"}
            titleColor="#909090"
          />
        }
        ListEmptyComponent={EmptyComponent}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab("mylist");
              setEditMode(false);
              setSelectedItems(new Set());
            }}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "mylist" && styles.tabTextActive,
              ]}
            >
              {dict['My List'] || 'My List'}
            </Text>
            {activeTab === "mylist" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab("history");
              setEditMode(false);
              setSelectedItems(new Set());
            }}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.tabTextActive,
              ]}
            >
              {dict['History'] || 'History'}
            </Text>
            {activeTab === "history" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={toggleEditMode} style={styles.editButton}>
          {!editMode ? (<Image
            source={ASSETS.mylistSettingIcon}
            style={styles.editIcon}
          />) : (
            <Image
              source={ASSETS.mylistSettingCloseIcon}
              style={styles.editIcon}
            />
          )}
        </TouchableOpacity>
      </View>
      {removeLoading && (<View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FFF" />
      </View>)}
      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Remove Button */}
      {editMode && (
        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[
              styles.removeButton,
              selectedItems.size === 0 && styles.removeButtonDisabled,
            ]}
            onPress={handleRemove}
            disabled={selectedItems.size === 0}
          >
            <Image
              source={ASSETS.mylistDelIcon}
              style={styles.trashIcon}
            />
            <Text style={styles.removeButtonText}>
              {dict['Remove'] || 'Remove'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040404",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 24,
  },
  tabButton: {
    position: "relative",
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 16,
    color: "#909090",
    fontWeight: "400",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#EE0000",
    borderRadius: 1.5,
  },
  editButton: {
    padding: 8,
  },
  editIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
  content: {
    flex: 1,
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
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "flex-start",
    gap: 10,
  },
  item: {
    marginBottom: 15,
  },
  coverContainer: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    position: "relative",
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
  checkboxContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 11,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#EE0000",
  },
  title: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  epContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  epTextActive: {
    color: "#EE0000",
    fontSize: 14,
  },
  epTextTotal: {
    color: "#909090",
    fontSize: 14,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#272727",
    backgroundColor: "#040404",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    borderRadius: 8,
    gap: 8,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  removeButtonText: {
    color: "#F2F2F2",
    fontSize: 14,
  },
  trashIcon: {
    width: 24,
    height: 24,
  },
  closeButton: {
    position: "absolute",
    top: 70,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    width: 16,
    height: 16,
    tintColor: "#FFFFFF",
  },
  // History list styles
  historyListContent: {
    backgroundColor: "#040404",
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  historyCheckboxLeft: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    marginRight: 12,
    marginLeft: -10,
  },
  historyCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  historyCheckboxSelected: {
    backgroundColor: "#EE0000",
  },
  historyCoverContainer: {
    width: 100,
    height: 140,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    position: "relative",
  },
  historyCover: {
    width: "100%",
    height: "100%",
  },
  historyInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
    // justifyContent: "flex-end",
  },
  historyTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
    lineHeight: 24,
  },
  historyGenre: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 12,
    lineHeight: 18,
  },
});