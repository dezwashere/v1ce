import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import CoinFront from "@/components/CoinFront";
import CoinBack from "@/components/coin/CoinBack";
import { buildCoinDesign, pointsString } from "@/lib/coinDesign";
import Svg, { Polygon } from "react-native-svg";
import Coin3DPreview from "@/components/coin/Coin3DPreview";
import { V1CECoinView } from "@/modules/v1ce-coin-renderer/src";
import { Platform } from "react-native";

type Props = React.ComponentProps<typeof CoinFront> & {
  motto?: string;
  substances?: string[];
  backIcon?: string;
};

export default function SobrietyCoin(props: Props) {
  const [flipped, setFlipped] = useState(false);
  const progress = useSharedValue(0);
  const size = props.size || 260;
  const design = buildCoinDesign(props);
  const edgeStyle = useAnimatedStyle(() => ({
    position: "absolute",
    opacity: Math.sin(progress.value * Math.PI) * .72,
    transform: [{ scaleX: Math.max(.055, Math.abs(Math.cos(progress.value * Math.PI))) }],
  }));

  const flip = () => {
    const next = !flipped;
    setFlipped(next);
    progress.value = withTiming(next ? 1 : 0, { duration: 520 });
  };

  if (Platform.OS === "ios" && V1CECoinView) {
    return <Pressable onPress={flip}>
      <Coin3DPreview {...props} showBack={flipped} />
    </Pressable>;
  }

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
        <Animated.View style={edgeStyle} pointerEvents="none">
          <Svg width={size} height={size} viewBox="-3 -3 106 111">
            {design.showBorder && design.rim.map((points,i) => <Polygon key={i} points={pointsString(points)} fill={design.rimPrimary}/>)}
          </Svg>
        </Animated.View>
        <Animated.View style={frontStyle}>
          <CoinFront {...props} />
        </Animated.View>
        <Animated.View style={backStyle}>
          <CoinBack
            textLayout={props.textLayout}
            isPremium={props.isPremium}
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
