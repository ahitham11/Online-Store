import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Monogram } from '@/components/brand/BrandMark';
import { StackHeader } from '@/components/chrome/StackHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon } from '@/components/ui/Icon';
import { getProductBySlug, type SoldAs } from '@/data/catalog';
import { useCatalog } from '@/data/useCatalog';
import { formatEgp, formatQuantity, stockState } from '@/lib/format';
import { hapticSuccess, hapticTap } from '@/lib/haptics';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import {
  bagLineFor,
  clampQuantity,
  findVariant,
  galleryFor,
  hasShades,
  hasSizes,
  savingsEgp,
} from '@/lib/variants';
import { useBagStore } from '@/stores/bag';
import { useWishlistStore } from '@/stores/wishlist';
import { hairline, layout, radii, spacing } from '@/theme/tokens';

const stockKeys = {
  in_stock: 'product.inStock',
  low_stock: 'product.lowStock',
  out_of_stock: 'product.outOfStock',
  unavailable: 'product.outOfStock',
} as const satisfies Record<string, TranslationKey>;

const soldAsKeys: Record<SoldAs, TranslationKey> = {
  piece: 'product.soldAs.piece',
  box: 'product.soldAs.box',
  set: 'product.soldAs.set',
  bundle: 'product.soldAs.bundle',
};

/**
 * A single published piece: gallery, shade and size choice, stock, quantity
 * and add-to-bag. Every value shown comes from the catalog; nothing here is
 * filled in when the catalog does not provide it.
 */
