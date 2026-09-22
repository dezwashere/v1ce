import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { V1CEAndroidWidget } from './V1CEAndroidWidget';
import type { V1CEWidgetProps } from './V1CEWidgetProps';

const STORAGE_KEY = 'v1ce_widget_payload';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const data = raw ? (JSON.parse(raw) as V1CEWidgetProps) : null;
  const payload = data ? { ...data, days: data.sobrietyDate ? Math.max(0, Math.floor((Date.now() - new Date(data.sobrietyDate + 'T00:00:00').getTime()) / 86400000)) : data.days } : {
    days: 0,
    sobrietyDate: new Date().toISOString().slice(0, 10),
    coinColor: '#F5D680' as `#${string}`,
    coinTextColor: '#0a0a0a' as `#${string}`,
    coinBorderColor: '#0a0a0a' as `#${string}`,
    coinShowBorder: true,
    coinShape: 'circle',
    numberStyle: 'classic',
    motto: '',
  };

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(<V1CEAndroidWidget {...payload} />);
      break;
    default:
      break;
  }
}
