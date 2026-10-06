import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getElapsed } from "@/constants/app";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export default function SobrietyCounter({ sobrietyDate }: { sobrietyDate?: string }) {
  const colors = useColors();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = useMemo(() => getElapsed(sobrietyDate, now), [sobrietyDate, now]);
  return (
    <View style={styles.grid}>
      {([
        [time.days, "DAYS"],
        [time.hours, "HRS"],
        [time.minutes, "MIN"],
        [time.seconds, "SEC"],
      ] as const).map(([value, label]) => (
        <View key={label} style={[styles.cell, { borderColor: colors.foreground }]}>
          <Text style={[styles.value, { color: colors.foreground }]}>{String(value).padStart(2, "0")}</Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row" },
  cell: { flex: 1, minHeight: 94, borderWidth: 2, marginRight: -2, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 29, lineHeight: 31, fontFamily: fonts.display },
  label: { fontSize: 9, fontFamily: fonts.bodyBold, letterSpacing: 2, marginTop: 5 },
});
