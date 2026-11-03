/**
 * Countries VEIVETY sells in. Each market has its own currency, prices,
 * shipping rate and delivery window. Prices live per variant in the catalog
 * (`prices: { EG: 100, AE: 100, ... }`); shipping rates live in Supabase
 * (`shipping_rates`) with the defaults below as an offline fallback.
 */

export const MARKET_CODES = ['EG', 'AE', 'SA', 'IE'] as const;
export type MarketCode = (typeof MARKET_CODES)[number];

export type ShippingRate = {
  market: MarketCode;
  fee: number;
  /** Subtotal at or above which shipping is free; null = never free. */
  freeOver: number | null;
  etaMinDays: number;
  etaMaxDays: number;
};

export type Market = {
  code: MarketCode;
  nameAr: string;
  nameEn: string;
  flag: string;
  currency: 'EGP' | 'AED' | 'SAR' | 'EUR';
  symbolAr: string;
  symbolEn: string;
  /** Currency symbol goes before the number (e.g. €12). */
  symbolBefore: boolean;
  decimals: number;
  dialCode: string;
  /** Local phone digits after the country code, as a loose check. */
  phonePattern: RegExp;
  shipping: ShippingRate;
};

export const markets: Record<MarketCode, Market> = {
  EG: {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    flag: '🇪🇬',
    currency: 'EGP',
    symbolAr: 'ج.م',
    symbolEn: 'EGP',
    symbolBefore: false,
    decimals: 0,
    dialCode: '+20',
    phonePattern: /^1[0125]\d{8}$/,
    shipping: { market: 'EG', fee: 60, freeOver: 1000, etaMinDays: 2, etaMaxDays: 4 },
  },
  AE: {
    code: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    symbolAr: 'د.إ',
    symbolEn: 'AED',
    symbolBefore: false,
    decimals: 0,
    dialCode: '+971',
    phonePattern: /^5\d{8}$/,
    shipping: { market: 'AE', fee: 25, freeOver: 300, etaMinDays: 1, etaMaxDays: 3 },
  },
  SA: {
    code: 'SA',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    symbolAr: 'ر.س',
    symbolEn: 'SAR',
    symbolBefore: false,
    decimals: 0,
    dialCode: '+966',
    phonePattern: /^5\d{8}$/,
    shipping: { market: 'SA', fee: 25, freeOver: 300, etaMinDays: 2, etaMaxDays: 5 },
  },
  IE: {
    code: 'IE',
    nameAr: 'أيرلندا',
    nameEn: 'Ireland',
    flag: '🇮🇪',
    currency: 'EUR',
    symbolAr: '€',
    symbolEn: '€',
    symbolBefore: true,
    decimals: 2,
    dialCode: '+353',
    phonePattern: /^8\d{8}$/,
    shipping: { market: 'IE', fee: 5, freeOver: 60, etaMinDays: 3, etaMaxDays: 6 },
  },
};

export const DEFAULT_MARKET: MarketCode = 'EG';

export function isMarketCode(value: unknown): value is MarketCode {
  return typeof value === 'string' && (MARKET_CODES as readonly string[]).includes(value);
}

/** Device region (expo-localization `regionCode`) → market, else Egypt. */
export function marketFromRegion(region: string | null | undefined): MarketCode {
  const upper = region?.toUpperCase();
  return isMarketCode(upper) ? upper : DEFAULT_MARKET;
}

export function formatPrice(value: number, market: MarketCode, language: 'ar' | 'en' = 'ar') {
  const m = markets[market];
  const showDecimals = m.decimals > 0 && !Number.isInteger(value);
  const number = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
    numberingSystem: 'latn',
    minimumFractionDigits: showDecimals ? m.decimals : 0,
    maximumFractionDigits: showDecimals ? m.decimals : 0,
  }).format(value);
  const symbol = language === 'ar' ? m.symbolAr : m.symbolEn;
  return m.symbolBefore ? `${symbol}${number}` : `${number} ${symbol}`;
}

/** Shipping for a subtotal; free at or above the market's threshold. */
export function shippingFee(subtotal: number, rate: ShippingRate) {
  if (subtotal <= 0) return 0;
  if (rate.freeOver !== null && subtotal >= rate.freeOver) return 0;
  return rate.fee;
}

/** Normalises a local phone number for a market; returns E.164 or null. */
export function normalizePhone(input: string, market: MarketCode): string | null {
  const m = markets[market];
  let digits = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\d+]/g, '');
  const dial = m.dialCode.replace('+', '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith(dial)) digits = digits.slice(dial.length);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return m.phonePattern.test(digits) ? `${m.dialCode}${digits}` : null;
}
