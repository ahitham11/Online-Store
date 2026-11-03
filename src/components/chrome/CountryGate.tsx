import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/BrandMark';
import { AppText } from '@/components/ui/AppText';
import { hapticSuccess } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { MARKET_CODES, markets } from '@/lib/markets';
import { useTheme } from '@/lib/theme';
import { usePreferencesStore } from '@/stores/preferences';
import { radii, spacing } from '@/theme/tokens';

/**
 * First thing a new shopper sees: pick a country. Prices, currency and
 * delivery all follow from it. Shown once; changeable later in Account.
 */
export function CountryGate() {
  const marketChosen = usePreferencesStore((state) => state.marketChosen);
  if (marketChosen) return null;
  return <Gate />;
}

function Gate() {
  const { colors } = useTheme();
  const { t, language, setLanguage, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const suggested = usePreferencesStore((state) => state.market);
  const setMarket = usePreferencesStore((state) => state.setMarket);
  const contentWidth = Math.min(width - spacing.xl * 2, 440);
  const cardWidth = Math.floor((contentWidth - spacing.md) / 2);

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(260)} style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.topRow, { width: contentWidth, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('drawer.language')}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            hitSlop={8}
            style={[styles.langPill, { borderColor: colors.goldLine }]}>
            <AppText variant="caption" maxScale={1.2}>
              {t('drawer.language')}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.brand}>
          <BrandMark size={1.1} />
        </View>

        <AppText variant="title" align="center" style={styles.title} maxScale={1.2}>
          {t('gate.title')}
        </AppText>
        <AppText variant="body" tone="secondary" align="center" style={[styles.body, { maxWidth: contentWidth }]} maxScale={1.3}>
          {t('gate.body')}
        </AppText>

        <View style={[styles.grid, { width: contentWidth, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {MARKET_CODES.map((code) => {
            const market = markets[code];
            const name = language === 'ar' ? market.nameAr : market.nameEn;
            const isSuggested = code === suggested;
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityLabel={name}
                onPress={() => {
                  hapticSuccess();
                  setMarket(code);
                }}
                style={({ pressed }) => [
                  styles.card,
                  {
                    width: cardWidth,
                    backgroundColor: colors.surface,
                    borderColor: isSuggested ? colors.primary : colors.goldLine,
                    borderWidth: isSuggested ? 1.5 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <AppText style={styles.flag} maxScale={1}>
                  {market.flag}
                </AppText>
                <AppText variant="subtitle" align="center" numberOfLines={1} maxScale={1.2}>
                  {name}
                </AppText>
                <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
                  {language === 'ar' ? market.symbolAr : market.currency}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="caption" tone="tertiary" align="center" style={styles.note} maxScale={1.2}>
          {t('gate.note')}
        </AppText>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1000, elevation: 1000 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  topRow: { justifyContent: 'flex-start' },
  langPill: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6 },
  brand: { marginTop: spacing.xl, marginBottom: spacing['2xl'] },
  title: { maxWidth: 360 },
  body: { marginTop: spacing.sm },
  grid: { flexWrap: 'wrap', gap: spacing.md, marginTop: spacing['2xl'] },
  card: { borderRadius: radii.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, alignItems: 'center', gap: 4 },
  flag: { fontSize: 34, lineHeight: 44 },
  note: { marginTop: spacing.xl, maxWidth: 300 },
});
