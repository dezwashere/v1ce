import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCoinContext } from "@/context/CoinContext";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/lib/i18n";
import { supabase, TABLES } from "@/lib/supabase";
import { daysSince } from "@/constants/app";
import { fonts } from "@/constants/typography";
import SobrietyCoin from "@/components/coin/SobrietyCoin";
import RotatingLabel from "@/components/home/RotatingLabel";
import SobrietyCounter from "@/components/home/SobrietyCounter";
import SubstanceChecklist from "@/components/home/SubstanceChecklist";
import MilestoneTimeline from "@/components/home/MilestoneTimeline";
import MilestoneCalendarExport from "@/components/home/MilestoneCalendarExport";
import CalendarField from "@/components/onboarding/CalendarField";
import {
  AsteriskStar,
  BlobSplat,
  Crosshair,
  DiamondGrid,
  Halftone,
  Starburst,
  WarpedTorus,
} from "@/components/ui/RetroAccents";

export default function Home() {
  const { profile, setProfile } = useAuth();
  const { updateCoinData } = useCoinContext();
  const colors = useColors();
  const { t } = useTranslation();
  const router = useRouter();
  const [substances, setSubstances] = useState<string[]>(profile?.substances || []);
  const entrance = useRef(new Animated.Value(0)).current;
  const sobrietyDate = profile?.sobriety_date || "";
  const days = daysSince(sobrietyDate);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    setSubstances(profile?.substances || []);
  }, [profile?.substances]);

  useEffect(() => {
    updateCoinData({ days, color: profile?.coin_color || "#F5D680", displayName: profile?.display_name || "" });
  }, [days, profile?.coin_color, profile?.display_name, updateCoinData]);

  const persist = async (values: Record<string, unknown>) => {
    if (!profile?.id) return;
    const { data } = await supabase.from(TABLES.SobrietyProfile).update(values).eq("id", profile.id).select().single();
    if (data) setProfile(data);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { borderBottomColor: colors.foreground }]}>
        <View style={styles.burst}>
          <Starburst size={64} color={colors.foreground} opacity={0.06} />
        </View>
        <Animated.View
          style={{
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <Text style={[styles.days, { color: colors.foreground }]}>{days}</Text>
          <RotatingLabel />
          <View style={styles.coinWrap}>
            <SobrietyCoin
              days={days}
              shape={profile?.coin_shape || "circle"}
              color={profile?.coin_color || "#F5D680"}
              numberStyle={profile?.number_style || "classic"}
              size={250}
              displayName={profile?.display_name || ""}
              motto={profile?.coin_motto}
              customShapePath={profile?.coin_shape_path || undefined}
              showBorder={profile?.coin_show_border ?? true}
              coinPhoto={profile?.coin_photo || undefined}
              borderColor={profile?.coin_border_color || undefined}
              numberColor={profile?.coin_number_color || undefined}
              imageOnlyMode={profile?.coin_image_only || false}
              background={profile?.coin_background}
              substances={substances}
            />
          </View>
          <Pressable onPress={() => router.push("/(tabs)/settings")} style={styles.customizeWrap}>
            <Text style={[styles.link, { color: colors.mutedForeground, borderBottomColor: colors.mutedForeground }]}>
              SETTINGS
            </Text>
          </Pressable>
        </Animated.View>
        <View style={styles.splat}>
          <BlobSplat size={90} color={colors.foreground} opacity={0.05} />
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>STARTED ON</Text>
        <View style={styles.dateRow}>
          <Text style={[styles.date, { color: colors.foreground }]}>
            {sobrietyDate
              ? new Date(`${sobrietyDate}T00:00:00`).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }).toUpperCase()
              : "NOT SET"}
          </Text>
          <View style={styles.calendar}>
            <CalendarField
              value={sobrietyDate}
              onChange={(next) => {
                persist({ sobriety_date: next });
              }}
            />
          </View>
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <View style={styles.diamond}>
          <DiamondGrid size={72} color={colors.foreground} opacity={0.08} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("home.timeElapsed")}</Text>
        <SobrietyCounter sobrietyDate={sobrietyDate} />
      </View>

      <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
        <View style={styles.crosshair}>
          <Crosshair size={60} color={colors.foreground} opacity={0.08} />
        </View>
        <View style={styles.halftone}>
          <Halftone size={56} color={colors.foreground} opacity={0.06} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("home.whatsYourDoc")}</Text>
        <SubstanceChecklist
          selected={substances}
          onChange={(next) => {
            setSubstances(next);
            persist({ substances: next });
          }}
        />
      </View>

      {days > 0 ? (
        <View style={[styles.section, { borderBottomColor: colors.foreground }]}>
          <View style={styles.asterisk}>
            <AsteriskStar size={48} color={colors.foreground} opacity={0.09} />
          </View>
          <View style={styles.torus}>
            <WarpedTorus size={100} color={colors.foreground} opacity={0.07} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("home.yourMilestones")}</Text>
          <MilestoneTimeline days={days} />
          <MilestoneCalendarExport sobrietyDate={sobrietyDate} displayName={profile?.display_name} />
        </View>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { paddingBottom: 48 },
  hero: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, borderBottomWidth: 2, overflow: "hidden" },
  days: {
    fontSize: 128,
    lineHeight: 148,
    letterSpacing: -3,
    paddingTop: 4,
    fontFamily: fonts.display,
  },
  burst: { position: "absolute", right: 16, top: 16 },
  splat: { position: "absolute", left: -24, bottom: -16 },
  coinWrap: { alignItems: "center", paddingVertical: 16 },
  customizeWrap: { alignItems: "center", zIndex: 2 },
  link: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2.4,
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  section: { paddingHorizontal: 20, paddingVertical: 40, borderBottomWidth: 2, position: "relative", overflow: "hidden" },
  sectionTitle: { fontSize: 48, lineHeight: 58, paddingTop: 4, fontFamily: fonts.display, letterSpacing: 1, marginBottom: 24 },
  eyebrow: { fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 3, marginBottom: 8, textTransform: "uppercase" },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  date: { flex: 1, fontSize: 30, lineHeight: 40, paddingTop: 2, fontFamily: fonts.display, letterSpacing: 0.5 },
  calendar: { width: 148 },
  diamond: { position: "absolute", right: 12, top: 16 },
  crosshair: { position: "absolute", right: 16, top: 16 },
  halftone: { position: "absolute", right: 0, bottom: 16 },
  asterisk: { position: "absolute", right: 20, top: 20 },
  torus: { position: "absolute", right: -16, bottom: -16 },
});
