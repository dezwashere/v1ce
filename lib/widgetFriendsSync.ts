import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, type FriendConnection } from "@/lib/supabase";
import { writeWidgetFriends, type WidgetFriend } from "@/lib/widgetCache";

/**
 * Restore the three chosen friends whenever the app opens. The widget stores
 * progress dates locally, so day counts advance even between app launches.
 */
export async function refreshWidgetFriendsForUser(userId: string): Promise<void> {
  const key = `v1ce_widget_friends_${userId}`;
  const saved = await AsyncStorage.getItem(key);
  if (!saved) return;

  let selectedIds: string[] = [];
  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      selectedIds = parsed.filter((id): id is string => typeof id === "string").slice(0, 3);
    }
  } catch {
    return;
  }

  if (!selectedIds.length) {
    await writeWidgetFriends([]);
    return;
  }

  const { data, error } = await supabase.rpc("get_my_friend_connections");
  if (error) throw error;
  const accepted = ((data || []) as FriendConnection[]).filter((f) => f.status === "accepted");
  const selected = selectedIds.flatMap((id): { userId: string; friend: WidgetFriend }[] => {
    const connection = accepted.find((f) => f.id === id);
    if (!connection) return [];
    const requester = connection.requester_id === userId;
    const targetId = requester ? connection.recipient_id : connection.requester_id;
    if (!targetId) return [];
    return [{
      userId: targetId,
      friend: {
        id,
        name: (requester ? connection.recipient_name : connection.requester_name) || "Friend",
        avatar: (requester ? connection.recipient_avatar : connection.requester_avatar) || "",
      },
    }];
  });

  const ids = selected.map(({ userId: targetId }) => targetId);
  const { data: dates, error: datesError } = ids.length
    ? await supabase.rpc("get_friend_widget_progress", { target_ids: ids })
    : { data: [], error: null };
  if (datesError) throw datesError;

  const progress = (dates || []) as { friend_id: string; sobriety_date: string | null }[];
  await writeWidgetFriends(selected.map(({ userId: targetId, friend }) => ({
    ...friend,
    sobrietyDate: progress.find((date) => date.friend_id === targetId)?.sobriety_date || null,
  })));
}
