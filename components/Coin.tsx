import { StyleSheet, Text, View } from "react-native";

export type CoinSettings = {
  color?: string | null;
  shape?: string | null;
  motto?: string | null;
  imageUrl?: string | null;
  number?: number;
};

export function Coin({
  color = "#F5D680",
  shape = "circle",
  motto = "ONE DAY AT A TIME",
  number = 1,
}: CoinSettings) {
  const isCircle = shape === "circle";

  return (
    <View
      style={[
        styles.coin,
        {
          backgroundColor: color || "#F5D680",
          borderRadius: isCircle ? 999 : 12,
        },
      ]}
    >
      <Text style={styles.number}>{number}</Text>
      <Text style={styles.motto}>{motto || "ONE DAY AT A TIME"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    width: 200,
    height: 200,
    borderWidth: 5,
    borderColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontSize: 64,
    fontWeight: "800",
    color: "#0A0A0A",
  },
  motto: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#0A0A0A",
  },
});
