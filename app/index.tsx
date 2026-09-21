import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Index() {
  const { user, loading } = useAuth();
  const [profileReady, setProfileReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setProfileReady(null);
      return;
    }

    let mounted = true;
    supabase
      .from("profiles")
      .select("display_name, sobriety_date")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) setProfileReady(Boolean(data?.display_name && data?.sobriety_date));
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading || (user && profileReady === null)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#F5A41A" />
      </View>
    );
  }

  if (!user) return <Redirect href="/sign-in" />;
  return <Redirect href={profileReady ? "/(tabs)" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
});
