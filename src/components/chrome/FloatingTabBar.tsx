import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { selectBagCount, useBagStore } from '@/stores/bag';
import { hairline, layout, motion, palette, spacing, zIndex } from '@/theme/tokens';

type TabKey = '/' | '/categories' | '/wishlist' | '/bag' | '/account';

const TABS: {
  key: TabKey;
  route: string;
  icon: IconName;
  activeIcon?: IconName;
  labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0];
}[] = [
  { key: '/', route: '/', icon: 'home', labelKey: 'nav.home' },
  { key: '/categories', route: '/categories', icon: 'grid', labelKey: 'nav.categories' },
  { key: '/wishlist', route: '/wishlist', icon: 'heart', labelKey: 'nav.wishlist' },
  { key: '/bag', route: '/bag', icon: 'bag', labelKey: 'nav.bag' },
  { key: '/account', route: '/account', icon: 'user', labelKey: 'nav.account' },
];

function TabItem({
  tab,
  active,
  onPress,
  count,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onPress: () => void;
  count?: number;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t(tab.labelKey)}
      onPress={onPress}
      onPressIn={() => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design.
        scale.value = withSpring(0.92, motion.spring);
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design.
        scale.value = withSpring(1, motion.spring);
      }}
      style={styles.item}>
      <Animated.View style={[styles.itemInner, animated]}>
        <View style={styles.iconWrap}>
          <Icon
            name={tab.icon}
            size={20}
            color={active ? colors.tabBarActive : colors.tabBarInactive}
            filled={tab.icon === 'heart' && active}
          />
          {count && count > 0 && tab.key === '/bag' ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <AppText variant="caption" style={styles.badgeText} maxScale={1}>
                {count > 9 ? '9+' : count}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText
          variant="caption"
          style={[
            styles.label,
            { color: active ? colors.tabBarActive : colors.tabBarInactive },
          ]}
          maxScale={1.1}>
          {t(tab.labelKey)}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isRTL } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const bagCount = useBagStore(selectBagCount);

  const activeKey: TabKey = TABS.find((tab) => {
    if (tab.route === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(tab.route);
  })?.key ?? '/';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom, layout.tabBarBottomGap) },
      ]}>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.goldLine,
            shadowColor: isDark ? '#000000' : palette.aubergine,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}>
        {TABS.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={activeKey === tab.key}
            onPress={() => router.push(tab.route as any)}
            count={tab.key === '/bag' ? bagCount : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex.tabBar,
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  shell: {
    width: '100%',
    maxWidth: 520,
    height: layout.tabBarHeight,
    borderRadius: 999,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 40,
    elevation: 12,
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    position: 'relative',
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badge: {
    position: 'absolute',
    top: -4,
    end: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#2B1026',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '600',
  },
});
