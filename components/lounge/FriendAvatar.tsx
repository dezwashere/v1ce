import React from "react";
import { Image, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export default function FriendAvatar({ seed, uri, size = 58 }: { seed: string; uri?: string | null; size?: number }) {
  const hash = [...seed].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const tilt = (hash % 15) - 7;
  const eyeY = 38 + (hash % 7);
  const smile = hash % 2 === 0;
  const frame = { width: size, height: size, borderRadius: size / 2, overflow: "hidden" as const };
  if (uri && /^https:\/\//i.test(uri)) {
    return <View style={frame}><Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" /></View>;
  }
  return <View style={frame}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="49" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
      <Path d="M8 101 Q14 76 36 73 Q51 83 65 73 Q88 78 93 101" stroke="#111111" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M28 41 Q22 17 48 15 Q76 12 75 43 L70 59 Q60 75 49 75 Q35 73 29 58 Z" stroke="#111111" strokeWidth="3" fill="white" transform={`rotate(${tilt} 50 50)`} />
      <Path d="M26 39 Q26 12 51 13 Q77 12 76 38 Q67 30 61 24 Q45 38 26 39" stroke="#111111" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d={`M37 ${eyeY} l5 -1 M58 ${eyeY - 1} l5 1`} stroke="#111111" strokeWidth="3" strokeLinecap="round" />
      <Path d="M51 45 l-3 10 l5 1" stroke="#111111" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d={smile ? "M42 61 Q51 68 60 60" : "M42 64 Q51 60 60 64"} stroke="#111111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  </View>;
}
