/**
 * Normalizes URLs delivered by iOS/Android before Expo Router resolves them.
 * WidgetKit launches V1CE with v1ce://widget so we rewrite that stable native
 * intent to the actual Coin tab route. Keeping the widget URL independent of
 * the file-system route also lets us reorganize tabs without breaking widgets
 * already installed on a user's Home Screen.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    const normalized = String(path || "").toLowerCase();

    if (
      normalized === "widget" ||
      normalized === "/widget" ||
      normalized === "v1ce://widget" ||
      normalized === "v1ce:///widget" ||
      normalized === "customize" ||
      normalized === "/customize" ||
      normalized === "v1ce://customize" ||
      normalized === "v1ce:///customize"
    ) {
      return "/(tabs)/customize";
    }

    return path;
  } catch {
    return "/(tabs)/customize";
  }
}
