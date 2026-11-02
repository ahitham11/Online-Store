import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCatalog } from '../src/data/catalogSchema.ts';
import {
  CatalogIntegrityError,
  fetchSupabaseCatalog,
  rowsToSnapshot,
  type CatalogRows,
} from '../src/data/supabaseCatalog.ts';
import { readSupabaseConfig } from '../src/lib/env.ts';
import {
  bagLineFor,
  clampQuantity,
  defaultVariant,
  findVariant,
  galleryFor,
  hasShades,
  hasSizes,
  savingsEgp,
} from '../src/lib/variants.ts';

// Test-only fixture. It exists to exercise validation rules and is never
// bundled into the app or published.
function fixture() {
  return {
    updatedAt: '2026-11-01T10:00:00Z',
    categories: [
      { id: 'test-parent', nameAr: 'أ', nameEn: 'A', sortOrder: 2 },
      { id: 'test-child', parentId: 'test-parent', nameAr: 'ب', nameEn: 'B', sortOrder: 1 },
    ],
    products: [
      {
        id: 'test-product',
        categoryId: 'test-child',
        nameAr: 'منتج اختبار',
        nameEn: 'Test product',
        images: ['https://example.test/p.jpg'],
        variants: [
          {
            sku: 'T-1',
            shadeNameEn: 'One',
            shadeHex: '#AA2244',
            images: ['https://example.test/v1.jpg'],
            priceEgp: 100,
            compareAtPriceEgp: 120,
            available: 0,
          },
          { sku: 'T-2', shadeNameEn: 'Two', shadeHex: '#112233', priceEgp: 110, available: 5, lowStockThreshold: 2 },
        ],
      },
    ],
  };
}

test('a valid catalog file becomes a ready snapshot with defaults applied', () => {
  const result = parseCatalog(fixture());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.catalog.status, 'ready');
  assert.deepEqual(result.catalog.categories.map((c) => c.id), ['test-child', 'test-parent']);
  const product = result.catalog.products[0];
  assert.equal(product.soldAs, 'piece');
  assert.equal(product.variants[0].lowStockThreshold, 3);
  assert.equal(product.variants[0].barcode, null);
});

test('an empty file stays an empty catalog with no update date', () => {
  const result = parseCatalog({ updatedAt: '2026-11-01T10:00:00Z' });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.catalog.status, 'empty');
  assert.equal(result.catalog.updatedAt, null);
});

test('a missing price is rejected, never defaulted', () => {
  const broken = fixture();
  delete (broken.products[0].variants[1] as { priceEgp?: number }).priceEgp;
  const result = parseCatalog(broken);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.join('\n'), /variants\.1\.priceEgp/);
});

test('duplicate SKUs and unknown categories are rejected', () => {
  const broken = fixture();
  broken.products[0].variants[0].sku = 'T-2';
  broken.products[0].categoryId = 'nowhere';
  const result = parseCatalog(broken);
  assert.equal(result.ok, false);
  if (result.ok) return;
  const joined = result.errors.join('\n');
  assert.match(joined, /duplicate sku "T-2"/);
  assert.match(joined, /unknown category "nowhere"/);
});

test('compare-at price must be higher than the price', () => {
  const broken = fixture();
  broken.products[0].variants[0].compareAtPriceEgp = 90;
  const result = parseCatalog(broken);
  assert.equal(result.ok, false);
});

test('inactive products are hidden from the app snapshot', () => {
  const file = fixture();
  (file.products[0] as { isActive?: boolean }).isActive = false;
  const result = parseCatalog(file);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.catalog.products.length, 0);
});

