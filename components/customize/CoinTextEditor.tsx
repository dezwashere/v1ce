import React from "react";
import { Text, View } from "react-native";
import CoinFace from "@/components/coin/CoinFace";
import { normalizeLayout, type CoinInput, type CoinTextLayout } from "@/lib/coinDesign";
import { useColors } from "@/hooks/useColors";

/** Automatic layout preview. Position and font controls are intentionally not exposed. */
export default function CoinTextEditor({ input, value }: { input: CoinInput; value: CoinTextLayout; onChange: (next: CoinTextLayout) => void }) {
  const colors = useColors();
  return <View style={{ gap: 10, marginVertical: 16 }}>
    <Text style={{ color: colors.foreground }}>AUTOMATIC TEXT LAYOUT</Text>
    <Text style={{ color: colors.mutedForeground }}>V1CE centers, wraps, sizes, and fits text automatically for each coin shape and face.</Text>
    <View style={{ alignSelf: "center" }}><CoinFace {...input} size={240} textLayout={normalizeLayout(value)} face="front" /></View>
  </View>;
}
