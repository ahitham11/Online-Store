import * as Device from 'expo-device';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/chrome/StackHeader';
import { Hero3D } from '@/components/motion/Hero3D';
import { OpeningVeil } from '@/components/motion/OpeningVeil';
import { TiltCard } from '@/components/motion/TiltCard';
import { VelvetShader } from '@/components/motion/VelvetShader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon } from '@/components/ui/Icon';
import { useFrameRate, type FrameRateSample } from '@/hooks/useFrameRate';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hapticSelection, hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { usePreferencesStore } from '@/stores/preferences';
import { useUiStore } from '@/stores/ui';
import { hairline, layout, radii, spacing } from '@/theme/tokens';

type DepthMode = 'still' | 'perspective';

export default function LabScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <LabBody />;
}

function LabBody() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, preference, setTheme } = useTheme();
  const { t, language, setLanguage, isRTL } = useI18n();
  const reduced = useReducedMotion();
  const override = usePreferencesStore((state) => state.reduceMotionOverride);
  const setOverride = usePreferencesStore((state) => state.setReduceMotionOverride);
  const replayOpening = useUiStore((state) => state.replayOpening);

  const [measuring, setMeasuring] = useState(false);
  const [mode, setMode] = useState<DepthMode>('perspective');
  const [snapshots, setSnapshots] = useState<Partial<Record<DepthMode, FrameRateSample>>>({});
  const [showOpening, setShowOpening] = useState(false);

  const frame = useFrameRate(measuring);
  const reducedMotion = reduced;

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const widthSafe = Math.max(200, Math.min(width - spacing.xl * 2, layout.maxContentWidth));
  const previewHeight = Math.min(360, Math.round(widthSafe * 0.72));

  useEffect(() => {
    if (!measuring || reducedMotion) {
      dragX.value = withTiming(0, { duration: 240 });
      dragY.value = withTiming(0, { duration: 240 });
      return;
    }
    dragX.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    dragY.value = withRepeat(
      withTiming(0.55, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [dragX, dragY, measuring, reducedMotion]);

  const heroCopy = useMemo(
    () => ({
      eyebrow: t('home.heroEyebrow'),
      title: t('home.heroTitle'),
      body: t('home.heroBody'),
      hint: t('home.dragHint'),
      statusLabel: t('lab.scene'),
      statusValue: mode === 'still' ? t('lab.modeStill') : t('lab.modePerspective'),
      ctaLabel: undefined,
    }),
    [mode, t],
  );

  const capture = () => {
    hapticSelection();
    setSnapshots((current) => ({ ...current, [mode]: frame }));
  };

  const motionOptions = [
    { key: 'system' as const, value: null, label: t('lab.motionSystem') },
    { key: 'reduced' as const, value: true, label: t('lab.motionReduced') },
    { key: 'full' as const, value: false, label: t('lab.motionFull') },
  ];

  const activeMotionKey =
    override === null ? 'system' : override === true ? 'reduced' : 'full';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader
        title={t('lab.title')}
        eyebrow={t('lab.subtitle')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => router.replace('/')}
            hitSlop={8}
            style={({ pressed }) => [pressed ? { opacity: 0.55 } : null]}>
            <Icon name="close" size={18} color={colors.text} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['5xl'] },
        ]}>
        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.fps')} icon="chart" />
          <View style={styles.metricRow}>
            <Metric label={t('lab.min')} value={frame.min ? String(frame.min) : '—'} />
            <Metric label={t('lab.avg')} value={frame.average ? String(frame.average) : '—'} />
            <Metric label={t('lab.target')} value="60" />
          </View>
          <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
            <AppText variant="caption" tone="tertiary" maxScale={1.2}>
              {frame.samples > 0
                ? `${frame.samples} ${t('lab.samples')}`
                : t('lab.idle')}
            </AppText>
            <AppText variant="caption" tone="tertiary" maxScale={1.2}>
              {Platform.OS === 'web' ? t('lab.webOnly') : t('lab.hardware')}
            </AppText>
          </View>
          <Button
            label={measuring ? t('lab.stop') : t('lab.start')}
            icon={measuring ? 'pause' : 'play'}
            variant={measuring ? 'outline' : 'primary'}
            onPress={() => {
              hapticTap();
              setMeasuring((current) => !current);
            }}
          />
          <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
            {t('lab.fpsHint')}
          </AppText>
        </View>

        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.comparison')} icon="layers" />
          <View
            style={[
              styles.segmented,
              { borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}>
            {(['still', 'perspective'] as DepthMode[]).map((item) => {
              const active = mode === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item === 'still' ? t('lab.modeStill') : t('lab.modePerspective')}
                  onPress={() => {
                    hapticSelection();
                    setMode(item);
                  }}
                  style={({ pressed }) => [
                    styles.segment,
                    {
                      backgroundColor: active ? colors.bgAlt : 'transparent',
                      borderColor: active ? colors.goldLine : 'transparent',
                      opacity: pressed ? 0.68 : 1,
                    },
                  ]}>
                  <AppText variant="caption" tone={active ? 'accent' : 'tertiary'} maxScale={1.15}>
                    {item === 'still' ? t('lab.modeStill') : t('lab.modePerspective')}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.preview, { borderColor: colors.goldLine }]}>
            <Hero3D
              width={widthSafe - spacing.lg * 2}
              height={previewHeight}
              copy={heroCopy}
              dragX={dragX}
              dragY={dragY}
              still={mode === 'still'}
              compact
            />
          </View>

          <View style={styles.captureRow}>
            <Button
              label={t('lab.capture')}
              variant="outline"
              size="sm"
              icon="download"
              disabled={frame.samples === 0}
              onPress={capture}
              style={styles.flex}
            />
            <Button
              label={t('lab.clearComparison')}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => setSnapshots({})}
            />
          </View>

          <View style={[styles.compareTable, { borderColor: colors.border }]}>
            {(['still', 'perspective'] as DepthMode[]).map((item) => {
              const snapshot = snapshots[item];
              return (
                <View key={item} style={[styles.compareRow, { borderTopColor: colors.border }]}>
                  <AppText variant="caption" tone="secondary" maxScale={1.2}>
                    {item === 'still' ? t('lab.modeStill') : t('lab.modePerspective')}
                  </AppText>
                  <AppText variant="caption" tone={snapshot ? 'accent' : 'tertiary'} maxScale={1.2}>
                    {snapshot
                      ? `${t('lab.min')} ${snapshot.min} · ${t('lab.avg')} ${snapshot.average}`
                      : t('lab.pending')}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.shader')} icon="sparkle" />
          <View style={styles.shaderRow}>
            {(['velvet', 'silk', 'pearl'] as const).map((variant) => (
              <View key={variant} style={[styles.shaderCell, { borderColor: colors.goldLine }]}>
                <VelvetShader width={96} height={96} variant={variant} active={measuring} />
                <AppText variant="caption" tone="tertiary" align="center" style={styles.shaderLabel} maxScale={1.15}>
                  {t('lab.skia')} · {variant}
                </AppText>
              </View>
            ))}
          </View>
          <AppText variant="caption" tone="tertiary" maxScale={1.2}>
            {Platform.OS === 'web' ? t('lab.webOnly') : t('lab.skia')}
          </AppText>
        </View>

        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.tilt')} icon="layers" />
          <View style={[styles.tiltWrap, { borderColor: colors.goldLine }]}>
            <TiltCard radius={radii.lg} style={styles.tiltCard}>
              <View style={[styles.tiltInner, { backgroundColor: colors.bgAlt }]}>
                <AppText variant="titleSmall" align="center" maxScale={1.2}>
                  {t('lab.sampleCardTitle')}
                </AppText>
                <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
                  {t('lab.sampleCardBody')}
                </AppText>
              </View>
            </TiltCard>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.device')} icon="phone" />
          <InfoRow label="Model" value={Device.modelName ?? '—'} />
          <InfoRow label="OS" value={`${Device.osName ?? Platform.OS} ${Device.osVersion ?? ''}`} />
          <InfoRow label="Physical" value={Device.isDevice ? 'true' : 'false'} />
          <InfoRow label={t('lab.reduceMotion')} value={reducedMotion ? 'true' : 'false'} />
          <InfoRow label={t('lab.sensor')} value={Platform.OS === 'web' ? 'Web' : 'expo-sensors'} />
          <AppText variant="caption" tone="warning" style={styles.pending} maxScale={1.2}>
            {t('lab.hardware')}: {t('lab.pending')}
          </AppText>
        </View>

        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.reduceMotion')} icon="eye" />
          <View
            style={[
              styles.segmented,
              { borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}>
            {motionOptions.map((option) => {
              const active = activeMotionKey === option.key;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  onPress={() => {
                    hapticSelection();
                    setOverride(option.value);
                  }}
                  style={({ pressed }) => [
                    styles.segment,
                    {
                      backgroundColor: active ? colors.bgAlt : 'transparent',
                      borderColor: active ? colors.goldLine : 'transparent',
                      opacity: pressed ? 0.68 : 1,
                    },
                  ]}>
                  <AppText variant="caption" tone={active ? 'accent' : 'tertiary'} maxScale={1.15}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.opening')} icon="play" />
          <Button
            label={t('lab.opening')}
            variant="outline"
            size="sm"
            icon="refresh"
            onPress={() => {
              hapticTap();
              setShowOpening(true);
            }}
          />
          <Button
            label={t('lab.reset')}
            variant="ghost"
            size="sm"
            onPress={() => {
              hapticTap();
              replayOpening();
              setShowOpening(true);
            }}
          />
        </View>

        <View
          style={[
            styles.card,
            { borderColor: colors.goldLine, backgroundColor: colors.surface },
          ]}>
          <SectionTitle label={t('lab.language')} icon="globe" />
          <View style={[styles.inlineRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppText variant="caption" tone="secondary" maxScale={1.2}>
              {language === 'ar' ? 'العربية' : 'English'}
            </AppText>
            <Button
              label={t('lab.language')}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => {
                hapticTap();
                setLanguage(language === 'ar' ? 'en' : 'ar');
              }}
            />
          </View>
          <View style={[styles.inlineRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppText variant="caption" tone="secondary" maxScale={1.2}>
              {t('lab.theme')}
            </AppText>
            <Button
              label={
                preference === 'system'
                  ? t('account.themeSystem')
                  : preference === 'dark'
                    ? t('account.themeDark')
                    : t('account.themeLight')
              }
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => {
                hapticTap();
                setTheme(
                  preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light',
                );
              }}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <GoldRule width="30%" />
          <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
            {t('lab.note')}
          </AppText>
        </View>
      </ScrollView>

      {showOpening ? (
        <OpeningVeil brief={false} onDone={() => setShowOpening(false)} />
      ) : null}
    </View>
  );
}

function SectionTitle({ label, icon }: { label: string; icon: Parameters<typeof Icon>[0]['name'] }) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  return (
    <View style={[styles.sectionTitle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Icon name={icon} size={15} color={colors.accentText} />
      <AppText variant="label" tone="accent" style={styles.sectionLabel} maxScale={1.2}>
        {label}
      </AppText>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.metric, { borderColor: colors.border }]}>
      <AppText variant="displaySmall" style={styles.metricValue} maxScale={1.1}>
        {value}
      </AppText>
      <AppText variant="caption" tone="tertiary" maxScale={1.15}>
        {label}
      </AppText>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  return (
    <View
      style={[
        styles.infoRow,
        { borderTopColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}>
      <AppText variant="caption" tone="tertiary" maxScale={1.2}>
        {label}
      </AppText>
      <AppText variant="caption" tone="secondary" style={styles.infoValue} maxScale={1.2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: hairline,
    padding: spacing.base,
    gap: spacing.md,
  },
  sectionTitle: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionLabel: {
    letterSpacing: 1.4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    borderWidth: hairline,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    fontSize: 26,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: hairline,
    paddingTop: spacing.sm,
  },
  segmented: {
    borderWidth: hairline,
    borderRadius: radii.pill,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    borderWidth: hairline,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  preview: {
    borderRadius: radii.lg,
    borderWidth: hairline,
    overflow: 'hidden',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  compareTable: {
    borderWidth: hairline,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  shaderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  shaderCell: {
    flex: 1,
    borderWidth: hairline,
    borderRadius: radii.md,
    overflow: 'hidden',
    gap: 4,
    paddingBottom: spacing.xs,
  },
  shaderLabel: {
    fontSize: 8,
    textTransform: 'capitalize',
  },
  tiltWrap: {
    borderRadius: radii.lg,
    borderWidth: hairline,
    overflow: 'hidden',
  },
  tiltCard: {
    height: 158,
  },
  tiltInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  pending: {
    fontSize: 10,
  },
  infoRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: hairline,
    paddingTop: spacing.sm,
  },
  infoValue: {
    flexShrink: 1,
    textAlign: 'end',
  },
  inlineRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
});
