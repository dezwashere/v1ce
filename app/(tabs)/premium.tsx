import React, { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";

const PERKS = [
  { translation: 2, icon: "circle" },
  { translation: 3, icon: "users" },
  { translation: 4, icon: "message-circle" },
  { translation: 5, icon: "image" },
] as const;

export default function Premium() {
  const { profile, refreshProfile } = useAuth();
  const colors = useColors();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const isPremium = !!profile?.is_premium;

  // Stripe returns to v1ce://premium. Refresh whenever this route regains focus
  // so webhook-applied entitlement changes appear without restarting the app.
  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile])
  );

  const checkout = async () => {
    if (isPremium || loading) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan, successUrl: "v1ce://premium?success=1", cancelUrl: "v1ce://premium" },
    });
    setLoading(false);
    if (error || !data?.url) {
      Alert.alert("V1CE", error?.message || "Checkout is not available yet.");
      return;
    }
    Linking.openURL(data.url);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>{t("premium.title")}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t("premium.subtitle")}</Text>
      {isPremium ? (
        <View style={[styles.badge, { borderColor: colors.gold, backgroundColor: colors.gold }]}>
          <Text style={{ color: colors.goldForeground, fontFamily: fonts.black, letterSpacing: 2 }}>{t("premium.youre")}</Text>
        </View>
      ) : (
        <>
          <View style={styles.plans}>
            <TouchableOpacity onPress={() => setPlan("monthly")} style={[styles.plan, { borderColor: plan === "monthly" ? colors.foreground : colors.border }]}>
              <Text style={[styles.planTitle, { color: colors.foreground }]}>$2.99/MO</Text>
              <Text style={[styles.planSub, { color: colors.mutedForeground }]}>Monthly access</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPlan("yearly")} style={[styles.plan, { borderColor: plan === "yearly" ? colors.foreground : colors.border }]}>
              <Text style={[styles.planTitle, { color: colors.foreground }]}>$30/YR</Text>
              <Text style={[styles.planSub, { color: colors.mutedForeground }]}>Best value</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={checkout} style={[styles.button, { backgroundColor: colors.gold, opacity: loading ? 0.5 : 1 }]}>
            <Text style={{ color: colors.goldForeground, fontFamily: fonts.black, letterSpacing: 2 }}>{loading ? "..." : t("premium.unlock")}</Text>
          </TouchableOpacity>
        </>
      )}
      {PERKS.map((perk, i) => {
        const n = i + 1;
        const title = t(`premium.perk${perk.translation}Title`);
        const desc = t(`premium.perk${perk.translation}Desc`);
        return (
          <View key={title} style={[styles.perk, { borderBottomColor: colors.border }]}>
            <View style={[styles.icon, { borderColor: colors.foreground }]}>
              <Feather name={perk.icon} size={16} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.perkTitle, { color: colors.foreground }]}>{n}. {title}</Text>
              <Text style={[styles.desc, { color: colors.mutedForeground }]}>{desc}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 64, fontFamily: fonts.display, lineHeight: 76, paddingTop: 6, letterSpacing: 1 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 16, fontFamily: fonts.body },
  badge: { borderWidth: 2, padding: 12, alignSelf: "flex-start", marginTop: 24 },
  plans: { flexDirection: "row", gap: 8, marginTop: 24 },
  plan: { flex: 1, borderWidth: 2, padding: 14, minHeight: 82 },
  planTitle: { fontSize: 24, fontFamily: fonts.display, letterSpacing: 1 },
  planSub: { fontSize: 10, marginTop: 6, fontFamily: fonts.body },
  button: { height: 56, alignItems: "center", justifyContent: "center", marginTop: 16 },
  perk: { flexDirection: "row", gap: 14, paddingVertical: 18, borderBottomWidth: 1, alignItems: "center" },
  icon: { width: 32, height: 32, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  perkTitle: { fontSize: 15, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  desc: { fontSize: 12, lineHeight: 18, marginTop: 4, fontFamily: fonts.body },
});
