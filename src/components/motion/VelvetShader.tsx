import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { GrainOverlay } from '@/components/chrome/GrainOverlay';
import { useTheme } from '@/lib/theme';
import { palette } from '@/theme/tokens';

type Variant = 'velvet' | 'silk' | 'pearl';

type Props = {
  width: number;
  height: number;
  variant?: Variant;
  active?: boolean;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Web fallback for the Skia runtime shaders. It keeps the same velvet fold
 * language using static gradients so the browser bundle does not need
 * CanvasKit/WASM. Tilt and drag still move the layered highlights above it.
 */
export function VelvetShader({
  width,
  height,
  variant = 'velvet',
  intensity = 1,
  style,
  children,
}: Props) {
  const { isDark } = useTheme();
  const deep = isDark ? '#160A13' : palette.aubergineDeep;
  const rose = variant === 'pearl' ? '#3A1732' : palette.aubergineSoft;
  const glow = variant === 'pearl' ? palette.champagne : palette.rose;

  return (
    <View style={[styles.wrap, { width, height }, style]}>
      <LinearGradient
        colors={[deep, rose, deep]}
        locations={[0, 0.54, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', `${glow}55`, 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.1, y: 0.8 }}
        end={{ x: 0.9, y: 0.2 }}
        style={[styles.band, { transform: [{ rotate: '-18deg' }, { scaleY: 1.6 }] }]}
      />
      <LinearGradient
        colors={['transparent', `${palette.champagne}2e`, 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.band, styles.bandTwo, { transform: [{ rotate: '14deg' }] }]}
      />
      <View style={[styles.vignette, { opacity: variant === 'pearl' ? 0.32 : 0.62 }]} />
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: 0.34 * intensity,
            backgroundColor: variant === 'pearl' ? palette.champagne : palette.rose,
          },
        ]}
      />
      <GrainOverlay opacity={0.07} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: '-20%',
    right: '-20%',
    top: '22%',
    height: '46%',
    opacity: 0.9,
  },
  bandTwo: {
    top: '48%',
    height: '30%',
    opacity: 0.7,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0B0509',
  },
  glow: {
    position: 'absolute',
    width: '62%',
    aspectRatio: 1,
    borderRadius: 999,
    top: '-14%',
    end: '-18%',
  },
});
