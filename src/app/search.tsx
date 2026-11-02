import { router } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon } from '@/components/ui/Icon';
import { useCatalog } from '@/data/useCatalog';
import { createSearchIndex, includesNormalized } from '@/lib/arabic';
import { hapticSelection, hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useSearchStore } from '@/stores/search';
import { hairline, layout, radii, spacing } from '@/theme/tokens';

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();
  const catalog = useCatalog();
  const [query, setQuery] = useState('');
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const recent = useSearchStore((state) => state.recent);
  const addRecent = useSearchStore((state) => state.addRecent);
  const clearRecent = useSearchStore((state) => state.clearRecent);

  const hasCatalog = catalog.data.products.length > 0;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return catalog.data.products.filter((product) => {
      const haystack = createSearchIndex(
        product.nameAr,
        product.nameEn,
        product.descriptionAr,
        product.descriptionEn,
        ...product.tags,
        ...product.variants.flatMap((variant) => [
          variant.shadeNameAr,
          variant.shadeNameEn,
          variant.size,
        ]),
      );
      return includesNormalized(haystack, query);
    });
  }, [catalog.data.products, query]);

  const submit = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    addRecent(clean);
    hapticSelection();
  };

  const available = Math.min(width, layout.maxContentWidth + 160) - spacing.xl * 2;
  const columns = available > 520 ? 3 : 2;
  const cardWidth = Math.floor((available - spacing.md * (columns - 1)) / columns);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={{ paddingTop: insets.top }}>
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeButton,
              {
                borderColor: colors.goldLine,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.6 : 1,
              },
            ]}>
            <Icon name="close" size={17} color={colors.text} />
          </Pressable>
          <AppText variant="titleSmall" style={styles.topTitle} maxScale={1.25}>
            {t('search.title')}
          </AppText>
          <View style={styles.closeButton} />
        </View>

        <View style={[styles.searchWrap, { paddingHorizontal: spacing.xl }]}>
          <View
            style={[
              styles.search,
              {
                borderColor: colors.goldLine,
                backgroundColor: colors.input,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}>
            <Icon name="search" size={18} color={colors.textTertiary} />
            <TextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => submit(query)}
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel={t('search.a11yInput')}
              returnKeyType="search"
              autoCorrect={false}
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
                accessibilityLabel={t('search.a11yClear')}
                onPress={() => {
                  hapticTap();
                  setQuery('');
                  inputRef.current?.focus();
                }}
                hitSlop={10}>
                <Icon name="close" size={15} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
          <AppText variant="caption" tone="tertiary" style={styles.hint} maxScale={1.2}>
            {t('search.hint')}
          </AppText>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['4xl'] },
        ]}>
        {query.trim() && results.length > 0 ? (
          <>
            <View style={[styles.resultTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="label" tone="accent" style={styles.resultCount} maxScale={1.2}>
                {t('search.results', { count: results.length })}
              </AppText>
              <GoldRule width="34%" diamond={false} />
            </View>
            <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  width={cardWidth}
                  onPress={() => router.push(`/product/${product.id}`)}
                />
              ))}
            </View>
          </>
        ) : query.trim() && results.length === 0 && hasCatalog ? (
          <EmptyState
            showOrnament={false}
            title={t('search.noResultsTitle', { query: query.trim() })}
            body={t('search.noResultsBody')}
            actionLabel={t('categories.title')}
            onAction={() => router.push('/categories')}
          />
        ) : (
          <>
            {recent.length > 0 ? (
              <View style={styles.recentBlock}>
                <View style={[styles.recentTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <AppText variant="label" tone="accent" style={styles.resultCount} maxScale={1.2}>
                    {t('search.recent')}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('search.clear')}
                    onPress={() => {
                      hapticTap();
                      clearRecent();
                    }}
                    hitSlop={8}>
                    <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                      {t('search.clear')}
                    </AppText>
                  </Pressable>
                </View>
                <View style={styles.chips}>
                  {recent.map((term) => (
                    <Pressable
                      key={term}
                      accessibilityRole="button"
                      accessibilityLabel={term}
                      onPress={() => {
                        setQuery(term);
                        submit(term);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderColor: colors.goldLine,
                          backgroundColor: colors.surface,
                          opacity: pressed ? 0.6 : 1,
                        },
                      ]}>
                      <Icon name="search" size={12} color={colors.textTertiary} />
                      <AppText variant="caption" maxScale={1.2}>
                        {term}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <EmptyState
              showOrnament={!hasCatalog}
              title={hasCatalog ? t('common.emptyTitle') : t('search.emptyTitle')}
              body={hasCatalog ? t('search.emptyBody') : t('search.emptyBody')}
              actionLabel={hasCatalog ? undefined : t('categories.title')}
              onAction={hasCatalog ? undefined : () => router.push('/categories')}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
  },
  searchWrap: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  search: {
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: hairline,
    paddingHorizontal: spacing.base,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    padding: 0,
    outlineStyle: 'none',
  } as object,
  hint: {
    paddingStart: spacing.base,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  resultTop: {
    alignItems: 'center',
    gap: spacing.md,
  },
  resultCount: {
    letterSpacing: 1.4,
  },
  grid: {
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  recentBlock: {
    gap: spacing.md,
  },
  recentTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: hairline,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    height: 36,
  },
});
