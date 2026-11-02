export type SoldAs = 'piece' | 'box' | 'set' | 'bundle';

export type Category = {
  id: string;
  parentId: string | null;
  nameAr: string;
  nameEn: string;
  image: string | null;
  sortOrder: number;
};

export type ProductVariant = {
  sku: string;
  barcode: string | null;
  shadeNameAr: string | null;
  shadeNameEn: string | null;
  shadeHex: string | null;
  size: string | null;
  images: string[];
  priceEgp: number;
  compareAtPriceEgp: number | null;
  available: number;
  lowStockThreshold: number;
};

export type Product = {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  soldAs: SoldAs;
  images: string[];
  tags: string[];
  isActive: boolean;
  variants: ProductVariant[];
};

export type HeroSlide = {
  id: string;
  eyebrowAr: string | null;
  eyebrowEn: string | null;
  titleAr: string;
  titleEn: string;
  bodyAr: string | null;
  bodyEn: string | null;
  image: string | null;
  productId: string | null;
  deepLink: string | null;
};

export type Banner = {
  id: string;
  placement: 'full' | 'two-up';
  titleAr: string;
  titleEn: string;
  image: string | null;
  deepLink: string | null;
  sortOrder: number;
};

export type CatalogSnapshot = {
  status: 'empty' | 'ready';
  categories: Category[];
  products: Product[];
  heroSlides: HeroSlide[];
  banners: Banner[];
  updatedAt: string | null;
};

/**
 * Phase 1 does not have a published catalog. The snapshot is deliberately
 * empty instead of using invented products. The data layer will be replaced
 * by Supabase queries after the catalog import lands.
 */
export const emptyCatalog: CatalogSnapshot = {
  status: 'empty',
  categories: [],
  products: [],
  heroSlides: [],
  banners: [],
  updatedAt: null,
};

export function getProductBySlug(catalog: CatalogSnapshot, id: string) {
  return catalog.products.find((product) => product.id === id) ?? null;
}
