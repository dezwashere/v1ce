import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

const SUBSTANCES = ["Alcohol","Benzodiazepines","Caffeine","Cannabis","Cocaine","Gambling","Methamphetamine","Nicotine","OCD Compulsions","Opioids","Prescription Drugs","Social Media","Sugar","Other"];

function formatDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function toDatabaseDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1]}-${match[2]}` : "";
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [substances, setSubstances] = useState<string[]>([]);
  const [eula, setEula] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user, setProfile } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const toggleSubstance = (value: string) => {
    setSubstances((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const handleSave = async () => {
    const sobrietyDate = toDatabaseDate(date);
    if (!sobrietyDate || !user?.id || saving) return;
    setSaving(true);
    await AsyncStorage.setItem("v1ce_email", email.trim().toLowerCase());
    const values = {
      id: user.id,
      email: email.trim().toLowerCase(),
      display_name: name.trim(),
      sobriety_date: sobrietyDate,
      substances,
      coin_color: "#F5D680",
      coin_shape: "circle",
      number_style: "classic",
      coin_show_border: true,
      coin_border_color: null,
      coin_number_color: null,
      coin_photo: null,
      coin_image_only: false,
      coin_motto: "",
      avatar_url: null,
      gifted_count: 0,
      is_premium: false,
      coin_balance: 0,
    };
    const { data, error } = await supabase.from("profiles").upsert(values).select().single();
    if (error) {
      Alert.alert("V1CE", error.message);
      setSaving(false);
      return;
    }
    setProfile(data);
    router.replace("/(tabs)");
    setSaving(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
      <Text style={[styles.step, { color: colors.gold }]}>STEP {step + 1} / 4</Text>

      {step === 0 && (
        <>
          <Text style={[styles.title, { color: colors.foreground }]}>WELCOME{"\n"}TO V1CE.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your sobriety, your coin. Let's get you set up — no account needed.</Text>
          <Text style={[styles.label, { color: colors.foreground }]}>YOUR NAME OR NICKNAME</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your name or nickname" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.foreground }]} />
          <TouchableOpacity onPress={() => setEula((value) => !value)} style={styles.eula}>
            <View style={[styles.box, { borderColor: colors.foreground, backgroundColor: eula ? colors.foreground : "transparent" }]}>
              {eula ? <Text style={{ color: colors.background, fontWeight: "900" }}>✓</Text> : null}
            </View>
            <Text style={[styles.eulaText, { color: colors.mutedForeground }]}>I agree to the Terms of Use & Community Guidelines. I understand V1CE has a zero tolerance policy for harassment, abuse, or harmful content.</Text>
          </TouchableOpacity>
          <Button label="NEXT →" disabled={!name.trim() || !eula} onPress={() => setStep(1)} colors={colors} />
        </>
      )}

      {step === 1 && (
        <>
          <Text style={[styles.title, { color: colors.foreground }]}>WHAT IS{"\n"}YOUR EMAIL?</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Used for friend connections and V1CE account communication.</Text>
          <Text style={[styles.label, { color: colors.foreground }]}>EMAIL</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.foreground }]} />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setStep(0)} style={[styles.backButton, { borderColor: colors.foreground }]}><Text style={{ color: colors.foreground, fontWeight: "800" }}>← BACK</Text></TouchableOpacity>
            <Button label="NEXT →" disabled={!/^\S+@\S+\.\S+$/.test(email)} onPress={() => setStep(2)} colors={colors} />
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={[styles.title, { color: colors.foreground }]}>WHEN DID{"\n"}YOU START?</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Enter the first day of your sobriety journey.</Text>
          <Text style={[styles.label, { color: colors.foreground }]}>SOBRIETY DATE</Text>
          <TextInput value={date} onChangeText={(value) => setDate(formatDate(value))} maxLength={10} keyboardType="number-pad" placeholder="MM/DD/YYYY" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.foreground }]} />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setStep(1)} style={[styles.backButton, { borderColor: colors.foreground }]}><Text style={{ color: colors.foreground, fontWeight: "800" }}>← BACK</Text></TouchableOpacity>
            <Button label="NEXT →" disabled={!/^\d{2}\/\d{2}\/\d{4}$/.test(date)} onPress={() => setStep(3)} colors={colors} />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={[styles.title, { color: colors.foreground }]}>WHAT'S{"\n"}YOUR DOC?</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Select what you're staying free from. (optional)</Text>
          <View style={styles.wrap}>
            {SUBSTANCES.map((item) => {
              const selected = substances.includes(item);
              return <TouchableOpacity key={item} onPress={() => toggleSubstance(item)} style={[styles.chip, { borderColor: colors.foreground, backgroundColor: selected ? colors.foreground : "transparent" }]}><Text style={{ color: selected ? colors.background : colors.foreground }}>{item}</Text></TouchableOpacity>;
            })}
          </View>
          <Button label="START MY JOURNEY →" disabled={saving} onPress={handleSave} colors={colors} />
        </>
      )}
    </View>
  );
}

function Button({ label, onPress, disabled, colors }: { label: string; onPress: () => void; disabled?: boolean; colors: any }) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button, { backgroundColor: colors.foreground, opacity: disabled ? 0.3 : 1 }]}><Text style={{ color: colors.background, fontWeight: "800", fontSize: 15, letterSpacing: 1 }}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  step: { fontSize: 10, fontWeight: "800", letterSpacing: 3, marginBottom: 24 },
  title: { fontSize: 48, fontWeight: "900", lineHeight: 48, marginBottom: 18, letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 28 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  input: { borderWidth: 2, padding: 14, fontSize: 17 },
  eula: { flexDirection: "row", gap: 10, marginTop: 18 },
  box: { width: 24, height: 24, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  eulaText: { flex: 1, fontSize: 11, lineHeight: 16 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2 },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: "auto" },
  backButton: { borderWidth: 2, height: 56, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  button: { height: 56, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", marginTop: "auto", alignSelf: "stretch" },
});
