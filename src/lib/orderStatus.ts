import type { TextTone } from '@/components/ui/AppText';
import type { TranslationKey } from '@/lib/i18n';
import type { OrderStatus } from '@/lib/orders';

export function statusKey(status: OrderStatus): TranslationKey {
  return `orderStatus.${status}` as TranslationKey;
}

export function statusTone(status: OrderStatus): TextTone {
  if (status === 'delivered') return 'success';
  if (status === 'cancelled' || status === 'returned') return 'danger';
  return 'accent';
}
