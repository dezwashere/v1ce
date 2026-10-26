import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";

const COLORS = ["#F5A41A", "#FF2D95", "#00A675", "#9671EB"];

/** Finite opening burst. No timers, saved video, or animation while closed. */
export default function BirthdayConfetti({ active = true }: { active?: boolean }) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    progress.setValue(0);
    if (!active || reduceMotion) return;
    const animation = Animated.timing(progress, { toValue: 1, duration: 3800, easing: Easing.out(Easing.quad), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [active, reduceMotion, progress]);
  if (!active || reduceMotion) return null;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {Array.from({ length: 22 }, (_, i) => <Animated.View key={i} style={{
      position: "absolute", left: `${(i * 37) % 100}%`, top: -30 - (i % 4) * 15,
      width: 5 + i % 3, height: 8 + i % 4, backgroundColor: COLORS[i % COLORS.length],
      opacity: progress.interpolate({ inputRange: [0, .08, .65, 1], outputRange: [0, .85, .65, 0] }),
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 540 + i % 5 * 30] }) },
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, (i % 2 ? 1 : -1) * 38] }) },
        { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${(i % 2 ? 1 : -1) * 480}deg`] }) },
      ],
    }} />)}
  </View>;
}
