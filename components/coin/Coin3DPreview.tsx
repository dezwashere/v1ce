import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { coinTime } from "@/lib/coinDesign";
import { V1CECoinView } from "@/modules/v1ce-coin-renderer/src";

export type Coin3DPreviewProps = {
  days?: number;
  displayName?: string;
  motto?: string;
  substances?: string[];
  color?: string;
  numberStyle?: string;
  size?: number;
  showBack?: boolean;
};

export default function Coin3DPreview(props: Coin3DPreviewProps) {
  if (Platform.OS !== "ios" || !V1CECoinView) return null;
  const time = coinTime(props.days || 0);
  const requestJSON = JSON.stringify({
    displayName: props.displayName || "",
    milestone: `${time.value} ${time.unit}`,
    coinMotto: props.motto || "",
    selections: (props.substances || []).slice(0, 3),
    color: props.color || "gold",
    numberStyle: props.numberStyle || "walter_turncoat",
    showBack: !!props.showBack,
    width: props.size || 260,
    height: props.size || 260,
  });
  return <View style={[styles.container, { width: props.size || 260, height: props.size || 260 }]}>
    <V1CECoinView style={StyleSheet.absoluteFill} requestJSON={requestJSON} />
  </View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: "transparent" } });
