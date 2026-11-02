import assert from 'node:assert/strict';
import test from 'node:test';

import { createSyncClient, mergeBag, mergeWishlist } from '../src/lib/accountSync.ts';
import { AuthError, createAuthClient, isExpiring, normalizeEmail, normalizeOtp } from '../src/lib/auth.ts';
import { parseCatalog } from '../src/data/catalogSchema.ts';
import type { BagLine } from '../src/stores/bag.ts';

const config = { url: 'https://x.supabase.co', anonKey: 'anon' };

type Call = { url: string; method?: string; headers?: Record<string, string>; body?: unknown };

function fakeFetch(responses: Record<string, { status?: number; body?: unknown }>, calls: Call[]) {
  return async (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => {
    calls.push({ url, method: init?.method, headers: init?.headers, body: init?.body ? JSON.parse(init.body) : undefined });
    const key = Object.keys(responses).find((path) => url.includes(path));
    const response = key ? responses[key] : { status: 404, body: {} };
    const status = response.status ?? 200;
    return { ok: status < 400, status, json: async () => response.body ?? {} };
  };
}

test('emails are trimmed and lowercased; bad ones are rejected', () => {
  assert.equal(normalizeEmail('  Sara@Example.COM '), 'sara@example.com');
  assert.equal(normalizeEmail('sara@example'), null);
  assert.equal(normalizeEmail('not an email'), null);
});

test('codes accept Arabic-Indic digits, spaces and dashes', () => {
  assert.equal(normalizeOtp('١٢٣ ٤٥٦'), '123456');
  assert.equal(normalizeOtp('۱۲۳-۴۵۶'), '123456');
  assert.equal(normalizeOtp('12345'), null);
  assert.equal(normalizeOtp('12a456'), null);
});

test('isExpiring uses a safety margin', () => {
  assert.equal(isExpiring({ expiresAt: 1_000 }, 900), false);
  assert.equal(isExpiring({ expiresAt: 1_000 }, 950), true);
});

test('requestEmailCode posts the normalized email and allows new shoppers', async () => {
  const calls: Call[] = [];
  const auth = createAuthClient(config, fakeFetch({ '/auth/v1/otp': { body: {} } }, calls));
  assert.equal(await auth.requestEmailCode(' Sara@Example.com'), 'sara@example.com');
  assert.deepEqual(calls[0].body, { email: 'sara@example.com', create_user: true });
  assert.equal(calls[0].headers?.apikey, 'anon');
  await assert.rejects(auth.requestEmailCode('nope'), (error: AuthError) => error.code === 'invalid_email');
});

test('verifyEmailCode returns a session and classifies failures', async () => {
  const calls: Call[] = [];
  const ok = createAuthClient(
    config,
    fakeFetch(
      {
        '/auth/v1/verify': {
          body: { access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: 'sara@example.com' } },
        },
      },
      calls,
    ),
    () => 1_000,
  );
  const session = await ok.verifyEmailCode('sara@example.com', '١٢٣٤٥٦');
  assert.deepEqual(calls[0].body, { type: 'email', email: 'sara@example.com', token: '123456' });
  assert.deepEqual(session, {
    accessToken: 'a',
    refreshToken: 'r',
    expiresAt: 4_600,
    user: { id: 'u1', email: 'sara@example.com' },
  });

  const expired = createAuthClient(
    config,
    fakeFetch({ '/auth/v1/verify': { status: 403, body: { error_code: 'otp_expired', msg: 'Token has expired or is invalid' } } }, []),
  );
  await assert.rejects(expired.verifyEmailCode('sara@example.com', '123456'), (error: AuthError) => error.code === 'expired');

  const limited = createAuthClient(config, fakeFetch({ '/auth/v1/otp': { status: 429, body: {} } }, []));
  await assert.rejects(limited.requestEmailCode('sara@example.com'), (error: AuthError) => error.code === 'rate_limited');

  const offline = createAuthClient(config, async () => {
    throw new Error('offline');
  });
  await assert.rejects(offline.requestEmailCode('sara@example.com'), (error: AuthError) => error.code === 'network');
});

