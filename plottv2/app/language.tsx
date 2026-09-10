import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loginApi } from "@/api/login";
import { storage } from "@/utils/storage";
import { useDictionary } from "@/hooks/useDictionary";

const ASSETS = {
  iconArrowLeft: require("@/assets/icons/icon_arrow_left.png"),
  iconLanguageSelect: require("@/assets/icons/icon_language_select.png"),
};

interface LanguageItem {
  name: string;
  lexeme: string;
}

export default function Language() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [loading, setLoading] = useState(true);
  const dict = useDictionary();

  useEffect(() => {
    const init = async () => {
      try {
        const currentLang = await (storage.getLanguage() as Promise<string | null>) || "en";
        setSelectedLang(currentLang);

        const res = await loginApi.getLangSetting();
        if (res && res.places) {
          setLanguages(res.places);
        } else {
          setLanguages([{ name: "English", lexeme: "en" }]);
        }
      } catch (error) {
        console.error("Failed to fetch languages:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSelectLanguage = async (item: LanguageItem) => {
    if (item.lexeme === selectedLang) return;

    setSelectedLang(item.lexeme);
    await storage.setLanguage(item.lexeme);

    try {
      const data = await loginApi.getDictionary(item.lexeme);
      const dictionaryObj: Record<string, string> = {};
      if (data?.glossaries && Array.isArray(data.glossaries)) {
        data.glossaries.forEach((g: any) => {
          if (g.lexeme && g.locale) {
            dictionaryObj[g.lexeme] = g.locale;
          }
        });
      }
      await storage.setDictionary(dictionaryObj);
    } catch (e) {
      console.warn("Failed to get dictionary:", e);
    }
  };

  const renderItem = ({ item }: { item: LanguageItem }) => {
    const isSelected = item.lexeme === selectedLang;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleSelectLanguage(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.contentText}>{item.name}</Text>
        {isSelected && (
          <Image
            source={ASSETS.iconLanguageSelect}
            style={styles.select}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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

        <Text style={styles.headerText}>{dict['Language'] || 'Language'}</Text>
      </View>

      {loading ? (
        null
      ) : (
        <FlatList
          data={languages}
          keyExtractor={(item) => item.lexeme}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingVertical: 12,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  contentText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  select: {
    width: 18,
    height: 18,
  },
});
