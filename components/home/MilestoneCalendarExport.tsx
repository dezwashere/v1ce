import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import * as Calendar from "expo-calendar";
import { MILESTONES } from "@/constants/app";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";
import { Feather } from "@expo/vector-icons";

async function addNextMilestone(sobrietyDate: string, displayName?: string) {
  const start = new Date(`${sobrietyDate}T00:00:00`);
  const elapsed = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
  const milestone = MILESTONES.find((item) => item.days > elapsed) || MILESTONES[MILESTONES.length - 1];
  const date = new Date(start);
  date.setDate(date.getDate() + milestone.days);
  const title = `V1CE · ${milestone.label}`;
  const details = `${displayName || "You"} · ${milestone.message}`;
  try {
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (permission.status !== Calendar.PermissionStatus.GRANTED) {
      Alert.alert("V1CE", "Calendar access is required to add this milestone.");
      return;
    }
    await Calendar.createEventInCalendarAsync({
      title,
      notes: details,
      startDate: date,
      endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recurrenceRule: { frequency: Calendar.Frequency.YEARLY },
      alarms: [{ relativeOffset: -24 * 60 }],
    });
  } catch {
    Alert.alert("V1CE", "Couldn't open the native calendar editor.");
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
