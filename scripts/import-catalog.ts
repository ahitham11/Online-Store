/**
 * Validate `catalog/catalog.json` and publish it to Supabase.
 *
 *   npm run catalog:check                 # validate only, needs no secrets
 *   npm run catalog:import                # validate + upsert (reads .env)
 *   npm run catalog:import -- --deactivate-missing
 *
 * Publishing uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. Run it only on
 * a trusted machine. It is never bundled into the app because it is not
 * prefixed with EXPO_PUBLIC_.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { catalogFileSchema, type CatalogFile } from '../src/data/catalogSchema.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const deactivateMissing = args.includes('--deactivate-missing');
const fileArg = args.find((arg) => !arg.startsWith('--'));
const file = resolve(fileArg ?? 'catalog/catalog.json');

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  fail(`Could not read ${file}: ${(error as Error).message}`);
}

const parsed = catalogFileSchema.safeParse(raw);
if (!parsed.success) {
  console.error(`Catalog has ${parsed.error.issues.length} problem(s):`);
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  fail('Nothing was published.');
}

const catalog: CatalogFile = parsed.data;
const variantCount = catalog.products.reduce((total, product) => total + product.variants.length, 0);
console.log(
  `✔ ${file} is valid: ${catalog.categories.length} categories, ${catalog.products.length} products, ` +
    `${variantCount} variants, ${catalog.heroSlides.length} hero slides, ${catalog.banners.length} banners.`,
);

if (dryRun) process.exit(0);

const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!url || !serviceKey) {
  fail('Set SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env first.');
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

async function upsert(table: string, conflict: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  for (let start = 0; start < rows.length; start += 500) {
    const chunk = rows.slice(start, start + 500);
    const response = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(chunk),
    });
    if (!response.ok) fail(`${table}: ${response.status} ${await response.text()}`);
  }
  console.log(`  ↑ ${table}: ${rows.length}`);
}

/** Parents must exist before children because of the self-reference. */
function orderCategories(categories: CatalogFile['categories']) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const ordered: CatalogFile['categories'] = [];
  const seen = new Set<string>();
  const visit = (id: string, trail: Set<string>) => {
    if (seen.has(id)) return;
    if (trail.has(id)) fail(`Category cycle detected at "${id}".`);
    const category = byId.get(id)!;
    trail.add(id);
    if (category.parentId) visit(category.parentId, trail);
    seen.add(id);
    ordered.push(category);
  };
  categories.forEach((category) => visit(category.id, new Set()));
  return ordered;
}

await upsert(
  'categories',
  'id',
  orderCategories(catalog.categories).map((category) => ({
    id: category.id,
    parent_id: category.parentId,
    name_ar: category.nameAr,
    name_en: category.nameEn,
    image: category.image,
    sort_order: category.sortOrder,
  })),
);

await upsert(
  'products',
  'id',
  catalog.products.map((product) => ({
    id: product.id,
    category_id: product.categoryId,
    name_ar: product.nameAr,
    name_en: product.nameEn,
    description_ar: product.descriptionAr,
    description_en: product.descriptionEn,
    sold_as: product.soldAs,
    images: product.images,
    tags: product.tags,
    is_active: product.isActive,
  })),
);

await upsert(
  'product_variants',
  'sku',
  catalog.products.flatMap((product) =>
    product.variants.map((variant, index) => ({
      sku: variant.sku,
      product_id: product.id,
      barcode: variant.barcode,
      shade_name_ar: variant.shadeNameAr,
      shade_name_en: variant.shadeNameEn,
      shade_hex: variant.shadeHex,
      size: variant.size,
      images: variant.images,
      prices: variant.prices,
      compare_at: variant.compareAt,
      available: variant.available,
      low_stock_threshold: variant.lowStockThreshold,
      sort_order: index,
    })),
  ),
);

await upsert(
  'hero_slides',
  'id',
  catalog.heroSlides.map((slide, index) => ({
    id: slide.id,
    eyebrow_ar: slide.eyebrowAr,
    eyebrow_en: slide.eyebrowEn,
    title_ar: slide.titleAr,
    title_en: slide.titleEn,
    body_ar: slide.bodyAr,
    body_en: slide.bodyEn,
    image: slide.image,
    product_id: slide.productId,
    deep_link: slide.deepLink,
    sort_order: index,
    is_active: true,
  })),
);

await upsert(
  'banners',
  'id',
  catalog.banners.map((banner) => ({
    id: banner.id,
    placement: banner.placement,
    title_ar: banner.titleAr,
    title_en: banner.titleEn,
    image: banner.image,
    deep_link: banner.deepLink,
    sort_order: banner.sortOrder,
    is_active: true,
  })),
);

if (deactivateMissing && catalog.products.length > 0) {
  const keep = catalog.products.map((product) => `"${product.id}"`).join(',');
  const response = await fetch(`${url}/rest/v1/products?id=not.in.(${encodeURIComponent(keep)})`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ is_active: false }),
  });
  if (!response.ok) fail(`deactivate: ${response.status} ${await response.text()}`);
  console.log('  ↓ products missing from the file were deactivated');
}

console.log('✔ Catalog published.');
