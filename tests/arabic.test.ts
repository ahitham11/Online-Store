import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSearchIndex,
  formatEgyptianPhoneForDisplay,
  includesNormalized,
  normalizeArabic,
  normalizeEgyptianPhone,
} from '../src/lib/arabic.ts';

test('normalizeArabic removes diacritics, tatweel and alef variants', () => {
  assert.equal(normalizeArabic('أَحْمَر'), 'احمر');
  assert.equal(normalizeArabic('مـاسـكـارا'), 'ماسكارا');
  assert.equal(normalizeArabic('إيليت'), 'ايليت');
});

test('normalizeArabic folds teh marbuta and alef maksura', () => {
  assert.equal(normalizeArabic('وردة'), normalizeArabic('ورده'));
  assert.equal(normalizeArabic('مستشفى'), normalizeArabic('مستشفي'));
});

test('normalizeArabic converts Arabic-Indic digits', () => {
  assert.equal(normalizeArabic('عطر ١٢٣'), 'عطر 123');
});

test('includesNormalized matches across spelling variants', () => {
  assert.equal(includesNormalized('أحمر شفاه مات', 'احمر'), true);
  assert.equal(includesNormalized('ماسكارا', 'عطر'), false);
});

test('createSearchIndex joins and normalizes multiple fields', () => {
  const index = createSearchIndex('أحمر شفاه', null, 'Matte Lipstick', undefined);
  assert.match(index, /احمر شفاه/);
  assert.match(index, /matte lipstick/);
});

test('normalizeEgyptianPhone accepts common Egyptian formats', () => {
  assert.equal(normalizeEgyptianPhone('01012345678'), '+201012345678');
  assert.equal(normalizeEgyptianPhone('1012345678'), '+201012345678');
  assert.equal(normalizeEgyptianPhone('+201012345678'), '+201012345678');
  assert.equal(normalizeEgyptianPhone('00201012345678'), '+201012345678');
  assert.equal(normalizeEgyptianPhone('٠١٠١٢٣٤٥٦٧٨'), '+201012345678');
});

test('normalizeEgyptianPhone rejects invalid numbers', () => {
  assert.equal(normalizeEgyptianPhone(''), null);
  assert.equal(normalizeEgyptianPhone('02012345678'), null);
  assert.equal(normalizeEgyptianPhone('0101234567'), null);
  assert.equal(normalizeEgyptianPhone('010123456789'), null);
});

test('formatEgyptianPhoneForDisplay groups the national number', () => {
  assert.equal(formatEgyptianPhoneForDisplay('01012345678'), '0101 234 5678');
});
