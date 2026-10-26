import React, { useRef, useState } from "react";
import { Alert, Modal, Platform, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { requireOptionalNativeModule } from "expo-modules-core";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import BirthdayConfetti from "@/components/birthday/BirthdayConfetti";
import BirthdayPrompts from "@/components/birthday/BirthdayPrompts";
import BirthdayStylePicker from "@/components/birthday/BirthdayStylePicker";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";

// Older development clients must still open the card without the new audio module.
const AudioPlayer: React.ComponentType<{ song: string }> | null =
  Platform.OS === "web" || requireOptionalNativeModule("ExpoAudio")
    ? require("./BirthdayAudioPlayer").default : null;

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
  const [message, setMessage] = useState("");
  const focused = useIsFocused();
  const cardRef = useRef<ViewShot>(null);

  const shareImage = async () => {
    try {
      if (!cardRef.current) throw new Error("Card is not ready to share.");
      const available = await Sharing.isAvailableAsync();
      if (!available) throw new Error("Image sharing is not available on this device.");
      const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share V1CE card" });
    } catch (error) {
      Alert.alert("V1CE", error instanceof Error ? error.message : "Could not share the card image.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ViewShot ref={cardRef} options={{ format: "png", quality: 1 }} style={[styles.card, { backgroundColor: colors.background, borderColor: colors.foreground }]}>
          <BirthdayConfetti active={visible} />
          <Text style={[styles.kicker, { color: colors.gold }]}>{t("birthday.kicker")}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("birthday.title")}{"\n"}{name.toUpperCase()}.</Text>
          <BirthdayStylePicker value={song} onChange={setSong} postToLounge={post} onTogglePost={() => setPost((v) => !v)} />
          {visible && focused && AudioPlayer ? <AudioPlayer key={song} song={song}/> : null}
          {!AudioPlayer && <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Card music will be available after the next V1CE development build.</Text>}
          <BirthdayPrompts
            onSelect={(text) => {
              setMessage(text);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (post) onShare?.(text);
            }}
          />
          <Text style={{ color: colors.foreground, fontFamily: fonts.bodyBold, marginTop: 14 }}>WRITE YOUR OWN MESSAGE</Text>
          <TextInput
            value={message}
            onChangeText={(value) => setMessage(value.slice(0, 200))}
            maxLength={200}
            multiline
            placeholder="Write a birthday message"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.messageInput, { borderColor: colors.foreground, color: colors.foreground }]}
          />
          <Text style={{ color: colors.mutedForeground, fontFamily: fonts.body, fontSize: 11, textAlign: "right" }}>{message.length}/200</Text>
          <TouchableOpacity disabled={!message.trim()} onPress={() => { if (post) onShare?.(message.trim()); void shareImage(); }} style={[styles.button, { borderColor: colors.foreground, borderWidth: 2, backgroundColor: colors.background, opacity: message.trim() ? 1 : .5 }]}>
            <Text style={{ color: colors.foreground, fontFamily: fonts.black, letterSpacing: 2 }}>SHARE CARD</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: colors.foreground }]}>
            <Text style={{ color: colors.background, fontFamily: fonts.black, letterSpacing: 2 }}>{t("common.close")}</Text>
          </TouchableOpacity>
        </ViewShot>
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
  messageInput: { borderWidth: 1, minHeight: 76, padding: 10, marginTop: 8, fontFamily: fonts.body, textAlignVertical: "top" },
});
