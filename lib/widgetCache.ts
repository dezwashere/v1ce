import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";
import type { SobrietyProfile } from "@/lib/supabase";
import V1CEWidgetData from "@/modules/v1ce-widget-data/src";
import { buildCoinDesign, coinInputFromProfile, normalizeShape, type CoinDesign } from "./coinDesign";
import { normalizeNumberStyle } from "../constants/coin";
import { cacheWidgetPhoto } from "./widgetPhoto";
import { V1CECoinRenderer } from "@/modules/v1ce-coin-renderer/src";
import { formatMilestoneDuration } from "./milestoneDuration";

export const V1CE_WIDGET_CACHE_KEY = "v1ce_widget_profile_v1";
export const V1CE_WIDGET_DESIGN_KEY = "v1ce_widget_coin_design_v2";
export const V1CE_WIDGET_FRIENDS_KEY = "v1ce_widget_selected_friends";
export type WidgetFriend = { id: string; name: string; avatar: string; avatarSeed?: string; photoFile?: string; sobrietyDate?: string | null };
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
  coinBackIcon: "v1ce_widget_coin_back_icon",
  isPremium: "v1ce_widget_is_premium",
  personalQuote: "v1ce_widget_personal_quote",
} as const;

export type WidgetProfileSnapshot = {
  coinDesign: CoinDesign;
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
  coinBackIcon: string;
  isPremium: boolean;
  personalQuote: string;
  milestoneDisplayFormat?: import("./milestoneDuration").MilestoneDisplayFormat;
  substances: string[];
};

export function toWidgetProfileSnapshot(profile: SobrietyProfile): WidgetProfileSnapshot {
  return {
    coinDesign: buildCoinDesign(coinInputFromProfile(profile)),
    userId: profile.user_id || profile.id || "",
    sobrietyDate: profile.sobriety_date,
    displayName: profile.display_name || "",
    coinColor: profile.coin_color || "#F5D680",
    coinShape: normalizeShape(profile.coin_shape),
    coinShapePath: profile.coin_shape_path || null,
    numberStyle: normalizeNumberStyle(profile.number_style),
    coinShowBorder: profile.coin_show_border ?? true,
    coinBorderColor: profile.coin_border_color || null,
    coinNumberColor: profile.coin_number_color || null,
    coinPhoto: profile.coin_photo || null,
    coinImageOnly: profile.coin_image_only ?? false,
    coinMotto: (profile.coin_motto || "").slice(0, 20),
    coinBackIcon: profile.coin_back_icon || "none",
    isPremium: !!profile.is_premium,
    personalQuote: (profile.personal_quote || "").slice(0, 90),
    milestoneDisplayFormat: profile.milestone_display_format || "automatic",
    substances: Array.isArray(profile.substances) ? profile.substances : [],
  };
}

export async function writeWidgetFriends(friends: WidgetFriend[]) {
  const selected = friends.slice(0, 3).map((friend) => ({
    id: friend.id,
    name: friend.name.slice(0, 60),
    avatar: friend.avatar || "",
    avatarSeed: friend.avatarSeed || friend.name,
    photoFile: undefined as string | undefined,
    sobrietyDate: friend.sobrietyDate || null,
  }));
  if (Platform.OS === "ios") await Promise.all(selected.map(async friend => {
    if (!friend.avatar) return;
    try { friend.photoFile = await cacheWidgetPhoto(`friend:${friend.id}`, friend.avatar); } catch {}
  }));
  const json = JSON.stringify(selected);
  await AsyncStorage.setItem(V1CE_WIDGET_FRIENDS_KEY, json);
  if (Platform.OS === "ios") {
    iosWidgetStorage.set(V1CE_WIDGET_FRIENDS_KEY, json);
    ExtensionStorage.reloadWidget();
  } else if (Platform.OS === "android") {
    V1CEWidgetData.setFriends(json);
  }
}

function clearIosWidgetFields() {
  Object.values(IOS_WIDGET_KEYS).forEach((key) => iosWidgetStorage.remove(key));
  iosWidgetStorage.remove(V1CE_WIDGET_CACHE_KEY);
  iosWidgetStorage.remove(V1CE_WIDGET_DESIGN_KEY);
  iosWidgetStorage.remove(V1CE_WIDGET_FRIENDS_KEY);
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
  iosWidgetStorage.set(IOS_WIDGET_KEYS.coinBackIcon, snapshot.coinBackIcon);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.isPremium, snapshot.isPremium ? 1 : 0);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.personalQuote, snapshot.personalQuote);
  iosWidgetStorage.set(IOS_WIDGET_KEYS.ready, 1);
}

let snapshotRevision = 0;
export async function writeWidgetProfileSnapshot(profile: SobrietyProfile | null) {
  const revision = ++snapshotRevision;
  if (!profile?.sobriety_date) {
    await AsyncStorage.removeItem(V1CE_WIDGET_CACHE_KEY);
    await AsyncStorage.removeItem(V1CE_WIDGET_FRIENDS_KEY);
    if (revision !== snapshotRevision) return;
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
  if (Platform.OS === "ios" && snapshotObject.coinPhoto) {
    try { snapshotObject.coinDesign.photoFile = await cacheWidgetPhoto(snapshotObject.userId, snapshotObject.coinPhoto); }
    catch { /* Still publish current colors/text; widget explicitly shows that its photo needs refreshing. */ }
  }
  if (revision !== snapshotRevision) return; // Discard a slow older photo request after an edit/sign-out.
  const snapshot = JSON.stringify(snapshotObject);
  await AsyncStorage.setItem(V1CE_WIDGET_CACHE_KEY, snapshot);
  if (revision !== snapshotRevision) return;

  if (Platform.OS === "ios") {
    try {
      // Keep the legacy JSON snapshot for backwards compatibility, but write
      // native fields individually so WidgetKit does not depend on JSON decoding.
      iosWidgetStorage.set(V1CE_WIDGET_CACHE_KEY, snapshot);
      writeIosWidgetFields(snapshotObject);
      // One complete payload is the atomic source for the new widget renderer.
      iosWidgetStorage.set(V1CE_WIDGET_DESIGN_KEY, snapshot);
      if (V1CECoinRenderer) {
        const progress = snapshotObject.milestoneDisplayFormat
          ? { value: formatMilestoneDuration(snapshotObject.sobrietyDate, snapshotObject.milestoneDisplayFormat), label: "" }
          : getCoinDisplay(getDaysSober(snapshotObject.sobrietyDate));
        for (const showBack of [false, true]) {
          V1CECoinRenderer.renderSnapshot(JSON.stringify({
            displayName: snapshotObject.displayName,
            milestone: `${progress.value}${progress.label ? ` ${progress.label}` : ""}`,
            coinMotto: snapshotObject.coinMotto,
            selections: snapshotObject.substances.slice(0, 3),
            color: snapshotObject.coinColor,
            numberStyle: snapshotObject.numberStyle,
            showBack,
            width: 1024,
            height: 1024,
          }));
        }
      }
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
    if (iosWidgetStorage.get(V1CE_WIDGET_DESIGN_KEY) !== expected) return { ok: false, reason: "WIDGET COIN DESIGN DOES NOT MATCH" };
    if (parsed.coinPhoto && !parsed.coinDesign.photoFile) return { ok: false, reason: "WIDGET PHOTO COULD NOT BE CACHED" };
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
