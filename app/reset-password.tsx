import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function updatePassword() {
    if (password.length < 8) return Alert.alert("Password too short", "Use at least 8 characters.");
    if (password !== confirm) return Alert.alert("Passwords don't match", "Enter the same password twice.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return Alert.alert("Couldn't update password", error.message);
    Alert.alert("Password updated", "You can sign in with your new password now.", [{ text: "Continue", onPress: () => router.replace("/sign-in") }]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>V1CE</Text>
        <Text style={styles.title}>Choose a new password.</Text>
        <Text style={styles.subtitle}>Make it something you can keep secure.</Text>
        <TextInput style={styles.input} placeholder="new password" placeholderTextColor="#737373" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="confirm password" placeholderTextColor="#737373" secureTextEntry value={confirm} onChangeText={setConfirm} />
        <Pressable style={styles.primaryButton} onPress={updatePassword} disabled={busy}>
          <Text style={styles.primaryText}>{busy ? "Updating..." : "Update password"}</Text>
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
  subtitle: { marginTop: 10, marginBottom: 28, fontSize: 16, color: "#737373" },
  input: { height: 54, borderWidth: 2, borderColor: "#E0E0E0", backgroundColor: "#FFFFFF", paddingHorizontal: 16, marginBottom: 12, color: "#0A0A0A", fontSize: 16 },
  primaryButton: { height: 54, alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A", marginTop: 8 },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});