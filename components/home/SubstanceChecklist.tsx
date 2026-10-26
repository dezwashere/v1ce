import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SUBSTANCES } from "@/constants/app";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

export default function SubstanceChecklist({ selected, onChange }: {
  selected: string[];
  onChange: (next: string[]) => Promise<void>;
}) {
  const colors = useColors();
  const customValues = selected.filter(value => !SUBSTANCES.includes(value));
  const savedOther = customValues[0] || "";
  const [editing, setEditing] = useState(selected.includes("Other") || !!savedOther);
  const [draft, setDraft] = useState(savedOther);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setDraft(savedOther);
    setEditing(selected.includes("Other") || !!savedOther);
  }, [savedOther, selected.includes("Other")]);

  const save = async (next: string[]) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setMessage("");
    try {
      await onChange([...new Set(next)]);
      setMessage("SAVED");
    } catch {
      setMessage("NOT SAVED — PLEASE TRY AGAIN. YOUR EDIT IS STILL HERE.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return <View style={styles.wrap}>
    {SUBSTANCES.map(item => {
      const active = item === "Other" ? editing : selected.includes(item);
      return <TouchableOpacity key={item} disabled={saving} accessibilityRole="checkbox" accessibilityState={{ checked: active, disabled: saving }}
        onPress={() => item === "Other" ? setEditing(true) : void save(selected.includes(item) ? selected.filter(value => value !== item) : [...selected, item])}
        style={[styles.chip, { borderColor: colors.foreground, backgroundColor: active ? colors.foreground : "transparent", opacity: saving ? .5 : 1 }]}>
        <Text style={{ color: active ? colors.background : colors.foreground, fontSize: 12, fontFamily: fonts.bodyBold }}>{item.toUpperCase()}</Text>
      </TouchableOpacity>;
    })}
    {editing ? <View style={{ width: "100%", gap: 8 }}>
      <TextInput value={draft} onChangeText={value => { setDraft(value); setMessage(""); }} editable={!saving}
        placeholder="TYPE YOUR DOC" accessibilityLabel="Other DOC" placeholderTextColor={colors.mutedForeground} maxLength={60}
        style={[styles.otherInput, { borderColor: colors.foreground, color: colors.foreground }]} />
      <TouchableOpacity disabled={saving} accessibilityRole="button" onPress={() => {
        // Replace only the edited custom value; retain every other saved choice.
        const base = selected.filter(value => value !== "Other" && value !== savedOther);
        const value = draft.trim();
        void save(value ? [...base, value] : base);
      }} style={[styles.chip, { borderColor: colors.foreground }]}>
        <Text style={{ color: colors.foreground, fontFamily: fonts.bodyBold }}>{saving ? "SAVING…" : "SAVE OTHER"}</Text>
      </TouchableOpacity>
      <Text style={{ color: colors.mutedForeground, fontFamily: fonts.body, fontSize: 11 }}>Clear the text and save to remove this custom value.</Text>
    </View> : null}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: colors.foreground, fontFamily: fonts.body, fontSize: 12 }}>{message}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 10 },
  otherInput: { width: "100%", borderWidth: 2, minHeight: 48, paddingHorizontal: 12, fontSize: 15, fontFamily: fonts.body },
});
