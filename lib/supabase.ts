import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://gvvnixltrfyhsmakdqgm.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_cxaVNv_FUG-bmaP8oE5tDQ_DVkoyl8Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Live table names mapped from Base44 entity names in V1CE_Code.txt / V1CE_daea.txt */
export const TABLES = {
  SobrietyProfile: "profiles",
  FriendConnection: "friend_connections",
  BlockedUser: "blocked_users",
  LoungeChatMessage: "lounge_messages",
  GiveawayEntry: "giveaway_entries",
} as const;

export type SobrietyProfile = {
  id?: string;
  user_id?: string;
  email: string;
  display_name: string;
  sobriety_date: string;
  birthday?: string | null;
  substances: string[];
  coin_color: string;
  coin_shape: string;
  coin_shape_path?: string | null;
  coin_background?: string;
  coin_background_color?: string;
  number_style: string;
  coin_show_border: boolean;
  coin_border_color: string;
  coin_number_color: string;
  coin_photo: string;
  coin_image_only: boolean;
  coin_motto: string;
  personal_quote?: string | null;
  avatar_url: string;
  gifted_count: number;
  is_premium: boolean;
  show_coin?: boolean;
  status_note?: string;
  default_avatar_seed?: string;
  coin_balance: number;
  created_at?: string;
};

export type FriendConnection = {
  id: string;
  requester_id?: string;
  recipient_id?: string;
  requester_email: string;
  recipient_email: string;
  requester_name: string;
  recipient_name: string;
  requester_avatar?: string | null;
  recipient_avatar?: string | null;
  status: "pending" | "accepted" | "rejected" | "declined" | "blocked" | string;
  is_active_in_lounge?: boolean;
  created_at: string;
};

export type BlockedUser = {
  id: string;
  blocker_id?: string;
  blocked_id?: string;
  blocker_email: string;
  blocked_email: string;
  created_at: string;
};

export type LoungeChatMessage = {
  id: string;
  sender_id?: string;
  body?: string;
  message?: string;
  sender_name: string;
  display_name?: string | null;
  avatar_url?: string | null;
  message_type?: "regular" | "birthday_announcement" | "birthday_response" | string;
  related_friend?: string | null;
  created_at: string;
};

export type GiveawayEntry = {
  id: string;
  email: string;
  entered_by_email?: string | null;
  is_winner: boolean;
  giveaway_month: string;
  created_at?: string;
};

export const defaultProfileFields = {
  coin_color: "#F5D680",
  coin_shape: "circle",
  number_style: "classic",
  coin_show_border: true,
  coin_border_color: "",
  coin_number_color: "",
  coin_photo: "",
  coin_image_only: false,
  coin_motto: "",
  personal_quote: "",
  coin_background: "solid",
  coin_background_color: "#F5D680",
  coin_shape_path: "",
  avatar_url: "",
  gifted_count: 0,
  is_premium: false,
  show_coin: true,
  status_note: "",
  default_avatar_seed: "MIA",
  coin_balance: 0,
  substances: [] as string[],
};
