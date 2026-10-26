import { supabase, type FriendConnection, type FriendProfile, type LoungeChatMessage } from "./supabase";

export const AVATAR_KEYS = ["MIA","CROSS","LEAF","JORDAN","PINK","DOTS","TAYLOR","CASEY"] as const;
export function avatarSeed(seed?: string | null) {
  return seed && AVATAR_KEYS.includes(seed.toUpperCase() as any) ? seed.toUpperCase() : undefined;
}
let missingMigration = false;
export async function loadAvatarChoices(ids: (string | undefined)[]): Promise<Record<string,string>> {
  const targets = [...new Set(ids.filter((id): id is string => !!id))];
  if (!targets.length || missingMigration) return {};
  const {data,error} = await supabase.rpc("get_friend_avatar_preferences", { target_ids: targets });
  if (error) {
    if (error.code === "PGRST202" || error.code === "42883") missingMigration = true;
    else console.warn("Saved friend avatar choices could not be refreshed.");
    return {};
  }
  return Object.fromEntries((data || []).flatMap((row: {friend_id:string;default_avatar_seed:string}) => {
    const seed=avatarSeed(row.default_avatar_seed); return seed ? [[row.friend_id,seed]] : [];
  }));
}
export async function friendConnectionsWithAvatars(currentUserId?: string) {
  const result = await supabase.rpc("get_my_friend_connections");
  if (result.error) return result;
  const rows = (result.data || []) as FriendConnection[];
  const choices = await loadAvatarChoices(rows.flatMap(row => [row.requester_id,row.recipient_id]));
  const enriched = rows.map(row => ({ ...row, requester_avatar_seed: choices[row.requester_id || ""], recipient_avatar_seed: choices[row.recipient_id || ""] }));
  const ids = enriched.flatMap(row => [row.requester_id, row.recipient_id]).filter((id): id is string => !!id);
  const { data: profiles } = ids.length ? await supabase.rpc("get_accepted_friend_profiles", { target_ids: [...new Set(ids)] }) : { data: [] };
  const profileMap = new Map(((profiles || []) as FriendProfile[]).map(profile => [profile.id, profile]));
  return { ...result, data: enriched.map(row => {
    const friendId = currentUserId && row.requester_id === currentUserId ? row.recipient_id : row.requester_id;
    return { ...row, friend_profile: profileMap.get(friendId || "") };
  }) };
}
export async function loungeMessagesWithAvatars() {
  const result=await supabase.rpc("get_lounge_messages");
  if(result.error)return result;
  const rows=(result.data||[]) as LoungeChatMessage[];
  const choices=await loadAvatarChoices(rows.map(row=>row.sender_id));
  return {...result,data:rows.map(row=>({...row,default_avatar_seed:choices[row.sender_id||""]}))};
}
