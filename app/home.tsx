import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/sign-in");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>V1CE</Text>
      <Text style={styles.title}>You're in.</Text>
      <Text style={styles.subtitle}>Your account and profile are connected to Supabase.</Text>

      <Pressable style={styles.primaryButton} onPress={() => router.push("/onboarding")}>
        <Text style={styles.primaryText}>Edit profile</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={signOut}>
        <Text style={styles.secondaryText}>Sign out</Text>
      </Pressable>

      <Text style={styles.user}>{user?.email ?? ""}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#F7F7F7" },
  brand: { fontSize: 18, fontWeight: "800", letterSpacing: 3, color: "#F5A41A", marginBottom: 36 },
  title: { fontSize: 38, fontWeight: "800", color: "#0A0A0A" },
  subtitle: { marginTop: 10, marginBottom: 28, fontSize: 16, lineHeight: 23, color: "#737373" },
  primaryButton: { height: 54, alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A" },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: { height: 54, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#0A0A0A", marginTop: 10 },
  secondaryText: { color: "#0A0A0A", fontSize: 16, fontWeight: "700" },
  user: { marginTop: 18, textAlign: "center", color: "#737373" },
});
