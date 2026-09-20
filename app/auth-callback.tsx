import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function finish() {
      const url = window?.location?.href;
      if (url) {
        const { params } = QueryParams.getQueryParams(url);
        if (params.code) await supabase.auth.exchangeCodeForSession(params.code);
        else if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
      }
      router.replace("/home");
    }
    finish();
  }, [router]);

  return <View style={styles.container}><ActivityIndicator /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F7" },
});
