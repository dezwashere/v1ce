import { requireOptionalNativeModule } from "expo-modules-core";
type V1CEWidgetDataModuleType = { setSnapshot(json: string): void; clearSnapshot(): void; setFriends(json: string): void; };

const nativeModule = requireOptionalNativeModule<V1CEWidgetDataModuleType>("V1CEWidgetData");

// Expo Go and web do not contain this custom module. Keep the app usable there;
// development/production native builds receive the real module during prebuild.
export default nativeModule ?? {
  setSnapshot: () => {},
  clearSnapshot: () => {},
  setFriends: () => {},
};