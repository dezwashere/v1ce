import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { fonts } from "@/constants/typography";

function displayFromIso(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${month}/${day}/${year}` : "";
}

function formatTypedDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isoFromDisplay(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  const today = new Date();
  if (year < 1900 || candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day || candidate > today) return "";
  return `${match[3]}-${match[1]}-${match[2]}`;
}

export default function CalendarField({ value, onChange, placeholder = "MM/DD/YYYY" }: { value: string; onChange: (iso: string) => void; placeholder?: string }) {
  const [text, setText] = useState(displayFromIso(value));
  useEffect(() => { if (!text && value) setText(displayFromIso(value)); }, [value]);
  return <TextInput value={text} onChangeText={(next) => { const formatted = formatTypedDate(next); setText(formatted); const iso = isoFromDisplay(formatted); if (iso) onChange(iso); }} style={styles.field} placeholder={placeholder} placeholderTextColor="#A3A3A3" keyboardType="number-pad" inputMode="numeric" maxLength={10} autoCorrect={false} returnKeyType="done" accessibilityLabel="Sober date" />;
}

const styles = StyleSheet.create({
  field: { borderWidth: 2, borderColor: "#0A0A0A", backgroundColor: "#FFFFFF", minHeight: 52, paddingHorizontal: 12, fontSize: 18, color: "#0A0A0A", fontFamily: fonts.bodySemi, textAlign: "center" },
});
