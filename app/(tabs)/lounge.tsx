import React, { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { supabase, TABLES, type FriendConnection, type LoungeChatMessage } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/lib/i18n";
import { fonts } from "@/constants/typography";
import LofiAvatar from "@/components/lounge/LofiAvatar";
import CoinPreview from "@/components/lounge/CoinPreview";
import BirthdayCard from "@/components/birthday/BirthdayCard";
import BirthdayTag from "@/components/birthday/BirthdayTag";
import GifterBadge from "@/components/GifterBadge";

export default function Lounge() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<LoungeChatMessage[]>([]);
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<{ name: string; days: number } | null>(null);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [birthdayName, setBirthdayName] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [{ data: friendData, error: friendError }, { data: messageData, error: messageError }] = await Promise.all([
      supabase.rpc("get_my_friend_connections"),
      supabase.rpc("get_lounge_messages"),
    ]);
    if (friendError) Alert.alert("V1CE", friendError.message);
    else setFriends(((friendData || []) as FriendConnection[]).filter((f) => f.status === "accepted"));
    if (messageError) Alert.alert("V1CE", messageError.message);
    else setMessages((messageData || []) as LoungeChatMessage[]);
  }, [user?.id]);

  useEffect(() => {
    load();
    const channel = user?.id
      ? supabase
          .channel("v1ce-lounge")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: TABLES.LoungeChatMessage }, () => load())
          .subscribe()
      : null;
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [load, user?.id]);

  const send = async (bodyText?: string) => {
    const body = (bodyText ?? message).trim();
    if (!body || !user?.id || sending) return;
    setSending(true);
    const { error } = await supabase.from(TABLES.LoungeChatMessage).insert({
      sender_id: user.id,
      body,
      sender_name: profile?.display_name || "You",
    });
    if (error) Alert.alert("V1CE", error.message);
    else setMessage("");
    setSending(false);
    if (!error) load();
  };

  const friendName = (f: FriendConnection) =>
    f.requester_id === user?.id ? f.recipient_name || f.recipient_email || "Friend" : f.requester_name || f.requester_email || "Friend";
  const isBirthday =
    profile?.birthday &&
    new Date(profile.birthday).getMonth() === new Date().getMonth() &&
    new Date(profile.birthday).getDate() === new Date().getDate();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={96}
    >
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>{t("lounge.title")}</Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: fonts.body }}>{t("lounge.subtitle")}</Text>

      {isBirthday ? (
        <TouchableOpacity onPress={() => setBirthdayOpen(true)} style={[styles.bdayBanner, { borderColor: colors.foreground }]}>
          <BirthdayTag />
          <Text style={{ color: colors.foreground, fontFamily: fonts.extraBold }}>It's your birthday in the lounge.</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={[styles.section, { color: colors.foreground }]}>{t("lounge.friends")}</Text>
      {__DEV__ ? (
        ["Mia", "Jordan", "Sam"].map((name, index) => (
          <TouchableOpacity
            key={name}
            onPress={() => {
              if (index === 0) {
                setBirthdayName(name);
                setBirthdayOpen(true);
              } else {
                setPreview({ name, days: [365, 42, 128][index] });
              }
            }}
            style={[styles.friend, { borderColor: colors.border }]}
          >
            <LofiAvatar seed={name} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontFamily: fonts.extraBold, flex: 1 }}>{name}</Text>
            {index === 0 ? <BirthdayTag /> : null}
            <Text style={{ color: colors.mutedForeground, fontFamily: fonts.bodyBold, fontSize: 9 }}>DEMO</Text>
          </TouchableOpacity>
        ))
      ) : friends.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>{t("friends.noFriendsYet")}</Text>
      ) : (
        friends.map((item, index) => {
          const name = friendName(item);
          const locked = !profile?.is_premium && index > 0;
          return (
            <TouchableOpacity
              key={item.id}
              disabled={locked}
              onPress={() => setPreview({ name, days: 1 })}
              style={[styles.friend, { borderColor: colors.border, opacity: locked ? 0.45 : 1 }]}
            >
              <LofiAvatar seed={name} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontFamily: fonts.extraBold, flex: 1 }}>{name}</Text>
              {profile?.gifted_count ? <GifterBadge giftedCount={profile.gifted_count} size="sm" /> : null}
              {locked ? <Text style={{ color: colors.mutedForeground, fontFamily: fonts.extraBold }}>LOCKED</Text> : null}
            </TouchableOpacity>
          );
        })
      )}

      <Text style={[styles.section, { color: colors.foreground }]}>{t("lounge.loungeChat")}</Text>
      <View style={[styles.chat, { borderColor: colors.border }]}>
        {!user?.id ? (
          <View style={styles.locked}>
            <Text style={{ color: colors.mutedForeground, fontFamily: fonts.body }}>{t("lounge.signInToChat")}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Text style={{ color: colors.foreground, fontFamily: fonts.black, letterSpacing: 1 }}>{t("lounge.signIn")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          messages.length === 0 && !__DEV__ ? (
            <Text style={{ color: colors.mutedForeground, fontFamily: fonts.body }}>No messages yet. Say hello.</Text>
          ) : (
            <>
              {__DEV__ ? [
                { id: "demo-mia", sender_id: "demo-mia", sender_name: "Mia", body: "Checking in. Hope everybody is having a good day." },
                { id: "demo-jordan", sender_id: "demo-jordan", sender_name: "Jordan", body: "One day at a time." },
                { id: "demo-sam", sender_id: "demo-sam", sender_name: "Sam", body: "Proud of this group." },
              ].map((m) => (
                <View key={m.id} style={styles.message}>
                  <LofiAvatar seed={m.sender_name} size={28} color={colors.foreground} />
                  <Text style={{ color: colors.foreground, flex: 1, fontFamily: fonts.body }}>
                    <Text style={{ fontFamily: fonts.black }}>{m.sender_name}: </Text>{m.body}
                  </Text>
                </View>
              )) : null}
              {messages.map((m) => (
              <View key={m.id} style={styles.message}>
                <LofiAvatar seed={m.display_name || m.sender_name || "F"} size={28} color={colors.foreground} />
                <Text style={{ color: colors.foreground, flex: 1, fontFamily: fonts.body }}>
                  <Text style={{ fontFamily: fonts.black }}>{m.sender_id === user?.id ? "You" : m.display_name || m.sender_name || "Friend"}: </Text>
                  {m.body || m.message}
                </Text>
              </View>
              ))}
            </>
          )
        )}
      </View>
      {user?.id ? (
        <View style={styles.composer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            maxLength={500}
            placeholder="Say something..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, fontFamily: fonts.body }]}
          />
          <TouchableOpacity disabled={sending} onPress={() => send()} style={[styles.send, { backgroundColor: colors.foreground }]}>
            <Text style={{ color: colors.background, fontFamily: fonts.extraBold }}>SEND</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <CoinPreview visible={!!preview} onClose={() => setPreview(null)} name={preview?.name || ""} days={preview?.days || 0} />
      <BirthdayCard
        name={birthdayName || profile?.display_name || "friend"}
        visible={birthdayOpen}
        onClose={() => setBirthdayOpen(false)}
        onShare={(text) => send(text)}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },
  title: { fontSize: 64, lineHeight: 78, paddingTop: 5, fontFamily: fonts.display, letterSpacing: 0.5 },
  section: { fontSize: 18, fontFamily: fonts.black, letterSpacing: 2, marginTop: 28, marginBottom: 12 },
  empty: { fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
  friend: { height: 52, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 8, marginBottom: 6, gap: 10 },
  bdayBanner: { borderWidth: 2, padding: 12, marginTop: 18, flexDirection: "row", gap: 10, alignItems: "center" },
  locked: { padding: 18, alignItems: "center", gap: 12 },
  chat: { borderWidth: 1, padding: 14, minHeight: 100 },
  arcadeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  gameCard: { flexGrow: 1, minWidth: "30%", borderWidth: 2, padding: 12, minHeight: 100 },
  gameTitle: { fontSize: 13, fontFamily: fonts.black, letterSpacing: 1 },
  message: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  composer: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, padding: 12 },
  send: { paddingHorizontal: 16, justifyContent: "center" },
});
