import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import CoinFront from "@/components/CoinFront";
import CoinBack from "@/components/coin/CoinBack";

type Props = React.ComponentProps<typeof CoinFront> & {
  motto?: string;
  substances?: string[];
  backIcon?: string;
};

export default function SobrietyCoin(props: Props) {
  const [flipped, setFlipped] = useState(false);
  const progress = useSharedValue(0);
  const size = props.size || 260;

  const flip = () => {
    const next = !flipped;
    setFlipped(next);
    progress.value = withTiming(next ? 1 : 0, { duration: 520 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: "hidden",
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: "hidden",
    position: "absolute",
  }));

  return (
    <Pressable onPress={flip}>
      <View style={[styles.stage, { width: size, height: size }]}>
        <Animated.View style={frontStyle}>
          <CoinFront {...props} />
        </Animated.View>
        <Animated.View style={backStyle}>
          <CoinBack
            size={props.size}
            color={props.color}
            shape={props.shape}
            motto={props.motto}
            substances={props.substances}
            customShapePath={props.customShapePath}
            showBorder={props.showBorder}
            borderColor={props.borderColor}
            numberColor={props.numberColor}
            numberStyle={props.numberStyle}
            coinPhoto={props.coinPhoto}
            background={props.background}
            imageOnlyMode={props.imageOnlyMode}
            days={props.days}
            displayName={props.displayName}
            backIcon={props.backIcon}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", justifyContent: "center", overflow: "visible", backgroundColor: "transparent" },
});
