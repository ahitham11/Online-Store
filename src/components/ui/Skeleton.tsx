import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/lib/theme';
import { radii } from '@/theme/tokens';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: object;
};

export function SkeletonBlock({ width = '100%', height = 16, radius = radii.sm, style }: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [progress, reducedMotion]);

  const shimmer = useAnimatedStyle(() => ({
    transform: [{ translateX: -180 + progress.value * 520 }],
    opacity: progress.value === 0 ? 0 : 0.55,
  }));

  return (
    <View
      style={[
        styles.block,
        { width, height, borderRadius: radius, backgroundColor: colors.skeleton },
        style,
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.goldLine,
            borderWidth: StyleSheet.hairlineWidth,
          },
          shimmer,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 130,
    opacity: 0.5,
    transform: [{ rotate: '12deg' }],
  },
});
