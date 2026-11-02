import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Monogram } from '@/components/brand/BrandMark';
import { TiltCard } from '@/components/motion/TiltCard';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { hapticSuccess, hapticTap } from '@/lib/haptics';
import { formatEgp, stockState } from '@/lib/format';
import { bagLineFor, defaultVariant, galleryFor } from '@/lib/variants';
import type { Product } from '@/data/catalog';
import { useBagStore } from '@/stores/bag';
import { useWishlistStore } from '@/stores/wishlist';
import { radii, spacing } from '@/theme/tokens';

type Props = {
  product: Product;
  onPress?: (product: Product) => void;
  width?: number;
};

const stockKeys = {
  in_stock: 'product.inStock',
  low_stock: 'product.lowStock',
  out_of_stock: 'product.outOfStock',
  unavailable: 'product.outOfStock',
} as const;

export function ProductCard({ product, onPress, width }: Props) {
  const { colors } = useTheme();
  const { t, language, localized } = useI18n();
  const addLine = useBagStore((state) => state.addLine);
  const inWishlist = useWishlistStore((state) => state.productIds.includes(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  const variant = defaultVariant(product);
  const soldOut = !variant || variant.available <= 0;
  const stock = variant ? stockState(variant.available, variant.lowStockThreshold) : 'out_of_stock';
  const name = localized(product.nameAr, product.nameEn);
  const shade = variant ? localized(variant.shadeNameAr, variant.shadeNameEn) : '';
  const image = galleryFor(product, variant)[0] ?? null;
  const price = variant?.priceEgp ?? 0;

  return (
    <TiltCard
      style={{ width, flex: width ? undefined : 1 }}
      radius={radii.lg}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.goldLine,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={name}
          onPress={() => {
            hapticTap();
            if (onPress) onPress(product);
            else router.push(`/product/${product.id}`);
          }}
          style={styles.imageArea}>
          {image ? (
            <Image
              source={{ uri: image }}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
              transition={300}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.bgAlt }]}>
              <Monogram size={48} color={colors.textTertiary} gold={colors.goldLine} />
              <AppText variant="caption" tone="tertiary" style={styles.placeholderNote} maxScale={1.1}>
                {t('common.imageFailed')}
              </AppText>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={inWishlist ? t('product.wishlistRemove') : t('product.wishlistAdd')}
            accessibilityState={{ selected: inWishlist }}
            onPress={() => {
              hapticTap();
              toggleWishlist(product.id);
            }}
            hitSlop={8}
            style={[
              styles.heart,
              { backgroundColor: colors.glassStrong, borderColor: colors.goldLine },
            ]}>
            <Icon
              name="heart"
              size={15}
              color={inWishlist ? colors.primary : colors.textSecondary}
              filled={inWishlist}
            />
          </Pressable>

          {soldOut || stock === 'low_stock' ? (
            <View
              style={[
                styles.stockChip,
                { backgroundColor: colors.glassStrong, borderColor: colors.goldLine },
              ]}>
              <View
                style={[
                  styles.stockDot,
                  {
                    backgroundColor:
                      stock === 'low_stock' ? colors.warning : colors.danger,
                  },
                ]}
              />
              <AppText variant="caption" style={styles.stockText} maxScale={1.1}>
                {t(stockKeys[stock])}
              </AppText>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.copy}>
          {product.tags[0] ? (
            <AppText variant="label" tone="accent" style={styles.tag} maxScale={1.2}>
              {product.tags[0]}
            </AppText>
          ) : null}
          <AppText variant="subtitle" style={styles.name} numberOfLines={2} maxScale={1.25}>
            {name}
          </AppText>
          {shade || variant?.size ? (
            <AppText variant="caption" tone="secondary" numberOfLines={1} maxScale={1.2}>
              {[shade, variant?.size].filter(Boolean).join(' · ')}
            </AppText>
          ) : null}

          <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
            <View style={styles.priceBlock}>
              <AppText variant="price" style={styles.price} maxScale={1.2}>
                {formatEgp(price, language)}
              </AppText>
              {variant?.compareAtPriceEgp && variant.compareAtPriceEgp > price ? (
                <AppText variant="caption" tone="tertiary" style={styles.compare} maxScale={1.1}>
                  {formatEgp(variant.compareAtPriceEgp, language)}
                </AppText>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('product.add')}
              accessibilityState={{ disabled: soldOut }}
              disabled={soldOut}
              onPress={() => {
                if (!variant || soldOut) return;
                hapticSuccess();
                addLine(bagLineFor(product, variant));
              }}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: soldOut ? colors.skeleton : colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Icon name="plus" size={17} color={soldOut ? colors.textTertiary : colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      </View>
    </TiltCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imageArea: {
    width: '100%',
    aspectRatio: 0.92,
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderNote: {
    fontSize: 9,
  },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockChip: {
    position: 'absolute',
    top: spacing.sm,
    start: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stockDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  stockText: {
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  copy: {
    padding: spacing.md,
    gap: 5,
  },
  tag: {
    fontSize: 8,
    letterSpacing: 1.2,
  },
  name: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  priceBlock: {
    gap: 1,
  },
  price: {
    fontSize: 16,
    lineHeight: 21,
  },
  compare: {
    textDecorationLine: 'line-through',
    fontSize: 10,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
