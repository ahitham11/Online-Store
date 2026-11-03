import assert from 'node:assert/strict';
import test from 'node:test';

import { emptyCatalog } from '../src/data/catalog.ts';

test('Phase 1 catalog is explicitly empty, not fixture data', () => {
  assert.equal(emptyCatalog.status, 'empty');
  assert.equal(emptyCatalog.products.length, 0);
  assert.equal(emptyCatalog.categories.length, 0);
  assert.equal(emptyCatalog.heroSlides.length, 0);
  assert.equal(emptyCatalog.banners.length, 0);
  assert.equal(emptyCatalog.updatedAt, null);
});

test('empty catalog never reports a fake update or price', () => {
  const serialized = JSON.stringify(emptyCatalog);
  assert.equal(serialized.includes('prices'), false);
  assert.equal(serialized.includes('EGP'), false);
});