function rows(): CatalogRows {
  return {
    categories: [{ id: 'test-child', parent_id: null, name_ar: 'ب', name_en: 'B', image: null, sort_order: 0 }],
    products: [
      {
        id: 'test-product',
        category_id: 'test-child',
        name_ar: 'منتج',
        name_en: 'Product',
        description_ar: null,
        description_en: null,
        sold_as: 'box',
        images: null,
        tags: null,
        is_active: true,
        updated_at: '2026-11-02T08:00:00+00:00',
        product_variants: [
          {
            sku: 'B', product_id: 'test-product', barcode: null, shade_name_ar: null, shade_name_en: null,
            shade_hex: null, size: '50 ml', images: null, price_egp: '350.50', compare_at_price_egp: null,
            available: 4, low_stock_threshold: 3, sort_order: 1,
          },
          {
            sku: 'A', product_id: 'test-product', barcode: null, shade_name_ar: null, shade_name_en: null,
            shade_hex: null, size: '30 ml', images: null, price_egp: '250.00', compare_at_price_egp: '300.00',
            available: 0, low_stock_threshold: 3, sort_order: 0,
          },
        ],
      },
    ],
    heroSlides: [],
    banners: [],
  };
}

test('Supabase rows map to the app snapshot with numeric prices and variant order', () => {
  const snapshot = rowsToSnapshot(rows());
  assert.equal(snapshot.status, 'ready');
  assert.equal(snapshot.updatedAt, '2026-11-02T08:00:00+00:00');
  const [product] = snapshot.products;
  assert.deepEqual(product.variants.map((v) => v.sku), ['A', 'B']);
  assert.equal(product.variants[1].priceEgp, 350.5);
  assert.equal(product.variants[0].compareAtPriceEgp, 300);
  assert.equal(product.descriptionEn, '');
});

test('corrupt published rows raise instead of showing invented values', () => {
  const bad = rows();
  bad.products[0].product_variants![0].price_egp = 'not-a-number';
  assert.throws(() => rowsToSnapshot(bad), CatalogIntegrityError);
});

test('fetchSupabaseCatalog sends the anon key and surfaces HTTP errors', async () => {
  const seen: string[] = [];
  const data = rows();
  const ok = await fetchSupabaseCatalog({ url: 'https://x.supabase.co', anonKey: 'anon' }, async (url, init) => {
    seen.push(url);
    assert.equal(init?.headers?.apikey, 'anon');
    const table = url.split('/rest/v1/')[1].split('?')[0];
    const body =
      table === 'categories' ? data.categories : table === 'products' ? data.products : [];
    return { ok: true, status: 200, json: async () => body };
  });
  assert.equal(ok.products.length, 1);
  assert.equal(seen.length, 4);

  await assert.rejects(
    fetchSupabaseCatalog({ url: 'https://x.supabase.co', anonKey: 'anon' }, async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
    })),
    /401/,
  );
});

test('Supabase config needs both values and an https URL', () => {
  assert.equal(readSupabaseConfig('', 'key'), null);
  assert.equal(readSupabaseConfig('https://x.supabase.co', ''), null);
  assert.equal(readSupabaseConfig('http://x.supabase.co', 'key'), null);
  assert.deepEqual(readSupabaseConfig('https://x.supabase.co/', ' key '), {
    url: 'https://x.supabase.co',
    anonKey: 'key',
  });
});

test('variant helpers pick buyable stock, clamp quantity and build bag lines', () => {
  const result = parseCatalog(fixture());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const product = result.catalog.products[0];

  assert.equal(defaultVariant(product)?.sku, 'T-2');
  assert.equal(findVariant(product, 'T-1')?.sku, 'T-1');
  assert.equal(findVariant(product, 'missing')?.sku, 'T-2');
  assert.equal(hasShades(product), true);
  assert.equal(hasSizes(product), false);

  const soldOut = findVariant(product, 'T-1');
  assert.deepEqual(galleryFor(product, soldOut), ['https://example.test/v1.jpg', 'https://example.test/p.jpg']);
  assert.equal(clampQuantity(3, soldOut), 0);
  assert.equal(savingsEgp(soldOut), 20);

  const buyable = findVariant(product, 'T-2')!;
  assert.equal(clampQuantity(50, buyable), 5);
  assert.equal(clampQuantity(0, buyable), 1);
  assert.equal(savingsEgp(buyable), 0);

  const line = bagLineFor(product, buyable, 2);
  assert.equal(line.key, 'T-2');
  assert.equal(line.unitPriceEgp, 110);
  assert.equal(line.quantity, 2);
  assert.equal(line.imageUri, 'https://example.test/p.jpg');
});
