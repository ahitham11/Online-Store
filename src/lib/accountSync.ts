import type { CatalogSnapshot } from '../data/catalog.ts';
import type { BagLine } from '../stores/bag.ts';
import type { SupabaseConfig } from './env.ts';
import type { MarketCode } from './markets.ts';
import { bagLineFor, priceFor } from './variants.ts';

/**
 * Keeps a signed-in shopper's bag and wishlist in Supabase (`bag_items`,
 * `wishlist_items`, protected by RLS) so they follow her across devices.
 *
 * The server stores only SKUs, product ids and quantities. Names, prices and
 * images are always rebuilt from the published catalog, so a stale price can
 * never come back from the server.
 */

export type RemoteBagRow = { sku: string; quantity: number };
export type RemoteWishlistRow = { product_id: string };

const MAX_QUANTITY = 99;

export function findVariantBySku(catalog: CatalogSnapshot, sku: string) {
  for (const product of catalog.products) {
    const variant = product.variants.find((item) => item.sku === sku);
    if (variant) return { product, variant };
  }
  return null;
}

/** Union of both lists, local order first. Unknown products are dropped. */
export function mergeWishlist(local: string[], remote: string[], catalog: CatalogSnapshot): string[] {
  const known = new Set(catalog.products.map((product) => product.id));
  const merged: string[] = [];
  for (const id of [...local, ...remote]) {
    if (known.has(id) && !merged.includes(id)) merged.push(id);
  }
  return merged;
}

/**
 * Same SKU on both sides keeps the larger quantity (never adds them, so a
 * re-sync cannot double a bag). Prices are refreshed from the catalog.
 */
export function mergeBag(
  local: BagLine[],
  remote: RemoteBagRow[],
  catalog: CatalogSnapshot,
  market: MarketCode = 'EG',
): BagLine[] {
  const quantities = new Map<string, number>();
  const order: string[] = [];
  for (const row of [...local.map((line) => ({ sku: line.sku, quantity: line.quantity })), ...remote]) {
    if (!quantities.has(row.sku)) order.push(row.sku);
    quantities.set(row.sku, Math.max(quantities.get(row.sku) ?? 0, row.quantity));
  }
  const lines: BagLine[] = [];
  for (const sku of order) {
    const match = findVariantBySku(catalog, sku);
    if (!match || priceFor(match.variant, market) === null) continue;
    const quantity = Math.min(Math.max(1, Math.floor(quantities.get(sku) ?? 1)), MAX_QUANTITY);
    lines.push(bagLineFor(match.product, match.variant, quantity, market));
  }
  return lines;
}

type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

function inList(values: string[]) {
  return encodeURIComponent(`(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`);
}

export function createSyncClient(config: SupabaseConfig, fetchImpl: FetchLike = fetch as unknown as FetchLike) {
  const rest = `${config.url}/rest/v1`;

  async function request(path: string, accessToken: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
    const headers: Record<string, string> = {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    if (init.prefer) headers.Prefer = init.prefer;
    const response = await fetchImpl(`${rest}/${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) throw new Error(`Sync ${init.method ?? 'GET'} ${path.split('?')[0]} failed (${response.status})`);
    return init.method && init.method !== 'GET' ? null : response.json();
  }

  return {
    async pull(accessToken: string) {
      const [bag, wishlist] = await Promise.all([
        request('bag_items?select=sku,quantity', accessToken) as Promise<RemoteBagRow[]>,
        request('wishlist_items?select=product_id', accessToken) as Promise<RemoteWishlistRow[]>,
      ]);
      return { bag, wishlist: wishlist.map((row) => row.product_id) };
    },

    /** Makes the server bag match `lines` exactly. */
    async pushBag(accessToken: string, userId: string, lines: Pick<BagLine, 'sku' | 'quantity'>[]) {
      if (lines.length > 0) {
        await request('bag_items?on_conflict=user_id,sku', accessToken, {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=minimal',
          body: lines.map((line) => ({
            user_id: userId,
            sku: line.sku,
            quantity: Math.min(Math.max(1, line.quantity), MAX_QUANTITY),
          })),
        });
      }
      const keep = lines.length > 0 ? `&sku=not.in.${inList(lines.map((line) => line.sku))}` : '';
      await request(`bag_items?user_id=eq.${userId}${keep}`, accessToken, { method: 'DELETE', prefer: 'return=minimal' });
    },

    /** Makes the server wishlist match `productIds` exactly. */
    async pushWishlist(accessToken: string, userId: string, productIds: string[]) {
      if (productIds.length > 0) {
        await request('wishlist_items?on_conflict=user_id,product_id', accessToken, {
          method: 'POST',
          prefer: 'resolution=ignore-duplicates,return=minimal',
          body: productIds.map((productId) => ({ user_id: userId, product_id: productId })),
        });
      }
      const keep = productIds.length > 0 ? `&product_id=not.in.${inList(productIds)}` : '';
      await request(`wishlist_items?user_id=eq.${userId}${keep}`, accessToken, { method: 'DELETE', prefer: 'return=minimal' });
    },
  };
}

/**
 * Re-prices bag lines for a market from the catalog. Lines whose shade is not
 * sold in that market are dropped. Returns the same array when nothing changed.
 */
export function repriceBag(lines: BagLine[], catalog: CatalogSnapshot, market: MarketCode): BagLine[] {
  let changed = false;
  const next: BagLine[] = [];
  for (const line of lines) {
    const match = findVariantBySku(catalog, line.sku);
    const price = match ? priceFor(match.variant, market) : null;
    if (!match || price === null) {
      changed = true;
      continue;
    }
    if (line.unitPrice !== price || line.market !== market) {
      changed = true;
      next.push({ ...line, unitPrice: price, market });
    } else {
      next.push(line);
    }
  }
  return changed ? next : lines;
}