test('refresh uses the refresh-token grant', async () => {
  const calls: Call[] = [];
  const auth = createAuthClient(
    config,
    fakeFetch({ 'grant_type=refresh_token': { body: { access_token: 'a2', refresh_token: 'r2', expires_at: 9_999, user: { id: 'u1' } } } }, calls),
  );
  const session = await auth.refresh('r1');
  assert.deepEqual(calls[0].body, { refresh_token: 'r1' });
  assert.equal(session.accessToken, 'a2');
  assert.equal(session.expiresAt, 9_999);
  assert.equal(session.user.email, null);
});

// Test-only catalog fixture; never bundled into the app.
function catalog() {
  const result = parseCatalog({
    categories: [{ id: 'test-cat', nameAr: 'أ', nameEn: 'A' }],
    products: [
      {
        id: 'test-a',
        categoryId: 'test-cat',
        nameAr: 'أ',
        nameEn: 'A',
        variants: [
          { sku: 'A-1', priceEgp: 100, available: 5 },
          { sku: 'A-2', priceEgp: 120, available: 5 },
        ],
      },
      { id: 'test-b', categoryId: 'test-cat', nameAr: 'ب', nameEn: 'B', variants: [{ sku: 'B-1', priceEgp: 50, available: 1 }] },
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('fixture');
  return result.catalog;
}

function line(sku: string, quantity: number, unitPriceEgp = 1): BagLine {
  return { key: sku, productId: 'x', sku, nameAr: 'x', nameEn: 'x', unitPriceEgp, quantity };
}

test('mergeBag keeps the larger quantity, refreshes prices and drops unknown SKUs', () => {
  const merged = mergeBag(
    [line('A-1', 2, 999), line('GONE', 1)],
    [
      { sku: 'A-1', quantity: 1 },
      { sku: 'B-1', quantity: 3 },
    ],
    catalog(),
  );
  assert.deepEqual(
    merged.map((item) => [item.sku, item.quantity, item.unitPriceEgp]),
    [
      ['A-1', 2, 100],
      ['B-1', 3, 50],
    ],
  );
  assert.equal(merged[0].nameEn, 'A');
});

test('merging twice is stable (no doubling)', () => {
  const first = mergeBag([line('A-1', 2)], [{ sku: 'A-1', quantity: 2 }], catalog());
  const second = mergeBag(first, [{ sku: 'A-1', quantity: 2 }], catalog());
  assert.equal(second[0].quantity, 2);
});

test('mergeWishlist unions both lists and drops unpublished products', () => {
  assert.deepEqual(mergeWishlist(['test-b', 'gone'], ['test-a', 'test-b'], catalog()), ['test-b', 'test-a']);
});

test('pushBag upserts the lines then deletes everything else for that shopper', async () => {
  const calls: Call[] = [];
  const sync = createSyncClient(config, fakeFetch({ bag_items: { body: [] } }, calls));
  await sync.pushBag('token', 'u1', [line('A-1', 2), line('B-1', 150)]);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].headers?.Authorization, 'Bearer token');
  assert.deepEqual(calls[0].body, [
    { user_id: 'u1', sku: 'A-1', quantity: 2 },
    { user_id: 'u1', sku: 'B-1', quantity: 99 },
  ]);
  assert.equal(calls[1].method, 'DELETE');
  assert.equal(decodeURIComponent(calls[1].url), 'https://x.supabase.co/rest/v1/bag_items?user_id=eq.u1&sku=not.in.("A-1","B-1")');

  const emptyCalls: Call[] = [];
  await createSyncClient(config, fakeFetch({ bag_items: { body: [] } }, emptyCalls)).pushBag('token', 'u1', []);
  assert.equal(emptyCalls.length, 1);
  assert.equal(emptyCalls[0].url, 'https://x.supabase.co/rest/v1/bag_items?user_id=eq.u1');
});

test('pull reads bag and wishlist rows', async () => {
  const sync = createSyncClient(
    config,
    fakeFetch(
      {
        'bag_items?select': { body: [{ sku: 'A-1', quantity: 2 }] },
        'wishlist_items?select': { body: [{ product_id: 'test-a' }] },
      },
      [],
    ),
  );
  assert.deepEqual(await sync.pull('token'), { bag: [{ sku: 'A-1', quantity: 2 }], wishlist: ['test-a'] });
});
