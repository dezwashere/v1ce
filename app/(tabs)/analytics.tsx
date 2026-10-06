import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";

export default function Analytics() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>{t("analytics.title")}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t("analytics.subtitle")}</Text>
      <View style={[styles.placeholder, { borderColor: colors.foreground }]}>
        <Text style={[styles.placeholderLabel, { color: colors.mutedForeground }]}>{t("analytics.progressOverTime")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 54, fontFamily: fonts.display, lineHeight: 66, paddingTop: 4, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 18, fontFamily: fonts.body },
  placeholder: { marginTop: 32, borderWidth: 2, minHeight: 220, alignItems: "center", justifyContent: "center", padding: 24 },
  placeholderLabel: { fontFamily: fonts.bodyBold, letterSpacing: 1, textTransform: "uppercase", fontSize: 12 },
});
