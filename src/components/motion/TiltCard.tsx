import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  tiltAmount?: number;
  sheen?: boolean;
  disabled?: boolean;
};

/**
 * A card that tilts under a horizontal drag and catches a light sweep. The
 * gesture fails on vertical movement so list scrolling always wins.
 */
export function TiltCard({
  children,
  style,
  radius = 26,
  tiltAmount = 9,
  sheen = true,
  disabled = false,
}: Props) {
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ width: 300, height: 380 });
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const pressed = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!disabled && !reduced)
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      pressed.value = withSpring(1, motion.spring);
    })
    .onUpdate((event) => {
      const nx = Math.max(-1, Math.min(1, event.x / size.width - 0.5));
      const ny = Math.max(-1, Math.min(1, event.y / size.height - 0.5));
      rotateY.value = nx * tiltAmount;
      rotateX.value = -ny * tiltAmount * 0.72;
    })
    .onFinalize(() => {
      rotateX.value = withSpring(0, motion.springSoft);
      rotateY.value = withSpring(0, motion.springSoft);
      pressed.value = withSpring(0, motion.springSoft);
    });

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: 1 - pressed.value * 0.012 },
    ],
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(rotateY.value), [0, tiltAmount], [0.06, 0.3]),
    transform: [
      { translateX: interpolate(rotateY.value, [-tiltAmount, tiltAmount], [-110, 110]) },
      { rotate: '-16deg' },
    ],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ width, height });
  };

  return (
    <GestureDetector gesture={pan} touchAction="pan-y">
      <Animated.View style={[sceneStyle, style]} onLayout={onLayout}>
        <View style={[styles.clip, { borderRadius: radius }]}>
          {children}
          {sheen ? (
            <Animated.View pointerEvents="none" style={[styles.sheen, sheenStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.2 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    flex: 1,
  },
  sheen: {
    position: 'absolute',
    top: -60,
    bottom: -60,
    width: 96,
    start: '-20%',
  },
});
