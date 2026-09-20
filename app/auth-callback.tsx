import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function finish(url: string) {
      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) return mounted && router.replace("/sign-in");
      let error = null;
      if (params.code) {
        ({ error } = await supabase.auth.exchangeCodeForSession(params.code));
      } else if (params.access_token && params.refresh_token) {
        ({ error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        }));
      }
      if (error) return mounted && router.replace("/sign-in");
      if (mounted) router.replace(params.type === "recovery" ? "/reset-password" : "/");
    }

    Linking.getInitialURL().then((url) => {
      if (url) finish(url);
    });
    const subscription = Linking.addEventListener("url", ({ url }) => finish(url));
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [router]);

  return <View style={styles.container}><ActivityIndicator /></View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F7" },
});