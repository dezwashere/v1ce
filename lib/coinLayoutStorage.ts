import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeLayout, type CoinTextLayout } from "./coinDesign";
const cache = new Map<string, CoinTextLayout>();
const key = (id: string) => `v1ce.coin.text-layout.v1:${id}`;
export async function loadCoinLayout(id: string, remote?: unknown) {
  const saved = await AsyncStorage.getItem(key(id));
  let layout = normalizeLayout(null);
  try { layout = normalizeLayout(saved ? JSON.parse(saved) : null); } catch {}
  if (remote && typeof remote === "object" && (remote as any).version === 1) layout = normalizeLayout(remote);
  cache.set(id, layout);
  return layout;
}
export function cachedCoinLayout(id: string) { return cache.get(id); }
export async function saveCoinLayout(id: string, input: CoinTextLayout) {
  const layout = normalizeLayout(input);
  await AsyncStorage.setItem(key(id), JSON.stringify(layout));
  cache.set(id, layout);
}
