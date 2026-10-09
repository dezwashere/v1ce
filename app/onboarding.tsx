import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { supabase, TABLES, defaultProfileFields } from "@/lib/supabase";
import { ONBOARDING_SUBSTANCES } from "@/constants/app";
import { fonts } from "@/constants/typography";
import CalendarField from "@/components/onboarding/CalendarField";
import V1ceLogo from "@/components/layout/V1ceLogo";
import { useTranslation } from "@/lib/i18n";
import { ONBOARDING_VERSION, ONBOARDING_VERSION_KEY } from "@/app/index";

WebBrowser.maybeCompleteAuthSession();

const SUBSTANCE_KEYS: Record<string, string> = {
  Alcohol: "alcohol",
  Cannabis: "cannabis",
  Cocaine: "cocaine",
  Opioids: "opioids",
  Meth: "methamphetamine",
  Benzodiazepines: "benzodiazepines",
  Nicotine: "nicotine",
  Sugar: "sugar",
  Gambling: "gambling",
  "OCD Compulsions": "ocdCompulsions",
  Other: "other",
};

function urlParam(url: string, name: string) {
  const match = url.match(new RegExp("[?#&]" + name + "=([^&#]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function Onboarding() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eula, setEula] = useState(false);
  const [date, setDate] = useState("");
  const [substances, setSubstances] = useState<string[]>([]);
  const [otherDoc, setOtherDoc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [authBusy, setAuthBusy] = useState<"apple" | "google" | "email" | null>(null);
  const router = useRouter();
  const { user, setProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const toggleSubstance = useCallback((s: string) => {
    setSubstances((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }, []);

  const ensureSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) return sessionData.session.user;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user;
  };

  const continueAsGuest = async () => {
    if (authBusy) return;
    setAuthBusy("email");
    try {
      await ensureSession();
      setEmail("");
      setStep(1);
    } catch (error: any) {
      Alert.alert("Could not continue", error?.message || "Please try again.");
    } finally {
      setAuthBusy(null);
    }
  };

  const continueWithEmail = async () => {
    if (authBusy) return;
    if (!eula) {
      Alert.alert("Accept terms to sign in", "Please accept the EULA before signing in.");
      return;
    }
    setAuthBusy("email");
    try {
      await ensureSession();
      setStep(1);
    } catch (error: any) {
      Alert.alert("Could not continue", error?.message || "Please try again.");
    } finally {
      setAuthBusy(null);
    }
  };

  const continueWithOAuth = async (provider: "apple" | "google") => {
    if (authBusy) return;
    if (!eula) {
      Alert.alert("Accept terms to sign in", "Please accept the EULA before signing in.");
      return;
    }
    setAuthBusy(provider);
    try {
      const redirectTo = Linking.createURL("/onboarding");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("No sign-in URL was returned.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return;

      const code = urlParam(result.url, "code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else {
        const accessToken = urlParam(result.url, "access_token");
        const refreshToken = urlParam(result.url, "refresh_token");
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }
      }

      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (currentUser.user?.email) setEmail(currentUser.user.email);
      setStep(1);
    } catch (error: any) {
      Alert.alert(
        provider === "apple" ? "Apple sign-in unavailable" : "Google sign-in unavailable",
        error?.message || "Please try again."
      );
    } finally {
      setAuthBusy(null);
    }
  };

  const persistProfile = async (values: Record<string, unknown>, storedEmail: string) => {
    const { data: currentUser } = await supabase.auth.getUser();
    const authUserId = currentUser.user?.id || user?.id;
    if (!authUserId) {
      Alert.alert("Error", "Your sign-in session is missing. Please return to the first screen and try again.");
      return false;
    }

    await AsyncStorage.setItem("v1ce_email", storedEmail);
    const payload = { ...defaultProfileFields, ...values, id: authUserId, email: storedEmail };
    const { data, error } = await supabase.from(TABLES.SobrietyProfile).upsert(payload).select().single();
    if (error) {
      Alert.alert("Error", error.message || "Could not save profile. Please try again.");
      return false;
    }
    setProfile(data);
    await AsyncStorage.setItem(ONBOARDING_VERSION_KEY, ONBOARDING_VERSION);
    router.replace("/(tabs)");
    return true;
  };

  const handleSave = async () => {
    if (!date || isSaving) return;
    setIsSaving(true);
    const storedEmail =
      email.trim().toLowerCase() ||
      user?.email ||
      `${name.trim().toLowerCase().replace(/\s+/g, ".")}.${Date.now()}@guest.v1ce.app`;

    await persistProfile(
      {
        display_name: name.trim(),
        sobriety_date: date,
        substances: substances.flatMap((s) => s === "Other" && otherDoc.trim() ? [otherDoc.trim()] : [s]),
        email: storedEmail,
        coin_color: "#F5D680",
      },
      storedEmail
    );
    setIsSaving(false);
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const nameValid = name.trim().length > 0;
  const authDisabled = !!authBusy;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <View style={styles.logoWrap}>
              <V1ceLogo height={64} />
            </View>
            <Text style={styles.title}>{t("onboarding.welcome")}</Text>
            <Text style={styles.subtitle}>{t("onboarding.signInSave")}</Text>

            <TouchableOpacity
              style={[styles.providerButton, authDisabled && styles.providerDisabled]}
              disabled={authDisabled}
              onPress={() => continueWithOAuth("apple")}
            >
              <FontAwesome name="apple" size={22} color="#0A0A0A" />
              <Text style={styles.providerText}>{authBusy === "apple" ? "CONNECTING..." : "CONTINUE WITH APPLE"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.providerButton, authDisabled && styles.providerDisabled]}
              disabled={authDisabled}
              onPress={() => continueWithOAuth("google")}
            >
              <FontAwesome name="google" size={20} color="#0A0A0A" />
              <Text style={styles.providerText}>{authBusy === "google" ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("onboarding.or")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.label}>{t("onboarding.emailLabel").toUpperCase()}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder={t("onboarding.emailPlaceholder")}
              placeholderTextColor="#A3A3A3"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.button, (!emailValid || authDisabled) && styles.buttonDisabled]}
              disabled={!emailValid || authDisabled}
              onPress={continueWithEmail}
            >
              <Text style={styles.buttonText}>{authBusy === "email" ? "..." : "CONTINUE WITH EMAIL →"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setEula(!eula)}>
              <View style={[styles.checkbox, eula && styles.checkboxOn]}>
                {eula ? <Feather name="check" size={14} color="#F3F3F3" /> : null}
              </View>
              <Text style={styles.checkboxText}>{t("onboarding.eulaText")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.skipButton, !!authBusy && styles.providerDisabled]}
              disabled={!!authBusy}
              onPress={continueAsGuest}
            >
              <Text style={styles.skipButtonText}>{authBusy === "email" ? "..." : "SKIP FOR NOW →"}</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.title}>WHAT'S{"\n"}YOUR NAME?</Text>
            <Text style={styles.subtitle}>{t("onboarding.nameSub")}</Text>
            <Text style={styles.label}>{t("onboarding.nameLabel").toUpperCase()}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={20}
              style={styles.input}
              placeholder={t("onboarding.namePlaceholder")}
              placeholderTextColor="#A3A3A3"
              autoCapitalize="words"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(0)}>
                <Text style={styles.backButtonText}>{t("onboarding.back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex, !nameValid && styles.buttonDisabled]}
                disabled={!nameValid}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>{t("onboarding.next")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>{t("onboarding.whenDidYouStart")}</Text>
            <Text style={styles.subtitle}>{t("onboarding.whenSub")}</Text>
            <Text style={styles.label}>{t("onboarding.sobrietyDate").toUpperCase()} · MM/DD/YYYY</Text>
            <CalendarField value={date} onChange={setDate} placeholder="MM/DD/YYYY" />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>{t("onboarding.back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex, !date && styles.buttonDisabled]}
                disabled={!date}
                onPress={() => setStep(3)}
              >
                <Text style={styles.buttonText}>{t("onboarding.next")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.title}>{t("onboarding.whatsYourDoc")}</Text>
            <Text style={styles.subtitle}>{t("onboarding.whatsYourDocSub")}</Text>
            <View style={styles.grid}>
              {ONBOARDING_SUBSTANCES.map((s) => {
                const selected = substances.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.subCell, selected && styles.subCellOn]}
                    onPress={() => toggleSubstance(s)}
                  >
                    <Text style={[styles.subText, selected && styles.subTextOn]}>
                      {t(`substances.${SUBSTANCE_KEYS[s] || s.toLowerCase()}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {substances.includes("Other") && (
              <TextInput
                value={otherDoc}
                onChangeText={setOtherDoc}
                style={[styles.input, styles.otherDocInput]}
                placeholder={t("onboarding.docPlaceholder")}
                placeholderTextColor="#A3A3A3"
                autoCapitalize="sentences"
                maxLength={60}
              />
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backButtonText}>{t("onboarding.back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex, isSaving && styles.buttonDisabled]}
                disabled={isSaving}
                onPress={handleSave}
              >
                <Text style={styles.journey}>{isSaving ? "..." : t("onboarding.startJourney")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { paddingHorizontal: 24, flexGrow: 1, width: "100%", maxWidth: 430, alignSelf: "center" },
  skipButton: { alignItems: "center", paddingVertical: 14, marginTop: 10 },
  skipButtonText: { fontSize: 12, letterSpacing: 1.5, color: "#737373", fontFamily: fonts.black },
  logoWrap: { alignItems: "center", marginBottom: 30 },
  title: { fontSize: 56, lineHeight: 68, paddingTop: 6, fontFamily: fonts.display, color: "#0A0A0A", marginBottom: 12 },
  subtitle: { fontSize: 16, lineHeight: 24, color: "#737373", fontFamily: fonts.body, marginBottom: 28 },
  label: { fontSize: 10, letterSpacing: 2, color: "#737373", fontFamily: fonts.bodyBold, marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: "#0A0A0A",
    backgroundColor: "#FFFFFF",
    padding: 14,
    fontSize: 18,
    fontFamily: fonts.bodySemi,
    color: "#0A0A0A",
  },
  providerButton: {
    height: 54,
    borderWidth: 2,
    borderColor: "#0A0A0A",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 10,
  },
  providerDisabled: { opacity: 0.45 },
  providerText: { fontSize: 14, letterSpacing: 1.2, fontFamily: fonts.bodyBold, color: "#0A0A0A" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#B8B8B8" },
  dividerText: { fontSize: 10, letterSpacing: 2, color: "#737373", fontFamily: fonts.bodyBold },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 18, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: "#0A0A0A", alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkboxOn: { backgroundColor: "#0A0A0A" },
  checkboxText: { flex: 1, fontSize: 13, lineHeight: 18, color: "#737373", fontFamily: fonts.body },
  button: { marginTop: 18, height: 56, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0A0A" },
  buttonFlex: { flex: 1, marginTop: 0 },
  buttonDisabled: { backgroundColor: "#C8C8C8" },
  buttonText: { fontSize: 19, letterSpacing: 1.2, fontFamily: fonts.display, color: "#F7F7F7", textAlign: "center" },
  journey: { fontSize: 18, lineHeight: 20, letterSpacing: 1, fontFamily: fonts.display, color: "#F7F7F7", textAlign: "center" },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: "auto" },
  backButton: { flex: 1, height: 56, backgroundColor: "#E4E4E4", justifyContent: "center", alignItems: "center" },
  backButtonText: { fontSize: 18, letterSpacing: 1, fontFamily: fonts.display, color: "#0A0A0A" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  subCell: {
    width: "48.4%",
    minHeight: 48,
    borderWidth: 2,
    borderColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  subCellOn: { backgroundColor: "#0A0A0A" },
  otherDocInput: { marginBottom: 24 },
  subText: { fontSize: 14, fontFamily: fonts.body, color: "#0A0A0A" },
  subTextOn: { color: "#FFFFFF" },
});
