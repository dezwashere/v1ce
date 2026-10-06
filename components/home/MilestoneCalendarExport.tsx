import React from "react";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MILESTONES } from "@/constants/app";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";
import { Feather } from "@expo/vector-icons";

function calendarDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function addNextMilestone(sobrietyDate: string, displayName?: string) {
  const start = new Date(`${sobrietyDate}T00:00:00`);
  const elapsed = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
  const milestone = MILESTONES.find((item) => item.days > elapsed) || MILESTONES[MILESTONES.length - 1];
  const date = new Date(start);
  date.setDate(date.getDate() + milestone.days);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);
  const title = `V1CE · ${milestone.label}`;
  const details = `${displayName || "You"} · ${milestone.message}`;
  const url =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${calendarDate(date)}/${calendarDate(end)}` +
    `&details=${encodeURIComponent(details)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("V1CE", "Couldn't open your calendar.");
  }
}

export default function MilestoneCalendarExport({
  sobrietyDate,
  displayName,
}: {
  sobrietyDate?: string;
  displayName?: string;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  if (!sobrietyDate) return null;
  return (
    <TouchableOpacity
      onPress={() => void addNextMilestone(sobrietyDate, displayName)}
      style={[styles.button, { borderColor: colors.foreground }]}
    >
      <Feather name="calendar" size={16} color={colors.foreground} />
      <Text style={[styles.label, { color: colors.foreground }]}>{t("calendar.addToCalendar")}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderWidth: 2, height: 52, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 24 },
  label: { fontSize: 18, fontFamily: fonts.display, letterSpacing: 2 },
});
