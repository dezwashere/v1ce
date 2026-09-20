import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendReset() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return Alert.alert("Enter your email", "We need your email to send the reset link.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: Linking.createURL("auth/callback"),
    });
    setBusy(false);
    if (error) return Alert.alert("Couldn't send reset link", error.message);
    Alert.alert("Check your email", "We sent you a password reset link.", [{ text: "OK", onPress: () => router.replace("/sign-in") }]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>V1CE</Text>
        <Text style={styles.title}>Reset your password.</Text>
        <Text style={styles.subtitle}>We'll send a secure reset link to your email.</Text>
        <TextInput style={styles.input} placeholder="email" placeholderTextColor="#737373" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Pressable style={styles.primaryButton} onPress={sendReset} disabled={busy}>
          <Text style={styles.primaryText}>{busy ? "Sending..." : "Send reset link"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Back to sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { flex: 1, justifyContent: "center", padding: 28 },
  brand: { fontSize: 18, fontWeight: "800", letterSpacing: 3, color: "#F5A41A", marginBottom: 28 },
  title: { fontSize: 32, fontWeight: "800", color: "#0A0A0A" },
  subtitle: { marginTop: 10, marginBottom: 28, fontSize: 16, lineHeight: 23, color: "#737373" },
  input: { height: 54, borderWidth: 2, borderColor: "#E0E0E0", backgroundColor: "#FFFFFF", paddingHorizontal: 16, color: "#0A0A0A", fontSize: 16 },
  primaryButton: { height: 54, alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A", marginTop: 18 },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: { alignItems: "center", padding: 18 },
  secondaryText: { color: "#0A0A0A", fontSize: 15, fontWeight: "600" },
});