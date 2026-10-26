import { Platform, requireNativeModule, requireNativeViewManager } from "expo-modules-core";

export type CoinRendererSnapshotRequest = {
  displayName: string;
  milestone: string;
  coinMotto: string;
  selections: string[];
  color: string;
  numberStyle: string;
  showBack: boolean;
  width: number;
  height: number;
};

type NativeCoinRenderer = {
  renderSnapshot(request: string): string;
  clearSnapshots(): void;
};

export const V1CECoinRenderer = Platform.OS === "ios"
  ? requireNativeModule<NativeCoinRenderer>("V1CECoinRenderer")
  : null;

export const V1CECoinView = Platform.OS === "ios"
  ? requireNativeViewManager("V1CECoinRenderer")
  : null;
