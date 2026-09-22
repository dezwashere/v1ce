'use no memo';

import React from 'react';
import { FlexWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';
import type { V1CEWidgetProps } from './V1CEWidgetProps';

function shapeGlyph(shape: string) {
  switch (shape) {
    case 'hexagon': return '⬢';
    case 'octagon': return '⬣';
    case 'shield': return '⬟';
    case 'diamond': return '◆';
    case 'star': return '★';
    case 'cross': return '✚';
    case 'badge': return '◆';
    case 'arrow': return '▲';
    default: return '●';
  }
}

export function V1CEAndroidWidget(props: V1CEWidgetProps) {
  const glyph = shapeGlyph(props.coinShape);

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
      <OverlapWidget
        style={{ height: 120, width: 120 }}
      >
        <TextWidget
          text={glyph}
          style={{ fontSize: 100, fontFamily: 'sans-serif', color: props.coinColor }}
        />
        <TextWidget
          text={String(props.days)}
        style={{
          fontSize: 30,
          fontFamily: props.numberStyle === 'monospace' ? 'monospace' : 'sans-serif',
          color: props.coinTextColor,
        }}
        />
      </OverlapWidget>
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
