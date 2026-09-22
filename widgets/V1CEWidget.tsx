import { Image, Text, VStack, HStack, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, opacity } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type V1CEWidgetProps = {
  days: number;
  coinColor: string;
  coinTextColor: string;
  coinBorderColor: string;
  coinShowBorder: boolean;
  coinShape: string;
  numberStyle: string;
  motto: string;
  displayName: string;
  coinPhoto: string | null;
  coinImageOnly: boolean;
};

const V1CEWidget = (props: V1CEWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const shapeSymbol = (shape: string) => {
    switch (shape) {
      case 'hexagon': return 'hexagon.fill';
      case 'octagon': return 'octagon.fill';
      case 'shield': return 'shield.fill';
      case 'diamond': return 'diamond.fill';
      case 'star': return 'star.fill';
      case 'cross': return 'cross.fill';
      case 'badge': return 'seal.fill';
      case 'arrow': return 'arrowtriangle.up.fill';
      default: return 'circle.fill';
    }
  };

  const numberSize = (style: string) => {
    switch (style) {
      case 'bebas':
      case 'courier':
      case 'monospace': return 28;
      case 'fredoka':
      case 'pacifico': return 26;
      default: return 30;
    }
  };

  const numberFont = (style: string) => {
    switch (style) {
      case 'classic': return 'Cinzel_700Bold';
      case 'poppins': return 'Poppins_700Bold';
      case 'monospace': return 'SpaceMono_700Bold';
      case 'fredoka': return 'Fredoka_400Regular';
      case 'serif': return 'IBMPlexSerif_700Bold';
      case 'dmsans': return 'DMSans_700Bold';
      case 'courier': return 'CourierPrime_700Bold';
      case 'bodoni': return 'BodoniModa_700Bold';
      case 'syne': return 'Syne_700Bold';
      case 'pacifico': return 'Pacifico_400Regular';
      case 'bebas': return 'BebasNeue_400Regular';
      case 'inter': return 'Inter_700Bold';
      default: return 'Cinzel_700Bold';
    }
  };

  const symbol = shapeSymbol(props.coinShape);
  const size = environment.widgetFamily === 'systemSmall' ? 92 : 112;
  const fontFamily = numberFont(props.numberStyle);

  return (
    <VStack spacing={4} modifiers={[padding({ all: 10 })]}>
      <ZStack>
        <Image systemName={symbol as any} size={size} color={props.coinColor} />
        {props.coinPhoto ? (
          <Image
            uiImage={props.coinPhoto}
            size={size - 4}
            modifiers={[opacity(props.coinImageOnly ? 1 : 0.35)]}
          />
        ) : null}
        {props.coinShowBorder ? (
          <Image systemName={symbol as any} size={size - 4} color={props.coinBorderColor} />
        ) : null}
        {!props.coinImageOnly ? (
          <Image systemName={symbol as any} size={size - (props.coinShowBorder ? 12 : 4)} color={props.coinColor} />
        ) : null}
        {!props.coinImageOnly ? (
          <Text
            modifiers={[
              font({ family: fontFamily, weight: 'bold', size: numberSize(props.numberStyle) }),
              foregroundStyle(props.coinTextColor),
            ]}
          >
            {String(props.days)}
          </Text>
        ) : null}
      </ZStack>
      {environment.widgetFamily !== 'accessoryCircular' && !props.coinImageOnly ? (
        <VStack spacing={1}>
          <Text modifiers={[font({ weight: 'bold', size: 10 }), foregroundStyle(props.coinTextColor)]}>
            DAYS SOBER
          </Text>
          {props.displayName ? (
            <Text modifiers={[font({ weight: 'regular', size: 8 }), foregroundStyle(props.coinTextColor)]}>
              {props.displayName.toUpperCase()}
            </Text>
          ) : null}
          {props.motto ? (
            <Text modifiers={[font({ weight: 'regular', size: 7 }), foregroundStyle(props.coinTextColor)]}>
              {props.motto}
            </Text>
          ) : null}
        </VStack>
      ) : null}
    </VStack>
  );
};

export default createWidget('V1CEWidget', V1CEWidget);
