export function formatEgp(value: number, language: 'ar' | 'en' = 'ar', decimals = false) {
  const formatter = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    numberingSystem: 'latn',
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: 0,
  });
  return `${formatter.format(value)} ${language === 'ar' ? 'ج.م' : 'EGP'}`;
}

export function formatQuantity(value: number, language: 'ar' | 'en' = 'ar') {
  const formatter = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    numberingSystem: 'latn',
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unavailable';

export function stockState(available: number, lowStockThreshold: number): StockState {
  if (!Number.isFinite(available) || available <= 0) return 'out_of_stock';
  if (available <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export function availableStock(onHand: number, reserved: number) {
  return Math.max(0, onHand - reserved);
}

/**
 * Price in minor units is never guessed. The importer validates the catalog
 * price before this helper is called.
 */
export function lineTotal(unitPriceEgp: number, quantity: number) {
  return Math.round(unitPriceEgp * quantity * 100) / 100;
}
