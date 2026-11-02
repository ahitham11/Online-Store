import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Monogram } from '@/components/brand/BrandMark';
import { Page } from '@/components/chrome/Page';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldRule } from '@/components/ui/GoldRule';
import { Icon } from '@/components/ui/Icon';
import { formatEgp, lineTotal } from '@/lib/format';
import { hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import {
  selectBagCount,
  selectBagSubtotal,
  useBagStore,
  type BagLine,
} from '@/stores/bag';
import { hairline, radii, spacing } from '@/theme/tokens';

export default function BagScreen() {
  const { colors } = useTheme();
  const { t, language, localized, isRTL } = useI18n();
  const lines = useBagStore((state) => state.lines);
  const count = useBagStore(selectBagCount);
  const subtotal = useBagStore(selectBagSubtotal);
  const setQuantity = useBagStore((state) => state.setQuantity);
  const removeLine = useBagStore((state) => state.removeLine);
  const clear = useBagStore((state) => state.clear);

  const confirmClear = () => {
    if (lines.length === 0) return;
    hapticTap();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Alert has no native dialog on web; keep the action explicit.
      if (window.confirm(t('bag.clear'))) clear();
      return;
    }
    Alert.alert(t('bag.clear'), t('bag.emptyBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('bag.clear'), style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <Page
      eyebrow={t('bag.eyebrow')}
      title={t('bag.title')}
      description={t('bag.catalogNote')}
      headerAccessory={
        count > 0 ? (
          <AppText variant="caption" tone="tertiary" maxScale={1.2}>
            {t('bag.itemCount', { count })}
          </AppText>
        ) : undefined
      }
      footer={
        lines.length > 0 ? (
          <View style={styles.footerBlock}>
            <GoldRule width="32%" style={styles.footerRule} />
            <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
              {t('bag.checkoutSoon')}
            </AppText>
          </View>
        ) : null
      }>
      {lines.length === 0 ? (
        <EmptyState
          eyebrow={t('bag.eyebrow')}
          title={t('bag.emptyTitle')}
          body={t('bag.emptyBody')}
          actionLabel={t('bag.cta')}
          onAction={() => router.push('/')}
          secondaryLabel={t('home.categoriesCta')}
          onSecondary={() => router.push('/categories')}
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.lines}>
            {lines.map((line) => (
              <BagRow
                key={line.key}
                line={line}
                isRTL={isRTL}
                currencyLanguage={language}
                name={localized(line.nameAr, line.nameEn)}
                shade={localized(line.shadeNameAr, line.shadeNameEn)}
                colors={colors}
                labels={{
                  remove: t('bag.remove'),
                  quantity: t('bag.quantity'),
                  decrease: t('bag.decrease'),
                  increase: t('bag.increase'),
                }}
                onChangeQuantity={(quantity) => setQuantity(line.key, quantity)}
                onRemove={() => {
                  hapticTap();
                  removeLine(line.key);
                }}
              />
            ))}
          </View>

          <View
            style={[
              styles.summary,
              { borderColor: colors.goldLine, backgroundColor: colors.surface },
            ]}>
            <SummaryRow
              label={t('bag.subtotal')}
              value={formatEgp(subtotal, language)}
              strong
            />
            <View style={[styles.summaryRule, { backgroundColor: colors.border }]} />
            <SummaryRow
              label={t('bag.shipping')}
              value={t('bag.shippingAtCheckout')}
              muted
            />
            <View style={[styles.summaryRule, { backgroundColor: colors.border }]} />
            <SummaryRow
              label={t('bag.total')}
              value={`${formatEgp(subtotal, language)} + ${t('bag.shipping')}`}
              strong
              accent
            />
          </View>

          <Button
            label={t('bag.checkout')}
            icon="lock"
            iconPosition="end"
            disabled
            accessibilityHint={t('bag.checkoutSoon')}
          />
          <AppText variant="caption" tone="tertiary" align="center" maxScale={1.2}>
            {t('bag.checkoutSoon')}
          </AppText>

          <Button
            label={t('bag.clear')}
            icon="trash"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={confirmClear}
          />
        </View>
      )}
    </Page>
  );
}

type BagRowProps = {
  line: BagLine;
  isRTL: boolean;
  currencyLanguage: 'ar' | 'en';
  name: string;
  shade: string;
  colors: ReturnType<typeof useTheme>['colors'];
  labels: {
    remove: string;
    quantity: string;
    decrease: string;
    increase: string;
  };
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
};

function BagRow({
  line,
  isRTL,
  currencyLanguage,
  name,
  shade,
  colors,
  labels,
  onChangeQuantity,
  onRemove,
}: BagRowProps) {
  const total = lineTotal(line.unitPriceEgp, line.quantity);

  return (
    <View
      style={[
        styles.line,
        {
          borderColor: colors.goldLine,
          backgroundColor: colors.surface,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}>
      <View style={styles.lineImage}>
        {line.imageUri ? (
          <Image
            source={{ uri: line.imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={240}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.linePlaceholder, { backgroundColor: colors.bgAlt }]}>
            <Monogram size={38} color={colors.textTertiary} gold={colors.goldLine} />
          </View>
        )}
      </View>

      <View style={styles.lineCopy}>
        <View style={[styles.lineTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <AppText variant="subtitle" style={styles.lineName} numberOfLines={2} maxScale={1.25}>
            {name}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.remove}
            onPress={onRemove}
            hitSlop={10}
            style={({ pressed }) => [styles.removeButton, pressed ? { opacity: 0.5 } : null]}>
            <Icon name="close" size={14} color={colors.textTertiary} />
          </Pressable>
        </View>

        {shade || line.size ? (
          <AppText variant="caption" tone="secondary" numberOfLines={1} maxScale={1.2}>
            {[shade, line.size].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}

        <View style={[styles.lineBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View
            style={[
              styles.stepper,
              { borderColor: colors.goldLine, backgroundColor: colors.input },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.decrease}
              disabled={line.quantity <= 1}
              onPress={() => {
                hapticTap();
                onChangeQuantity(line.quantity - 1);
              }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.stepButton,
                { opacity: line.quantity <= 1 ? 0.32 : pressed ? 0.55 : 1 },
              ]}>
              <Icon name="minus" size={13} color={colors.text} />
            </Pressable>
            <AppText variant="bodySmall" style={styles.quantity} maxScale={1.2}>
              {line.quantity}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.increase}
              onPress={() => {
                hapticTap();
                onChangeQuantity(line.quantity + 1);
              }}
              hitSlop={6}
              style={({ pressed }) => [styles.stepButton, pressed ? { opacity: 0.55 } : null]}>
              <Icon name="plus" size={13} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.priceBlock}>
            <AppText variant="price" style={styles.price} maxScale={1.2}>
              {formatEgp(total, currencyLanguage)}
            </AppText>
            {line.quantity > 1 ? (
              <AppText variant="caption" tone="tertiary" maxScale={1.15}>
                {formatEgp(line.unitPriceEgp, currencyLanguage)}
              </AppText>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  muted = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.summaryRow}>
      <AppText variant={strong ? 'body' : 'bodySmall'} tone={muted ? 'secondary' : 'text'} maxScale={1.25}>
        {label}
      </AppText>
      <AppText
        variant={strong ? 'price' : 'bodySmall'}
        style={[
          styles.summaryValue,
          {
            color: accent ? colors.accentText : muted ? colors.textTertiary : colors.text,
            fontSize: strong ? 18 : 12,
          },
        ]}
        maxScale={1.2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  lines: {
    gap: spacing.md,
  },
  line: {
    borderRadius: radii.xl,
    borderWidth: hairline,
    padding: spacing.sm,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  lineImage: {
    width: 88,
    height: 108,
    borderRadius: radii.lg,
    overflow: 'hidden',
    flexShrink: 0,
  },
  linePlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineCopy: {
    flex: 1,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  lineTop: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  lineName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBottom: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: hairline,
    borderRadius: 999,
    height: 34,
    overflow: 'hidden',
  },
  stepButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: 22,
    textAlign: 'center',
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 1,
  },
  price: {
    fontSize: 16,
    lineHeight: 21,
  },
  summary: {
    borderRadius: radii.xl,
    borderWidth: hairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryValue: {
    flexShrink: 1,
    textAlign: 'end',
  },
  summaryRule: {
    height: StyleSheet.hairlineWidth,
  },
  footerBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  footerRule: {
    marginBottom: spacing.xs,
  },
});
