import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>V1CE</Text>
      <Text style={styles.title}>SOMETHING{"\n"}WENT WRONG.</Text>
      <Text style={styles.message}>{error.message || "An unexpected error occurred."}</Text>
      <TouchableOpacity onPress={resetError} style={styles.button}>
        <Text style={styles.buttonText}>TRY AGAIN →</Text>
      </TouchableOpacity>
      {__DEV__ ? (
        <TouchableOpacity onPress={() => setShowDetails(true)} style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>VIEW ERROR DETAILS</Text>
        </TouchableOpacity>
      ) : null}
      <Modal visible={showDetails} animationType="slide" onRequestClose={() => setShowDetails(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>ERROR DETAILS</Text>
          <ScrollView style={styles.trace}>
            <Text selectable style={styles.traceText}>{error.stack || error.message}</Text>
          </ScrollView>
          <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.button}>
            <Text style={styles.buttonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#F7F7F7" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 4, marginBottom: 16 },
  title: { fontSize: 46, lineHeight: 45, fontWeight: "900", color: "#0A0A0A" },
  message: { marginTop: 20, color: "#737373", fontSize: 14, lineHeight: 21 },
  button: { minHeight: 54, marginTop: 28, alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A" },
  buttonText: { color: "#F7F7F7", fontSize: 15, fontWeight: "900", letterSpacing: 2 },
  detailsButton: { marginTop: 18, alignItems: "center" },
  detailsButtonText: { color: "#737373", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  modal: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: "#F7F7F7" },
  modalTitle: { fontSize: 28, fontWeight: "900", marginBottom: 20 },
  trace: { flex: 1, borderWidth: 2, borderColor: "#0A0A0A", padding: 14 },
  traceText: { fontFamily: "monospace", fontSize: 12, lineHeight: 18 },
});