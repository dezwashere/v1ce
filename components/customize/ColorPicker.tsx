import React, { useEffect, useMemo, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const HUE_STOPS = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#00C7BE",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#FF3B30",
];

function hsvToHex(h: number, s = 0.82, v = 0.98) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHue(hex: string) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return 48;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return (h + 360) % 360;
}

export default function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const [width, setWidth] = useState(1);
  const [hue, setHue] = useState(() => hexToHue(value));

  useEffect(() => {
    setHue(hexToHue(value));
  }, [value]);

  const updateFromX = (x: number) => {
    const nextHue = Math.max(0, Math.min(359.9, (x / Math.max(width, 1)) * 360));
    setHue(nextHue);
    onChange(hsvToHex(nextHue));
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => updateFromX(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateFromX(event.nativeEvent.locationX),
      }),
    [width]
  );

  return (
    <View
      style={[styles.track, { borderColor: colors.foreground }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      {...responder.panHandlers}
    >
      {HUE_STOPS.map((color, index) => (
        <View key={index} style={[styles.stop, { backgroundColor: color }]} />
      ))}
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            left: `${(hue / 360) * 100}%`,
            borderColor: colors.foreground,
            backgroundColor: value,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 24,
    borderWidth: 2,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "visible",
    position: "relative",
  },
  stop: { flex: 1 },
  thumb: {
    position: "absolute",
    top: -5,
    width: 30,
    height: 30,
    marginLeft: -15,
    borderRadius: 15,
    borderWidth: 3,
  },
});
