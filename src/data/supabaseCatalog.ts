import type { CatalogSnapshot } from './catalog.ts';
import { parseCatalog } from './catalogSchema.ts';
import type { SupabaseConfig } from '../lib/env.ts';

/**
 * Reads the published catalog from Supabase through PostgREST.
 *
 * Plain `fetch` keeps the bundle free of extra native dependencies. The tables
 * and Row Level Security policies live in `supabase/migrations`. Anonymous
 * clients can only read active catalog rows.
 */

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  name_ar: string;
  name_en: string;
  image: string | null;
  sort_order: number;
};

export type VariantRow = {
  sku: string;
  product_id: string;
  barcode: string | null;
  shade_name_ar: string | null;
  shade_name_en: string | null;
  shade_hex: string | null;
  size: string | null;
  images: string[] | null;
  prices: Record<string, number | string> | null;
  compare_at: Record<string, number | string> | null;
  available: number;
  low_stock_threshold: number;
  sort_order: number;
};

export type ProductRow = {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  sold_as: 'piece' | 'box' | 'set' | 'bundle';
  images: string[] | null;
  tags: string[] | null;
  is_active: boolean;
  updated_at: string | null;
  product_variants: VariantRow[] | null;
};

export type HeroSlideRow = {
  id: string;
  eyebrow_ar: string | null;
  eyebrow_en: string | null;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  image: string | null;
  product_id: string | null;
  deep_link: string | null;
};

export type BannerRow = {
  id: string;
  placement: 'full' | 'two-up';
  title_ar: string;
  title_en: string;
  image: string | null;
  deep_link: string | null;
  sort_order: number;
};

export type CatalogRows = {
  categories: CategoryRow[];
  products: ProductRow[];
  heroSlides: HeroSlideRow[];
  banners: BannerRow[];
};

/** jsonb numbers may arrive as strings; prices are never guessed. */
function toPrices(value: Record<string, number | string> | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [market, price] of Object.entries(value ?? {})) out[market] = typeof price === 'number' ? price : Number(price);
  return out;
}

export function rowsToSnapshot(rows: CatalogRows): CatalogSnapshot {
  const updatedAt =
    rows.products
      .map((product) => product.updated_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  const result = parseCatalog({
    updatedAt,
    categories: rows.categories.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      image: row.image,
      sortOrder: row.sort_order,
    })),
    products: rows.products.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      descriptionAr: row.description_ar ?? '',
      descriptionEn: row.description_en ?? '',
      soldAs: row.sold_as,
      images: row.images ?? [],
      tags: row.tags ?? [],
      isActive: row.is_active,
      variants: [...(row.product_variants ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((variant) => ({
          sku: variant.sku,
          barcode: variant.barcode,
          shadeNameAr: variant.shade_name_ar,
          shadeNameEn: variant.shade_name_en,
          shadeHex: variant.shade_hex,
          size: variant.size,
          images: variant.images ?? [],
          prices: toPrices(variant.prices),
          compareAt: toPrices(variant.compare_at),
          available: variant.available,
          lowStockThreshold: variant.low_stock_threshold,
        })),
    })),
    heroSlides: rows.heroSlides.map((row) => ({
      id: row.id,
      eyebrowAr: row.eyebrow_ar,
      eyebrowEn: row.eyebrow_en,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      bodyAr: row.body_ar,
      bodyEn: row.body_en,
      image: row.image,
      productId: row.product_id,
      deepLink: row.deep_link,
    })),
    banners: rows.banners.map((row) => ({
      id: row.id,
      placement: row.placement,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      image: row.image,
      deepLink: row.deep_link,
      sortOrder: row.sort_order,
    })),
  });

  if (!result.ok) {
    throw new CatalogIntegrityError(result.errors);
  }
  return result.catalog;
}

export class CatalogIntegrityError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Published catalog failed validation: ${issues.slice(0, 3).join('; ')}`);
    this.name = 'CatalogIntegrityError';
    this.issues = issues;
  }
}

type FetchLike = (input: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export async function fetchSupabaseCatalog(
  config: SupabaseConfig,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  signal?: AbortSignal,
): Promise<CatalogSnapshot> {
  const headers = {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    Accept: 'application/json',
  };

  async function get<T>(path: string): Promise<T> {
    const response = await fetchImpl(`${config.url}/rest/v1/${path}`, { headers, signal });
    if (!response.ok) {
      throw new Error(`Catalog request failed (${response.status}) for ${path.split('?')[0]}`);
    }
    return (await response.json()) as T;
  }

  const [categories, products, heroSlides, banners] = await Promise.all([
    get<CategoryRow[]>('categories?select=*&order=sort_order.asc'),
    get<ProductRow[]>('products?select=*,product_variants(*)&is_active=eq.true&order=created_at.desc'),
    get<HeroSlideRow[]>('hero_slides?select=*&is_active=eq.true&order=sort_order.asc'),
    get<BannerRow[]>('banners?select=*&is_active=eq.true&order=sort_order.asc'),
  ]);

  return rowsToSnapshot({ categories, products, heroSlides, banners });
}