export default function ProductScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; sku?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const initialSku = Array.isArray(params.sku) ? params.sku[0] : params.sku;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, localized, language } = useI18n();
  const catalog = useCatalog();

  const product = useMemo(
    () => (id ? getProductBySlug(catalog.data, id) : null),
    [catalog.data, id],
  );
  const category = useMemo(
    () => catalog.data.categories.find((item) => item.id === product?.categoryId) ?? null,
    [catalog.data.categories, product?.categoryId],
  );

  const [selectedSku, setSelectedSku] = useState<string | null>(initialSku ?? null);
  const [quantity, setQuantity] = useState(1);
  const [page, setPage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const addLine = useBagStore((state) => state.addLine);
  const inWishlist = useWishlistStore((state) => (product ? state.productIds.includes(product.id) : false));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  if (!product) {
    const loading = catalog.isFetching && catalog.data.status === 'empty';
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <StackHeader title={t('product.eyebrow')} />
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
          <EmptyState
            eyebrow={t('product.eyebrow')}
            title={loading ? t('common.loading') : t('product.notFoundTitle')}
            body={loading ? undefined : t('product.notFoundBody')}
            actionLabel={t('categories.title')}
            onAction={() => router.replace('/categories')}
          />
        </ScrollView>
      </View>
    );
  }

  const variant = findVariant(product, selectedSku);
  const gallery = galleryFor(product, variant);
  const stock = variant ? stockState(variant.available, variant.lowStockThreshold) : 'out_of_stock';
  const soldOut = !variant || variant.available <= 0;
  const qty = clampQuantity(quantity, variant);
  const savings = savingsEgp(variant);
  const name = localized(product.nameAr, product.nameEn);
  const description = localized(product.descriptionAr, product.descriptionEn);
  const contentWidth = Math.min(width, layout.maxContentWidth + 160);
  const imageWidth = contentWidth - spacing.xl * 2;
  const shadeVariants = hasShades(product) ? product.variants : [];
  const sizes = hasSizes(product)
    ? product.variants.filter((item, index, list) => item.size && list.findIndex((other) => other.size === item.size) === index)
    : [];

  const selectVariant = (sku: string) => {
    hapticTap();
    setSelectedSku(sku);
    setQuantity(1);
    setPage(0);
    setJustAdded(false);
  };

  const onGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
    if (next !== page) setPage(next);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader
        title={name}
        eyebrow={category ? localized(category.nameAr, category.nameEn) : t('product.eyebrow')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={inWishlist ? t('product.wishlistRemove') : t('product.wishlistAdd')}
            accessibilityState={{ selected: inWishlist }}
            hitSlop={10}
            onPress={() => {
              hapticTap();
              toggleWishlist(product.id);
            }}>
            <Icon name="heart" size={20} filled={inWishlist} color={inWishlist ? colors.primary : colors.text} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
        <View style={[styles.gallery, { width: imageWidth, borderColor: colors.goldLine, backgroundColor: colors.bgAlt }]}>
          {gallery.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onGalleryScroll}
              key={variant?.sku ?? 'gallery'}>
              {gallery.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{ width: imageWidth, height: imageWidth * 1.1 }}
                  contentFit="cover"
                  transition={280}
                  accessibilityLabel={name}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.placeholder, { height: imageWidth * 1.1 }]}>
              <Monogram size={72} color={colors.textTertiary} gold={colors.goldLine} />
            </View>
          )}
          {gallery.length > 1 ? (
            <View style={styles.dots}>
              {gallery.map((uri, index) => (
                <View
                  key={uri}
                  style={[
                    styles.dot,
                    { backgroundColor: index === page ? colors.accent : colors.glassStrong },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.block}>
          {product.tags[0] ? (
            <AppText variant="label" tone="accent" style={styles.eyebrow} maxScale={1.2}>
              {product.tags.join(' · ')}
            </AppText>
          ) : null}
          <AppText variant="title" maxScale={1.2}>
            {name}
          </AppText>
          <AppText variant="caption" tone="secondary" maxScale={1.2}>
            {t(soldAsKeys[product.soldAs])}
          </AppText>

          <View style={styles.priceRow}>
            {variant ? (
              <AppText variant="price" style={styles.price} maxScale={1.2}>
                {formatEgp(variant.priceEgp, language)}
              </AppText>
            ) : null}
            {savings > 0 && variant?.compareAtPriceEgp ? (
              <>
                <AppText variant="bodySmall" tone="tertiary" style={styles.compare} maxScale={1.1}>
                  {formatEgp(variant.compareAtPriceEgp, language)}
                </AppText>
                <View style={[styles.saveChip, { borderColor: colors.goldLine }]}>
                  <AppText variant="caption" tone="accent" maxScale={1.1}>
                    {t('product.save', { amount: formatEgp(savings, language) })}
                  </AppText>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockDot,
                {
                  backgroundColor:
                    stock === 'in_stock' ? colors.success : stock === 'low_stock' ? colors.warning : colors.danger,
                },
              ]}
            />
            <AppText variant="caption" tone="secondary" maxScale={1.2}>
              {t(stockKeys[stock])}
            </AppText>
          </View>
        </View>

        {shadeVariants.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="label" tone="accent" style={styles.eyebrow} maxScale={1.2}>
              {t('product.shade')}
              {variant && localized(variant.shadeNameAr, variant.shadeNameEn)
                ? ` — ${localized(variant.shadeNameAr, variant.shadeNameEn)}`
                : ''}
            </AppText>
            <View style={styles.wrapRow}>
              {shadeVariants.map((item) => {
                const selected = item.sku === variant?.sku;
                const label = localized(item.shadeNameAr, item.shadeNameEn) || item.sku;
                return (
                  <Pressable
                    key={item.sku}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ selected, disabled: item.available <= 0 }}
                    onPress={() => selectVariant(item.sku)}
                    style={[
                      styles.swatchRing,
                      { borderColor: selected ? colors.accent : 'transparent' },
                    ]}>
                    <View
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: item.shadeHex ?? colors.bgAlt,
                          borderColor: colors.goldLine,
                          opacity: item.available > 0 ? 1 : 0.35,
                        },
                      ]}>
                      {!item.shadeHex ? (
                        <AppText variant="caption" maxScale={1} numberOfLines={1} style={styles.swatchText}>
                          {label.slice(0, 2)}
                        </AppText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {sizes.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="label" tone="accent" style={styles.eyebrow} maxScale={1.2}>
              {t('product.size')}
            </AppText>
            <View style={styles.wrapRow}>
              {sizes.map((item) => (
                <Button
                  key={item.sku}
                  label={item.size ?? item.sku}
                  size="sm"
                  fullWidth={false}
                  variant={item.size === variant?.size ? 'primary' : 'outline'}
                  disabled={item.available <= 0}
                  onPress={() => selectVariant(item.sku)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <GoldRule width="100%" />

        <View style={styles.buyRow}>
          <View style={[styles.stepper, { borderColor: colors.goldLine }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('bag.decrease')}
              disabled={soldOut || qty <= 1}
              onPress={() => setQuantity(Math.max(1, qty - 1))}
              hitSlop={6}
              style={styles.stepButton}>
              <Icon name="minus" size={16} color={qty <= 1 ? colors.textTertiary : colors.text} />
            </Pressable>
            <AppText variant="subtitle" accessibilityLabel={`${t('bag.quantity')} ${qty}`} maxScale={1.2}>
              {formatQuantity(qty, language)}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('bag.increase')}
              disabled={soldOut || !variant || qty >= variant.available}
              onPress={() => setQuantity(qty + 1)}
              hitSlop={6}
              style={styles.stepButton}>
              <Icon
                name="plus"
                size={16}
                color={!variant || qty >= variant.available ? colors.textTertiary : colors.text}
              />
            </Pressable>
          </View>
          <Button
            label={soldOut ? t('product.outOfStock') : justAdded ? t('product.added') : t('product.add')}
            icon={justAdded ? 'check' : 'bag'}
            disabled={soldOut}
            style={styles.addButton}
            onPress={() => {
              if (!variant || soldOut) return;
              hapticSuccess();
              addLine(bagLineFor(product, variant, qty));
              setJustAdded(true);
            }}
          />
        </View>

        {justAdded ? (
          <Button label={t('product.viewBag')} variant="outline" icon="arrow" iconPosition="end" onPress={() => router.push('/bag')} />
        ) : null}

        {description ? (
          <View style={[styles.block, styles.card, { borderColor: colors.goldLine, backgroundColor: colors.surface }]}>
            <AppText variant="label" tone="accent" style={styles.eyebrow} maxScale={1.2}>
              {t('product.description')}
            </AppText>
            <AppText variant="body" tone="secondary" maxScale={1.3}>
              {description}
            </AppText>
          </View>
        ) : null}

        {variant?.sku ? (
          <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
            SKU {variant.sku}
          </AppText>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
    alignItems: 'stretch',
  },
  gallery: {
    alignSelf: 'center',
    borderRadius: radii['2xl'],
    borderWidth: hairline,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  block: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: hairline,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  eyebrow: {
    letterSpacing: 1.4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
  },
  compare: {
    textDecorationLine: 'line-through',
  },
  saveChip: {
    borderWidth: hairline,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: {
    fontSize: 10,
  },
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: hairline,
    borderRadius: radii.pill,
    height: 50,
    paddingHorizontal: spacing.md,
  },
  stepButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flex: 1,
    width: undefined,
  },
});
