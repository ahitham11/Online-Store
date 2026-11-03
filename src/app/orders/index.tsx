import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/chrome/StackHeader';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { useMyOrders } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/format';
import { hapticTap } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useSessionStore } from '@/stores/session';
import { hairline, radii, spacing } from '@/theme/tokens';

import { statusKey, statusTone } from '@/lib/orderStatus';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, language, isRTL } = useI18n();
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  const orders = useMyOrders();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StackHeader title={t('orders.title')} eyebrow={t('account.eyebrow')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
        {!signedIn ? (
          <EmptyState
            title={t('checkout.signInTitle')}
            body={t('orders.signInBody')}
            actionLabel={t('account.signIn')}
            onAction={() => router.push('/sign-in')}
          />
        ) : orders.isLoading ? (
          <View style={styles.list}>
            {[0, 1, 2].map((key) => (
              <SkeletonBlock key={key} height={86} radius={radii.lg} />
            ))}
          </View>
        ) : orders.isError ? (
          <EmptyState title={t('common.errorTitle')} body={t('common.errorBody')} actionLabel={t('common.retry')} onAction={() => orders.refetch()} />
        ) : (orders.data ?? []).length === 0 ? (
          <EmptyState
            title={t('account.guestOrdersTitle')}
            body={t('account.guestOrdersBody')}
            actionLabel={t('bag.cta')}
            onAction={() => router.replace('/')}
          />
        ) : (
          <View style={styles.list}>
            {orders.data!.map((order) => (
              <Pressable
                key={order.id}
                accessibilityRole="button"
                accessibilityLabel={`${order.number}, ${t(statusKey(order.status))}`}
                onPress={() => {
                  hapticTap();
                  router.push({ pathname: '/orders/[id]', params: { id: order.id } });
                }}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: colors.goldLine, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1, flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}>
                <View style={styles.cardCopy}>
                  <AppText variant="subtitle" maxScale={1.2}>
                    {order.number}
                  </AppText>
                  <AppText variant="caption" tone="tertiary" maxScale={1.2}>
                    {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { numberingSystem: 'latn', day: 'numeric', month: 'long', year: 'numeric' } as Intl.DateTimeFormatOptions)}
                  </AppText>
                  <AppText variant="caption" tone={statusTone(order.status)} maxScale={1.2}>
                    {t(statusKey(order.status))}
                  </AppText>
                </View>
                <AppText variant="price" maxScale={1.2}>
                  {formatPrice(order.total, order.market, language)}
                </AppText>
                <Icon name="chevron" size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  list: { gap: spacing.md },
  card: {
    borderWidth: hairline,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  cardCopy: { flex: 1, gap: 3 },
});
