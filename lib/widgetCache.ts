import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";
import type { SobrietyProfile } from "@/lib/supabase";
import V1CEWidgetData from "@/modules/v1ce-widget-data/src";

export const V1CE_WIDGET_CACHE_KEY = "v1ce_widget_profile_v1";
const V1CE_APP_GROUP = "group.app.v1ce";
const iosWidgetStorage = new ExtensionStorage(V1CE_APP_GROUP);

export type WidgetProfileSnapshot = {
  userId: string;
  sobrietyDate: string;
  displayName: string;
  coinColor: string;
  coinShape: string;
  coinShapePath: string | null;
  numberStyle: string;
  coinShowBorder: boolean;
  coinBorderColor: string | null;
  coinNumberColor: string | null;
  coinPhoto: string | null;
  coinImageOnly: boolean;
  coinMotto: string;
  substances: string[];
};

export function toWidgetProfileSnapshot(profile: SobrietyProfile): WidgetProfileSnapshot {
  return {
    userId: profile.user_id || profile.id || "",
    sobrietyDate: profile.sobriety_date,
    displayName: profile.display_name || "",
    coinColor: profile.coin_color || "#F5D680",
    coinShape: profile.coin_shape || "circle",
    coinShapePath: profile.coin_shape_path || null,
    numberStyle: profile.number_style || "classic",
    coinShowBorder: profile.coin_show_border ?? true,
    coinBorderColor: profile.coin_border_color || null,
    coinNumberColor: profile.coin_number_color || null,
    coinPhoto: profile.coin_photo || null,
    coinImageOnly: profile.coin_image_only ?? false,
    coinMotto: (profile.coin_motto || "").slice(0, 18),
    substances: Array.isArray(profile.substances) ? profile.substances : [],
  };
}

export async function writeWidgetProfileSnapshot(profile: SobrietyProfile | null) {
  if (!profile?.sobriety_date) {
    await AsyncStorage.removeItem(V1CE_WIDGET_CACHE_KEY);
    if (Platform.OS === "ios") {
      try { iosWidgetStorage.remove(V1CE_WIDGET_CACHE_KEY); ExtensionStorage.reloadWidget("V1CEWidget"); } catch {}
    } else {
      try { V1CEWidgetData.clearSnapshot(); } catch {}
    }
    return;
  }
  const snapshot = JSON.stringify(toWidgetProfileSnapshot(profile));
  await AsyncStorage.setItem(V1CE_WIDGET_CACHE_KEY, snapshot);
  if (Platform.OS === "ios") {
    try { iosWidgetStorage.set(V1CE_WIDGET_CACHE_KEY, snapshot); ExtensionStorage.reloadWidget("V1CEWidget"); } catch {}
  } else {
    try { V1CEWidgetData.setSnapshot(snapshot); } catch {}
  }
}

export async function verifyWidgetSharedSnapshot() {
  if (Platform.OS !== "ios") return { ok: true, reason: "ANDROID USES THE ANDROID WIDGET BRIDGE" };
  try {
    const expected = await AsyncStorage.getItem(V1CE_WIDGET_CACHE_KEY);
    const shared = iosWidgetStorage.get(V1CE_WIDGET_CACHE_KEY);
    if (!expected) return { ok: false, reason: "NO APP SNAPSHOT SAVED" };
    if (!shared) return { ok: false, reason: "APP GROUP SNAPSHOT IS MISSING" };
    if (shared !== expected) return { ok: false, reason: "APP GROUP SNAPSHOT DOES NOT MATCH" };
    return { ok: true, reason: "APP GROUP SNAPSHOT MATCHES" };
  } catch {
    return { ok: false, reason: "SHARED STORAGE COULD NOT BE READ" };
  }
}

export function getDaysSober(sobrietyDate: string, now = Date.now()) {
  const start = new Date(
    sobrietyDate.includes("T") ? sobrietyDate : sobrietyDate + "T00:00:00",
  ).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now - start) / 86400000));
}

export function getCoinDisplay(days: number) {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years >= 1) return { value: years, label: years === 1 ? "YEAR" : "YEARS" };
  if (months >= 1) return { value: months, label: months === 1 ? "MONTH" : "MONTHS" };
  return { value: days, label: "DAYS" };
}

export function getAutoContrast(hex: string) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#FFFFFF";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : luminance > 0.5 ? "#0A0A0A" : "#FFFFFF";
}
