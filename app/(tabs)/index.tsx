import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Coin } from "../../components/Coin";

type Profile = {
  display_name: string | null;
  sobriety_date: string | null;
  substances: string[] | null;
  coin_motto: string | null;
  coin_color: string | null;
  coin_shape: string | null;
  coin_photo: string | null;
};

const LABELS = ["DAYS SOBER", "CLEAN TIME", "KEEP GOING", "ONE DAY AT A TIME"];
const MILESTONES = [
  { label: "1 DAY", days: 1 },
  { label: "1 WEEK", days: 7 },
  { label: "1 MONTH", days: 30 },
  { label: "2 MONTHS", days: 60 },
  { label: "90 DAYS", days: 90 },
  { label: "6 MONTHS", days: 180 },
  { label: "1 YEAR", days: 365 },
  { label: "2 YEARS", days: 730 },
];

function daysBetween(start: string) {
  const [y, m, d] = start.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((todayStart.getTime() - date.getTime()) / 86400000));
}

function displayDate(start: string | null) {
  if (!start) return "—";
  const [y, m, d] = start.split("-");
  return `${m}/${d}/${y}`;
}

export default function HomeTab() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("SobrietyProfile")
      .select("display_name, sobriety_date, substances, coin_motto, coin_color, coin_shape, coin_photo")
      .eq("email", user.email)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setLabelIndex((i) => (i + 1) % LABELS.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const days = useMemo(
    () => (profile?.sobriety_date ? daysBetween(profile.sobriety_date) : 0),
    [profile?.sobriety_date]
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: dark ? "#0A0A0A" : "#F7F7F7" }]}>
        <ActivityIndicator color="#F5A41A" />
      </View>
    );
  }

  const bg = dark ? "#0A0A0A" : "#F7F7F7";
  const fg = dark ? "#FAFAFA" : "#0A0A0A";
  const border = dark ? "#2A2A2A" : "#E0E0E0";
  const muted = dark ? "#A3A3A3" : "#737373";
  const card = dark ? "#1A1A1A" : "#FFFFFF";

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 110,
          backgroundColor: bg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>V1CE</Text>
          <Text style={[styles.greeting, { color: fg }]}>
            hey, {profile?.display_name || "friend"}.
          </Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/profile")} hitSlop={12}>
          <Text style={[styles.menu, { color: fg }]}>•••</Text>
        </Pressable>
      </View>

      <View style={[styles.counter, { backgroundColor: card, borderColor: fg }]}>
        <Text style={[styles.counterNumber, { color: fg }]}>{days}</Text>
        <Text style={[styles.counterLabel, { color: muted }]}>{LABELS[labelIndex]}</Text>
        <View style={[styles.dateRule, { backgroundColor: border }]} />
        <Text style={[styles.dateLabel, { color: muted }]}>
          SINCE {displayDate(profile?.sobriety_date || null)}
        </Text>
      </View>

      <View style={styles.coinWrap}>
        <Coin
          color={profile?.coin_color}
          shape={profile?.coin_shape || "circle"}
          motto={profile?.coin_motto}
          imageUrl={profile?.coin_photo}
          number={days}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: muted }]}>RECOVERY FROM</Text>
        <View style={styles.chips}>
          {(profile?.substances || []).map((item) => (
            <View
              key={item}
              style={[styles.chip, { borderColor: fg, backgroundColor: card }]}
            >
              <View style={styles.dot} />
              <Text style={[styles.chipText, { color: fg }]}>{item}</Text>
            </View>
          ))}
          {!profile?.substances?.length && (
            <Text style={[styles.muted, { color: muted }]}>nothing added yet</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: muted, marginBottom: 0 }]}>
            MILESTONES
          </Text>
          <Text style={[styles.progressText, { color: muted }]}>{days} DAYS</Text>
        </View>

        <View style={[styles.milestones, { borderColor: border }]}>
          {MILESTONES.map((milestone, index) => {
            const reached = days >= milestone.days;
            return (
              <View
                key={milestone.label}
                style={[
                  styles.milestone,
                  index !== MILESTONES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.milestoneMark,
                    {
                      borderColor: reached ? "#F5A41A" : border,
                      backgroundColor: reached ? "#F5A41A" : card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.milestoneMarkText,
                      { color: reached ? "#0A0A0A" : muted },
                    ]}
                  >
                    {reached ? "✓" : "·"}
                  </Text>
                </View>
                <Text style={[styles.milestoneLabel, { color: reached ? fg : muted }]}>
                  {milestone.label}
                </Text>
                <Text style={[styles.milestoneStatus, { color: muted }]}>
                  {reached ? "REACHED" : `${milestone.days - days}D`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable
        style={[styles.checkIn, { backgroundColor: fg }]}
        onPress={() => router.push("/(tabs)/analytics")}
      >
        <Text style={[styles.checkInText, { color: bg }]}>CHECK IN TODAY →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brand: {
    color: "#F5A41A",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4,
    fontFamily: "Inter_700Bold",
  },
  greeting: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  menu: { fontSize: 22, fontWeight: "800" },
  counter: {
    borderWidth: 2,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: "center",
  },
  counterNumber: {
    fontSize: 96,
    lineHeight: 100,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    fontFamily: "Inter_700Bold",
  },
  dateRule: { width: 42, height: 2, marginVertical: 12 },
  dateLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.8,
    fontFamily: "Inter_600SemiBold",
  },
  coinWrap: { alignItems: "center", paddingVertical: 28 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  progressText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
    fontFamily: "Inter_600SemiBold",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 38,
    borderWidth: 2,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: "#F5A41A" },
  chipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  muted: { fontSize: 12 },
  milestones: { borderWidth: 1 },
  milestone: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  milestoneMark: {
    width: 26,
    height: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
  },
  milestoneMarkText: { fontSize: 13, fontWeight: "800" },
  milestoneLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
  milestoneStatus: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
  checkIn: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkInText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    fontFamily: "Inter_700Bold",
  },
});
