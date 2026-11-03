import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { PearlPagination } from '@/components/home/PearlPagination';
import { Hero3D, type HeroCopy } from '@/components/motion/Hero3D';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { hapticSelection, hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { motion, spacing } from '@/theme/tokens';

export type VelvetSlide = {
  id: string;
  copy: HeroCopy;
  imageUri?: string | null;
  anchor?: string;
};

type Props = {
  width: number;
  height: number;
  slides: VelvetSlide[];
  index: number;
  onChange: (index: number) => void;
  onCta?: (slide: VelvetSlide) => void;
};

export function HeroSlider({ width, height, slides, index, onChange, onCta }: Props) {
  const { t, isRTL } = useI18n();
  const { colors } = useTheme();
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const slide = slides[index] ?? slides[0];

  const go = (direction: 1 | -1) => {
    if (slides.length < 2) return;
    const next = (index + direction + slides.length) % slides.length;
    hapticSelection();
    onChange(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onUpdate((event) => {
      dragX.value = Math.max(-1.2, Math.min(1.2, event.translationX / (width * 0.72)));
      dragY.value = Math.max(-1.2, Math.min(1.2, event.translationY / (height * 0.72)));
    })
    .onEnd((event) => {
      const shouldAdvance =
        slides.length > 1 &&
        (event.translationX < -width * 0.16 || event.velocityX < -620);
      const shouldRetreat =
        slides.length > 1 &&
        (event.translationX > width * 0.16 || event.velocityX > 620);
      if (shouldAdvance) {
        dragX.value = withSpring(-0.5, motion.spring);
        onChange((index + 1) % slides.length);
      } else if (shouldRetreat) {
        dragX.value = withSpring(0.5, motion.spring);
        onChange((index - 1 + slides.length) % slides.length);
      }
      dragX.value = withSpring(0, motion.springSoft);
      dragY.value = withSpring(0, motion.springSoft);
    });

  const resetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.abs(dragX.value) * 0.006 }],
  }));

  if (!slide) return null;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <GestureDetector gesture={pan}>
        <Animated.View
          key={slide.id}
          entering={FadeIn.duration(600)}
          style={[styles.scene, resetStyle]}
          accessibilityLabel={t('home.heroA11y')}
          accessibilityHint={t('home.dragHint')}>
          <Hero3D
            width={width}
            height={height}
            copy={slide.copy}
            imageUri={slide.imageUri}
            dragX={dragX}
            dragY={dragY}
            onCta={() => onCta?.(slide)}
          />
        </Animated.View>
      </GestureDetector>

      <View
        pointerEvents="box-none"
        style={[
          styles.paginationRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}>
        <View style={[styles.count, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <AppText variant="caption" tone="accent" style={styles.countCurrent} maxScale={1.1}>
            {String(index + 1).padStart(2, '0')}
          </AppText>
          <View style={[styles.countRule, { backgroundColor: colors.goldLine }]} />
          <AppText variant="caption" tone="stageMuted" style={styles.countTotal} maxScale={1.1}>
            {String(slides.length).padStart(2, '0')}
          </AppText>
        </View>

        <PearlPagination
          count={slides.length}
          index={index}
          onSelect={(next) => {
            if (next === index) return;
            hapticTap();
            onChange(next);
          }}
        />

        {slides.length > 1 ? (
          <View style={styles.arrows}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isRTL ? t('home.heroNext') : t('home.heroPrev')}
              onPress={() => go(isRTL ? 1 : -1)}
              hitSlop={8}
              style={({ pressed }) => [styles.arrow, { opacity: pressed ? 0.55 : 1 }]}>
              {/* Physical left arrow in both languages. */}
              <Icon name="chevron" size={14} color={colors.stageText} flip={!isRTL} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isRTL ? t('home.heroPrev') : t('home.heroNext')}
              onPress={() => go(isRTL ? -1 : 1)}
              hitSlop={8}
              style={({ pressed }) => [styles.arrow, { opacity: pressed ? 0.55 : 1 }]}>
              <Icon name="chevron" size={14} color={colors.stageText} flip={isRTL} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.scrollHint}>
            <View style={[styles.scrollLine, { backgroundColor: colors.goldLine }]} />
            <AppText variant="caption" tone="stageMuted" style={styles.scrollText} maxScale={1.2}>
              {t('home.heroScroll')}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  scene: {
    flex: 1,
  },
  paginationRow: {
    position: 'absolute',
    bottom: spacing.xl,
    start: spacing.xl,
    end: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  count: {
    alignItems: 'center',
    gap: 6,
  },
  countCurrent: {
    fontSize: 11,
    letterSpacing: 1.6,
  },
  countTotal: {
    fontSize: 9,
    opacity: 0.7,
  },
  countRule: {
    width: 14,
    height: StyleSheet.hairlineWidth,
  },
  arrows: {
    flexDirection: 'row',
    gap: 2,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201,154,134,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollHint: {
    alignItems: 'center',
    gap: 4,
    opacity: 0.8,
  },
  scrollLine: {
    width: StyleSheet.hairlineWidth,
    height: 16,
  },
  scrollText: {
    fontSize: 8,
    letterSpacing: 1.2,
  },
});
