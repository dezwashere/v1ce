import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
  coin_image_url: string | null;
};

function daysBetween(start: string) {
  const [y, m, d] = start.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((todayStart.getTime() - date.getTime()) / 86400000));
}

export default function HomeTab() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, sobriety_date, substances, coin_motto, coin_color, coin_shape, coin_image_url").eq("id", user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user]);

  const days = useMemo(() => profile?.sobriety_date ? daysBetween(profile.sobriety_date) : 0, [profile?.sobriety_date]);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>V1CE</Text>
          <Text style={styles.greeting}>hey, {profile?.display_name || "friend"}.</Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/profile")}><Text style={styles.settings}>•••</Text></Pressable>
      </View>

      <View style={styles.counter}>
        <Text style={styles.counterNumber}>{days}</Text>
        <Text style={styles.counterLabel}>DAYS SOBER</Text>
      </View>

      <Coin color={profile?.coin_color} shape={profile?.coin_shape || "circle"} motto={profile?.coin_motto} imageUrl={profile?.coin_image_url} number={days} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>RECOVERY FROM</Text>
        <View style={styles.chips}>
          {(profile?.substances || []).map((item) => <View key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text></View>)}
          {!profile?.substances?.length && <Text style={styles.muted}>nothing added yet</Text>}
        </View>
      </View>

      <Pressable style={styles.checkIn} onPress={() => router.push("/(tabs)/analytics")}>
        <Text style={styles.checkInText}>CHECK IN TODAY →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 110, backgroundColor: "#F7F7F7" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  kicker: { color: "#F5A41A", fontWeight: "800", letterSpacing: 3, fontSize: 14 },
  greeting: { marginTop: 5, color: "#0A0A0A", fontSize: 24, fontWeight: "800" },
  settings: { fontSize: 22, fontWeight: "800" },
  counter: { borderWidth: 2, borderColor: "#0A0A0A", paddingVertical: 22, alignItems: "center", backgroundColor: "#FFFFFF" },
  counterNumber: { fontSize: 72, lineHeight: 76, fontWeight: "800", color: "#0A0A0A" },
  counterLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 3, color: "#737373" },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2, color: "#737373", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 2, borderColor: "#0A0A0A", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  chipText: { fontSize: 13, fontWeight: "700" },
  muted: { color: "#737373" },
  checkIn: { height: 54, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" },
  checkInText: { color: "#FFFFFF", fontWeight: "800", letterSpacing: 1.5 },
});
