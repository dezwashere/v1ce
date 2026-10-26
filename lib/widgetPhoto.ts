import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";

/** Copy a photo into the App Group; widgets never fetch remote URLs while rendering. */
export async function cacheWidgetPhoto(userId: string, uri: string): Promise<string | undefined> {
  if (!requireOptionalNativeModule("FileSystem")) return undefined;
  const { File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
  const directory = Paths.appleSharedContainers["group.app.v1ce"];
  if (!directory) return undefined;
  const key = `v1ce.widget.photo.v2:${userId}`;
  try {
    const saved = JSON.parse(await AsyncStorage.getItem(key) || "null");
    if (saved?.source === uri && /^v1ce-coin-photo-[a-z0-9-]+\.img$/.test(saved.filename)) {
      const cached = new File(directory, saved.filename);
      if (cached.exists && cached.size > 0 && cached.size <= 8 * 1024 * 1024) return saved.filename;
    }
  } catch { /* Invalid cache metadata does not prevent a fresh copy. */ }
  if (!uri.startsWith("file://") && !uri.startsWith("https://")) return undefined;
  const filename = `v1ce-coin-photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}.img`;
  const destination = new File(directory, filename);
  if (uri.startsWith("file://")) {
    const source = new File(uri);
    if (!source.exists || source.size <= 0 || source.size > 8 * 1024 * 1024) return undefined;
    source.copy(destination);
  } else {
    await File.downloadFileAsync(uri, destination);
  }
  if (!destination.exists || destination.size <= 0 || destination.size > 8 * 1024 * 1024) return undefined;
  await AsyncStorage.setItem(key, JSON.stringify({ source: uri, filename }));
  return filename;
}
