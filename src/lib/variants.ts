import type { Product, ProductVariant } from '../data/catalog.ts';
import type { BagLine } from '../stores/bag.ts';
import type { MarketCode } from './markets.ts';

/** Price in a market, or null when the shade is not sold there. */
export function priceFor(variant: ProductVariant | null | undefined, market: MarketCode): number | null {
  const price = variant?.prices[market];
  return typeof price === 'number' && price > 0 ? price : null;
}

export function compareAtFor(variant: ProductVariant | null | undefined, market: MarketCode): number | null {
  const price = priceFor(variant, market);
  const compare = variant?.compareAt[market];
  return price !== null && typeof compare === 'number' && compare > price ? compare : null;
}

/** Can be bought in this market: priced there and in stock. */
export function isBuyable(variant: ProductVariant | null | undefined, market: MarketCode) {
  return !!variant && variant.available > 0 && priceFor(variant, market) !== null;
}

/** First variant that can be bought in the market, otherwise the first one listed. */
export function defaultVariant(product: Product, market?: MarketCode): ProductVariant | null {
  const buyable = market
    ? product.variants.find((variant) => isBuyable(variant, market))
    : product.variants.find((variant) => variant.available > 0);
  return buyable ?? product.variants[0] ?? null;
}

export function findVariant(product: Product, sku: string | null | undefined, market?: MarketCode): ProductVariant | null {
  if (!sku) return defaultVariant(product, market);
  return product.variants.find((variant) => variant.sku === sku) ?? defaultVariant(product, market);
}

/** Variant photos first (they show the chosen shade), then product photos. */
export function galleryFor(product: Product, variant: ProductVariant | null): string[] {
  const images = [...(variant?.images ?? []), ...product.images];
  return images.filter((uri, index) => images.indexOf(uri) === index);
}

export function hasShades(product: Product) {
  return product.variants.some((variant) => variant.shadeHex || variant.shadeNameAr || variant.shadeNameEn);
}

export function hasSizes(product: Product) {
  return new Set(product.variants.map((variant) => variant.size).filter(Boolean)).size > 1;
}

/** Quantity is clamped to stock so the bag never promises what is not there. */
export function clampQuantity(quantity: number, variant: ProductVariant | null) {
  if (!variant || variant.available <= 0) return 0;
  return Math.max(1, Math.min(Math.floor(quantity), variant.available, 99));
}

export function savingsFor(variant: ProductVariant | null, market: MarketCode) {
  const price = priceFor(variant, market);
  const compare = compareAtFor(variant, market);
  if (price === null || compare === null) return 0;
  return Math.round((compare - price) * 100) / 100;
}

/** Lowest price across a product's variants in a market (for "from" labels). */
export function fromPrice(product: Product, market: MarketCode): number | null {
  const prices = product.variants.map((variant) => priceFor(variant, market)).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

export function bagLineFor(product: Product, variant: ProductVariant, quantity: number, market: MarketCode): BagLine {
  return {
    key: variant.sku,
    productId: product.id,
    sku: variant.sku,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    shadeNameAr: variant.shadeNameAr,
    shadeNameEn: variant.shadeNameEn,
    shadeHex: variant.shadeHex,
    size: variant.size,
    soldAs: product.soldAs,
    unitPrice: priceFor(variant, market) ?? 0,
    market,
    quantity,
    imageUri: galleryFor(product, variant)[0] ?? null,
  };
}
