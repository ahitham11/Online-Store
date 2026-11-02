import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Page } from '@/components/chrome/Page';
import { ProductCard } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCatalog } from '@/data/useCatalog';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useWishlistStore } from '@/stores/wishlist';
import { layout, spacing } from '@/theme/tokens';

export default function WishlistScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();
  const catalog = useCatalog();
  const productIds = useWishlistStore((state) => state.productIds);

  const products = useMemo(
    () =>
      catalog.data.products.filter(
        (product) => product.isActive && productIds.includes(product.id),
      ),
    [catalog.data.products, productIds],
  );

  const available = Math.min(width, layout.maxContentWidth + 160) - spacing.xl * 2;
  const columns = available > 520 ? 3 : 2;
  const cardWidth = Math.floor((available - spacing.md * (columns - 1)) / columns);

  return (
    <Page
      eyebrow={t('wishlist.eyebrow')}
      title={t('wishlist.title')}
      description={t('wishlist.emptyBody')}
      headerAccessory={
        products.length > 0 ? (
          <AppText variant="caption" tone="tertiary" maxScale={1.2}>
            {t('wishlist.itemCount', { count: products.length })}
          </AppText>
        ) : undefined
      }>
      {products.length > 0 ? (
        <>
          <View
            style={[
              styles.grid,
              {
                flexDirection: isRTL ? 'row-reverse' : 'row',
                borderColor: colors.goldLine,
              },
            ]}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} width={cardWidth} />
            ))}
          </View>
          <AppText
            variant="caption"
            tone="tertiary"
            align="center"
            style={styles.note}
            maxScale={1.2}>
            {t('bag.catalogNote')}
          </AppText>
        </>
      ) : (
        <EmptyState
          eyebrow={t('wishlist.eyebrow')}
          title={t('wishlist.emptyTitle')}
          body={t('wishlist.emptyBody')}
          actionLabel={t('wishlist.cta')}
          onAction={() => router.push('/')}
        />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
  note: {
    marginTop: spacing.xl,
  },
});
