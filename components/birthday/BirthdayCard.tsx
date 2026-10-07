import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import BirthdayConfetti from "@/components/birthday/BirthdayConfetti";
import BirthdayPrompts from "@/components/birthday/BirthdayPrompts";
import BirthdayStylePicker from "@/components/birthday/BirthdayStylePicker";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";

export default function BirthdayCard({
  name,
  visible,
  onClose,
  onShare,
}: {
  name: string;
  visible: boolean;
  onClose: () => void;
  onShare?: (message: string) => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const [song, setSong] = useState("arcade");
  const [post, setPost] = useState(true);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.foreground }]}>
          <BirthdayConfetti />
          <Text style={[styles.kicker, { color: colors.gold }]}>{t("birthday.kicker")}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("birthday.title")}{"\n"}{name.toUpperCase()}.</Text>
          <BirthdayStylePicker value={song} onChange={setSong} postToLounge={post} onTogglePost={() => setPost((v) => !v)} />
          <BirthdayPrompts
            onSelect={(text) => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (post) onShare?.(text);
            }}
          />
          <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: colors.foreground }]}>
            <Text style={{ color: colors.background, fontFamily: fonts.black, letterSpacing: 2 }}>{t("common.close")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 20 },
  card: { borderWidth: 2, padding: 20, overflow: "hidden" },
  kicker: { fontSize: 12, fontFamily: fonts.bodyBold, letterSpacing: 4 },
  title: { fontSize: 36, fontFamily: fonts.display, lineHeight: 38, marginTop: 8, marginBottom: 8 },
  button: { height: 52, alignItems: "center", justifyContent: "center", marginTop: 18 },
});
