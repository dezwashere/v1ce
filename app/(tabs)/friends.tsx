import { StyleSheet, Text, View } from "react-native";

export default function Friends() {
  return <View style={styles.container}><Text style={styles.kicker}>FRIENDS</Text><Text style={styles.title}>Your people.</Text><Text style={styles.body}>Friend requests, connections and blocking will live here.</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 28, backgroundColor: "#F7F7F7" }, kicker: { color: "#F5A41A", fontWeight: "800", letterSpacing: 2 }, title: { marginTop: 12, fontSize: 34, fontWeight: "800" }, body: { marginTop: 12, color: "#737373", fontSize: 16, lineHeight: 24 } });
