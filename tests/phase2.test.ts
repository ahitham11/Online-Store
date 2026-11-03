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
  savingsFor,
  priceFor,
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
            prices: { EG: 100 },
            compareAt: { EG: 120 },
            available: 0,
          },
          { sku: 'T-2', shadeNameEn: 'Two', shadeHex: '#112233', prices: { EG: 110 }, available: 5, lowStockThreshold: 2 },
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
  (broken.products[0].variants[1] as { prices: object }).prices = {};
  const result = parseCatalog(broken);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.join('\n'), /variants\.1\.prices/);
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
  (broken.products[0].variants[0] as { compareAt: object }).compareAt = { EG: 90 };
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
            shade_hex: null, size: '50 ml', images: null, prices: { EG: '350.50', AE: 120 }, compare_at: null,
            available: 4, low_stock_threshold: 3, sort_order: 1,
          },
          {
            sku: 'A', product_id: 'test-product', barcode: null, shade_name_ar: null, shade_name_en: null,
            shade_hex: null, size: '30 ml', images: null, prices: { EG: '250.00' }, compare_at: { EG: '300.00' },
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
  assert.deepEqual(product.variants[1].prices, { EG: 350.5, AE: 120 });
  assert.deepEqual(product.variants[0].compareAt, { EG: 300 });
  assert.equal(product.descriptionEn, '');
});

test('corrupt published rows raise instead of showing invented values', () => {
  const bad = rows();
  bad.products[0].product_variants![0].prices = { EG: 'not-a-number' };
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
  assert.equal(savingsFor(soldOut, 'EG'), 20);

  const buyable = findVariant(product, 'T-2')!;
  assert.equal(clampQuantity(50, buyable), 5);
  assert.equal(clampQuantity(0, buyable), 1);
  assert.equal(savingsFor(buyable, 'EG'), 0);

  const line = bagLineFor(product, buyable, 2, 'EG');
  assert.equal(priceFor(buyable, 'AE'), null);
  assert.equal(line.key, 'T-2');
  assert.equal(line.unitPrice, 110);
  assert.equal(line.quantity, 2);
  assert.equal(line.imageUri, 'https://example.test/p.jpg');
});

test('markets: currency formatting, shipping thresholds and phone numbers', async () => {
  const { formatPrice, shippingFee, normalizePhone, marketFromRegion, markets } = await import('../src/lib/markets.ts');
  assert.equal(formatPrice(100, 'EG', 'en'), '100 EGP');
  assert.equal(formatPrice(100, 'AE', 'ar'), '100 د.إ');
  assert.equal(formatPrice(100, 'SA', 'en'), '100 SAR');
  assert.equal(formatPrice(12.5, 'IE', 'en'), '€12.50');
  assert.equal(formatPrice(100, 'IE', 'en'), '€100');
  assert.equal(shippingFee(0, markets.EG.shipping), 0);
  assert.equal(shippingFee(500, markets.EG.shipping), 60);
  assert.equal(shippingFee(1000, markets.EG.shipping), 0);
  assert.equal(normalizePhone('010 1234 5678', 'EG'), '+201012345678');
  assert.equal(normalizePhone('+971 55 945 2564', 'AE'), '+971559452564');
  assert.equal(normalizePhone('٠٥٥٩٤٥٢٥٦٤', 'AE'), '+971559452564');
  assert.equal(normalizePhone('087 625 1185', 'IE'), '+353876251185');
  assert.equal(normalizePhone('12345', 'SA'), null);
  assert.equal(marketFromRegion('ae'), 'AE');
  assert.equal(marketFromRegion('US'), 'EG');
});

test('repriceBag switches currency and drops shades not sold in the market', async () => {
  const { repriceBag } = await import('../src/lib/accountSync.ts');
  const result = parseCatalog({
    categories: [{ id: 'c', nameAr: 'أ', nameEn: 'A' }],
    products: [{ id: 'p', categoryId: 'c', nameAr: 'م', nameEn: 'P', variants: [
      { sku: 'S1', prices: { EG: 100, AE: 100 }, available: 3 },
      { sku: 'S2', prices: { EG: 100 }, available: 3 },
    ] }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const lines = [
    { key: 'S1', productId: 'p', sku: 'S1', nameAr: 'م', nameEn: 'P', unitPrice: 100, market: 'EG' as const, quantity: 1 },
    { key: 'S2', productId: 'p', sku: 'S2', nameAr: 'م', nameEn: 'P', unitPrice: 100, market: 'EG' as const, quantity: 2 },
  ];
  assert.equal(repriceBag(lines, result.catalog, 'EG'), lines);
  const ae = repriceBag(lines, result.catalog, 'AE');
  assert.deepEqual(ae.map((l) => [l.sku, l.market, l.unitPrice]), [['S1', 'AE', 100]]);
});
