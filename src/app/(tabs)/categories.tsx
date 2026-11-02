import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Monogram } from '@/components/brand/BrandMark';
import { Page } from '@/components/chrome/Page';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { useCatalog } from '@/data/useCatalog';
import { includesNormalized } from '@/lib/arabic';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { hairline, palette, radii, spacing } from '@/theme/tokens';

export default function CategoriesScreen() {
  const { t, language, localized, isRTL } = useI18n();
  const { colors, isDark } = useTheme();
  const catalog = useCatalog();
  const [query, setQuery] = useState('');

  const categories = useMemo(
    () =>
      catalog.data.categories.filter((category) =>
        includesNormalized(
          `${category.nameAr} ${category.nameEn}`,
          query,
        ),
      ),
    [catalog.data.categories, query],
  );

  const countFor = (categoryId: string) =>
    catalog.data.products.filter((product) => product.categoryId === categoryId).length;

  const isEmpty = catalog.data.categories.length === 0;

  return (
    <Page
      eyebrow={t('categories.eyebrow')}
      title={t('categories.title')}
      description={t('home.categoriesEmptyBody')}
      headerAccessory={
        <AppText variant="caption" tone="tertiary" style={styles.count} maxScale={1.2}>
          {language === 'ar'
            ? `${catalog.data.categories.length} قسم`
            : t('categories.count', { count: catalog.data.categories.length })}
        </AppText>
      }>
      <View
        style={[
          styles.search,
          {
            borderColor: colors.goldLine,
            backgroundColor: colors.input,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}>
        <Icon name="search" size={17} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('categories.search')}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={t('categories.search')}
          returnKeyType="search"
          style={[
            styles.input,
            {
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.clear')}
            onPress={() => setQuery('')}
            hitSlop={10}>
            <Icon name="close" size={15} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            eyebrow={t('categories.eyebrow')}
            title={t('categories.emptyTitle')}
            body={t('categories.emptyBody')}
            actionLabel={t('home.categoriesCta')}
            onAction={() => router.push('/')}
          />
          <View
            style={[
              styles.stateStrip,
              { borderColor: colors.goldLine, backgroundColor: colors.surface },
            ]}>
            <View style={[styles.stateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.stateDot, { backgroundColor: colors.warning }]} />
              <AppText variant="caption" tone="secondary" style={styles.stateText} maxScale={1.3}>
                {t('home.principleCatalogValue')}
              </AppText>
              <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                {catalog.data.updatedAt
                  ? new Date(catalog.data.updatedAt).toLocaleDateString(
                      language === 'ar' ? 'ar-EG' : 'en-GB',
                    )
                  : '—'}
              </AppText>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {categories.map((category, index) => {
            const count = countFor(category.id);
            const name = localized(category.nameAr, category.nameEn);
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={`${name}, ${t('categories.count', { count })}`}
                onPress={() => router.push(`/category/${category.id}`)}
                style={({ pressed }) => [
                  styles.categoryRow,
                  {
                    borderColor: colors.goldLine,
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.8 : 1,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}>
                <View style={styles.categoryImage}>
                  {category.image ? (
                    <Image
                      source={{ uri: category.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={250}
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <View style={[styles.categoryPlaceholder, { backgroundColor: colors.bgAlt }]}>
                      <Monogram size={32} color={colors.textTertiary} gold={colors.goldLine} />
                    </View>
                  )}
                </View>
                <View style={styles.categoryCopy}>
                  <AppText variant="label" tone="accent" style={styles.categoryIndex} maxScale={1.2}>
                    {String(index + 1).padStart(2, '0')}
                  </AppText>
                  <AppText variant="titleSmall" maxScale={1.25}>
                    {name}
                  </AppText>
                  <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                    {t('categories.count', { count })}
                  </AppText>
                </View>
                <Icon name="chevron" size={16} color={isDark ? colors.textTertiary : palette.plumSoft} mirrored />
              </Pressable>
            );
          })}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  count: {
    fontSize: 10,
    letterSpacing: 1,
  },
  search: {
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: hairline,
    paddingHorizontal: spacing.base,
    marginBottom: spacing['2xl'],
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    padding: 0,
    outlineStyle: 'none',
  } as object,
  emptyWrap: {
    gap: spacing.base,
  },
  stateStrip: {
    borderRadius: radii.lg,
    borderWidth: hairline,
    padding: spacing.base,
  },
  stateRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  stateText: {
    flex: 1,
    fontSize: 11,
  },
  list: {
    gap: spacing.md,
  },
  categoryRow: {
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: hairline,
  },
  categoryImage: {
    width: 74,
    height: 86,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  categoryPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCopy: {
    flex: 1,
    gap: 2,
  },
  categoryIndex: {
    fontSize: 8,
    letterSpacing: 1.2,
  },
});
