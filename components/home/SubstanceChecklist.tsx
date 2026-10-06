import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SUBSTANCES } from "@/constants/app";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export default function SubstanceChecklist({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const colors = useColors();
  const customValues = selected.filter((value) => !SUBSTANCES.includes(value));
  const otherActive = selected.includes("Other") || customValues.length > 0;
  const otherValue = customValues[0] || "";
  const toggle = (item: string) => {
    if (item === "Other") {
      onChange(otherActive ? selected.filter((value) => value !== "Other" && SUBSTANCES.includes(value)) : [...selected, "Other"]);
      return;
    }
    onChange(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item]);
  };
  return (
    <View style={styles.wrap}>
      {SUBSTANCES.map((item) => {
        const active = item === "Other" ? otherActive : selected.includes(item);
        return (
          <TouchableOpacity
            key={item}
            onPress={() => toggle(item)}
            style={[
              styles.chip,
              { borderColor: colors.foreground, backgroundColor: active ? colors.foreground : "transparent" },
            ]}
          >
            <Text style={{ color: active ? colors.background : colors.foreground, fontSize: 12, fontFamily: fonts.bodyBold, letterSpacing: 0.6 }}>
              {item.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
      {otherActive ? (
        <TextInput
          value={otherValue}
          onChangeText={(value) => {
            const base = selected.filter((item) => item !== "Other" && SUBSTANCES.includes(item));
            onChange(value.trim() ? [...base, value.slice(0, 60)] : [...base, "Other"]);
          }}
          placeholder="TYPE YOUR DOC"
          placeholderTextColor={colors.mutedForeground}
          maxLength={60}
          style={[styles.otherInput, { borderColor: colors.foreground, color: colors.foreground }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 10 },
  otherInput: { width: "100%", borderWidth: 2, minHeight: 48, paddingHorizontal: 12, fontSize: 15, fontFamily: fonts.body },
});
