import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { GrainOverlay } from '@/components/chrome/GrainOverlay';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { VelvetShader } from '@/components/motion/VelvetShader';
import { useDeviceTilt } from '@/hooks/useDeviceTilt';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { palette, spacing } from '@/theme/tokens';

export type HeroCopy = {
  eyebrow: string;
  title: string;
  body: string;
  hint: string;
  statusLabel: string;
  statusValue: string;
  ctaLabel?: string;
};

type Props = {
  width: number;
  height: number;
  copy: HeroCopy;
  imageUri?: string | null;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  onCta?: () => void;
  /** Lab can freeze the scene to compare the static and motion layers. */
  still?: boolean;
  compact?: boolean;
};

/**
 * The guaranteed 3D moment: layered perspective, a Skia velvet shader on
 * native, and a static gradient fallback on web. It is deliberately isolated
 * so a future Filament hero can replace only this subtree.
 */
export function Hero3D({
  width,
  height,
  copy,
  imageUri,
  dragX,
  dragY,
  onCta,
  still = false,
  compact = false,
}: Props) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  const reducedMotion = useReducedMotion();
  const device = useDeviceTilt(!still && !reducedMotion);

  const combinedX = (value: number) => {
    'worklet';
    return Math.max(-1.2, Math.min(1.2, value + device.x.value * 0.72));
  };
  const combinedY = (value: number) => {
    'worklet';
    return Math.max(-1.2, Math.min(1.2, value + device.y.value * 0.72));
  };

  const sceneStyle = useAnimatedStyle(() => {
    if (still) return {};
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${combinedX(dragX.value) * 7.5}deg` },
        { rotateX: `${-combinedY(dragY.value) * 5.5}deg` },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => {
    if (still) return {};
    return {
      transform: [
        { translateX: combinedX(dragX.value) * -12 },
        { translateY: combinedY(dragY.value) * -8 },
      ],
    };
  });

  const sculptureStyle = useAnimatedStyle(() => {
    if (still) return {};
    return {
      transform: [
        { translateX: combinedX(dragX.value) * 26 },
        { translateY: combinedY(dragY.value) * 16 },
        { translateZ: 0 },
      ],
    };
  });

  const pearlStyle = useAnimatedStyle(() => {
    if (still) return {};
    return {
      transform: [
        { translateX: combinedX(dragX.value) * 38 },
        { translateY: combinedY(dragY.value) * 26 },
      ],
    };
  });

  const sheenStyle = useAnimatedStyle(() => {
    if (still) return { opacity: 0.16 };
    return {
      opacity: 0.12 + Math.abs(combinedX(dragX.value)) * 0.24,
      transform: [
        { translateX: interpolate(combinedX(dragX.value), [-1, 1], [-width * 0.45, width * 0.45]) },
        { rotate: '-18deg' },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    if (still) return {};
    return {
      transform: [
        { translateX: combinedX(dragX.value) * 18 },
        { scaleX: 1 + Math.abs(combinedX(dragX.value)) * 0.08 },
      ],
      opacity: 0.5 - Math.abs(combinedY(dragY.value)) * 0.12,
    };
  });

  return (
    <View style={[styles.wrap, { width, height }]}>
      <VelvetShader width={width} height={height} variant="velvet" active={!still} />
      {imageUri ? (
        <>
          <Image
            source={{ uri: imageUri }}
            style={[StyleSheet.absoluteFill, { opacity: 0.62 }]}
            contentFit="cover"
            transition={380}
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={['rgba(22,10,19,0.24)', 'rgba(22,10,19,0.5)', 'rgba(22,10,19,0.94)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}
      <GrainOverlay opacity={0.06} />

      <Animated.View style={[StyleSheet.absoluteFill, sceneStyle]}>
        <View pointerEvents="none" style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL, { borderColor: 'rgba(201,165,122,0.6)' }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: 'rgba(201,165,122,0.6)' }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: 'rgba(201,165,122,0.6)' }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: 'rgba(201,165,122,0.6)' }]} />
        </View>

        <Animated.View style={[styles.sculpture, sculptureStyle]}>
          <View style={styles.curtain}>
            {[0, 1, 2, 3, 4, 5].map((fold) => (
              <LinearGradient
                key={fold}
                colors={[
                  'rgba(22,10,19,0.06)',
                  fold % 2 === 0 ? 'rgba(168,71,110,0.44)' : 'rgba(58,23,50,0.62)',
                  'rgba(22,10,19,0.2)',
                ]}
                locations={[0, 0.48, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.1 }}
                style={[
                  styles.fold,
                  {
                    flex: fold === 1 || fold === 4 ? 1.35 : 0.9,
                    transform: [{ skewX: `${(fold - 2.5) * 2.6}deg` }],
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.arch}>
            <LinearGradient
              colors={['rgba(251,246,241,0.18)', 'rgba(168,71,110,0.16)', 'rgba(22,10,19,0.5)']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.archInner, { borderColor: 'rgba(233,214,186,0.52)' }]} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.pearlOrbit, pearlStyle]}>
          <View style={styles.orbitRing} />
          <LinearGradient
            colors={[palette.champagneLight, palette.blush, palette.roseLight, palette.aubergineSoft]}
            locations={[0, 0.34, 0.72, 1]}
            start={{ x: 0.18, y: 0.08 }}
            end={{ x: 0.8, y: 0.92 }}
            style={styles.pearl}
          />
          <View style={styles.pearlHighlight} />
          <View style={styles.orbitDot} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.sheen, sheenStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(251,246,241,0.42)', 'transparent']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sheenGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.shadow, shadowStyle]} />

        <Animated.View
          style={[
            styles.copy,
            copyStyle,
            { top: compact ? height * 0.42 : height * 0.34 },
          ]}>
          <View style={[styles.statusRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statusDot} />
            <AppText variant="label" tone="onVeilMuted" style={styles.statusText} maxScale={1.2}>
              {copy.statusLabel}
            </AppText>
            <View style={styles.statusRule} />
            <AppText variant="label" tone="accent" style={styles.statusText} maxScale={1.2}>
              {copy.statusValue}
            </AppText>
          </View>

          <AppText
            variant="label"
            tone="accent"
            style={styles.eyebrow}
            maxScale={1.3}>
            {copy.eyebrow}
          </AppText>

          <AppText
            variant={compact ? 'displaySmall' : 'display'}
            tone="onVeil"
            style={styles.title}
            maxScale={1.15}>
            {copy.title}
          </AppText>

          <AppText
            variant="bodySmall"
            tone="onVeilMuted"
            style={styles.body}
            maxScale={1.25}>
            {copy.body}
          </AppText>

          <View style={[styles.ctaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {copy.ctaLabel && onCta ? (
              <Button
                label={copy.ctaLabel}
                onPress={onCta}
                variant="veil"
                size="sm"
                icon="arrow"
                iconPosition="end"
                fullWidth={false}
              />
            ) : null}
            <View style={styles.hint}>
              <View style={[styles.hintLine, { backgroundColor: colors.accent }]} />
              <AppText variant="caption" tone="onVeilMuted" style={styles.hintText} maxScale={1.2}>
                {copy.hint}
              </AppText>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <View pointerEvents="none" style={[styles.bottomFade, { height: height * 0.22 }]}>
        <LinearGradient
          colors={['transparent', 'rgba(22,10,19,0.86)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  frame: {
    ...StyleSheet.absoluteFill,
    margin: 18,
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.8,
  },
  cornerTL: {
    top: 0,
    start: 0,
    borderEndWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    end: 0,
    borderStartWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    start: 0,
    borderEndWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    end: 0,
    borderStartWidth: 0,
    borderTopWidth: 0,
  },
  sculpture: {
    position: 'absolute',
    end: -28,
    top: 44,
    width: '52%',
    height: '58%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  curtain: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    end: -20,
    width: '86%',
    flexDirection: 'row',
    opacity: 0.9,
  },
  fold: {
    height: '100%',
  },
  arch: {
    width: '68%',
    aspectRatio: 0.62,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201,165,122,0.62)',
    marginTop: 24,
  },
  archInner: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 0,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
  pearlOrbit: {
    position: 'absolute',
    end: '9%',
    top: '23%',
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: 168,
    height: 62,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(233,214,186,0.5)',
    transform: [{ rotate: '-24deg' }],
  },
  pearl: {
    width: 92,
    height: 92,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,246,241,0.5)',
  },
  pearlHighlight: {
    position: 'absolute',
    top: 34,
    start: 40,
    width: 20,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ rotate: '-28deg' }],
  },
  orbitDot: {
    position: 'absolute',
    top: 26,
    end: 22,
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.champagneLight,
  },
  sheen: {
    position: 'absolute',
    top: -40,
    bottom: '-20%',
    width: '38%',
    start: '-20%',
  },
  sheenGradient: {
    flex: 1,
  },
  shadow: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '26%',
    width: '46%',
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(8,3,6,0.6)',
  },
  copy: {
    position: 'absolute',
    start: spacing.xl,
    end: spacing.xl,
    gap: 10,
  },
  statusRow: {
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.champagne,
  },
  statusText: {
    fontSize: 8,
    letterSpacing: 1.4,
  },
  statusRule: {
    width: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(201,165,122,0.4)',
  },
  eyebrow: {
    letterSpacing: 2.4,
  },
  title: {
    maxWidth: 360,
  },
  body: {
    maxWidth: 330,
    lineHeight: 21,
  },
  ctaRow: {
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintLine: {
    width: 12,
    height: StyleSheet.hairlineWidth,
    opacity: 0.7,
  },
  hintText: {
    fontSize: 10,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
