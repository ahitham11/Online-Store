import type { SupabaseConfig } from './env.ts';
import type { MarketCode } from './markets.ts';

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The happy path shown as a tracking timeline. */
export const TRACKING_STEPS: OrderStatus[] = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];

export type ShippingAddress = {
  name: string;
  phone: string;
  email?: string | null;
  city: string;
  area?: string | null;
  line: string;
  notes?: string | null;
};

export type OrderSummary = {
  id: string;
  number: string;
  market: MarketCode;
  currency: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
};

export type OrderItem = {
  sku: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  shadeNameAr: string | null;
  shadeNameEn: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderEvent = { status: OrderStatus; note: string | null; createdAt: string };

export type OrderDetail = OrderSummary & {
  paymentMethod: 'cod';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  customerName: string;
  phone: string;
  city: string;
  area: string | null;
  addressLine: string;
  notes: string | null;
  subtotal: number;
  shippingFee: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  items: OrderItem[];
  events: OrderEvent[];
};

export class OrderError extends Error {
  readonly code: 'sign_in_required' | 'empty_bag' | 'out_of_stock' | 'not_sold_in_market' | 'market_unavailable' | 'invalid' | 'network' | 'unknown';
  readonly sku: string | null;
  constructor(code: OrderError['code'], message: string, sku: string | null = null) {
    super(message);
    this.name = 'OrderError';
    this.code = code;
    this.sku = sku;
  }
}

/** Maps a Postgres exception message from place_order to a typed error. */
export function classifyOrderError(message: string): OrderError {
  const [code, sku = null] = message.split(':');
  switch (code) {
    case 'sign_in_required':
    case 'empty_bag':
    case 'out_of_stock':
    case 'not_sold_in_market':
    case 'market_unavailable':
      return new OrderError(code, message, sku);
    case 'invalid_quantity':
    case 'unknown_item':
      return new OrderError('invalid', message, sku);
    default:
      return new OrderError('unknown', message);
  }
}

/** Where along the timeline an order is (index into TRACKING_STEPS), -1 if off-path. */
export function trackingIndex(status: OrderStatus): number {
  if (status === 'packed') return TRACKING_STEPS.indexOf('confirmed');
  return TRACKING_STEPS.indexOf(status);
}

type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const num = (value: unknown) => (typeof value === 'number' ? value : Number(value));

export function createOrdersClient(config: SupabaseConfig, fetchImpl: FetchLike = fetch as unknown as FetchLike) {
  const rest = `${config.url}/rest/v1`;
  const headers = (accessToken: string) => ({
    apikey: config.anonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  async function get<T>(path: string, accessToken: string): Promise<T> {
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(`${rest}/${path}`, { headers: headers(accessToken) });
    } catch (error) {
      throw new OrderError('network', (error as Error).message);
    }
    if (!response.ok) throw new OrderError('unknown', `Request failed (${response.status})`);
    return (await response.json()) as T;
  }

  return {
    async placeOrder(
      accessToken: string,
      market: MarketCode,
      items: { sku: string; quantity: number }[],
      address: ShippingAddress,
    ): Promise<{ id: string; number: string; total: number; currency: string }> {
      let response: Awaited<ReturnType<FetchLike>>;
      try {
        response = await fetchImpl(`${rest}/rpc/place_order`, {
          method: 'POST',
          headers: headers(accessToken),
          body: JSON.stringify({ p_market: market, p_items: items, p_address: address }),
        });
      } catch (error) {
        throw new OrderError('network', (error as Error).message);
      }
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown> | Record<string, unknown>[];
      if (!response.ok) {
        const message = String((body as Record<string, unknown>).message ?? `Request failed (${response.status})`);
        throw classifyOrderError(message);
      }
      const row = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
      return { id: String(row.order_id), number: String(row.order_number), total: num(row.order_total), currency: String(row.order_currency) };
    },

    async listOrders(accessToken: string): Promise<OrderSummary[]> {
      const rows = await get<Record<string, unknown>[]>(
        'orders?select=id,number,market,currency,status,total,created_at&order=created_at.desc',
        accessToken,
      );
      return rows.map((row) => ({
        id: String(row.id),
        number: String(row.number),
        market: row.market as MarketCode,
        currency: String(row.currency),
        status: row.status as OrderStatus,
        total: num(row.total),
        createdAt: String(row.created_at),
      }));
    },

    async getOrder(accessToken: string, id: string): Promise<OrderDetail | null> {
      const rows = await get<Record<string, unknown>[]>(
        `orders?id=eq.${encodeURIComponent(id)}&select=*,order_items(*),order_events(status,note,created_at)`,
        accessToken,
      );
      const row = rows[0];
      if (!row) return null;
      const items = ((row.order_items as Record<string, unknown>[]) ?? []).map((item) => ({
        sku: String(item.sku),
        productId: String(item.product_id),
        nameAr: String(item.name_ar),
        nameEn: String(item.name_en),
        shadeNameAr: (item.shade_name_ar as string) ?? null,
        shadeNameEn: (item.shade_name_en as string) ?? null,
        image: (item.image as string) ?? null,
        unitPrice: num(item.unit_price),
        quantity: num(item.quantity),
        lineTotal: num(item.line_total),
      }));
      const events = ((row.order_events as Record<string, unknown>[]) ?? [])
        .map((event) => ({ status: event.status as OrderStatus, note: (event.note as string) ?? null, createdAt: String(event.created_at) }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return {
        id: String(row.id),
        number: String(row.number),
        market: row.market as MarketCode,
        currency: String(row.currency),
        status: row.status as OrderStatus,
        total: num(row.total),
        createdAt: String(row.created_at),
        paymentMethod: 'cod',
        paymentStatus: row.payment_status as OrderDetail['paymentStatus'],
        customerName: String(row.customer_name),
        phone: String(row.phone),
        city: String(row.city),
        area: (row.area as string) ?? null,
        addressLine: String(row.address_line),
        notes: (row.notes as string) ?? null,
        subtotal: num(row.subtotal),
        shippingFee: num(row.shipping_fee),
        carrier: (row.carrier as string) ?? null,
        trackingNumber: (row.tracking_number as string) ?? null,
        trackingUrl: (row.tracking_url as string) ?? null,
        items,
        events,
      };
    },
  };
}
