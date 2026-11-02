import type { Product, ProductVariant } from '../data/catalog.ts';
import type { BagLine } from '../stores/bag.ts';

/** First variant that can be bought, otherwise the first one listed. */
export function defaultVariant(product: Product): ProductVariant | null {
  return product.variants.find((variant) => variant.available > 0) ?? product.variants[0] ?? null;
}

export function findVariant(product: Product, sku: string | null | undefined): ProductVariant | null {
  if (!sku) return defaultVariant(product);
  return product.variants.find((variant) => variant.sku === sku) ?? defaultVariant(product);
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

export function savingsEgp(variant: ProductVariant | null) {
  if (!variant?.compareAtPriceEgp || variant.compareAtPriceEgp <= variant.priceEgp) return 0;
  return Math.round((variant.compareAtPriceEgp - variant.priceEgp) * 100) / 100;
}

export function bagLineFor(product: Product, variant: ProductVariant, quantity = 1): BagLine {
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
    unitPriceEgp: variant.priceEgp,
    quantity,
    imageUri: galleryFor(product, variant)[0] ?? null,
  };
}
