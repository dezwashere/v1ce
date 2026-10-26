import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Polygon } from "react-native-svg";
import { useRouter } from "expo-router";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";
import { normalizeShape, shapePolygon, pointsString } from "@/lib/coinDesign";
import { fonts } from "@/constants/typography";


const VISIBLE_ORDER = ["star", "badge", "circle", "hexagon", "octagon", "shield", "diamond"] as const;

function ShapeIcon({ shape, color }: { shape: string; color: string }) {
  if (shape === "circle") {
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.8" />
      </Svg>
    );
  }
  const d = pointsString(shapePolygon(shape));
  if (!d) return null;
  return (
    <Svg width={28} height={28} viewBox="0 0 100 100">
      <Polygon points={d} fill="none" stroke={color} strokeWidth="5" />
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
          const active = normalizeShape(value) === item;
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
