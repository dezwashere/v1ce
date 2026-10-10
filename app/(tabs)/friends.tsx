import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { supabase, TABLES, type BlockedUser, type FriendConnection } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { useTranslation } from "@/lib/i18n";
import FriendAvatar from "@/components/lounge/FriendAvatar";
import CoinPreview from "@/components/lounge/CoinPreview";
import { writeWidgetFriends } from "@/lib/widgetCache";

export default function Friends() {
  const { user } = useAuth();
  const colors = useColors();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [previewFriend, setPreviewFriend] = useState<FriendConnection | null>(null);
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [widgetFriendIds, setWidgetFriendIds] = useState<string[]>([]);
  const [widgetSelectionLoaded, setWidgetSelectionLoaded] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const widgetSelectionKey = user?.id ? `v1ce_widget_friends_${user.id}` : "";
  const [pending, setPending] = useState<FriendConnection[]>([]);
  const [outgoing, setOutgoing] = useState<FriendConnection[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const signedIn = !!user?.id;

  const load = async () => {
    if (!user?.id) return;
    const [{ data, error }, { data: blocks, error: blockError }] = await Promise.all([
      supabase.rpc("get_my_friend_connections"),
      supabase.from(TABLES.BlockedUser).select("*").eq("blocker_id", user.id),
    ]);
    if (error) Alert.alert("V1CE", error.message);
    if (blockError) Alert.alert("V1CE", blockError.message);
    const rows = (data || []) as FriendConnection[];
    if (!error) {
      setFriends(rows.filter((f) => f.status === "accepted"));
      setFriendsLoaded(true);
    }
    setPending(rows.filter((f) => f.status === "pending" && (f.recipient_id === user.id || f.recipient_email === user.email)));
    setOutgoing(rows.filter((f) => f.status === "pending" && f.requester_id === user.id));
    setBlocked((blocks || []) as BlockedUser[]);
  };

  useEffect(() => {
    setFriendsLoaded(false);
    if (signedIn) void load();
  }, [user?.id, signedIn]);

  useEffect(() => {
    let active = true;
    setWidgetSelectionLoaded(false);
    setWidgetFriendIds([]);
    if (!widgetSelectionKey) return;
    void AsyncStorage.getItem(widgetSelectionKey).then((saved) => {
      if (!active) return;
      let ids: string[] = [];
      try {
        const parsed: unknown = saved ? JSON.parse(saved) : [];
        if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string").slice(0, 3);
      } catch {}
      setWidgetFriendIds(ids);
      setWidgetSelectionLoaded(true);
    });
    return () => { active = false; };
  }, [widgetSelectionKey]);

  const syncWidgetFriends = async (ids: string[], accepted: FriendConnection[]) => {
    const selected = ids.flatMap((id) => {
      const friend = accepted.find((f) => f.id === id);
      if (!friend) return [];
      const isRequester = friend.requester_id === user?.id;
      return [{ id, name: isRequester ? (friend.recipient_name || "Friend") : (friend.requester_name || "Friend"), avatar: (isRequester ? friend.recipient_avatar : friend.requester_avatar) || "" }];
    });
    const userIds = selected.map((friend) => { const connection = accepted.find((f) => f.id === friend.id); return connection?.requester_id === user?.id ? connection?.recipient_id : connection?.requester_id; });
    const validUserIds = userIds.filter((id): id is string => !!id);
    const { data: profiles, error } = validUserIds.length ? await supabase.from(TABLES.SobrietyProfile).select("user_id,sobriety_date").in("user_id", validUserIds) : { data: [], error: null };
    if (error) console.warn("Could not load widget friend progress", error.message);
    await writeWidgetFriends(selected.map((friend, index) => ({ ...friend, sobrietyDate: profiles?.find((profile) => profile.user_id === userIds[index])?.sobriety_date || null })));
  };

  useEffect(() => {
    if (!widgetSelectionLoaded || !friendsLoaded || !widgetSelectionKey) return;
    const acceptedIds = new Set(friends.map((friend) => friend.id));
    const validIds = widgetFriendIds.filter((id) => acceptedIds.has(id));
    void (async () => {
      try {
        if (validIds.length !== widgetFriendIds.length) {
          await AsyncStorage.setItem(widgetSelectionKey, JSON.stringify(validIds));
          setWidgetFriendIds(validIds);
        }
        await syncWidgetFriends(validIds, friends);
      } catch {
        Alert.alert("V1CE", "Could not refresh widget friends.");
      }
    })();
  }, [widgetSelectionLoaded, friendsLoaded, widgetSelectionKey, friends]);

  const toggleWidgetFriend = async (friendId: string) => {
    if (!widgetSelectionLoaded || !widgetSelectionKey) return;
    const next = widgetFriendIds.includes(friendId)
      ? widgetFriendIds.filter((id) => id !== friendId)
      : [...widgetFriendIds, friendId].slice(0, 3);
    if (!widgetFriendIds.includes(friendId) && widgetFriendIds.length >= 3) {
      Alert.alert("V1CE", "Select up to three friends for your widget. Deselect one first.");
      return;
    }
    try {
      await AsyncStorage.setItem(widgetSelectionKey, JSON.stringify(next));
      await syncWidgetFriends(next, friends);
      setWidgetFriendIds(next);
    } catch {
      Alert.alert("V1CE", "Could not save widget friend selection.");
    }
  };

  const send = async () => {
    if (!user?.id || !email.trim()) return;
    const target = email.trim().toLowerCase();
    const { data: targetProfile, error: lookupError } = await supabase.rpc("find_profile_by_email", { target_email: target });
    if (lookupError) return Alert.alert("V1CE", lookupError.message);
    if (!targetProfile?.length) return Alert.alert("V1CE", "No V1CE profile found for that email.");
    const targetId = targetProfile[0].id;
    if (targetId === user.id) return Alert.alert("V1CE", "You can't add yourself.");
    const { error } = await supabase.from(TABLES.FriendConnection).insert({
      requester_id: user.id,
      recipient_id: targetId,
      requester_email: user.email,
      recipient_email: target,
      requester_name: "",
      recipient_name: "",
      status: "pending",
    });
    if (error) Alert.alert("V1CE", error.message);
    else {
      setEmail("");
      Alert.alert("V1CE", "Friend request sent!");
      load();
    }
  };

  const action = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from(TABLES.FriendConnection).update({ status }).eq("id", id);
    if (error) Alert.alert("V1CE", error.message);
    load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from(TABLES.FriendConnection).delete().eq("id", id);
    if (error) Alert.alert("V1CE", error.message);
    load();
  };
  const block = async (id: string) => {
    const friend = friends.find((f) => f.id === id);
    if (!friend || !user?.id) return;
    const blockedId = friend.requester_id === user.id ? friend.recipient_id : friend.requester_id;
    const blockedEmail = friend.requester_id === user.id ? friend.recipient_email : friend.requester_email;
    const { error } = await supabase.from(TABLES.BlockedUser).insert({
      blocker_id: user.id,
      blocked_id: blockedId,
      blocker_email: user.email,
      blocked_email: blockedEmail,
    });
    if (error) Alert.alert("V1CE", error.message);
    else {
      await supabase.from(TABLES.FriendConnection).delete().eq("id", id);
      load();
    }
  };
  const unblock = async (id: string) => {
    const { error } = await supabase.from(TABLES.BlockedUser).delete().eq("id", id);
    if (error) Alert.alert("V1CE", error.message);
    load();
  };
  const friendName = (f: FriendConnection) =>
    f.requester_id === user?.id ? f.recipient_name || f.recipient_email || "Friend" : f.requester_name || f.requester_email || "Friend";
  const activeCount = friends.filter((f) => f.is_active_in_lounge).length;
  const toggleLounge = async (id: string, current: boolean) => {
    if (!current && activeCount >= 8) return Alert.alert("V1CE", t("friends.maxFriends"));
    const { error } = await supabase.from(TABLES.FriendConnection).update({ is_active_in_lounge: !current }).eq("id", id);
    if (error) Alert.alert("V1CE", error.message);
    else load();
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.foreground }]}>{t("friends.manageFriends")}</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>{t("friends.yourFriends")}</Text>
      <View style={[styles.rule, { backgroundColor: colors.foreground }]} />

      <Text style={[styles.heading, { color: colors.foreground }]}>{t("friends.sendRequest")}</Text>
      <View style={styles.row}>
        <View style={[styles.inputWrap, { borderColor: colors.foreground }]}>
          <Feather name="mail" size={18} color={colors.foreground} style={{ marginRight: 8 }} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t("friends.enterEmail")}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
          />
        </View>
        <TouchableOpacity onPress={send} style={styles.send}>
          <Feather name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={[styles.rule, { backgroundColor: colors.foreground }]} />

      <Text style={[styles.heading, { color: colors.foreground }]}>{t("friends.incoming")}</Text>
      {pending.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>{t("friends.noPendingRequests")}</Text>
      ) : (
        pending.map((f) => (
          <View key={f.id} style={[styles.card, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontFamily: fonts.bodySemi }}>{f.requester_name || f.requester_email || "Friend"}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => action(f.id, "accepted")}>
                <Text style={{ color: colors.foreground, fontFamily: fonts.extraBold }}>{t("friends.accept")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => action(f.id, "rejected")}>
                <Text style={{ color: colors.mutedForeground }}>{t("friends.reject")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={[styles.heading, { color: colors.foreground, marginTop: 24 }]}>{t("friends.sentRequests")}</Text>
      {outgoing.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>{t("friends.noSentRequests")}</Text>
      ) : outgoing.map((f) => (
        <View key={f.id} style={[styles.card, { borderColor: colors.border }]}>
          <View>
            <Text style={{ color: colors.foreground, fontFamily: fonts.bodySemi }}>{f.recipient_name || f.recipient_email || "Friend"}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: fonts.body, fontSize: 11, marginTop: 3 }}>{t("friends.requestPending")}</Text>
          </View>
          <TouchableOpacity onPress={() => remove(f.id)}>
            <Text style={{ color: colors.mutedForeground, fontFamily: fonts.extraBold }}>{t("friends.cancel")}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.heading, { color: colors.foreground, marginTop: 24 }]}>{t("friends.yourFriends")}</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>Select up to three accepted friends for your Large widget ({widgetFriendIds.filter((id) => friends.some((f) => f.id === id)).length}/3).</Text>
      {friends.length === 0 ? (
        <Text style={[styles.foot, { color: colors.mutedForeground }]}>{t("friends.noFriendsYet")}</Text>
      ) : (
        <View style={styles.friendGrid}>
          {friends.map((f) => {
            const name = friendName(f);
            const photo = (f.requester_id === user?.id ? f.recipient_avatar : f.requester_avatar) || "";
            return (
              <View key={f.id} style={[styles.friendTile, { borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => setPreviewFriend(f)} accessibilityRole="button" accessibilityLabel={`View ${name} profile`}><FriendAvatar seed={name} uri={photo} size={58} /></TouchableOpacity>
                <TouchableOpacity disabled={!widgetSelectionLoaded} onPress={() => void toggleWidgetFriend(f.id)} accessibilityRole="checkbox" accessibilityState={{ checked: widgetFriendIds.includes(f.id), disabled: !widgetSelectionLoaded }}>
                  <Text style={[styles.friendTileStatus, { color: colors.foreground }]}>{widgetFriendIds.includes(f.id) ? "Selected for widget" : "Add to widget"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPreviewFriend(f)} style={{width:"100%"}}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.friendTileName, { color: colors.foreground }]}>{name}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => toggleLounge(f.id, !!f.is_active_in_lounge)}>
                  <Text style={[styles.friendTileStatus, { color: colors.foreground }]}>{f.is_active_in_lounge ? t("friends.active") : t("friends.inactive")}</Text>
                </TouchableOpacity>
                <View style={styles.tileActions}>
                  <TouchableOpacity onPress={() => remove(f.id)}><Text style={{ color: colors.mutedForeground, fontFamily: fonts.extraBold, fontSize: 8 }}>{t("friends.remove")}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => block(f.id)}><Text style={{ color: colors.mutedForeground, fontFamily: fonts.bodyBold, fontSize: 8 }}>{t("friends.blockUser")}</Text></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <CoinPreview visible={!!previewFriend} onClose={() => setPreviewFriend(null)} name={previewFriend ? friendName(previewFriend) : ""} days={0} showDays={false} showCoinPlaceholder={false} avatarSeed={previewFriend ? friendName(previewFriend) : ""} showCoin={false} />
      {blocked.length > 0 ? (
        <>
          <Text style={[styles.heading, { color: colors.foreground, marginTop: 28 }]}>{t("friends.blockedUsers")}</Text>
          {blocked.map((b) => (
            <View key={b.id} style={[styles.card, { borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground }}>{b.blocked_email || "BLOCKED USER"}</Text>
              <TouchableOpacity onPress={() => unblock(b.id)}>
                <Text style={{ color: colors.mutedForeground }}>{t("friends.unblock")}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },
  title: { fontSize: 56, lineHeight: 68, paddingTop: 4, fontFamily: fonts.display },
  sub: { fontSize: 15, lineHeight: 22, fontFamily: fonts.body, marginTop: 12 },
  rule: { height: 2, marginVertical: 22 },
  heading: { fontSize: 13, fontFamily: fonts.extraBold, letterSpacing: 1.4, marginBottom: 12 },
  row: { flexDirection: "row", gap: 0 },
  inputWrap: {
    flex: 1,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, fontFamily: fonts.body, paddingVertical: 12 },
  send: { width: 52, alignItems: "center", justifyContent: "center", backgroundColor: "#8E8E8E" },
  empty: { textAlign: "center", fontSize: 14, fontFamily: fonts.body, marginTop: 8 },
  foot: { textAlign: "center", fontSize: 14, fontFamily: fonts.body, marginTop: 36 },
  card: { borderWidth: 2, padding: 16, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 14, alignItems: "center" },
  friendGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", columnGap: 4, rowGap: 10 },
  friendTile: { width: "32%", minHeight: 175, borderWidth: 2, alignItems: "center", justifyContent: "center", padding: 5 },
  friendTileName: { width: "100%", textAlign: "center", fontFamily: fonts.extraBold, fontSize: 11, lineHeight: 15, marginTop: 8 },
  friendTileStatus: { fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 0.5, marginTop: 4, textAlign: "center" },
  tileActions: { marginTop: 8, gap: 5, alignItems: "center" },
});
