import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import type { SobrietyProfile } from './supabase';
import { resolveCoinColor } from '@/constants/coin';
import type { V1CEWidgetProps } from '../widgets/V1CEWidgetProps';

const STORAGE_KEY = 'v1ce_widget_payload';

export type WidgetPayload = V1CEWidgetProps;

function daysSober(sobrietyDate?: string | null) {
  if (!sobrietyDate) return 0;
  const start = new Date(sobrietyDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
}

async function sharedCoinPhoto(source: string | null | undefined) {
  if (!source || !widgetsDirectory) return null;
  try {
    const target = new File(widgetsDirectory, 'v1ce-coin-photo.jpg');
    if (source.startsWith('http://') || source.startsWith('https://')) {
      await File.downloadFileAsync(source, target, { idempotent: true });
    } else if (source.startsWith('file://')) {
      await new File(source).copy(target, { overwrite: true });
    } else {
      return null;
    }
    return target.uri;
  } catch {
    return null;
  }
}

async function buildPayload(profile: SobrietyProfile): Promise<WidgetPayload> {
  const base = resolveCoinColor(profile.coin_color || 'gold');
  const coinColor = base.bg as `#${string}`;
  const textColor = (/^#[0-9A-Fa-f]{6}$/.test(profile.coin_number_color || '') ? profile.coin_number_color : base.text) as `#${string}`;
  const borderColor = (/^#[0-9A-Fa-f]{6}$/.test(profile.coin_border_color || '') ? profile.coin_border_color : base.border) as `#${string}`;

  return {
    days: daysSober(profile.sobriety_date),
    sobrietyDate: profile.sobriety_date,
    coinColor,
    coinTextColor: textColor,
    coinBorderColor: borderColor,
    coinShowBorder: profile.coin_show_border !== false,
    coinShape: profile.coin_shape || 'circle',
    numberStyle: profile.number_style || 'classic',
    motto: profile.coin_motto || '',
    displayName: profile.display_name || '',
    coinPhoto: await sharedCoinPhoto(profile.coin_photo),
    coinImageOnly: profile.coin_image_only === true,
  };
}

export async function syncV1CEWidget(profile: SobrietyProfile | null) {
  if (!profile) return;

  const payload = await buildPayload(profile);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  if (Platform.OS === 'ios') {
    const { default: V1CEWidget } = await import('../widgets/V1CEWidget');
    const entries = Array.from({ length: 8 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      return {
        date,
        props: { ...payload, days: payload.days + index },
      };
    });
    V1CEWidget.updateTimeline(entries);
  } else if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { V1CEAndroidWidget } = await import('../widgets/V1CEAndroidWidget');
    await requestWidgetUpdate({
      widgetName: 'V1CEWidget',
      renderWidget: () => React.createElement(V1CEAndroidWidget, payload),
    });
  }
}
