import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";
import type { SobrietyProfile } from "@/lib/supabase";
import V1CEWidgetData from "@/modules/v1ce-widget-data/src";

export const V1CE_WIDGET_CACHE_KEY = "v1ce_widget_profile_v1";
export const V1CE_WIDGET_FRIENDS_KEY = "v1ce_widget_selected_friends";
export type WidgetFriend = { id: string; name: string; avatar: string };
const V1CE_APP_GROUP = "group.app.v1ce";
const iosWidgetStorage = new ExtensionStorage(V1CE_APP_GROUP);

const IOS_WIDGET_KEYS = {
  ready: "v1ce_widget_ready",
  sobrietyDate: "v1ce_widget_sobriety_date",
  displayName: "v1ce_widget_display_name",
  coinColor: "v1ce_widget_coin_color",
  coinShape: "v1ce_widget_coin_shape",
  coinShapePath: "v1ce_widget_coin_shape_path",
  numberStyle: "v1ce_widget_number_style",
  coinShowBorder: "v1ce_widget_coin_show_border",
  coinBorderColor: "v1ce_widget_coin_border_color",
  coinNumberColor: "v1ce_widget_coin_number_color",
  coinMotto: "v1ce_widget_coin_motto",
  isPremium: "v1ce_widget_is_premium",
  personalQuote: "v1ce_widget_personal_quote",
} as const;

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
  isPremium: boolean;
  personalQuote: string;
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
    coinMotto: (profile.coin_motto || "").slice(0, 20),
    isPremium: !!profile.is_premium,
    personalQuote: (profile.personal_quote || "").slice(0, 90),
    substances: Array.isArray(profile.substances) ? profile.substances : [],
  };
}

function clearIosWidgetFields() {
  Object.values(IOS_WIDGET_KEYS).forEach((key) => iosWidgetStorage.remove(key));
  iosWidgetStorage.remove(V1CE_WIDGET_CACHE_KEY);
}

function writeIosWidgetFields(snapshot: WidgetProfileSnapshot) {
  iosWidgetStorage.set(IOS_WIDGET_KEYS.sobrietyDate, snapshot.sobrietyDate);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.displayName, snapshot.displayName);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.coinColor, snapshot.coinColor);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.coinShape, snapshot.coinShape);
  snapshot.coinShapePath
    ? iosWidgetStorage.set(IOS_WIDGET_KEYS.coinShapePath, snapshot.coinShapePath)
    : iosWidgetStorage.remove(IOS_WIDGET_KEYS.coinShapePath);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.numberStyle, snapshot.numberStyle);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.coinShowBorder, snapshot.coinShowBorder ? 1 : 0);
  snapshot.coinBorderColor
    ? iosWidgetStorage.set(IOS_WIDGET_KEYS.coinBorderColor, snapshot.coinBorderColor)
    : iosWidgetStorage.remove(IOS_WIDGET_KEYS.coinBorderColor);
  snapshot.coinNumberColor
    ? iosWidgetStorage.set(IOS_WIDGET_KEYS.coinNumberColor, snapshot.coinNumberColor)
    : iosWidgetStorage.remove(IOS_WIDGET_KEYS.coinNumberColor);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.coinMotto, snapshot.coinMotto);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.isPremium, snapshot.isPremium ? 1 : 0);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.personalQuote, snapshot.personalQuote);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.ready, 1);
}

export async function writeWidgetProfileSnapshot(profile: SobrietyProfile | null) {
  if (!profile?.sobriety_date) {
    await AsyncStorage.removeItem(V1CE_WIDGET_CACHE_KEY);
    if (Platform.OS === "ios") {
      try {
        clearIosWidgetFields();
        ExtensionStorage.reloadWidget();
      } catch {}
    } else {
      try { V1CEWidgetData.clearSnapshot(); } catch {}
    }
    return;
  }

  const snapshotObject = toWidgetProfileSnapshot(profile);
  const snapshot = JSON.stringify(snapshotObject);
  await AsyncStorage.setItem(V1CE_WIDGET_CACHE_KEY, snapshot);

  if (Platform.OS === "ios") {
    try {
      // Keep the legacy JSON snapshot for backwards compatibility, but write
      // native fields individually so WidgetKit does not depend on JSON decoding.
      iosWidgetStorage.set(V1CE_WIDGET_CACHE_KEY, snapshot);
      writeIosWidgetFields(snapshotObject);
      ExtensionStorage.reloadWidget();
    } catch {}
  } else {
    try { V1CEWidgetData.setSnapshot(snapshot); } catch {}
  }
}

export async function verifyWidgetSharedSnapshot() {
  if (Platform.OS !== "ios") return { ok: true, reason: "ANDROID USES THE ANDROID WIDGET BRIDGE" };
  try {
    const expected = await AsyncStorage.getItem(V1CE_WIDGET_CACHE_KEY);
    if (!expected) return { ok: false, reason: "NO APP SNAPSHOT SAVED" };
    const parsed = JSON.parse(expected) as WidgetProfileSnapshot;
    const ready = iosWidgetStorage.get(IOS_WIDGET_KEYS.ready);
    const sobrietyDate = iosWidgetStorage.get(IOS_WIDGET_KEYS.sobrietyDate);
    const coinColor = iosWidgetStorage.get(IOS_WIDGET_KEYS.coinColor);
    const coinShape = iosWidgetStorage.get(IOS_WIDGET_KEYS.coinShape);
    if (!ready) return { ok: false, reason: "APP GROUP READY FLAG IS MISSING" };
    if (sobrietyDate !== parsed.sobrietyDate) return { ok: false, reason: "WIDGET SOBRIETY DATE DOES NOT MATCH" };
    if (coinColor !== parsed.coinColor) return { ok: false, reason: "WIDGET COIN COLOR DOES NOT MATCH" };
    if (coinShape !== parsed.coinShape) return { ok: false, reason: "WIDGET COIN SHAPE DOES NOT MATCH" };
    return { ok: true, reason: "APP GROUP WIDGET FIELDS MATCH" };
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
