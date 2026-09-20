import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTo = Linking.createURL("auth/callback");

  async function signInWithProvider(provider: "apple" | "google") {
    setBusy(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      setBusy(false);
      Alert.alert("Sign in failed", error?.message ?? "Could not start sign in.");
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    setBusy(false);

    if (result.type !== "success") return;

    const { params, errorCode } = QueryParams.getQueryParams(result.url);

    if (errorCode) {
      Alert.alert("Sign in failed", errorCode);
      return;
    }

    if (params.code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exchangeError) {
        Alert.alert("Sign in failed", exchangeError.message);
        return;
      }
    } else if (params.access_token && params.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) {
        Alert.alert("Sign in failed", sessionError.message);
        return;
      }
    } else {
      Alert.alert("Sign in failed", "The provider did not return a valid session.");
      return;
    }

    router.replace("/home");
  }

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert("Missing information", "Enter your email and password.");
      return;
    }

    setBusy(true);

    const result =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : await supabase.auth.signUp({ email: cleanEmail, password });

    setBusy(false);

    if (result.error) {
      Alert.alert(mode === "signIn" ? "Sign in failed" : "Sign up failed", result.error.message);
      return;
    }

    if (mode === "signUp" && !result.data.session) {
      Alert.alert("Check your email", "Supabase may require email confirmation before you can continue.");
      return;
    }

    router.replace("/onboarding");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.brand}>V1CE</Text>
        <Text style={styles.title}>{mode === "signIn" ? "Welcome back." : "Create your account."}</Text>
        <Text style={styles.subtitle}>
          {mode === "signIn" ? "Sign in to continue." : "Your recovery journey starts here."}
        </Text>

        <Pressable style={styles.socialButton} onPress={() => signInWithProvider("apple")} disabled={busy}>
          <Text style={styles.socialText}>Continue with Apple</Text>
        </Pressable>

        <Pressable style={styles.socialButton} onPress={() => signInWithProvider("google")} disabled={busy}>
          <Text style={styles.socialText}>Continue with Google</Text>
        </Pressable>

        <Text style={styles.divider}>or</Text>

        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#737373"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#737373"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.primaryButton} onPress={submit} disabled={busy}>
          <Text style={styles.primaryText}>
            {busy ? "Please wait..." : mode === "signIn" ? "Sign in" : "Create account"}
          </Text>
        </Pressable>

        <Pressable style={styles.switchButton} onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
          <Text style={styles.switchText}>
            {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { flex: 1, justifyContent: "center", padding: 28 },
  brand: { fontSize: 18, fontWeight: "800", letterSpacing: 3, color: "#F5A41A", marginBottom: 28 },
  title: { fontSize: 34, fontWeight: "800", color: "#0A0A0A" },
  subtitle: { marginTop: 8, marginBottom: 24, fontSize: 16, color: "#737373" },
  socialButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#0A0A0A",
    marginBottom: 10,
  },
  socialText: { color: "#0A0A0A", fontSize: 16, fontWeight: "700" },
  divider: { textAlign: "center", color: "#737373", marginVertical: 12 },
  input: {
    height: 54,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    marginBottom: 12,
    color: "#0A0A0A",
    fontSize: 16,
  },
  primaryButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A0A",
    marginTop: 8,
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  switchButton: { alignItems: "center", padding: 18 },
  switchText: { color: "#0A0A0A", fontSize: 15, fontWeight: "600" },
});
