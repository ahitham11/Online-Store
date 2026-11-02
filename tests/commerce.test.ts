import assert from 'node:assert/strict';
import test from 'node:test';

import {
  availableStock,
  formatEgp,
  formatQuantity,
  lineTotal,
  stockState,
} from '../src/lib/format.ts';

test('formatEgp uses EGP and Latin digits for both languages', () => {
  assert.equal(formatEgp(1250, 'en'), '1,250 EGP');
  assert.equal(formatEgp(1250, 'ar'), '1,250 ج.م');
});

test('formatEgp only shows decimals when asked', () => {
  assert.equal(formatEgp(99.5, 'en'), '100 EGP');
  assert.equal(formatEgp(99.5, 'en', true), '99.5 EGP');
});

test('formatQuantity stays in Latin digits', () => {
  assert.equal(formatQuantity(3, 'ar'), '3');
});

test('availableStock never goes below zero', () => {
  assert.equal(availableStock(10, 3), 7);
  assert.equal(availableStock(2, 5), 0);
});

test('stockState distinguishes availability bands', () => {
  assert.equal(stockState(0, 3), 'out_of_stock');
  assert.equal(stockState(-1, 3), 'out_of_stock');
  assert.equal(stockState(3, 3), 'low_stock');
  assert.equal(stockState(4, 3), 'in_stock');
  assert.equal(stockState(Number.NaN, 3), 'out_of_stock');
});

test('lineTotal rounds to piastres', () => {
  assert.equal(lineTotal(249.99, 3), 749.97);
  assert.equal(lineTotal(0.1 + 0.2, 1), 0.3);
});
