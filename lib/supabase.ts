import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gvvnixltrfyhsmakdqgm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cxaVNv_FUG-bmaP8oE5tDQ_DVkoyl8Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type SobrietyProfile = {
  id?: string;
  user_id?: string | null;
  email: string;
  display_name: string;
  sobriety_date: string;
  birthday?: string | null;
  substances: string[];
  coin_shape_path?: string | null;
  coin_color: string;
  coin_shape: string;
  coin_background?: string | null;
  coin_background_color?: string | null;
  number_style: string;
  coin_show_border: boolean;
  coin_border_color: string | null;
  coin_number_color: string | null;
  coin_photo: string | null;
  coin_image_only: boolean;
  coin_motto: string;
  avatar_url: string | null;
  gifted_count: number;
  is_premium: boolean;
  coin_balance: number;
  created_at?: string;
};

export type FriendConnection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester_name: string | null;
  requester_avatar: string | null;
  recipient_name: string | null;
  recipient_avatar: string | null;
  status: "pending" | "accepted" | "declined" | "blocked";
  is_active_in_lounge: boolean;
  created_at: string;
};

export type BlockedUser = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};