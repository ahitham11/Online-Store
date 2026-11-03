import { useQuery } from '@tanstack/react-query';

import { readSupabaseConfig } from '@/lib/env';
import { markets, type MarketCode, type ShippingRate } from '@/lib/markets';

const config = readSupabaseConfig();

type Row = { market: string; fee: number | string; free_over: number | string | null; eta_min_days: number; eta_max_days: number };

async function fetchRates(): Promise<Partial<Record<MarketCode, ShippingRate>>> {
  if (!config) return {};
  const response = await fetch(`${config.url}/rest/v1/shipping_rates?select=*&is_active=eq.true`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
  });
  if (!response.ok) return {};
  const rows = (await response.json()) as Row[];
  const out: Partial<Record<MarketCode, ShippingRate>> = {};
  for (const row of rows) {
    if (!(row.market in markets)) continue;
    out[row.market as MarketCode] = {
      market: row.market as MarketCode,
      fee: Number(row.fee),
      freeOver: row.free_over === null ? null : Number(row.free_over),
      etaMinDays: row.eta_min_days,
      etaMaxDays: row.eta_max_days,
    };
  }
  return out;
}

/** Shipping rate for a market: the store's live rate, or the built-in default. */
export function useShippingRate(market: MarketCode): ShippingRate {
  const query = useQuery({ queryKey: ['shipping-rates'], queryFn: fetchRates, staleTime: 10 * 60_000 });
  return query.data?.[market] ?? markets[market].shipping;
}
