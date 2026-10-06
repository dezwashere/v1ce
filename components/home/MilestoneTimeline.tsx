import React, { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MILESTONES } from "@/constants/app";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type Memory = { milestone_days: number; blurb: string; photo_url: string | null };

export default function MilestoneTimeline({ days, userId }: { days: number; userId?: string }) {
  const colors = useColors();
  const progress = Math.min(100, (days / 1825) * 100);
  const [memories, setMemories] = useState<Record<number, Memory>>({});
  const [activeDays, setActiveDays] = useState<number | null>(null);
  const [blurb, setBlurb] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("milestone_memories").select("milestone_days,blurb,photo_url").eq("user_id", userId)
      .then(({ data }) => {
        const next: Record<number, Memory> = {};
        (data || []).forEach((item: Memory) => { next[item.milestone_days] = item; });
        setMemories(next);
      });
  }, [userId]);

  const openMemory = (milestoneDays: number) => {
    const existing = memories[milestoneDays];
    setActiveDays(milestoneDays);
    setBlurb(existing?.blurb || "");
    setPhotoUrl(existing?.photo_url || "");
  };

  const choosePhoto = async () => {
    if (!userId || activeDays === null) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("V1CE", "Photo access is required to add a milestone picture.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setSaving(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const body = await response.arrayBuffer();
      const extension = (asset.fileName?.split(".").pop() || asset.mimeType?.split("/").pop() || "jpg").toLowerCase();
      const path = `${userId}/${activeDays}-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from("milestone-photos").upload(path, body, {
        contentType: asset.mimeType || "image/jpeg",
      });
      if (error) throw error;
      const { data } = supabase.storage.from("milestone-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (error: any) {
      Alert.alert("V1CE", error?.message || "Couldn't add that photo.");
    } finally {
      setSaving(false);
    }
  };

  const saveMemory = async () => {
    if (!userId || activeDays === null || saving) return;
    setSaving(true);
    const payload = { user_id: userId, milestone_days: activeDays, blurb: blurb.trim().slice(0, 50), photo_url: photoUrl || null, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from("milestone_memories").upsert(payload).select().single();
    setSaving(false);
    if (error) return Alert.alert("V1CE", error.message);
    setMemories((previous) => ({ ...previous, [activeDays]: data as Memory }));
    setActiveDays(null);
  };

  return (
    <View>
      <View style={[styles.track, { borderColor: colors.foreground }]}>
        <View style={[styles.fill, { backgroundColor: colors.foreground, width: `${progress}%` }]} />
      </View>
      <View style={styles.grid}>
        {MILESTONES.map((item) => {
          const reached = days >= item.days;
          const memory = memories[item.days];
          return (
            <TouchableOpacity
              key={item.days}
              disabled={!reached}
              onPress={() => openMemory(item.days)}
              style={[styles.card, { borderColor: colors.foreground, opacity: reached ? 1 : 0.42 }]}
            >
              {memory?.photo_url ? <Image source={{ uri: memory.photo_url }} style={styles.thumb} /> : null}
              <Text style={[styles.number, { color: colors.foreground }]}>{item.days}</Text>
              <Text style={[styles.label, { color: colors.foreground }]}>{item.label}</Text>
              {reached ? <Text style={[styles.add, { color: colors.mutedForeground }]}>{memory ? "EDIT MEMORY" : "+ ADD MEMORY"}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={activeDays !== null} transparent animationType="fade" onRequestClose={() => setActiveDays(null)}>
        <Pressable style={styles.backdrop} onPress={() => setActiveDays(null)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.foreground }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>MILESTONE MEMORY</Text>
            {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.photo} /> : null}
            <TouchableOpacity onPress={choosePhoto} style={[styles.photoButton, { borderColor: colors.foreground }]}>
              <Text style={[styles.photoButtonText, { color: colors.foreground }]}>{photoUrl ? "CHANGE PHOTO" : "ADD PHOTO"}</Text>
            </TouchableOpacity>
            <TextInput
              value={blurb}
              onChangeText={(value) => setBlurb(value.slice(0, 50))}
              maxLength={50}
              multiline
              placeholder="WHAT DO YOU WANT TO REMEMBER?"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { borderColor: colors.foreground, color: colors.foreground }]}
            />
            <Text style={[styles.count, { color: colors.mutedForeground }]}>{blurb.length}/50</Text>
            <TouchableOpacity disabled={saving} onPress={saveMemory} style={[styles.save, { backgroundColor: colors.foreground, opacity: saving ? 0.5 : 1 }]}>
              <Text style={[styles.saveText, { color: colors.background }]}>{saving ? "SAVING..." : "SAVE MEMORY"}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderWidth: 2, marginBottom: 16 },
  fill: { height: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { width: "31.5%", minHeight: 108, borderWidth: 2, padding: 10 },
  thumb: { width: "100%", aspectRatio: 1, marginBottom: 8 },
  number: { fontSize: 23, fontFamily: fonts.display },
  label: { fontSize: 9, fontFamily: fonts.bodyBold, letterSpacing: 1.2, marginTop: 4 },
  add: { fontSize: 8, fontFamily: fonts.bodyBold, letterSpacing: 0.8, marginTop: 10 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", padding: 22 },
  modal: { width: "100%", maxWidth: 390, borderWidth: 2, padding: 18 },
  modalTitle: { fontSize: 28, fontFamily: fonts.display, letterSpacing: 1, marginBottom: 14 },
  photo: { width: "100%", aspectRatio: 1.5, marginBottom: 10 },
  photoButton: { minHeight: 46, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  photoButtonText: { fontFamily: fonts.black, fontSize: 11, letterSpacing: 1.4 },
  input: { minHeight: 92, borderWidth: 2, padding: 12, marginTop: 14, fontFamily: fonts.body, textAlignVertical: "top" },
  count: { fontFamily: fonts.body, fontSize: 10, textAlign: "right", marginTop: 5 },
  save: { minHeight: 50, alignItems: "center", justifyContent: "center", marginTop: 14 },
  saveText: { fontFamily: fonts.black, fontSize: 11, letterSpacing: 1.5 },
});
