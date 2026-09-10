import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { episodeApi } from "@/api/episodes";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDictionary } from "@/hooks/useDictionary";

const ASSETS = {
  arrowLeft: require("@/assets/icons/icon_arrow_left.png"),
};

const MAX_LENGTH = 200;

export default function Feedback() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dict = useDictionary();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const rem = useCallback((size: number) => (width / 750) * size, [width]);

  const handleSubmit = async () => {
    if (text.trim().length === 0) return;
    setLoading(true);
    try {
      await episodeApi.submitFeedback({ guides: [], other_recommendations: text });
      Alert.alert(dict['Success'] || "Success", dict['Feedback submitted successfully'] || "Feedback submitted successfully");
      setText("");
    } catch (error) {
      setLoading(false);
      console.error("Error submitting feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = text.trim().length === 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={[styles.headerContainer, { marginTop: insets.top + rem(10) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Image
              source={ASSETS.arrowLeft}
              style={{ width: rem(48), height: rem(48) }}
            />
          </TouchableOpacity>
          <Text style={[styles.headerText, { fontSize: rem(34) }]}>
            {dict['Feedback'] || 'Feedback'}
          </Text>
        </View>
        { loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFF" />
          </View>
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <View style={[styles.inputWrapper, { marginTop: rem(40) }]}>
            <TextInput
              style={[styles.input, { fontSize: rem(28), height: rem(300) }]}
              placeholder={dict['Enter your feedback'] || "Enter your feedback"}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              maxLength={MAX_LENGTH}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
            <Text style={[styles.counter, { fontSize: rem(24) }]}>
              {text.length}/{MAX_LENGTH}
            </Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipText}>{dict['Enter your feedback'] || 'Enter your feedback'}</Text>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  height: rem(96),
                  borderRadius: rem(48),
                  backgroundColor: isSubmitDisabled ? "#520808" : "#FF0000",
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitText, { fontSize: rem(32) }]}>
                {dict['submit'] || 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
    left: 12,
    zIndex: 1,
  },
  headerText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center", 
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputWrapper: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 15,
    position: "relative",
  },
  input: {
    color: "#FFFFFF",
    textAlignVertical: "top",
    paddingTop: 0,
  },
  counter: {
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "right",
    marginTop: 10,
  },
  tip: {
    marginTop: 10,
    paddingLeft: 2,
  },
  tipText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  submitButton: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
