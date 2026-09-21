import { StyleSheet, Text, View } from "react-native";

export default function Analytics() {
  return <View style={styles.container}><Text style={styles.kicker}>STATS</Text><Text style={styles.title}>Your progress.</Text><Text style={styles.card}>Check-ins and streak history will show up here.</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 28, backgroundColor: "#F7F7F7" }, kicker: { color: "#F5A41A", fontWeight: "800", letterSpacing: 2 }, title: { marginTop: 12, fontSize: 34, fontWeight: "800" }, card: { marginTop: 28, borderWidth: 2, borderColor: "#0A0A0A", padding: 20, backgroundColor: "#FFFFFF", fontSize: 16 } });
