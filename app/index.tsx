import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>V1CE</Text>
      <Text style={styles.subtitle}>
        {loading ? "Loading..." : user ? "Supabase is connected." : "Ready for sign in."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F7", padding: 24 },
  title: { fontSize: 42, fontWeight: "700", color: "#0A0A0A" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#737373" },
});
