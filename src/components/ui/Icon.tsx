import { useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Rect,
} from 'react-native-svg';

import { useI18n } from '@/lib/i18n';

export type IconName =
  | 'menu'
  | 'close'
  | 'search'
  | 'bag'
  | 'heart'
  | 'home'
  | 'grid'
  | 'user'
  | 'chevron'
  | 'arrow'
  | 'arrowUpRight'
  | 'instagram'
  | 'whatsapp'
  | 'globe'
  | 'moon'
  | 'sun'
  | 'sparkle'
  | 'box'
  | 'truck'
  | 'shield'
  | 'camera'
  | 'trash'
  | 'plus'
  | 'minus'
  | 'check'
  | 'phone'
  | 'pin'
  | 'receipt'
  | 'layers'
  | 'chart'
  | 'settings'
  | 'tag'
  | 'calendar'
  | 'download'
  | 'alert'
  | 'wifiOff'
  | 'play'
  | 'pause'
  | 'refresh'
  | 'lock'
  | 'eye'
  | 'image';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  mirrored?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Icon({
  name,
  size = 22,
  color = '#2B1026',
  strokeWidth = 1.6,
  filled = false,
  mirrored = false,
  style,
}: IconProps) {
  const { isRTL } = useI18n();
  const directionMirror = mirrored && isRTL;
  const shouldMirror = directionMirror || (name === 'chevron' && isRTL);

  const content = useMemo(() => {
    const stroke = {
      stroke: color,
      strokeWidth,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      fill: 'none' as const,
    };
    const fill = filled ? color : 'none';

    switch (name) {
      case 'menu':
        return (
          <>
            <Line x1="4" y1="7.5" x2="20" y2="7.5" {...stroke} />
            <Line x1="7" y1="12" x2="20" y2="12" {...stroke} />
            <Line x1="4" y1="16.5" x2="16.5" y2="16.5" {...stroke} />
          </>
        );
      case 'close':
        return (
          <>
            <Line x1="6" y1="6" x2="18" y2="18" {...stroke} />
            <Line x1="18" y1="6" x2="6" y2="18" {...stroke} />
          </>
        );
      case 'search':
        return (
          <>
            <Circle cx="10.6" cy="10.6" r="6.2" {...stroke} />
            <Line x1="15.3" y1="15.3" x2="20" y2="20" {...stroke} />
          </>
        );
      case 'bag':
        return (
          <>
            <Path d="M5.4 8.2h13.2l1 12.1H4.4l1-12.1Z" {...stroke} />
            <Path d="M9 9V7a3 3 0 0 1 6 0v2" {...stroke} />
          </>
        );
      case 'heart':
        return (
          <Path
            d="M12 20.2S3.8 15.4 3.8 9.3A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.2 2.8c0 6.1-8.2 10.9-8.2 10.9Z"
            {...stroke}
            fill={fill}
          />
        );
      case 'home':
        return (
          <>
            <Path d="M4.3 10.4 12 4l7.7 6.4v9.2a1.4 1.4 0 0 1-1.4 1.4H5.7a1.4 1.4 0 0 1-1.4-1.4v-9.2Z" {...stroke} />
            <Path d="M9.3 21v-6.2h5.4V21" {...stroke} />
          </>
        );
      case 'grid':
        return (
          <>
            <Rect x="4.2" y="4.2" width="6.2" height="6.2" rx="1.4" {...stroke} />
            <Rect x="13.6" y="4.2" width="6.2" height="6.2" rx="1.4" {...stroke} />
            <Rect x="4.2" y="13.6" width="6.2" height="6.2" rx="1.4" {...stroke} />
            <Rect x="13.6" y="13.6" width="6.2" height="6.2" rx="1.4" {...stroke} />
          </>
        );
      case 'user':
        return (
          <>
            <Circle cx="12" cy="8.3" r="3.6" {...stroke} />
            <Path d="M4.8 20.5c.5-4 3.4-6.2 7.2-6.2s6.7 2.2 7.2 6.2" {...stroke} />
          </>
        );
      case 'chevron':
        return <Path d="m9.5 5.5 6.5 6.5-6.5 6.5" {...stroke} />;
      case 'arrow':
        return (
          <>
            <Line x1="4.5" y1="12" x2="19" y2="12" {...stroke} />
            <Path d="m14 7.2 5 4.8-5 4.8" {...stroke} />
          </>
        );
      case 'arrowUpRight':
        return (
          <>
            <Line x1="6.5" y1="17.5" x2="17.5" y2="6.5" {...stroke} />
            <Path d="M9 6.5h8.5V15" {...stroke} />
          </>
        );
      case 'instagram':
        return (
          <>
            <Rect x="3.5" y="3.5" width="17" height="17" rx="5" {...stroke} />
            <Circle cx="12" cy="12" r="4.1" {...stroke} />
            <Circle cx="17.2" cy="6.8" r="1" fill={color} stroke="none" />
          </>
        );
      case 'whatsapp':
        return (
          <>
            <Path
              d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.6Z"
              {...stroke}
            />
            <Path
              d="M9.1 8.5c.3-.2.7-.1.9.2l.8 1.4c.2.3.1.6-.1.8l-.6.6c.5 1.2 1.5 2.2 2.7 2.7l.6-.6c.2-.2.5-.3.8-.1l1.4.8c.3.2.4.6.2.9-.4.6-1 1.2-1.8 1.2-2.7 0-5.7-3-5.7-5.7 0-.8.4-1.5 1-1.9Z"
              {...stroke}
            />
          </>
        );
      case 'globe':
        return (
          <>
            <Circle cx="12" cy="12" r="8.4" {...stroke} />
            <Ellipse cx="12" cy="12" rx="3.6" ry="8.4" {...stroke} />
            <Line x1="3.8" y1="12" x2="20.2" y2="12" {...stroke} />
          </>
        );
      case 'moon':
        return (
          <Path
            d="M19.6 14.8A8.2 8.2 0 0 1 9.2 4.4a8.2 8.2 0 1 0 10.4 10.4Z"
            {...stroke}
          />
        );
      case 'sun':
        return (
          <>
            <Circle cx="12" cy="12" r="4" {...stroke} />
            <Line x1="12" y1="2.8" x2="12" y2="5" {...stroke} />
            <Line x1="12" y1="19" x2="12" y2="21.2" {...stroke} />
            <Line x1="2.8" y1="12" x2="5" y2="12" {...stroke} />
            <Line x1="19" y1="12" x2="21.2" y2="12" {...stroke} />
            <Line x1="5.5" y1="5.5" x2="7.1" y2="7.1" {...stroke} />
            <Line x1="16.9" y1="16.9" x2="18.5" y2="18.5" {...stroke} />
            <Line x1="18.5" y1="5.5" x2="16.9" y2="7.1" {...stroke} />
            <Line x1="7.1" y1="16.9" x2="5.5" y2="18.5" {...stroke} />
          </>
        );
      case 'sparkle':
        return (
          <>
            <Path d="M12 3.2c.5 4.3 2.5 6.3 6.8 6.8-4.3.5-6.3 2.5-6.8 6.8-.5-4.3-2.5-6.3-6.8-6.8 4.3-.5 6.3-2.5 6.8-6.8Z" {...stroke} />
            <Path d="M18.6 16.6c.2 1.5.9 2.2 2.4 2.4-1.5.2-2.2.9-2.4 2.4-.2-1.5-.9-2.2-2.4-2.4 1.5-.2 2.2-.9 2.4-2.4Z" {...stroke} />
          </>
        );
      case 'box':
        return (
          <>
            <Path d="M4 7.5 12 3.6l8 3.9v9L12 20.4l-8-3.9v-9Z" {...stroke} />
            <Path d="M4.3 7.6 12 11.5l7.7-3.9M12 11.5v8.9" {...stroke} />
          </>
        );
      case 'truck':
        return (
          <>
            <Path d="M3 6.5h10.2v9H3zM13.2 10h3.6l2.9 3v2.5h-6.5" {...stroke} />
            <Circle cx="7" cy="17.4" r="1.7" {...stroke} />
            <Circle cx="16.4" cy="17.4" r="1.7" {...stroke} />
          </>
        );
      case 'shield':
        return (
          <>
            <Path d="M12 3.2 19 6v5.2c0 4.2-2.8 7.4-7 9.6-4.2-2.2-7-5.4-7-9.6V6l7-2.8Z" {...stroke} />
            <Path d="m8.7 11.8 2.2 2.2 4.4-4.4" {...stroke} />
          </>
        );
      case 'camera':
        return (
          <>
            <Path d="M3.5 8.2h4l1.4-2h6.2l1.4 2h4v11h-17z" {...stroke} />
            <Circle cx="12" cy="13.2" r="3.4" {...stroke} />
          </>
        );
      case 'trash':
        return (
          <>
            <Path d="M4.5 7h15M9 7V4.8h6V7M6.2 7l.8 13h10l.8-13" {...stroke} />
            <Line x1="10" y1="10.5" x2="10.3" y2="16.5" {...stroke} />
            <Line x1="14" y1="10.5" x2="13.7" y2="16.5" {...stroke} />
          </>
        );
      case 'plus':
        return (
          <>
            <Line x1="12" y1="5" x2="12" y2="19" {...stroke} />
            <Line x1="5" y1="12" x2="19" y2="12" {...stroke} />
          </>
        );
      case 'minus':
        return <Line x1="5" y1="12" x2="19" y2="12" {...stroke} />;
      case 'check':
        return <Path d="m5 12.5 4.3 4.3L19 7" {...stroke} />;
      case 'phone':
        return (
          <Path
            d="M7.2 3.8h3l1.2 4.2-1.8 1.4a12 12 0 0 0 5 5l1.4-1.8 4.2 1.2v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 5.2 6a2 2 0 0 1 2-2.2Z"
            {...stroke}
          />
        );
      case 'pin':
        return (
          <>
            <Path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z" {...stroke} />
            <Circle cx="12" cy="10" r="2.5" {...stroke} />
          </>
        );
      case 'receipt':
        return (
          <>
            <Path d="M5.5 3.5h13v17l-2.2-1.4-2.1 1.4-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4v-17Z" {...stroke} />
            <Line x1="8.7" y1="8" x2="15.3" y2="8" {...stroke} />
            <Line x1="8.7" y1="12" x2="15.3" y2="12" {...stroke} />
            <Line x1="8.7" y1="16" x2="12.8" y2="16" {...stroke} />
          </>
        );
      case 'layers':
        return (
          <>
            <Path d="m12 3.5 8.5 4.6L12 12.7 3.5 8.1 12 3.5Z" {...stroke} />
            <Path d="m4 12 8 4.3 8-4.3M4 15.9l8 4.3 8-4.3" {...stroke} />
          </>
        );
      case 'chart':
        return (
          <>
            <Line x1="4" y1="20" x2="20" y2="20" {...stroke} />
            <Rect x="5.5" y="12" width="3.2" height="6" rx="1" {...stroke} />
            <Rect x="10.4" y="8" width="3.2" height="10" rx="1" {...stroke} />
            <Rect x="15.3" y="4.5" width="3.2" height="13.5" rx="1" {...stroke} />
          </>
        );
      case 'settings':
        return (
          <>
            <Circle cx="12" cy="12" r="3" {...stroke} />
            <Path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" {...stroke} />
          </>
        );
      case 'tag':
        return (
          <>
            <Path d="M4 4h6.5L20 13.5 13.5 20 4 10.5V4Z" {...stroke} />
            <Circle cx="8.2" cy="8.2" r="1.2" {...stroke} />
          </>
        );
      case 'calendar':
        return (
          <>
            <Rect x="3.8" y="5.5" width="16.4" height="15" rx="2" {...stroke} />
            <Line x1="3.8" y1="10" x2="20.2" y2="10" {...stroke} />
            <Line x1="8" y1="3.5" x2="8" y2="7.5" {...stroke} />
            <Line x1="16" y1="3.5" x2="16" y2="7.5" {...stroke} />
          </>
        );
      case 'download':
        return (
          <>
            <Path d="M12 4v11M8 11.5l4 4 4-4" {...stroke} />
            <Path d="M4.5 19.5h15" {...stroke} />
          </>
        );
      case 'alert':
        return (
          <>
            <Path d="M12 3.5 21 20H3L12 3.5Z" {...stroke} />
            <Line x1="12" y1="9" x2="12" y2="14.3" {...stroke} />
            <Circle cx="12" cy="17.2" r="0.9" fill={color} stroke="none" />
          </>
        );
      case 'wifiOff':
        return (
          <>
            <Path d="M3 8.5a15 15 0 0 1 18 0M6.2 12a10 10 0 0 1 11.6 0M9.4 15.5a5 5 0 0 1 5.2 0" {...stroke} />
            <Circle cx="12" cy="19" r="0.9" fill={color} stroke="none" />
            <Line x1="3.5" y1="3.5" x2="20.5" y2="20.5" {...stroke} />
          </>
        );
      case 'play':
        return <Path d="M8 5.5v13l10-6.5L8 5.5Z" {...stroke} />;
      case 'pause':
        return (
          <>
            <Line x1="9" y1="5.5" x2="9" y2="18.5" {...stroke} />
            <Line x1="15" y1="5.5" x2="15" y2="18.5" {...stroke} />
          </>
        );
      case 'refresh':
        return (
          <>
            <Path d="M20 12a8 8 0 1 1-2.3-5.6" {...stroke} />
            <Path d="M20 4v5h-5" {...stroke} />
          </>
        );
      case 'lock':
        return (
          <>
            <Rect x="5" y="10" width="14" height="10" rx="2" {...stroke} />
            <Path d="M8.3 10V7.4a3.7 3.7 0 0 1 7.4 0V10" {...stroke} />
          </>
        );
      case 'eye':
        return (
          <>
            <Path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" {...stroke} />
            <Circle cx="12" cy="12" r="3" {...stroke} />
          </>
        );
      case 'image':
        return (
          <>
            <Rect x="3.5" y="4.5" width="17" height="15" rx="2" {...stroke} />
            <Circle cx="8.5" cy="9.5" r="1.4" {...stroke} />
            <Path d="m4.5 17 5-5 3.5 3.5 2.5-2.5 4 4" {...stroke} />
          </>
        );
      default:
        return null;
    }
  }, [color, filled, name, strokeWidth]);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={[styles.svg, shouldMirror ? { transform: [{ scaleX: -1 }] } : null, style]}
      accessibilityElementsHidden
      importantForAccessibility="no">
      {content}
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    flexShrink: 0,
  },
});
