import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useI18n } from '@/lib/i18n';
import { layout, spacing } from '@/theme/tokens';

/**
 * One size for every card (products, videos) so rows line up. Two columns on
 * phones, three on wide screens.
 */
export function useCardWidth(gutter: number = spacing.xl) {
  const { width } = useWindowDimensions();
  const available = Math.min(width, layout.maxContentWidth + 160) - gutter * 2;
  const columns = available > 520 ? 3 : 2;
  return Math.floor((available - spacing.md * (columns - 1)) / columns);
}

/** Wrapping grid; the first card sits on the reading side (right in Arabic). */
export function CardGrid({ children }: { children: ReactNode }) {
  const { isRTL } = useI18n();
  return <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexWrap: 'wrap', gap: spacing.md, alignItems: 'stretch' },
});
