import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BrandMark } from '@/components/brand/BrandMark';
import { GrainOverlay } from '@/components/chrome/GrainOverlay';
import { AppText } from '@/components/ui/AppText';
import { hapticSparkle } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion, palette, spacing, zIndex } from '@/theme/tokens';

const FOLD_COUNT = 7;

type Props = {
  /** Repeat launches use a shorter cut. */
  brief: boolean;
  onDone: () => void;
};

function Fold({
  index,
  height,
  delay,
  duration,
  reduce,
}: {
  index: number;
  height: number;
  delay: number;
  duration: number;
  reduce: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.bezier(...motion.easing) }),
    );
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => {
    if (reduce) {
      return { opacity: 1 - progress.value };
    }
    return {
      opacity: 1,
      transform: [
        { translateY: -progress.value * height * 1.03 },
        { scaleY: 1 + progress.value * 0.045 },
      ],
    };
  });

  const dark = index % 2 === 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fold,
        {
          left: `${(index / FOLD_COUNT) * 100}%`,
          width: `${100 / FOLD_COUNT + 0.4}%`,
        },
        style,
      ]}>
      <LinearGradient
        colors={
          dark
            ? ['#160A13', '#2B1026', '#160A13']
            : ['#220E1E', '#3A1732', '#1B0C18']
        }
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.seam, index === 0 ? null : { backgroundColor: 'rgba(201,165,122,0.18)' }]} />
      <LinearGradient
        colors={['transparent', 'rgba(168,71,110,0.22)', 'transparent']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.foldGlow}
      />
    </Animated.View>
  );
}

export function OpeningVeil({ brief, onDone }: Props) {
  const { height } = useWindowDimensions();
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const finished = useRef(false);

  const total = reduced ? 480 : brief ? 1080 : 1820;
  const foldStart = reduced ? 60 : brief ? 180 : 700;
  const foldDuration = reduced ? 340 : brief ? 560 : 780;

  const brandProgress = useSharedValue(0);

  useEffect(() => {
    brandProgress.value = withDelay(
      reduced ? 40 : 160,
      withTiming(1, { duration: reduced ? 220 : 520, easing: Easing.out(Easing.cubic) }),
    );
  }, [brandProgress, reduced]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      hapticSparkle();
      onDone();
    }, total);
    return () => clearTimeout(timer);
  }, [onDone, total]);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandProgress.value * (reduced ? 1 : 0.98),
    transform: [{ translateY: (1 - brandProgress.value) * 10 }],
  }));

  const folds = useMemo(
    () =>
      Array.from({ length: FOLD_COUNT }, (_, index) => ({
        index,
        delay: foldStart + index * (brief ? 28 : 44),
      })),
    [brief, foldStart],
  );

  return (
    <View
      style={[styles.overlay, { zIndex: zIndex.veil }]}
      accessibilityViewIsModal
      accessibilityLabel={t('opening.a11y')}>
      <View style={styles.stage}>
        {folds.map((fold) => (
          <Fold
            key={fold.index}
            index={fold.index}
            height={height}
            delay={fold.delay}
            duration={foldDuration}
            reduce={reduced}
          />
        ))}
        <GrainOverlay opacity={0.09} />
        <Animated.View style={[styles.brand, brandStyle]}>
          <BrandMark variant="lockup" tone="light" size={1.08} />
          <View style={styles.rule}>
            <View style={[styles.ruleLine, { backgroundColor: palette.champagne }]} />
            <View style={[styles.ruleDot, { backgroundColor: palette.champagneLight }]} />
            <View style={[styles.ruleLine, { backgroundColor: palette.champagne }]} />
          </View>
          <AppText variant="caption" tone="onVeilMuted" style={styles.note} maxScale={1.2}>
            {t('home.manifestoLine')}
          </AppText>
        </Animated.View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('opening.skip')}
        onPress={() => {
          if (finished.current) return;
          finished.current = true;
          onDone();
        }}
        hitSlop={14}
        style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.55 : 0.82 }]}>
        <AppText variant="caption" tone="onVeilMuted" style={styles.skipText} maxScale={1.2}>
          {t('common.skip')}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.aubergineDeep,
    overflow: 'hidden',
  },
  stage: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  fold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  seam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    width: StyleSheet.hairlineWidth,
  },
  foldGlow: {
    position: 'absolute',
    top: '18%',
    left: '-20%',
    right: '-20%',
    height: '54%',
    opacity: 0.8,
    transform: [{ rotate: '-8deg' }],
  },
  brand: {
    position: 'absolute',
    top: '32%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.lg,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  ruleLine: {
    width: 34,
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  ruleDot: {
    width: 4,
    height: 4,
    transform: [{ rotate: '45deg' }],
  },
  note: {
    letterSpacing: 2,
    fontSize: 9,
    opacity: 0.8,
  },
  skip: {
    position: 'absolute',
    bottom: 54,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201,165,122,0.3)',
    backgroundColor: 'rgba(251,246,241,0.05)',
  },
  skipText: {
    letterSpacing: 1.4,
    fontSize: 10,
  },
});
