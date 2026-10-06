import React, { useState } from "react";
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";

export default function ShareScreen() {
  const { profile, user } = useAuth();
  const c = useColors();
  const { t } = useTranslation();
  const [giftEmail, setGiftEmail] = useState("");
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);
  const widgetUrl = profile?.id ? `https://v1ce.app/w/${profile.id}` : "";

  const gift = async () => {
    const email = giftEmail.trim();
    if (!email) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        plan,
        giftEmail: email,
        gifterEmail: user?.email || "",
        successUrl: "v1ce://share?gift=1",
        cancelUrl: "v1ce://share",
      },
    });
    setBusy(false);
    if (error || !data?.url) {
      Alert.alert("V1CE", error?.message || "Gift checkout is not available.");
      return;
    }
    Linking.openURL(data.url);
  };

  const copyLink = async () => {
    if (!widgetUrl) return;
    Share.share({ message: widgetUrl });
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={[styles.pageTitle, { color: c.foreground }]}>{t("widget.title")}</Text>
      <Text style={[styles.pageSub, { color: c.mutedForeground }]}>{t("widget.shareAndInstallSub")}</Text>
      <View style={[styles.pwa, { backgroundColor: c.isDark ? "#D7E8FF" : "#E8F1FF", borderColor: "#9BB7E0" }]}>
        <Text style={styles.pwaTitle}>Add V1CE to Home Screen:</Text>
        <Text style={styles.pwaStep}>
          1. Tap the <Text style={styles.pwaEm}>Share</Text> icon (square with arrow)
        </Text>
        <Text style={styles.pwaStep}>
          2. Scroll and tap <Text style={styles.pwaEm}>Add to Home Screen</Text>
        </Text>
        <Text style={styles.pwaStep}>
          3. Name it <Text style={styles.pwaEm}>V1CE</Text> and tap <Text style={styles.pwaEm}>Add</Text>
        </Text>
        <View style={styles.pwaHint}>
          <Feather name="share" size={14} color="#1E3A5F" />
          <Text style={styles.pwaHintText}>Share icon in Safari bottom menu</Text>
        </View>
      </View>

      <View style={styles.widgetHead}>
        <Text style={[styles.section, { color: c.foreground }]}>{t("widget.widgetLink")}</Text>
        <TouchableOpacity
          onPress={() => Share.share({ message: widgetUrl || "My V1CE sobriety coin." })}
          style={[styles.previewBtn, { borderColor: c.foreground }]}
        >
          <Text style={[styles.previewBtnText, { color: c.foreground }]}>{t("widget.showPreview")}</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.linkRow, { borderColor: c.foreground }]}>
        <Text style={[styles.linkText, { color: widgetUrl ? c.foreground : c.mutedForeground }]} numberOfLines={1}>
          {widgetUrl || "Set up your profile first"}
        </Text>
        <TouchableOpacity onPress={copyLink} style={styles.copy}>
          <Feather name="copy" size={16} color={c.foreground} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.compat, { color: c.mutedForeground }]}>
        Compatible with: Widgy (iOS), KWGT (Android), or any widget-builder app.
      </Text>

      <View style={[styles.card, { borderColor: c.foreground }]}>
        <View style={styles.cardTitleRow}>
          <Feather name="heart" size={16} color={c.foreground} />
          <Text style={[styles.cardTitle, { color: c.foreground }]}>PAY IT FORWARD</Text>
        </View>
        <Text style={[styles.cardSub, { color: c.mutedForeground }]}>Gift Premium to someone on their sobriety journey.</Text>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>☀  GIFT OF THE YEAR — 3 MONTHS FREE AFTER 60 DAYS</Text>
        </View>
        <Text style={[styles.micro, { color: c.mutedForeground }]}>THEIR EMAIL</Text>
        <TextInput
          value={giftEmail}
          onChangeText={setGiftEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="friend@email.com"
          placeholderTextColor={c.mutedForeground}
          style={[styles.input, { borderColor: c.foreground, color: c.foreground }]}
        />
        <View style={styles.plans}>
          <TouchableOpacity
            onPress={() => setPlan("monthly")}
            style={[styles.plan, { backgroundColor: plan === "monthly" ? c.foreground : c.background, borderColor: c.foreground }]}
          >
            <Text style={[styles.planText, { color: plan === "monthly" ? c.background : c.foreground }]}>$2.99 / MO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPlan("yearly")}
            style={[styles.plan, { backgroundColor: plan === "yearly" ? c.foreground : c.background, borderColor: c.foreground }]}
          >
            <View style={styles.yearRow}>
              <Text style={[styles.strike, { color: c.mutedForeground }]}>$33</Text>
              <Text style={[styles.planText, { color: plan === "yearly" ? c.background : c.foreground }]}>$22 / YR</Text>
            </View>
            <View style={styles.off}>
              <Text style={styles.offText}>33% OFF</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity disabled={busy} onPress={gift} style={[styles.cta, { backgroundColor: c.foreground }]}>
          <Text style={[styles.ctaText, { color: c.background }]}>♡  SEND THE GIFT →</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48, gap: 0 },
  pageTitle: { fontFamily: fonts.display, fontSize: 52, lineHeight: 64, paddingTop: 4, marginBottom: 8 },
  pageSub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  pwa: { borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 22 },
  pwaTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: "#1E3A5F", marginBottom: 10 },
  pwaStep: { fontFamily: fonts.body, fontSize: 14, color: "#1E3A5F", lineHeight: 22, marginBottom: 4 },
  pwaEm: { fontFamily: fonts.bodyBold, color: "#1B4FBF" },
  pwaHint: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pwaHintText: { fontFamily: fonts.body, fontSize: 12, color: "#1E3A5F" },
  widgetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  section: { fontSize: 22, fontFamily: fonts.display, letterSpacing: 1 },
  previewBtn: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 6 },
  previewBtnText: { fontSize: 11, fontFamily: fonts.bodyBold },
  linkRow: { borderWidth: 2, minHeight: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  linkText: { flex: 1, fontFamily: fonts.body, fontSize: 13 },
  copy: { padding: 8 },
  compat: { fontSize: 12, fontFamily: fonts.body, marginTop: 8, marginBottom: 22, lineHeight: 18 },
  card: { borderWidth: 2, padding: 16, marginBottom: 16 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 22, fontFamily: fonts.display, letterSpacing: 1 },
  cardSub: { fontSize: 14, fontFamily: fonts.body, marginTop: 8, marginBottom: 14, lineHeight: 20 },
  banner: { backgroundColor: "#0A0A0A", padding: 12, marginBottom: 16 },
  bannerText: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6, color: "#FAFAFA" },
  micro: { fontSize: 10, letterSpacing: 1.8, fontFamily: fonts.bodyBold, marginBottom: 8 },
  input: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: fonts.body, marginBottom: 12 },
  plans: { flexDirection: "row", gap: 0, marginBottom: 12 },
  plan: { flex: 1, borderWidth: 2, minHeight: 56, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  planText: { fontFamily: fonts.extraBold, fontSize: 14, letterSpacing: 0.5 },
  yearRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  strike: { textDecorationLine: "line-through", fontSize: 12, fontFamily: fonts.body },
  off: { position: "absolute", right: 4, top: 4, backgroundColor: "#0A0A0A", paddingHorizontal: 4, paddingVertical: 2 },
  offText: { color: "#FFFFFF", fontSize: 8, fontFamily: fonts.bodyBold },
  cta: { height: 52, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: fonts.display, fontSize: 20, letterSpacing: 1 },
});
