import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { V1CEAndroidWidget } from './V1CEAndroidWidget';
import type { V1CEWidgetProps } from './V1CEWidgetProps';

const STORAGE_KEY = 'v1ce_widget_payload';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const data = raw ? (JSON.parse(raw) as V1CEWidgetProps) : null;
  const payload = data ?? {
    days: 0,
    coinColor: '#F5D680',
    coinTextColor: '#0a0a0a',
    coinBorderColor: '#0a0a0a',
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
