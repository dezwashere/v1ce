import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

const PATHS: Record<string, string> = {
  hexagon: "M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z",
  octagon: "M8 2 L16 2 L22 8 L22 16 L16 22 L8 22 L2 16 L2 8 Z",
  shield: "M12 2 L22 6 L22 14 L12 22 L2 14 L2 6 Z",
  diamond: "M12 2 L22 12 L12 22 L2 12 Z",
  star: "M12 1 L14.4 8.2 L22 8.2 L16 12.8 L18.2 20 L12 15.6 L5.8 20 L8 12.8 L2 8.2 L9.6 8.2 Z",
  cross: "M9 2 H15 V9 H22 V15 H15 V22 H9 V15 H2 V9 H9 Z",
  badge: "M12 1 L16 4 L21 3 L22 8 L24 12 L22 16 L21 21 L16 20 L12 23 L8 20 L3 21 L2 16 L0 12 L2 8 L3 3 L8 4 Z",
};

const VISIBLE_ORDER = ["star", "cross", "badge", "circle", "hexagon", "octagon", "shield", "diamond"] as const;

function ShapeIcon({ shape, color }: { shape: string; color: string }) {
  if (shape === "circle") {
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.8" />
      </Svg>
    );
  }
  const d = PATHS[shape];
  if (!d) return null;
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Path d={d} fill="none" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export default function ShapePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const { isPremium } = usePremium();
  const router = useRouter();
  return (
    <View>
      <View style={styles.grid}>
        {VISIBLE_ORDER.map((item) => {
          const locked = item !== "circle" && !isPremium;
          const active = value === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => (locked ? router.push("/(tabs)/premium") : onChange(item))}
              style={[
                styles.cell,
                { borderColor: active ? colors.foreground : colors.border },
                locked && { opacity: 0.45 },
              ]}
            >
              <ShapeIcon shape={item} color={colors.foreground} />
              <Text style={[styles.label, { color: colors.foreground }]}>{item.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
     </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: "22.5%",
    aspectRatio: 0.92,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  label: { fontSize: 8, fontFamily: fonts.bodyBold, letterSpacing: 0.6, textAlign: "center" },
});
