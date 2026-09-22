import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Platform } from 'react-native';
import type { SobrietyProfile } from './supabase';
import { resolveCoinColor } from '@/constants/coin';
import type { V1CEWidgetProps } from '../widgets/V1CEWidgetProps';

const STORAGE_KEY = 'v1ce_widget_payload';

export type WidgetPayload = V1CEWidgetProps;
