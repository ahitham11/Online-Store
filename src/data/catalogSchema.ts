import { z } from 'zod';

import type { CatalogSnapshot } from './catalog.ts';
import { MARKET_CODES } from '../lib/markets.ts';

/**
 * Source-of-truth format for `catalog/catalog.json`.
 *
 * Every value here comes from the house. Nothing is defaulted into existence:
 * a missing price, a duplicate SKU or a product pointing at an unknown
 * category fails validation instead of silently producing merchandise.
 */

const id = z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9-_]*$/, {
  message: 'ids use lowercase letters, digits, "-" and "_"',
});
const text = z.string().trim().min(1);
const optionalText = z.string().trim().min(1).nullish().transform((value) => value ?? null);
const imageUrl = z.string().trim().url();
const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, { message: 'shadeHex must look like #A1B2C3' })
  .nullish()
  .transform((value) => value ?? null);
const money = z.number().finite().positive().max(1_000_000);
const marketPrices = z
  .object(Object.fromEntries(MARKET_CODES.map((code) => [code, money.optional()])) as Record<(typeof MARKET_CODES)[number], z.ZodOptional<typeof money>>)
  .strict();

export const categoryInputSchema = z.object({
  id,
  parentId: id.nullish().transform((value) => value ?? null),
  nameAr: text,
  nameEn: text,
  image: imageUrl.nullish().transform((value) => value ?? null),
  sortOrder: z.number().int().default(0),
});

export const variantInputSchema = z
  .object({
    sku: z.string().trim().min(1).max(64),
    barcode: optionalText,
    shadeNameAr: optionalText,
    shadeNameEn: optionalText,
    shadeHex: hex,
    size: optionalText,
    images: z.array(imageUrl).default([]),
    /** Price per market, e.g. { "EG": 100, "AE": 100 }. At least one market is required. */
    prices: marketPrices,
    compareAt: marketPrices.default({}),
    available: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).default(3),
  })
  .refine((variant) => Object.values(variant.prices).some((price) => typeof price === 'number'), {
    message: 'a variant needs a price in at least one market',
    path: ['prices'],
  })
  .refine(
    (variant) =>
      Object.entries(variant.compareAt).every(([market, compare]) => {
        const price = variant.prices[market as keyof typeof variant.prices];
        return typeof compare !== 'number' || (typeof price === 'number' && compare > price);
      }),
    { message: 'compareAt must be higher than the price in the same market', path: ['compareAt'] },
  );

export const productInputSchema = z.object({
  id,
  categoryId: id,
  nameAr: text,
  nameEn: text,
  descriptionAr: z.string().trim().default(''),
  descriptionEn: z.string().trim().default(''),
  soldAs: z.enum(['piece', 'box', 'set', 'bundle']).default('piece'),
  images: z.array(imageUrl).default([]),
  tags: z.array(text).default([]),
  isActive: z.boolean().default(true),
  variants: z.array(variantInputSchema).min(1, { message: 'a product needs at least one variant' }),
});

export const heroSlideInputSchema = z.object({
  id,
  eyebrowAr: optionalText,
  eyebrowEn: optionalText,
  titleAr: text,
  titleEn: text,
  bodyAr: optionalText,
  bodyEn: optionalText,
  image: imageUrl.nullish().transform((value) => value ?? null),
  productId: id.nullish().transform((value) => value ?? null),
  deepLink: optionalText,
});

export const bannerInputSchema = z.object({
  id,
  placement: z.enum(['full', 'two-up']),
  titleAr: text,
  titleEn: text,
  image: imageUrl.nullish().transform((value) => value ?? null),
  deepLink: optionalText,
  sortOrder: z.number().int().default(0),
});

export const catalogFileSchema = z
  .object({
    updatedAt: z.iso.datetime({ offset: true }).nullish().transform((value) => value ?? null),
    categories: z.array(categoryInputSchema).default([]),
    products: z.array(productInputSchema).default([]),
    heroSlides: z.array(heroSlideInputSchema).default([]),
    banners: z.array(bannerInputSchema).default([]),
  })
  .superRefine((catalog, ctx) => {
    const categoryIds = new Set<string>();
    catalog.categories.forEach((category, index) => {
      if (categoryIds.has(category.id)) {
        ctx.addIssue({ code: 'custom', path: ['categories', index, 'id'], message: `duplicate category id "${category.id}"` });
      }
      categoryIds.add(category.id);
    });
    catalog.categories.forEach((category, index) => {
      if (category.parentId && !categoryIds.has(category.parentId)) {
        ctx.addIssue({ code: 'custom', path: ['categories', index, 'parentId'], message: `unknown parent category "${category.parentId}"` });
      }
      if (category.parentId === category.id) {
        ctx.addIssue({ code: 'custom', path: ['categories', index, 'parentId'], message: 'a category cannot be its own parent' });
      }
    });

    const productIds = new Set<string>();
    const skus = new Set<string>();
    catalog.products.forEach((product, index) => {
      if (productIds.has(product.id)) {
        ctx.addIssue({ code: 'custom', path: ['products', index, 'id'], message: `duplicate product id "${product.id}"` });
      }
      productIds.add(product.id);
      if (!categoryIds.has(product.categoryId)) {
        ctx.addIssue({ code: 'custom', path: ['products', index, 'categoryId'], message: `unknown category "${product.categoryId}"` });
      }
      product.variants.forEach((variant, variantIndex) => {
        if (skus.has(variant.sku)) {
          ctx.addIssue({ code: 'custom', path: ['products', index, 'variants', variantIndex, 'sku'], message: `duplicate sku "${variant.sku}"` });
        }
        skus.add(variant.sku);
      });
    });

    catalog.heroSlides.forEach((slide, index) => {
      if (slide.productId && !productIds.has(slide.productId)) {
        ctx.addIssue({ code: 'custom', path: ['heroSlides', index, 'productId'], message: `unknown product "${slide.productId}"` });
      }
    });
  });

export type CatalogFile = z.infer<typeof catalogFileSchema>;

export type CatalogValidation =
  | { ok: true; catalog: CatalogSnapshot }
  | { ok: false; errors: string[] };

/** Validates raw catalog JSON and returns an app-ready snapshot. */
export function parseCatalog(raw: unknown): CatalogValidation {
  const result = catalogFileSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    };
  }
  return { ok: true, catalog: toSnapshot(result.data) };
}

export function toSnapshot(file: CatalogFile): CatalogSnapshot {
  const products = file.products.filter((product) => product.isActive);
  const categories = [...file.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const banners = [...file.banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasContent = products.length > 0 || categories.length > 0;
  return {
    status: hasContent ? 'ready' : 'empty',
    categories,
    products,
    heroSlides: file.heroSlides,
    banners,
    updatedAt: hasContent ? file.updatedAt : null,
  };
}
