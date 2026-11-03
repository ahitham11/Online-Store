import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Monogram } from '@/components/brand/BrandMark';
import { getWhatsAppUrl } from '@/data/brand';
import { StackHeader } from '@/components/chrome/StackHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { useOrder } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { markets } from '@/lib/markets';
import { statusKey, statusTone } from '@/lib/orderStatus';
import { TRACKING_STEPS, trackingIndex } from '@/lib/orders';
import { useTheme } from '@/lib/theme';
import { hairline, radii, spacing } from '@/theme/tokens';

export default function OrderScreen() {
  const params = useLocalSearchParams<{ id?: string; placed?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, language, localized, isRTL } = useI18n();
  const order = useOrder(params.id);
  const data = order.data;

  const date = (value: string) =>
    new Date(value).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', {
      numberingSystem: 'latn',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    } as Intl.DateTimeFormatOptions);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader
        title={data?.number ?? t('orders.title')}
        eyebrow={t('orders.title')}
        onBack={() => (params.placed ? router.replace('/') : router.canGoBack() ? router.back() : router.replace('/orders'))}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
        {order.isLoading ? (
          <View style={styles.gap}>
            <SkeletonBlock height={120} radius={radii.xl} />
            <SkeletonBlock height={220} radius={radii.xl} />
          </View>
        ) : !data ? (
          <EmptyState title={t('orders.notFound')} body={t('notFound.body')} actionLabel={t('orders.title')} onAction={() => router.replace('/orders')} />
        ) : (
          <>
            {params.placed ? (
              <View style={[styles.card, styles.center, { borderColor: colors.primary, backgroundColor: colors.bgAlt }]}>
                <Icon name="check" size={28} color={colors.primary} />
                <AppText variant="title" align="center" maxScale={1.2}>
                  {t('orders.thanks')}
                </AppText>
                <AppText variant="bodySmall" tone="secondary" align="center" maxScale={1.3}>
                  {t('orders.thanksBody', { number: data.number })}
                </AppText>
              </View>
            ) : null}

            {/* Tracking timeline */}
            <View style={[styles.card, { borderColor: colors.goldLine, backgroundColor: colors.surface }]}>
              <AppText variant="label" tone="accent" style={styles.label} maxScale={1.2}>
                {t('orders.tracking')}
              </AppText>
              <AppText variant="subtitle" tone={statusTone(data.status)} maxScale={1.2}>
                {t(statusKey(data.status))}
              </AppText>
              {data.status === 'cancelled' || data.status === 'returned' ? null : (
                <View style={styles.timeline}>
                  {TRACKING_STEPS.map((step, index) => {
                    const done = index <= trackingIndex(data.status);
                    const event = data.events.find((e) => e.status === step || (step === 'confirmed' && e.status === 'packed'));
                    return (
                      <View key={step} style={[styles.step, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.rail}>
                          <View style={[styles.dot, { backgroundColor: done ? colors.primary : colors.skeleton, borderColor: done ? colors.primary : colors.border }]}>
                            {done ? <Icon name="check" size={10} color={colors.onPrimary} /> : null}
                          </View>
                          {index < TRACKING_STEPS.length - 1 ? (
                            <View style={[styles.line, { backgroundColor: index < trackingIndex(data.status) ? colors.primary : colors.border }]} />
                          ) : null}
                        </View>
                        <View style={styles.stepCopy}>
                          <AppText variant="bodySmall" tone={done ? 'text' : 'tertiary'} maxScale={1.2}>
                            {t(statusKey(step))}
                          </AppText>
                          {event ? (
                            <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                              {date(event.createdAt)}
                            </AppText>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              {data.trackingNumber ? (
                <View style={[styles.trackBox, { borderColor: colors.border }]}>
                  <AppText variant="caption" tone="secondary" maxScale={1.2}>
                    {t('orders.trackingNumber', { carrier: data.carrier ?? '' })}
                  </AppText>
                  <AppText variant="subtitle" selectable maxScale={1.2}>
                    {data.trackingNumber}
                  </AppText>
                  {data.trackingUrl ? (
                    <Button label={t('orders.trackShipment')} variant="outline" size="sm" icon="truck" onPress={() => Linking.openURL(data.trackingUrl!)} />
                  ) : null}
                </View>
              ) : (
                <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                  {t('orders.trackingSoon')}
                </AppText>
              )}
            </View>

            {/* Items */}
            <View style={[styles.card, { borderColor: colors.goldLine, backgroundColor: colors.surface }]}>
              <AppText variant="label" tone="accent" style={styles.label} maxScale={1.2}>
                {t('orders.items')}
              </AppText>
              {data.items.map((item) => (
                <View key={item.sku} style={[styles.item, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.thumb, { backgroundColor: colors.bgAlt }]}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Monogram size={28} color={colors.textTertiary} gold={colors.goldLine} />
                    )}
                  </View>
                  <View style={styles.itemCopy}>
                    <AppText variant="bodySmall" maxScale={1.2} numberOfLines={2}>
                      {localized(item.nameAr, item.nameEn)}
                    </AppText>
                    {item.shadeNameAr || item.shadeNameEn ? (
                      <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                        {localized(item.shadeNameAr, item.shadeNameEn)}
                      </AppText>
                    ) : null}
                    <AppText variant="caption" tone="secondary" maxScale={1.2}>
                      {item.quantity} × {formatPrice(item.unitPrice, data.market, language)}
                    </AppText>
                  </View>
                  <AppText variant="bodySmall" maxScale={1.2}>
                    {formatPrice(item.lineTotal, data.market, language)}
                  </AppText>
                </View>
              ))}
              <View style={[styles.rule, { backgroundColor: colors.border }]} />
              <Line label={t('bag.subtotal')} value={formatPrice(data.subtotal, data.market, language)} />
              <Line label={t('bag.shipping')} value={data.shippingFee === 0 ? t('bag.freeShipping') : formatPrice(data.shippingFee, data.market, language)} />
              <Line label={t('bag.total')} value={formatPrice(data.total, data.market, language)} strong />
              <Line label={t('checkout.payment')} value={t('checkout.cod')} />
            </View>

            {/* Delivery address */}
            <View style={[styles.card, { borderColor: colors.goldLine, backgroundColor: colors.surface }]}>
              <AppText variant="label" tone="accent" style={styles.label} maxScale={1.2}>
                {t('orders.deliveryTo')}
              </AppText>
              <AppText variant="bodySmall" maxScale={1.2}>
                {data.customerName}
              </AppText>
              <AppText variant="bodySmall" tone="secondary" maxScale={1.2} style={styles.ltr}>
                {data.phone}
              </AppText>
              <AppText variant="bodySmall" tone="secondary" maxScale={1.2}>
                {[data.addressLine, data.area, data.city, language === 'ar' ? markets[data.market].nameAr : markets[data.market].nameEn].filter(Boolean).join('، ')}
              </AppText>
              {data.notes ? (
                <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                  {data.notes}
                </AppText>
              ) : null}
            </View>

            {getWhatsAppUrl() ? (
              <Button
                label={t('orders.askWhatsapp')}
                variant="outline"
                icon="whatsapp"
                onPress={() => Linking.openURL(getWhatsAppUrl(t('orders.whatsappMessage', { number: data.number }))!).catch(() => undefined)}
              />
            ) : null}
            <Button label={t('orders.continue')} variant="outline" onPress={() => router.replace('/')} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const { isRTL } = useI18n();
  return (
    <View style={[styles.lineRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <AppText variant={strong ? 'subtitle' : 'bodySmall'} tone={strong ? 'text' : 'secondary'} maxScale={1.2}>
        {label}
      </AppText>
      <AppText variant={strong ? 'price' : 'bodySmall'} maxScale={1.2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  gap: { gap: spacing.md },
  card: { borderWidth: hairline, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  center: { alignItems: 'center' },
  label: { letterSpacing: 1.2 },
  timeline: { gap: 0, marginTop: spacing.xs },
  step: { gap: spacing.md, minHeight: 46 },
  rail: { alignItems: 'center', width: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 2 },
  stepCopy: { flex: 1, gap: 2, paddingBottom: spacing.sm },
  trackBox: { borderWidth: hairline, borderRadius: radii.md, padding: spacing.md, gap: spacing.xs },
  item: { alignItems: 'center', gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radii.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, gap: 2 },
  rule: { height: hairline },
  lineRow: { justifyContent: 'space-between', alignItems: 'center' },
  ltr: { writingDirection: 'ltr' },
});
