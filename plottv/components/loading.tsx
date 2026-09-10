import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const FunnyTVLoader = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // 1. 第一个圈的样式 (对应 CSS :before)
  const yellowRingStyle = useAnimatedStyle(() => {
    const rotateZ = `${progress.value * 360}deg`;
    return {
      borderColor: '#EEAB00',
      transform: [
        { rotateX: '70deg' },
        { rotateZ: rotateZ }
      ],
    };
  });

  // 2. 第二个圈的样式 (对应 CSS :after，带 0.4s 延迟偏移)
  const redRingStyle = useAnimatedStyle(() => {
    // 这里的 0.4 对应 CSS 的 0.4s delay
    const shiftedProgress = (progress.value + 0.4) % 1;
    const rotateZ = `${shiftedProgress * 360}deg`;
    return {
      borderColor: '#EE0000',
      transform: [
        { rotateY: '70deg' },
        { rotateZ: rotateZ }
      ],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        <Animated.View style={[styles.ring, yellowRingStyle]} />
        <Animated.View style={[styles.ring, redRingStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderWrapper: {
    width: 48,
    height: 48,
    transform: [{ rotateZ: '45deg' }],
  },
  ring: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    // 模拟 CSS 的效果：只给部分边框着色
    borderTopWidth: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
  },
});

export default FunnyTVLoader;