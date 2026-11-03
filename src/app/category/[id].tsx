import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Monogram } from '@/components/brand/BrandMark';
import { StackHeader } from '@/components/chrome/StackHeader';
import { ProductCard } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldRule } from '@/components/ui/GoldRule';
import { useCatalog } from '@/data/useCatalog';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { hairline, layout, radii, spacing } from '@/theme/tokens';

/**
 * A published category and its pieces. When the catalog is empty the route is
 * still reachable by deep link, so the screen explains that it is not yet on
 * the house map instead of pretending the address is broken.
 */
export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, localized, isRTL } = useI18n();
  const catalog = useCatalog();

  const category = useMemo(
    () => catalog.data.categories.find((item) => item.id === id) ?? null,
    [catalog.data.categories, id],
  );

  const products = useMemo(
    () =>
      category
        ? catalog.data.products.filter(
            (product) => product.categoryId === category.id && product.isActive,
          )
        : [],
    [catalog.data.products, category],
  );

  const children = useMemo(
    () =>
      category
        ? catalog.data.categories
            .filter((item) => item.parentId === category.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [catalog.data.categories, category],
  );

  const gutter = spacing.xl;
  const available = Math.min(width, layout.maxContentWidth + 160) - gutter * 2;
  const columns = available > 520 ? 3 : 2;
  const cardWidth = Math.floor((available - spacing.md * (columns - 1)) / columns);

  const headerTitle = category ? localized(category.nameAr, category.nameEn) : t('categories.title');

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader title={headerTitle} eyebrow={t('categories.eyebrow')} />

      {category ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['4xl'] },
          ]}>
          <View
            style={[
              styles.hero,
              {
                borderColor: colors.goldLine,
                backgroundColor: colors.surface,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}>
            <View style={styles.heroImage}>
              {category.image ? (
                <Image
                  source={{ uri: category.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={280}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={[styles.heroPlaceholder, { backgroundColor: colors.bgAlt }]}>
                  <Monogram size={54} color={colors.textTertiary} gold={colors.goldLine} />
                </View>
              )}
            </View>
            <View style={styles.heroCopy}>
              <AppText variant="label" tone="accent" style={styles.heroEyebrow} maxScale={1.2}>
                {t('categories.productCount', { count: products.length })}
              </AppText>
              <AppText variant="title" maxScale={1.2}>
                {headerTitle}
              </AppText>
              <GoldRule width="38%" style={styles.rule} />
              <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                {category.parentId === null && children.length > 0
                  ? t('categories.count', { count: children.length })
                  : t('categories.shadesCount', {
                      count: products.reduce((n, product) => n + product.variants.length, 0),
                    })}
              </AppText>
            </View>
          </View>

          {children.length > 0 ? (
            <View style={styles.blocks}>
              <AppText variant="label" tone="accent" style={styles.sectionLabel} maxScale={1.2}>
                {t('categories.title')}
              </AppText>
              <View style={[styles.children, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {children.map((child) => (
                  <Button
                    key={child.id}
                    label={localized(child.nameAr, child.nameEn)}
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    icon="chevron"
                    iconPosition="end"
                    onPress={() => router.push(`/category/${child.id}`)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {products.length > 0 ? (
            <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} width={cardWidth} />
              ))}
            </View>
          ) : (
            <View style={styles.blocks}>
              <EmptyState
                compact
                showOrnament
                title={t('home.newEmptyTitle')}
                body={t('home.newEmptyBody')}
                actionLabel={t('common.viewAll')}
                onAction={() => router.push('/categories')}
              />
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['4xl'] },
          ]}>
          <EmptyState
            eyebrow={t('categories.eyebrow')}
            title={t('categories.emptyTitle')}
            body={t('categories.emptyBody')}
            actionLabel={t('categories.title')}
            onAction={() => router.replace('/categories')}
            secondaryLabel={t('common.back')}
            onSecondary={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/categories');
            }}
          />
        </ScrollView>
      )}
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
    gap: spacing['2xl'],
  },
  hero: {
    borderRadius: radii['2xl'],
    borderWidth: hairline,
    overflow: 'hidden',
    alignItems: 'stretch',
    gap: spacing.base,
    padding: spacing.md,
  },
  heroImage: {
    width: 116,
    height: 136,
    borderRadius: radii.lg,
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  heroEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
  },
  rule: {
    marginVertical: spacing.sm,
  },
  blocks: {
    gap: spacing.md,
  },
  sectionLabel: {
    letterSpacing: 1.6,
  },
  children: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  grid: {
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
});
