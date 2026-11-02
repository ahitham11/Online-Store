import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  distance?: number;
};

export function Reveal({ children, delay = 0, style, distance = 14 }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.duration(520).delay(delay).easing(Easing.bezier(0.22, 1, 0.36, 1))}
      style={style}>
      {children}
    </Animated.View>
  );
}

export function SoftFade({ children, delay = 0, style }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(420).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}

/** A tiny value-driver for choreography when entering animations are not enough. */
export function useStagger(active: boolean, index: number, step = 60) {
  const value = useSharedValue(0);
  useEffect(() => {
    value.value = active ? withDelay(index * step, withTiming(1, { duration: 420 })) : 0;
  }, [active, index, step, value]);
  return useAnimatedStyle(() => ({
    opacity: value.value,
    transform: [{ translateY: (1 - value.value) * 10 }],
  }));
}
