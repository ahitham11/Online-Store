import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { layout, palette, radii, spacing } from '@/theme/tokens';

export function OfflineBanner() {
  const { offline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { colors, isDark } = useTheme();

  if (!offline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(260)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          top: insets.top + layout.headerHeight + 6,
          backgroundColor: isDark ? 'rgba(42,31,34,0.94)' : 'rgba(28,21,23,0.94)',
          borderColor: colors.goldLine,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}>
      <Icon name="wifiOff" size={14} color={palette.champagneLight} />
      <AppText variant="caption" style={styles.text} maxScale={1.2}>
        {t('offline.message')}
      </AppText>
      <View style={[styles.dot, { backgroundColor: palette.champagne }]} />
      <AppText variant="caption" tone="onVeilMuted" style={styles.retry} maxScale={1.1}>
        {t('offline.retry')}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    start: spacing.base,
    end: spacing.base,
    zIndex: 25,
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  text: {
    flex: 1,
    color: palette.pearl,
    fontSize: 10,
    lineHeight: 15,
  },
  retry: {
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
});
