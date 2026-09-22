import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SobrietyProfile } from './supabase';

const STORAGE_KEY = 'v1ce_widget_payload';

export type WidgetPayload = {
  days: number;
  coinColor: string;
  coinTextColor: string;
  coinBorderColor: string;
  coinShowBorder: boolean;
  coinShape: string;
  numberStyle: string;
  motto: string;
};

function daysSober(sobrietyDate?: string | null) {
  if (!sobrietyDate) return 0;
  const start = new Date(sobrietyDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
}

function buildPayload(profile: SobrietyProfile): WidgetPayload {
  const coinColor = profile.coin_color || '#F5D680';
  const textColor = profile.coin_number_color || '#0a0a0a';

  return {
    days: daysSober(profile.sobriety_date),
    coinColor,
    coinTextColor: textColor,
    coinBorderColor: profile.coin_border_color || '#0a0a0a',
    coinShowBorder: profile.coin_show_border !== false,
    coinShape: profile.coin_shape || 'circle',
    numberStyle: profile.number_style || 'classic',
    motto: profile.coin_motto || '',
  };
}

export async function syncV1CEWidget(profile: SobrietyProfile | null) {
  if (!profile) return;

  const payload = buildPayload(profile);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  if (Platform.OS === 'ios') {
    const { default: V1CEWidget } = await import('../widgets/V1CEWidget');
    const entries = Array.from({ length: 8 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index + 1);
      return {
        date,
        props: { ...payload, days: payload.days + index + 1 },
      };
    });
    V1CEWidget.updateSnapshot(payload);
    V1CEWidget.updateTimeline(entries);
  } else if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    await requestWidgetUpdate({ widgetName: 'V1CEWidget' });
  }
}
