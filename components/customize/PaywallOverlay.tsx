import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "@/lib/i18n";

export default function PaywallOverlay({ children }: { children?: React.ReactNode }) {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      {children}
      <View style={[styles.overlay, { backgroundColor: colors.background + "CC" }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.lock, { backgroundColor: colors.secondary }]}>
            <Feather name="lock" size={20} color={colors.foreground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("paywall.unlock")}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {t("paywall.body")}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/premium")} style={[styles.button, { backgroundColor: colors.foreground }]}>
            <Feather name="star" size={16} color={colors.background} />
            <Text style={{ color: colors.background, fontFamily: fonts.bodyBold }}>{t("paywall.upgrade")}</Text>
          </TouchableOpacity>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>{t("paywall.purchase")}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", padding: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: "center" },
  lock: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 18, fontFamily: fonts.display, marginBottom: 6 },
  body: { fontSize: 13, lineHeight: 18, fontFamily: fonts.body, textAlign: "center", marginBottom: 14 },
  button: { height: 44, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  note: { fontSize: 11, fontFamily: fonts.body, marginTop: 8 },
});
