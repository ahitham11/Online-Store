import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/chrome/StackHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { useShippingRate } from '@/data/useShipping';
import { useMarket } from '@/hooks/useMarket';
import { orderKeys, ordersClient } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/format';
import { hapticSuccess } from '@/lib/haptics';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { normalizePhone, shippingFee } from '@/lib/markets';
import { OrderError } from '@/lib/orders';
import { useTheme } from '@/lib/theme';
import { selectBagSubtotal, useBagStore } from '@/stores/bag';
import { authIsAvailable, useSessionStore } from '@/stores/session';
import { hairline, radii, spacing } from '@/theme/tokens';

type Fields = { name: string; phone: string; city: string; area: string; line: string; notes: string };
type FieldErrors = Partial<Record<keyof Fields, TranslationKey>>;

const orderErrorKeys: Record<OrderError['code'], TranslationKey> = {
  sign_in_required: 'checkout.errorSignIn',
  empty_bag: 'bag.emptyTitle',
  out_of_stock: 'checkout.errorStock',
  not_sold_in_market: 'checkout.errorMarket',
  market_unavailable: 'checkout.errorMarket',
  invalid: 'common.errorBody',
  network: 'common.offlineBody',
  unknown: 'common.errorBody',
};

/** Cash-on-delivery checkout. Prices and shipping are re-checked by the server. */
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, language, localized } = useI18n();
  const queryClient = useQueryClient();
  const market = useMarket();
  const rate = useShippingRate(market.code);
  const lines = useBagStore((state) => state.lines);
  const subtotal = useBagStore(selectBagSubtotal);
  const clearBag = useBagStore((state) => state.clear);
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const getAccessToken = useSessionStore((state) => state.getAccessToken);

  const [fields, setFields] = useState<Fields>({ name: '', phone: '', city: '', area: '', line: '', notes: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  const shipping = shippingFee(subtotal, rate);
  const total = subtotal + shipping;
  const country = language === 'ar' ? market.nameAr : market.nameEn;

  const set = (key: keyof Fields) => (value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/bag'));

  const placeOrder = async () => {
    if (busy) return;
    const next: FieldErrors = {};
    if (fields.name.trim().length < 2) next.name = 'checkout.errorName';
    const phone = normalizePhone(fields.phone, market.code);
    if (!phone) next.phone = 'checkout.errorPhone';
    if (fields.city.trim().length < 2) next.city = 'checkout.errorCity';
    if (fields.line.trim().length < 5) next.line = 'checkout.errorAddress';
    setErrors(next);
    if (Object.keys(next).length > 0 || !phone || !ordersClient) return;

    setBusy(true);
    setSubmitError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new OrderError('sign_in_required', 'Signed out');
      const order = await ordersClient.placeOrder(
        accessToken,
        market.code,
        lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
        {
          name: fields.name.trim(),
          phone,
          email: user?.email ?? null,
          city: fields.city.trim(),
          area: fields.area.trim() || null,
          line: fields.line.trim(),
          notes: fields.notes.trim() || null,
        },
      );
      hapticSuccess();
      clearBag();
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['catalog'] });
      router.replace({ pathname: '/orders/[id]', params: { id: order.id, placed: '1' } });
    } catch (error) {
      setSubmitError(error instanceof OrderError ? orderErrorKeys[error.code] : 'common.errorBody');
    } finally {
      setBusy(false);
    }
  };

  const body = (() => {
    if (authIsAvailable && status === 'restoring') {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (!authIsAvailable || status !== 'signedIn') {
      return (
        <EmptyState
          eyebrow={t('checkout.title')}
          title={t('checkout.signInTitle')}
          body={t('checkout.signInBody')}
          actionLabel={t('account.signIn')}
          onAction={() => router.push('/sign-in')}
          secondaryLabel={t('common.back')}
          onSecondary={close}
        />
      );
    }
    if (lines.length === 0) {
      return (
        <EmptyState
          eyebrow={t('checkout.title')}
          title={t('bag.emptyTitle')}
          body={t('bag.emptyBody')}
          actionLabel={t('bag.cta')}
          onAction={() => router.replace('/')}
        />
      );
    }
    return (
      <>
        <Section title={t('checkout.deliverTo', { country })} colors={colors}>
          <Field label={t('checkout.name')} value={fields.name} onChangeText={set('name')} error={errors.name && t(errors.name)} autoComplete="name" textContentType="name" />
          <Field
            label={t('checkout.phone')}
            prefix={`${market.flag} ${market.dialCode}`}
            value={fields.phone}
            onChangeText={set('phone')}
            error={errors.phone && t(errors.phone)}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            ltr
          />
          <Field label={t('checkout.city')} value={fields.city} onChangeText={set('city')} error={errors.city && t(errors.city)} autoComplete="postal-address-locality" />
          <Field label={t('checkout.area')} value={fields.area} onChangeText={set('area')} optional={t('checkout.optional')} />
          <Field
            label={t('checkout.address')}
            value={fields.line}
            onChangeText={set('line')}
            error={errors.line && t(errors.line)}
            autoComplete="street-address"
            multiline
          />
          <Field label={t('checkout.notes')} value={fields.notes} onChangeText={set('notes')} optional={t('checkout.optional')} multiline />
        </Section>

        <Section title={t('checkout.payment')} colors={colors}>
          <View style={[styles.payment, { borderColor: colors.primary, backgroundColor: colors.bgAlt }]}>
            <Icon name="check" size={18} color={colors.primary} />
            <View style={styles.paymentCopy}>
              <AppText variant="subtitle" maxScale={1.2}>
                {t('checkout.cod')}
              </AppText>
              <AppText variant="caption" tone="secondary" maxScale={1.2}>
                {t('checkout.codBody')}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" tone="tertiary" maxScale={1.2}>
            {t('checkout.moreSoon')}
          </AppText>
        </Section>

        <Section title={t('checkout.summary')} colors={colors}>
          {lines.map((line) => (
            <Row
              key={line.key}
              label={`${line.quantity} × ${localized(line.nameAr, line.nameEn)}${line.shadeNameAr || line.shadeNameEn ? ` — ${localized(line.shadeNameAr, line.shadeNameEn)}` : ''}`}
              value={formatPrice(line.unitPrice * line.quantity, market.code, language)}
            />
          ))}
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <Row label={t('bag.subtotal')} value={formatPrice(subtotal, market.code, language)} />
          <Row label={t('bag.shipping')} value={shipping === 0 ? t('bag.freeShipping') : formatPrice(shipping, market.code, language)} />
          <Row label={t('bag.total')} value={formatPrice(total, market.code, language)} strong />
          <AppText variant="caption" tone="tertiary" maxScale={1.2}>
            {t('bag.deliveryEta', { min: rate.etaMinDays, max: rate.etaMaxDays, country })}
          </AppText>
        </Section>

        {submitError ? (
          <AppText variant="bodySmall" tone="danger" align="center" accessibilityLiveRegion="polite" maxScale={1.3}>
            {t(submitError)}
          </AppText>
        ) : null}
        <Button label={t('checkout.place', { total: formatPrice(total, market.code, language) })} icon="check" loading={busy} onPress={placeOrder} />
      </>
    );
  })();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader title={t('checkout.title')} eyebrow={t('bag.title')} onBack={close} />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
          {body}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.section, { borderColor: colors.goldLine, backgroundColor: colors.surface }]}>
      <AppText variant="label" tone="accent" style={styles.sectionTitle} maxScale={1.2}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const { isRTL } = useI18n();
  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <AppText variant={strong ? 'subtitle' : 'bodySmall'} tone={strong ? 'text' : 'secondary'} style={styles.rowLabel} maxScale={1.2}>
        {label}
      </AppText>
      <AppText variant={strong ? 'price' : 'bodySmall'} maxScale={1.2}>
        {value}
      </AppText>
    </View>
  );
}

