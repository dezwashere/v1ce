import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const steps = ["name", "sobriety", "substances"] as const;

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [sobrietyDate, setSobrietyDate] = useState("");
  const [substances, setSubstances] = useState("");

  if (!user) {
    router.replace("/sign-in");
    return null;
  }

  const userId = user.id;

  async function finish() {
    if (!name.trim() || !sobrietyDate.trim()) {
      Alert.alert("Almost there", "Enter your name and sobriety date.");
      return;
    }

    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(sobrietyDate.trim())) {
      Alert.alert("Check the date", "Use YYYY-MM-DD, like 2020-11-15.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        display_name: name.trim(),
        sobriety_date: sobrietyDate.trim(),
        substances: substances.split(",").map((item) => item.trim()).filter(Boolean),
      },
      { onConflict: "id" },
    );

    if (error) {
      Alert.alert("Couldn't save your profile", error.message);
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.progress}>STEP {step + 1} OF {steps.length}</Text>
        <Text style={styles.title}>
          {step === 0 ? "What should we call you?" : step === 1 ? "When did your sobriety begin?" : "What are you in recovery from?"}
        </Text>
        <Text style={styles.subtitle}>
          {step === 0
            ? "This is the name we'll use inside V1CE."
            : step === 1
              ? "Use YYYY-MM-DD for now. We can make this prettier later."
              : "Optional. Separate multiple answers with commas."}
        </Text>

        {step === 0 && (
          <TextInput
            style={styles.input}
            placeholder="your name"
            placeholderTextColor="#737373"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        )}

        {step === 1 && (
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#737373"
            value={sobrietyDate}
            onChangeText={setSobrietyDate}
            keyboardType="numbers-and-punctuation"
            autoFocus
          />
        )}

        {step === 2 && (
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="alcohol, drugs, etc."
            placeholderTextColor="#737373"
            value={substances}
            onChangeText={setSubstances}
            multiline
            autoFocus
          />
        )}

        <View style={styles.actions}>
          {step > 0 && (
            <Pressable style={styles.secondaryButton} onPress={() => setStep(step - 1)}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
          )}
          <Pressable style={styles.primaryButton} onPress={() => step < steps.length - 1 ? setStep(step + 1) : finish()}>
            <Text style={styles.primaryText}>{step < steps.length - 1 ? "Continue" : "Finish"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { flex: 1, justifyContent: "center", padding: 28 },
  progress: { fontSize: 13, fontWeight: "800", letterSpacing: 2, color: "#F5A41A", marginBottom: 18 },
  title: { fontSize: 32, fontWeight: "800", color: "#0A0A0A" },
  subtitle: { marginTop: 10, marginBottom: 28, fontSize: 16, lineHeight: 23, color: "#737373" },
  input: { minHeight: 54, borderWidth: 2, borderColor: "#E0E0E0", backgroundColor: "#FFFFFF", paddingHorizontal: 16, color: "#0A0A0A", fontSize: 16 },
  multiline: { minHeight: 110, paddingTop: 16, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  primaryButton: { flex: 1, height: 54, alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A" },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: { height: 54, paddingHorizontal: 22, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#0A0A0A" },
  secondaryText: { color: "#0A0A0A", fontSize: 16, fontWeight: "700" },
});
