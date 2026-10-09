import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";

export default function BirthdayPrompts({ onSelect }: { onSelect: (text: string) => void }) {
  const colors = useColors();
  const { tList } = useTranslation();
  const prompts = tList("birthday.prompts");
  return (
    <View style={styles.wrap}>
      {prompts.map((prompt) => (
        <TouchableOpacity
          key={prompt}
          onPress={() => onSelect(prompt)}
          style={[styles.chip, { borderColor: colors.foreground }]}
        >
          <Text style={{ color: colors.foreground, fontSize: 12, fontFamily: fonts.bodyBold }}>{prompt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 12 },
  chip: { borderWidth: 2, padding: 12 },
});
