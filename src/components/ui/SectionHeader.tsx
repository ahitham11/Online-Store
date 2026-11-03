import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/theme/tokens';

type Props = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
};

export function SectionHeader({ eyebrow, title, actionLabel, onAction, style }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <View style={[styles.eyebrowRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.eyebrowRule, { backgroundColor: colors.goldLine }]} />
            <AppText variant="label" tone="accent" style={styles.eyebrow} maxScale={1.3}>
              {eyebrow}
            </AppText>
          </View>
        ) : null}
        <AppText variant="title" style={styles.title} maxScale={1.2}>
          {title}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={10}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}>
          <AppText variant="bodySmall" tone="secondary" maxScale={1.3}>
            {actionLabel}
          </AppText>
          <Icon name="arrow" size={14} color={colors.accentText} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  copy: {
    flexShrink: 1,
    gap: 6,
  },
  eyebrowRow: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrowRule: {
    width: 22,
    height: StyleSheet.hairlineWidth,
  },
  eyebrow: {
    letterSpacing: 1.6,
  },
  // One line on phones: shorter, smaller section titles.
  title: {
    maxWidth: 320,
    fontSize: 24,
    lineHeight: 32,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 5,
  },
});
