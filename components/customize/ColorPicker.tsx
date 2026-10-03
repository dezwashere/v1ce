import React, { useState } from "react";
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

const RAINBOW = [
  { name: "RED", color: "#FF3B30", shades: ["#7A1712", "#C92A22", "#FF3B30", "#FF756D", "#FFB3AF"] },
  { name: "ORANGE", color: "#FF9500", shades: ["#7A4700", "#C97300", "#FF9500", "#FFB44D", "#FFD399"] },
  { name: "YELLOW", color: "#FFCC00", shades: ["#7A6200", "#C9A100", "#FFCC00", "#FFDB4D", "#FFEB99"] },
  { name: "GREEN", color: "#34C759", shades: ["#185E2A", "#289B45", "#34C759", "#70D889", "#ADE9BA"] },
  { name: "BLUE", color: "#007AFF", shades: ["#003A7A", "#0060C9", "#007AFF", "#4DA2FF", "#99CAFF"] },
  { name: "INDIGO", color: "#5856D6", shades: ["#292865", "#4543A7", "#5856D6", "#8987E2", "#BAB9EF"] },
  { name: "VIOLET", color: "#AF52DE", shades: ["#522668", "#8840AD", "#AF52DE", "#C985E8", "#E2B9F2"] },
];

export default function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const [familyIndex, setFamilyIndex] = useState(2);
  const [shadeIndex, setShadeIndex] = useState(2);
  const selected = RAINBOW[familyIndex];

  const chooseShade = (x: number, width: number) => {
    const next = Math.max(0, Math.min(4, Math.round((x / Math.max(width, 1)) * 4)));
    setShadeIndex(next);
    onChange(selected.shades[next]);
  };

  const [sliderWidth, setSliderWidth] = useState(1);
  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => chooseShade(event.nativeEvent.locationX, sliderWidth),
    onPanResponderMove: (event) => chooseShade(event.nativeEvent.locationX, sliderWidth),
  }), [familyIndex, sliderWidth]);

  return (
    <View>
      <View style={styles.wrap}>
        {RAINBOW.map((family, index) => (
          <TouchableOpacity
            key={family.name}
            accessibilityLabel={`Select ${family.name.toLowerCase()}`}
            accessibilityState={{ selected: index === familyIndex }}
            onPress={() => {
              setFamilyIndex(index);
              setShadeIndex(2);
              onChange(family.color);
            }}
            style={styles.choice}
          >
            <View style={[styles.swatch, { backgroundColor: family.color, borderColor: index === familyIndex ? colors.foreground : "transparent" }]} />
            <Text style={[styles.name, { color: index === familyIndex ? colors.foreground : colors.mutedForeground }]}>{family.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.custom}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{selected.name}</Text>
        <View
          style={[styles.slider, { borderColor: colors.foreground }]}
          onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
          {...responder.panHandlers}
        >
          {selected.shades.map((shade) => <View key={shade} style={[styles.segment, { backgroundColor: shade }]} />)}
          <View pointerEvents="none" style={[styles.thumb, { left: `${shadeIndex * 25}%`, borderColor: colors.foreground, backgroundColor: value }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  choice: { flex: 1, alignItems: "center" },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
  name: { marginTop: 6, fontSize: 7, fontFamily: fonts.bodyBold, letterSpacing: 0.4 },
  custom: { marginTop: 22 },
  label: { fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 2, marginBottom: 8 },
  slider: { height: 36, borderWidth: 2, flexDirection: "row", position: "relative", overflow: "hidden" },
  segment: { flex: 1 },
  thumb: { position: "absolute", top: 4, width: 24, height: 24, marginLeft: -12, borderRadius: 12, borderWidth: 3 },
});
