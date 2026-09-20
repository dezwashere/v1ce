import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>V1CE</Text>
      <Text style={styles.subtitle}>Your milestone app is being rebuilt.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#737373",
  },
});
