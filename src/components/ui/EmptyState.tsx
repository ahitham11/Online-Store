import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Ornament } from '@/components/ui/Ornament';
import { Reveal } from '@/components/motion/Reveal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/theme/tokens';

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
  ornament?: boolean;
  showOrnament?: boolean;
};

export function EmptyState({
  eyebrow,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
  showOrnament = true,
}: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  const content = (
    <View
      style={[
        styles.wrap,
        compact ? styles.compact : null,
        { borderColor: colors.goldLine, backgroundColor: compact ? 'transparent' : colors.surface },
      ]}>
      {showOrnament ? (
        <Reveal delay={40}>
          <Ornament size={compact ? 88 : 124} />
        </Reveal>
      ) : null}
      {eyebrow ? (
        <AppText variant="label" tone="accent" align="center" style={styles.eyebrow} maxScale={1.3}>
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant={compact ? 'titleSmall' : 'title'} align="center" style={styles.title} maxScale={1.25}>
        {title}
      </AppText>
      {body ? (
        <AppText
          variant="body"
          tone="secondary"
          align="center"
          style={[styles.body, { fontSize: compact ? 13 : 14, lineHeight: compact ? 22 : 25 }]}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="outline"
            size={compact ? 'sm' : 'md'}
            fullWidth={false}
            icon="arrow"
            iconPosition="end"
          />
        </View>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          variant="ghost"
          size="sm"
          fullWidth={false}
        />
      ) : null}
    </View>
  );

  if (reducedMotion) return content;
  return <Reveal delay={20}>{content}</Reveal>;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  compact: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  eyebrow: {
    marginTop: spacing.md,
  },
  title: {
    marginTop: spacing.xs,
  },
  body: {
    maxWidth: 330,
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.lg,
  },
});
