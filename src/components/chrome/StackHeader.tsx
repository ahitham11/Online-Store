import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { hairline, layout, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
  onBack?: () => void;
};

/** Header for screens outside the tab navigator. */
export function StackHeader({ title, eyebrow, right, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top,
          height: insets.top + layout.headerHeight,
          backgroundColor: colors.tabBar,
          borderBottomColor: colors.goldLine,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={() => {
          if (onBack) onBack();
          else if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
        hitSlop={10}
        style={({ pressed }) => [styles.back, { opacity: pressed ? 0.55 : 1 }]}>
        <Icon name="chevron" size={18} color={colors.text} mirrored />
      </Pressable>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText variant="label" tone="accent" style={styles.eyebrow} maxScale={1.2}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="titleSmall" numberOfLines={1} maxScale={1.25}>
          {title}
        </AppText>
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: hairline,
  },
  back: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
  },
  right: {
    minWidth: 42,
    alignItems: 'flex-end',
  },
});
