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

const ROTATING_WORDS = [
  "SOBER", "UNBOTHERED", "HYDRATED", "EMPLOYABLE", "ASCENDING",
  "CRAZY", "SLAYING", "FEELING", "EXPERIENCING", "SHOWING UP",
  "CAFFEINATED", "UNHINGED", "VALID", "VIBING", "GRATEFUL",
  "GAY", "PROUD", "CLEAN", "HAPPY", "RICH", "LOVED",
];

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

const DOC_OPTIONS = [
  "Alcohol", "Benzodiazepines", "Caffeine", "Cannabis", "Cocaine",
  "Gambling", "Methamphetamine", "Nicotine", "Opioids", "Sugar",
];

function elapsed(start: string) {
  const startMs = new Date(`${start}T00:00:00`).getTime();
  const diff = Math.max(0, Date.now() - startMs);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function displayDate(start: string | null) {
  if (!start) return "—";
  const [y, m, d] = start.split("-");
  return `${m}/${d}/${y}`;
}

function Starburst({ dark }: { dark: boolean }) {
  return (
    <View pointerEvents="none" style={styles.starburst}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.starRay,
            {
              backgroundColor: dark ? "#FAFAFA" : "#0A0A0A",
              transform: [{ rotate: `${i * 15}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function DiamondMark({ reached }: { reached: boolean }) {
  return (
    <View style={[styles.diamond, reached && styles.diamondReached]}>
      <Text style={[styles.diamondText, reached && styles.diamondTextReached]}>
        {reached ? "✓" : "·"}
      </Text>
    </View>
  );
}

export default function HomeTab() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

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
        setSelectedDocs(data?.substances || []);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    const wordTimer = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 1500);
    const clockTimer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(wordTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const time = useMemo(
    () => (profile?.sobriety_date ? elapsed(profile.sobriety_date) : { days: 0, hours: 0, minutes: 0, seconds: 0 }),
    [profile?.sobriety_date, now]
  );

  const toggleDoc = async (doc: string) => {
    const next = selectedDocs.includes(doc)
      ? selectedDocs.filter((item) => item !== doc)
      : [...selectedDocs, doc];

    setSelectedDocs(next);
    if (profile && user) {
      await supabase.from("SobrietyProfile").update({ substances: next }).eq("email", user.email);
      setProfile({ ...profile, substances: next });
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: dark ? "#0A0A0A" : "#F7F7F7" }]}>
        <ActivityIndicator color="#F5A41A" />
      </View>
    );
  }

  const bg = dark ? "#0A0A0A" : "#F7F7F7";
  const fg = dark ? "#FAFAFA" : "#0A0A0A";
  const muted = dark ? "#A3A3A3" : "#737373";
  const border = dark ? "#2A2A2A" : "#0A0A0A";

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: bg, paddingTop: insets.top, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.topBar, { borderBottomColor: fg }]}>
        <Text style={[styles.logo, { color: fg }]}>V1CE.</Text>
        <Text style={[styles.version, { color: muted }]}>V1</Text>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push("/(tabs)/customize")}><Text style={[styles.topAction, { color: fg }]}>COIN</Text></Pressable>
          <Pressable onPress={() => router.push("/(tabs)/profile")}><Text style={[styles.topAction, { color: fg }]}>•••</Text></Pressable>
        </View>
      </View>

      <View style={[styles.hero, { borderBottomColor: fg }]}>
        <Starburst dark={dark} />
        <Text style={[styles.heroLine, { color: fg }]}>TIME</Text>
        <Text style={[styles.heroLine, { color: fg }]}>ELAPSED</Text>
        <Text style={[styles.rotating, { color: bg, borderColor: fg }]}>{ROTATING_WORDS[wordIndex]}</Text>
        <Text style={[styles.since, { color: muted }]}>
          {profile?.sobriety_date ? `SOBER SINCE ${displayDate(profile.sobriety_date)}` : "SET YOUR SOBRIETY DATE"}
        </Text>
      </View>

      <View style={[styles.timer, { borderBottomColor: fg }]}>
        <View style={styles.timerMain}>
          <Text style={[styles.days, { color: fg }]}>{time.days}</Text>
          <Text style={[styles.daysLabel, { color: muted }]}>DAYS</Text>
        </View>
        <View style={styles.subTimeRow}>
          {[
            [time.hours, "HRS"],
            [time.minutes, "MIN"],
            [time.seconds, "SEC"],
          ].map(([value, label]) => (
            <View key={label} style={[styles.subTime, { borderColor: border }]}>
              <Text style={[styles.subNumber, { color: fg }]}>{String(value).padStart(2, "0")}</Text>
              <Text style={[styles.subLabel, { color: muted }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.coinSection, { borderBottomColor: fg }]}>
        <Coin
          color={profile?.coin_color}
          shape={profile?.coin_shape || "circle"}
          motto={profile?.coin_motto}
          imageUrl={profile?.coin_photo}
          number={time.days}
        />
        <Pressable onPress={() => router.push("/(tabs)/customize")} style={[styles.customizeButton, { borderColor: fg }]}>
          <Text style={[styles.customizeText, { color: fg }]}>CUSTOMIZE →</Text>
        </Pressable>
      </View>

      <View style={[styles.section, { borderBottomColor: fg }]}>
        <Text style={[styles.sectionTitle, { color: fg }]}>WHAT’S{"\n"}YOUR DOC?</Text>
        <Text style={[styles.sectionSub, { color: muted }]}>SELECT WHAT YOU’RE STAYING FREE FROM.</Text>
        <View style={styles.docGrid}>
          {DOC_OPTIONS.map((doc) => {
            const active = selectedDocs.includes(doc);
            return (
              <Pressable
                key={doc}
                onPress={() => toggleDoc(doc)}
                style={[
                  styles.docChip,
                  { borderColor: fg, backgroundColor: active ? fg : "transparent" },
                ]}
              >
                <Text style={[styles.docText, { color: active ? bg : fg }]}>{doc}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: fg }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: fg }]}>YOUR{"\n"}MILESTONES.</Text>
          <Text style={[styles.milestoneCount, { color: muted }]}>{time.days} DAYS</Text>
        </View>
        <View style={styles.milestoneList}>
          {MILESTONES.map((milestone) => {
            const reached = time.days >= milestone.days;
            const remaining = Math.max(0, milestone.days - time.days);
            return (
              <View key={milestone.label} style={[styles.milestoneRow, { borderColor: border }]}>
                <DiamondMark reached={reached} />
                <Text style={[styles.milestoneLabel, { color: reached ? fg : muted }]}>{milestone.label}</Text>
                <Text style={[styles.milestoneStatus, { color: muted }]}>
                  {reached ? "REACHED" : `${remaining}D`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable onPress={() => router.push("/(tabs)/analytics")} style={[styles.bottomButton, { backgroundColor: fg }]}>
        <Text style={[styles.bottomButtonText, { color: bg }]}>CHECK IN TODAY →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
  },
  logo: { fontSize: 22, fontWeight: "900", letterSpacing: 3, fontFamily: "Inter_700Bold" },
  version: { marginLeft: 8, fontSize: 9, letterSpacing: 1.5, fontFamily: "Inter_600SemiBold" },
  topActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 18 },
  topAction: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, fontFamily: "Inter_700Bold" },
  hero: {
    minHeight: 230,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 20,
    borderBottomWidth: 2,
    position: "relative",
    overflow: "hidden",
  },
  heroLine: { fontSize: 58, lineHeight: 55, fontWeight: "900", letterSpacing: -2, fontFamily: "Inter_700Bold" },
  rotating: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
  since: { marginTop: 18, fontSize: 9, letterSpacing: 1.8, fontFamily: "Inter_600SemiBold" },
  starburst: { position: "absolute", right: 22, top: 24, width: 86, height: 86, alignItems: "center", justifyContent: "center", opacity: 0.12 },
  starRay: { position: "absolute", width: 2, height: 86 },
  timer: { paddingHorizontal: 20, paddingVertical: 22, borderBottomWidth: 2 },
  timerMain: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  days: { fontSize: 92, lineHeight: 96, fontWeight: "900", letterSpacing: -3, fontFamily: "Inter_700Bold" },
  daysLabel: { fontSize: 10, letterSpacing: 2, fontWeight: "800", fontFamily: "Inter_700Bold" },
  subTimeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  subTime: { flex: 1, borderWidth: 2, paddingVertical: 10, paddingHorizontal: 8 },
  subNumber: { fontSize: 24, fontWeight: "800", fontFamily: "Inter_700Bold" },
  subLabel: { marginTop: 2, fontSize: 8, letterSpacing: 1.5, fontFamily: "Inter_600SemiBold" },
  coinSection: { alignItems: "center", paddingVertical: 28, borderBottomWidth: 2 },
  customizeButton: { marginTop: 18, borderWidth: 2, paddingHorizontal: 18, paddingVertical: 11 },
  customizeText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 20, paddingVertical: 28, borderBottomWidth: 2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sectionTitle: { fontSize: 36, lineHeight: 34, fontWeight: "900", letterSpacing: -1, fontFamily: "Inter_700Bold" },
  sectionSub: { marginTop: 8, fontSize: 9, letterSpacing: 1.6, fontFamily: "Inter_600SemiBold" },
  docGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  docChip: { borderWidth: 2, paddingHorizontal: 11, paddingVertical: 9 },
  docText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, fontFamily: "Inter_700Bold" },
  milestoneCount: { fontSize: 9, letterSpacing: 1.5, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  milestoneList: { marginTop: 18 },
  milestoneRow: { minHeight: 54, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  diamond: { width: 25, height: 25, borderWidth: 2, transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center" },
  diamondReached: { backgroundColor: "#F5A41A", borderColor: "#F5A41A" },
  diamondText: { transform: [{ rotate: "-45deg" }], fontSize: 12, fontWeight: "900", color: "#737373" },
  diamondTextReached: { color: "#0A0A0A" },
  milestoneLabel: { flex: 1, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, fontFamily: "Inter_700Bold" },
  milestoneStatus: { fontSize: 9, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  bottomButton: { marginHorizontal: 20, marginTop: 24, height: 54, alignItems: "center", justifyContent: "center" },
  bottomButtonText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.8, fontFamily: "Inter_700Bold" },
});
