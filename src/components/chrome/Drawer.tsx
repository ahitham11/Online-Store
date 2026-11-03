import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BrandMark, Monogram } from '@/components/brand/BrandMark';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon, type IconName } from '@/components/ui/Icon';
import { brand, getWhatsAppUrl } from '@/data/brand';
import { hapticSelection, hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { authIsAvailable, useSessionStore } from '@/stores/session';
import { useUiStore } from '@/stores/ui';
import {
  hairline,
  layout,
  motion,
  palette,
  radii,
  shadows,
  spacing,
  zIndex,
} from '@/theme/tokens';

type NavRow = {
  key: string;
  icon: IconName;
  label: string;
  onPress: () => void;
  badge?: string;
  devOnly?: boolean;
};

export function Drawer() {
  const { width } = useWindowDimensions();
  const { colors, isDark, preference, setTheme } = useTheme();
  const { isRTL, t, language, setLanguage } = useI18n();
  const open = useUiStore((state) => state.drawerOpen);
  const close = useUiStore((state) => state.closeDrawer);
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  const user = useSessionStore((state) => state.user);
  const progress = useSharedValue(0);
  const panelWidth = Math.min(layout.drawerMaxWidth, width * 0.86);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: open ? motion.base : motion.fast,
      easing: Easing.bezier(...motion.easing),
    });
  }, [open, progress]);

  useEffect(() => {
    if (!open) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => back.remove();
  }, [close, open]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, open]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const panelStyle = useAnimatedStyle(() => {
    const direction = isRTL ? 1 : -1;
    return {
      transform: [
        { translateX: direction * panelWidth * (1 - progress.value) },
      ],
    };
  });

  const go = (href: string) => {
    close();
    hapticSelection();
    router.push(href as never);
  };

  const themeLabel =
    preference === 'system'
      ? t('account.themeSystem')
      : preference === 'dark'
        ? t('account.themeDark')
        : t('account.themeLight');

  const cycleTheme = () => {
    hapticSelection();
    setTheme(
      preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light',
    );
  };

  const navigate = (href: string) => go(href);

  const mainRows: NavRow[] = [
    { key: 'browse', icon: 'grid', label: t('drawer.browse'), onPress: () => navigate('/categories') },
    { key: 'offers', icon: 'tag', label: t('drawer.offers'), onPress: () => navigate('/?section=offers') },
    { key: 'orders', icon: 'receipt', label: t('drawer.orders'), onPress: () => navigate('/orders') },
    { key: 'wishlist', icon: 'heart', label: t('drawer.wishlist'), onPress: () => navigate('/wishlist') },
    { key: 'bag', icon: 'bag', label: t('drawer.bag'), onPress: () => navigate('/bag') },
  ];

  const policyRows: NavRow[] = [
    { key: 'shipping', icon: 'truck', label: t('footer.shipping'), onPress: () => navigate('/policies/shipping') },
    { key: 'returns', icon: 'refresh', label: t('footer.returns'), onPress: () => navigate('/policies/returns') },
    { key: 'privacy', icon: 'shield', label: t('footer.privacy'), onPress: () => navigate('/policies/privacy') },
    { key: 'terms', icon: 'receipt', label: t('footer.terms'), onPress: () => navigate('/policies/terms') },
  ];

  const whatsapp = getWhatsAppUrl();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View
      pointerEvents={open ? 'auto' : 'none'}
      style={[styles.layer, { zIndex: zIndex.drawer }]}
      accessibilityViewIsModal={open}
      aria-hidden={!open}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, scrimStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('drawer.close')}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            backgroundColor: isDark ? '#171113' : palette.pearl,
            borderColor: colors.goldLine,
            // Physical edge: the layout engine stays LTR (see lib/i18n.tsx).
            ...(isRTL
              ? { right: 0, borderLeftWidth: hairline }
              : { left: 0, borderRightWidth: hairline }),
            shadowColor: colors.shadow,
          },
          panelStyle,
        ]}>
        <View
          pointerEvents="none"
          style={[
            styles.panelGlow,
            { backgroundColor: isDark ? `${palette.roseDeep}44` : `${palette.blush}aa` },
          ]}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <BrandMark
              variant="lockup"
              tone={isDark ? 'light' : 'dark'}
              size={0.74}
              align={isRTL ? 'start' : 'start'}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('drawer.close')}
              onPress={close}
              hitSlop={10}
              style={({ pressed }) => [styles.closeButton, pressed ? { opacity: 0.6 } : null]}>
              <Icon name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.guestCard,
              { borderColor: colors.goldLine, backgroundColor: colors.surface },
            ]}>
            <View style={[styles.guestTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Monogram size={40} color={colors.text} gold={colors.accent} />
              <View style={styles.guestCopy}>
                <AppText variant="body" font="bodySemiBold" maxScale={1.3}>
                  {t('drawer.greeting')}
                </AppText>
                <AppText variant="caption" tone="secondary" maxScale={1.3} numberOfLines={1}>
                  {signedIn ? (user?.email ?? '') : t('drawer.guest')}
                </AppText>
              </View>
            </View>
            {signedIn ? null : (
              <Button
                label={t('drawer.signIn')}
                variant="outline"
                size="sm"
                icon="user"
                onPress={() => navigate(authIsAvailable ? '/sign-in' : '/account')}
                accessibilityHint={authIsAvailable ? undefined : t('account.signInSoon')}
              />
            )}
          </View>

          <View style={styles.navGroup}>
            {mainRows.map((row) => (
              <NavRowView key={row.key} row={row} isRTL={isRTL} />
            ))}
          </View>

          <GoldRule style={styles.rule} diamond={false} />

          <View style={styles.navGroup}>
            {policyRows.map((row) => (
              <NavRowView key={row.key} row={row} isRTL={isRTL} />
            ))}
            {__DEV__ ? (
              <NavRowView
                row={{
                  key: 'lab',
                  icon: 'chart',
                  label: t('drawer.motionLab'),
                  onPress: () => navigate('/lab'),
                }}
                isRTL={isRTL}
              />
            ) : null}
          </View>

          <GoldRule style={styles.rule} diamond={false} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('drawer.language')}: ${language === 'ar' ? 'English' : 'العربية'}`}
            onPress={() => {
              hapticTap();
              setLanguage(language === 'ar' ? 'en' : 'ar');
            }}
            style={({ pressed }) => [styles.settingRow, pressed ? { opacity: 0.7 } : null]}>
            <View style={[styles.settingStart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="globe" size={18} color={colors.textSecondary} />
              <AppText variant="body" maxScale={1.3}>
                {t('drawer.language')}
              </AppText>
            </View>
            <Icon name="chevron" size={15} color={colors.textTertiary} mirrored />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('drawer.theme')}: ${themeLabel}`}
            onPress={cycleTheme}
            style={({ pressed }) => [styles.settingRow, pressed ? { opacity: 0.7 } : null]}>
            <View style={[styles.settingStart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name={isDark ? 'moon' : 'sun'} size={18} color={colors.textSecondary} />
              <AppText variant="body" maxScale={1.3}>
                {t('drawer.theme')}
              </AppText>
            </View>
            <AppText variant="caption" tone="secondary" maxScale={1.2}>
              {themeLabel}
            </AppText>
          </Pressable>

          <GoldRule style={styles.rule} diamond={false} />

          <View style={styles.socialRow}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Instagram @${brand.handle}`}
              onPress={() => {
                hapticTap();
                Linking.openURL(brand.instagramUrl).catch(() => undefined);
              }}
              style={({ pressed }) => [styles.socialButton, { opacity: pressed ? 0.6 : 1 }]}>
              <Icon name="instagram" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t('drawer.whatsapp')}
              accessibilityState={{ disabled: !whatsapp }}
              disabled={!whatsapp}
              onPress={() => {
                if (!whatsapp) return;
                hapticTap();
                Linking.openURL(whatsapp).catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.socialButton,
                { opacity: !whatsapp ? 0.34 : pressed ? 0.6 : 1 },
              ]}>
              <Icon name="whatsapp" size={18} color={colors.textSecondary} />
            </Pressable>
            {!whatsapp ? (
              <AppText variant="caption" tone="tertiary" style={styles.whatsappNote} maxScale={1.2}>
                {t('drawer.whatsappUnavailable')}
              </AppText>
            ) : null}
          </View>

          <View style={styles.footerBlock}>
            <AppText variant="caption" tone="tertiary" maxScale={1.2}>
              {t('drawer.footer')}
            </AppText>
            <AppText variant="caption" tone="tertiary" style={styles.version} maxScale={1.2}>
              {t('drawer.version', { version })}
            </AppText>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function NavRowView({ row, isRTL }: { row: NavRow; isRTL: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.label}
      onPress={() => {
        hapticTap();
        row.onPress();
      }}
      style={({ pressed }) => [
        styles.navRow,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        pressed ? { backgroundColor: colors.skeleton } : null,
      ]}>
      <View style={[styles.navStart, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.navIcon}>
          <Icon name={row.icon} size={18} color={colors.textSecondary} />
        </View>
        <AppText variant="body" maxScale={1.3}>
          {row.label}
        </AppText>
      </View>
      <Icon name="chevron" size={14} color={colors.textTertiary} mirrored />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    // The closed panel waits just off-screen. Without clipping, on the web in
    // Arabic it sits past the right edge and widens the page (the phone then
    // zooms out and shows empty space under the tab bar).
    overflow: 'hidden',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    ...shadows.floating,
  },
  panelGlow: {
    position: 'absolute',
    top: -120,
    start: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
    opacity: 0.6,
  },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.base,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCard: {
    borderRadius: radii.lg,
    borderWidth: hairline,
    padding: spacing.base,
    gap: spacing.md,
  },
  guestTop: {
    alignItems: 'center',
    gap: spacing.md,
  },
  guestCopy: {
    flex: 1,
    gap: 2,
  },
  navGroup: {
    gap: 2,
  },
  navRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  navStart: {
    alignItems: 'center',
    gap: spacing.md,
  },
  navIcon: {
    width: 22,
    alignItems: 'center',
  },
  rule: {
    marginVertical: spacing.xs,
    opacity: 0.7,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  settingStart: {
    alignItems: 'center',
    gap: spacing.md,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: hairline,
    borderColor: 'rgba(201, 154, 134, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappNote: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
  },
  footerBlock: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: 3,
  },
  version: {
    opacity: 0.72,
  },
});
