import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { View } from "react-native";

const VARIANTS = ["circle", "bob", "spike", "wave"] as const;

export default function LofiAvatar({ seed = "A", size = 34, color = "#0A0A0A" }: { seed?: string; size?: number; color?: string }) {
  const code=[...seed].reduce((sum,c)=>sum+c.charCodeAt(0),0);
  const variant = VARIANTS[code % VARIANTS.length];
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r="18" fill={color} />
        {variant === "circle" ? <Circle cx="20" cy="16" r="7" fill="#F7F7F7" /> : null}
        {variant === "bob" ? <Path d="M8 22 Q20 8 32 22" fill="#F7F7F7" /> : null}
        {variant === "spike" ? <Path d="M10 24 L20 8 L30 24 Z" fill="#F7F7F7" /> : null}
        {variant === "wave" ? <Path d="M8 18 Q14 10 20 18 T32 18 L32 26 L8 26 Z" fill="#F7F7F7" /> : null}
      </Svg>
    </View>
  );
}
