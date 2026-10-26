import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export default function BirthdayPrompts({ onSelect }: { onSelect: (text: string) => void }) {
  const colors = useColors();
  const prompts = [
    "Happy birthday! Here's to more laughter, new adventures, and a whole lot of good things coming your way.",
    "Look how far you've come. You deserve to be celebrated today and every day. Happy birthday!",
    "The world is better with you in it. Wishing you a beautiful birthday and an even better year ahead.",
  ];
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
