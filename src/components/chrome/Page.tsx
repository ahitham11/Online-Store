import { StatusBar } from 'expo-status-bar';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { GoldRule } from '@/components/ui/GoldRule';
import { useBottomInset } from '@/hooks/useBottomInset';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/lib/theme';
import { layout, spacing } from '@/theme/tokens';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  headerAccessory?: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

/**
 * Standard interior page. The floating header is rendered by the tab layout;
 * this component only reserves its measured height and keeps a calm rhythm.
 */
export function Page({
  eyebrow,
  title,
  description,
  children,
  headerAccessory,
  footer,
  contentStyle,
  scroll = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const reduced = useReducedMotion();
  const bottomInset = useBottomInset(spacing['3xl']);

  const body = (
    <>
      <View style={styles.header}>
        {eyebrow ? (
          <AppText variant="label" tone="accent" style={styles.eyebrow} maxScale={1.3}>
            {eyebrow}
          </AppText>
        ) : null}
        <View style={styles.titleRow}>
          <AppText variant="displaySmall" style={styles.title} maxScale={1.2}>
            {title}
          </AppText>
          {headerAccessory}
        </View>
        {description ? (
          <AppText variant="body" tone="secondary" style={styles.description} maxScale={1.3}>
            {description}
          </AppText>
        ) : null}
        <GoldRule width="34%" style={styles.rule} />
      </View>
      <View style={[styles.content, contentStyle]}>{children}</View>
      {footer}
      <View style={{ height: bottomInset }} />
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + layout.headerHeight }}
          showsVerticalScrollIndicator={false}
          bounces={!reduced}
          scrollEventThrottle={16}>
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top + layout.headerHeight }}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  eyebrow: {
    letterSpacing: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
    maxWidth: 320,
  },
  description: {
    maxWidth: 380,
  },
  rule: {
    marginTop: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
});
