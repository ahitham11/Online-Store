import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/lib/theme';

type Props = {
  size?: number;
  color?: string;
  pearl?: string;
};

/**
 * A small architectural ornament used by empty states. It is drawn, not an
 * emoji, so it inherits the theme and stays crisp at every density.
 */
export function Ornament({ size = 132, color, pearl }: Props) {
  const { colors } = useTheme();
  const stroke = color ?? colors.goldLine;
  const dot = pearl ?? colors.accent;

  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: size, height: size * 0.82 }}>
      <Svg width={size} height={size * 0.82} viewBox="0 0 160 132">
        <Path
          d="M80 8c19 13 34 24 34 41v55H46V49C46 32 61 21 80 8Z"
          stroke={stroke}
          strokeWidth="0.9"
          fill="none"
        />
        <Path
          d="M80 18c14 10 26 19 26 32v46H54V50c0-13 12-22 26-32Z"
          stroke={stroke}
          strokeWidth="0.55"
          fill="none"
          opacity={0.75}
        />
        <Line x1="20" y1="104" x2="140" y2="104" stroke={stroke} strokeWidth="0.7" />
        <Line x1="30" y1="108" x2="130" y2="108" stroke={stroke} strokeWidth="0.4" opacity={0.6} />
        <Circle cx="80" cy="58" r="7.5" stroke={dot} strokeWidth="0.8" fill="none" />
        <Circle cx="80" cy="58" r="2.2" fill={dot} />
        <Path d="M80 66v14M73.5 73h13" stroke={dot} strokeWidth="0.6" opacity={0.7} />
        <Path d="M46 104c0-12 6-20 14-24M114 104c0-12-6-20-14-24" stroke={stroke} strokeWidth="0.6" fill="none" />
        <Circle cx="80" cy="118" r="1.5" fill={dot} />
      </Svg>
    </View>
  );
}
