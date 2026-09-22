import { Image, Text, VStack, HStack, ZStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame } from '@expo/ui/swift-ui/modifiers';
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
};

function shapeSymbol(shape: string) {
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
}

function numberSize(style: string) {
  switch (style) {
    case 'bebas':
    case 'courier':
    case 'monospace': return 28;
    case 'fredoka':
    case 'pacifico': return 26;
    default: return 30;
  }
}

const V1CEWidget = (props: V1CEWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const symbol = shapeSymbol(props.coinShape);
  const size = environment.widgetFamily === 'systemSmall' ? 92 : 112;

  return (
    <VStack spacing={4} modifiers={[padding({ all: 10 })]}>
      <ZStack>
        <Image systemName={symbol as any} size={size} color={props.coinColor} />
        {props.coinShowBorder ? (
          <Image systemName={symbol as any} size={size - 8} color={props.coinBorderColor} />
        ) : null}
        <Image systemName={symbol as any} size={size - (props.coinShowBorder ? 12 : 4)} color={props.coinColor} />
        <Text
          modifiers={[
            font({ weight: 'bold', size: numberSize(props.numberStyle) }),
            foregroundStyle(props.coinTextColor),
          ]}
        >
          {String(props.days)}
        </Text>
      </ZStack>
      {environment.widgetFamily !== 'accessoryCircular' ? (
        <HStack spacing={4}>
          <Text modifiers={[font({ weight: 'bold', size: 10 }), foregroundStyle(props.coinTextColor)]}>
            DAYS SOBER
          </Text>
        </HStack>
      ) : null}
    </VStack>
  );
};

export default createWidget('V1CEWidget', V1CEWidget);
