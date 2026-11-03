import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/BrandMark';
import { useHeaderScroll } from '@/components/chrome/HeaderScrollContext';
import { Icon } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { selectBagCount, useBagStore } from '@/stores/bag';
import { useUiStore } from '@/stores/ui';
import { hairline, layout, spacing, zIndex } from '@/theme/tokens';

const HERO_FADE_START = 160;
const HERO_FADE_END = 252;

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const { isRTL, t } = useI18n();
  const openDrawer = useUiStore((state) => state.openDrawer);
  const bagCount = useBagStore(selectBagCount);
  const scrollY = useHeaderScroll();
  const isHome = pathname === '/' || pathname === '/index';

  const tone = isHome ? colors.stageText : colors.text;
  const circleBackground = isHome
    ? isDark ? 'rgba(255, 251, 250, 0.08)' : 'rgba(255, 255, 255, 0.55)'
    : isDark
      ? 'rgba(255, 251, 250, 0.06)'
      : 'rgba(255, 255, 255, 0.9)';

  const shellStyle = useAnimatedStyle(() => {
    if (!isHome) {
      return {
        backgroundColor: colors.tabBar,
        borderBottomColor: colors.goldLine,
      };
    }
    if (!scrollY) {
      return { backgroundColor: 'transparent', borderBottomColor: 'transparent' };
    }
    const progress = interpolate(
      scrollY.value,
      [HERO_FADE_START, HERO_FADE_END],
      [0, 1],
      'clamp',
    );
    return {
      backgroundColor: `rgba(${colors.stageScrim}, ${progress * 0.94})`,
      borderBottomColor: `rgba(201, 154, 134, ${progress * 0.42})`,
    };
  });

  const brandStyle = useAnimatedStyle(() => {
    if (!isHome) return { opacity: 1 };
    if (!scrollY) return { opacity: 1 };
    return {
      opacity: interpolate(
        scrollY.value,
        [HERO_FADE_START, HERO_FADE_END],
        [0, 1],
        'clamp',
      ),
    };
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { paddingTop: insets.top, height: layout.headerHeight + insets.top },
        shellStyle,
      ]}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('header.menu')}
          onPress={openDrawer}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
          <View
            style={[
              styles.circle,
              { backgroundColor: circleBackground, borderColor: colors.goldLine },
            ]}>
            <Icon name="menu" size={19} color={tone} />
          </View>
        </Pressable>

        <View style={styles.brandSlot}>
          <Animated.View style={brandStyle}>
            <BrandMark variant="wordmark" tone={isDark ? 'light' : 'dark'} size={0.66} />
          </Animated.View>
        </View>

        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('header.search')}
            onPress={() => router.push('/search')}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
            <View
              style={[
                styles.circle,
                { backgroundColor: circleBackground, borderColor: colors.goldLine },
              ]}>
              <Icon name="search" size={17} color={tone} />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('header.bagWithCount', { count: bagCount })}
            onPress={() => router.push('/bag')}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
            <View
              style={[
                styles.circle,
                { backgroundColor: circleBackground, borderColor: colors.goldLine },
              ]}>
              <Icon name="bag" size={17} color={tone} />
              {bagCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <AppText
                    variant="caption"
                    style={styles.badgeText}
                    maxScale={1.1}>
                    {bagCount > 9 ? '9+' : bagCount}
                  </AppText>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: zIndex.header,
    justifyContent: 'flex-end',
    borderBottomWidth: hairline,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    height: layout.headerHeight,
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.62,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: hairline,
  },
  brandSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    end: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#1C1517',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
  },
});
