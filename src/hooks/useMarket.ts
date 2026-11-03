import { markets, type Market, type MarketCode } from '@/lib/markets';
import { usePreferencesStore } from '@/stores/preferences';

/** The shopper's current market (country, currency, shipping). */
export function useMarket(): Market & { setMarket: (market: MarketCode) => void } {
  const code = usePreferencesStore((state) => state.market);
  const setMarket = usePreferencesStore((state) => state.setMarket);
  return { ...markets[code] ?? markets.EG, setMarket };
}
