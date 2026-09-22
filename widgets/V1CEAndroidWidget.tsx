'use no memo';

import React from 'react';
import { FlexWidget, OverlapWidget, TextWidget, ImageWidget, SvgWidget } from 'react-native-android-widget';
import type { V1CEWidgetProps } from './V1CEWidgetProps';

export function V1CEAndroidWidget(props: V1CEWidgetProps) {
  const paths: Record<string, string> = {
    hexagon: 'M25 0 L75 0 L100 50 L75 100 L25 100 L0 50 Z',
    octagon: 'M30 0 L70 0 L100 30 L100 70 L70 100 L30 100 L0 70 L0 30 Z',
    shield: 'M50 0 L100 15 L100 65 L50 100 L0 65 L0 15 Z',
    diamond: 'M50 0 L95 50 L50 100 L5 50 Z',
    star: 'M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z',
    cross: 'M33 0 L67 0 L67 33 L100 33 L100 67 L67 67 L67 100 L33 100 L33 67 L0 67 L0 33 L33 33 Z',
    badge: 'M50 0 L65 10 L82 5 L90 20 L100 30 L95 50 L100 70 L90 80 L82 95 L65 90 L50 100 L35 90 L18 95 L10 80 L0 70 L5 50 L0 30 L10 20 L18 5 L35 10 Z',
    arrow: 'M0 35 L55 35 L55 10 L100 50 L55 90 L55 65 L0 65 Z',
  };

  const path = paths[props.coinShape] || '';
  const shapeSvg = props.coinShape === 'circle'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="${props.coinColor}" stroke="${props.coinShowBorder ? props.coinBorderColor : 'none'}" stroke-width="3"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${path}" fill="${props.coinColor}" stroke="${props.coinShowBorder ? props.coinBorderColor : 'none'}" stroke-width="3"/></svg>`;

  const numberFont = (style: string) => {
    switch (style) {
      case 'monospace':
      case 'courier': return 'monospace';
      case 'serif':
      case 'bodoni': return 'serif';
      case 'fredoka':
      case 'poppins':
      case 'dmsans':
      case 'syne':
      case 'inter': return 'sans-serif';
      default: return 'sans-serif';
    }
  };

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
      <OverlapWidget style={{ height: 120, width: 120 }}>
        {!props.coinImageOnly ? (
          <SvgWidget svg={shapeSvg} style={{ height: 120, width: 120 }} />
        ) : props.coinPhoto ? (
          <ImageWidget image={props.coinPhoto as `https:${string}`} imageWidth={120} imageHeight={120} resizeMode="cover" />
        ) : (
          <SvgWidget svg={shapeSvg} style={{ height: 120, width: 120 }} />
        )}
        {!props.coinImageOnly ? (
          <TextWidget
            text={String(props.days)}
            style={{
              fontSize: 30,
              fontFamily: numberFont(props.numberStyle),
              color: props.coinTextColor,
            }}
          />
        ) : null}
      </OverlapWidget>
      {!props.coinImageOnly ? (
        <>
          <TextWidget
            text="DAYS SOBER"
            style={{
              fontSize: 10,
              fontFamily: 'sans-serif',
              color: props.coinTextColor,
              marginTop: 6,
            }}
          />
          {props.displayName ? (
            <TextWidget text={props.displayName.toUpperCase()} style={{ fontSize: 8, fontFamily: 'sans-serif', color: props.coinTextColor }} />
          ) : null}
          {props.motto ? (
            <TextWidget text={props.motto} style={{ fontSize: 7, fontFamily: 'sans-serif', color: props.coinTextColor }} />
          ) : null}
        </>
      ) : null}
    </FlexWidget>
  );
}
