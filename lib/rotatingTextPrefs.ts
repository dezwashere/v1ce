import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

export type RotatingTextPrefs = { rotating: boolean; pausedWord: string; customWords: string[] };

export const HOME_WORD_PREFS_KEY = "v1ce_home_word_prefs";
export const CUSTOMIZE_WORD_PREFS_KEY = "v1ce_customize_word_prefs";
export const ROTATING_PREFS_CHANGED = "v1ce_rotating_prefs_changed";
export const DEFAULT_ROTATING_PREFS: RotatingTextPrefs = { rotating: true, pausedWord: "", customWords: [] };

export async function loadRotatingTextPrefs(key: string): Promise<RotatingTextPrefs> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return DEFAULT_ROTATING_PREFS;
    const parsed = JSON.parse(raw);
    return {
      rotating: parsed.rotating !== false,
      pausedWord: typeof parsed.pausedWord === "string" ? parsed.pausedWord.slice(0, 24) : "",
      customWords: Array.isArray(parsed.customWords) ? parsed.customWords.slice(0, 5).map((word: unknown) => typeof word === "string" ? word.slice(0, 24) : "") : [],
    };
  } catch {
    return DEFAULT_ROTATING_PREFS;
  }
}

export async function saveRotatingTextPrefs(key: string, prefs: RotatingTextPrefs) {
  await AsyncStorage.setItem(key, JSON.stringify({
    rotating: prefs.rotating,
    pausedWord: prefs.pausedWord.trim().slice(0, 24),
    customWords: prefs.customWords.slice(0, 5).map((word) => word.slice(0, 24)),
  }));
  DeviceEventEmitter.emit(ROTATING_PREFS_CHANGED, key);
}
