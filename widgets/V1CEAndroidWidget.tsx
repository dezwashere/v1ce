'use no memo';

import React from 'react';
import { FlexWidget, TextWidget, IconWidget } from 'react-native-android-widget';
import type { V1CEWidgetProps } from './V1CEWidgetProps';

function shapeIcon(shape: string) {
  switch (shape) {
    case 'hexagon': return 'hexagon';
    case 'shield': return 'shield';
    case 'diamond': return 'diamond';
    case 'star': return 'star';
    case 'badge': return 'verified';
    default: return 'circle';
  }
}

export function V1CEAndroidWidget(props: V1CEWidgetProps) {
  const icon = shapeIcon(props.coinShape);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 18,
      }}
      accessibilityLabel={`${props.days} days sober`}
    >
      <IconWidget
        image={icon}
        size={112}
        tintColor={props.coinColor}
        style={{ position: 'absolute' }}
      />
      <TextWidget
        text={String(props.days)}
        style={{
          fontSize: 30,
          fontFamily: props.numberStyle === 'monospace' ? 'monospace' : 'sans-serif',
          color: props.coinTextColor,
        }}
      />
      <TextWidget
        text="DAYS SOBER"
        style={{
          fontSize: 10,
          fontFamily: 'sans-serif',
          color: props.coinTextColor,
          marginTop: 6,
        }}
      />
    </FlexWidget>
  );
}
