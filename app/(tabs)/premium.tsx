import { StyleSheet, Text, View } from "react-native";

export default function Premium() {
  return <View style={styles.container}><Text style={styles.kicker}>V1CE PREMIUM</Text><Text style={styles.title}>More ways to use V1CE.</Text><Text style={styles.price}>$3.99 / month</Text><Text style={styles.body}>Premium features and billing will be connected after the core app is working.</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 28, backgroundColor: "#F7F7F7" }, kicker: { color: "#F5A41A", fontWeight: "800", letterSpacing: 2 }, title: { marginTop: 12, fontSize: 34, fontWeight: "800" }, price: { marginTop: 28, fontSize: 28, fontWeight: "800" }, body: { marginTop: 12, color: "#737373", fontSize: 16, lineHeight: 24 } });