function Field({
  label,
  error,
  optional,
  prefix,
  ltr,
  multiline,
  ...input
}: TextInputProps & { label: string; error?: string; optional?: string; prefix?: string; ltr?: boolean }) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  return (
    <View style={styles.field}>
      <AppText variant="caption" tone="secondary" maxScale={1.2}>
        {label}
        {optional ? ` · ${optional}` : ''}
      </AppText>
      <View
        style={[
          styles.inputWrap,
          { borderColor: error ? colors.danger : colors.goldLine, backgroundColor: colors.input, flexDirection: 'row' },
        ]}>
        {prefix ? (
          <AppText variant="bodySmall" tone="secondary" style={styles.prefix} maxScale={1.1}>
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          {...input}
          accessibilityLabel={label}
          multiline={multiline}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            multiline && styles.multiline,
            {
              color: colors.text,
              textAlign: ltr ? 'left' : isRTL ? 'right' : 'left',
              writingDirection: ltr ? 'ltr' : isRTL ? 'rtl' : 'ltr',
            },
          ]}
        />
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" maxScale={1.2}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  section: {
    borderWidth: hairline,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    letterSpacing: 1.2,
  },
  field: {
    gap: 6,
  },
  inputWrap: {
    borderWidth: hairline,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  prefix: {
    paddingEnd: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    paddingVertical: spacing.sm,
    outlineStyle: 'none',
  } as object,
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  payment: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  paymentCopy: {
    flex: 1,
    gap: 2,
  },
  rule: {
    height: hairline,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    flex: 1,
  },
});
