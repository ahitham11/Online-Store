import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyOrderError, createOrdersClient, OrderError, trackingIndex } from '../src/lib/orders.ts';

const config = { url: 'https://x.supabase.co', anonKey: 'anon' };

test('server errors map to typed order errors with the SKU', () => {
  const stock = classifyOrderError('out_of_stock:VV-GL-01');
  assert.equal(stock.code, 'out_of_stock');
  assert.equal(stock.sku, 'VV-GL-01');
  assert.equal(classifyOrderError('sign_in_required').code, 'sign_in_required');
  assert.equal(classifyOrderError('invalid_quantity').code, 'invalid');
  assert.equal(classifyOrderError('something else').code, 'unknown');
});

test('tracking index follows the happy path; packed counts as confirmed', () => {
  assert.equal(trackingIndex('placed'), 0);
  assert.equal(trackingIndex('packed'), 1);
  assert.equal(trackingIndex('delivered'), 4);
  assert.equal(trackingIndex('cancelled'), -1);
});

test('placeOrder calls the RPC with the user token and returns the order', async () => {
  const calls: { url: string; init?: { method?: string; headers?: Record<string, string>; body?: string } }[] = [];
  const client = createOrdersClient(config, async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, json: async () => [{ order_id: 'o1', order_number: 'VV-261103-ABCDE', order_total: '360.00', order_currency: 'EGP' }] };
  });
  const order = await client.placeOrder('tok', 'EG', [{ sku: 'S', quantity: 3 }], { name: 'Sara', phone: '+201012345678', city: 'Cairo', line: '12 Street' });
  assert.equal(calls[0].url, 'https://x.supabase.co/rest/v1/rpc/place_order');
  assert.equal(calls[0].init?.headers?.Authorization, 'Bearer tok');
  assert.deepEqual(JSON.parse(calls[0].init!.body!).p_items, [{ sku: 'S', quantity: 3 }]);
  assert.deepEqual(order, { id: 'o1', number: 'VV-261103-ABCDE', total: 360, currency: 'EGP' });
});

test('placeOrder surfaces server refusals as OrderError', async () => {
  const client = createOrdersClient(config, async () => ({ ok: false, status: 400, json: async () => ({ message: 'not_sold_in_market:G2' }) }));
  await assert.rejects(
    client.placeOrder('tok', 'AE', [{ sku: 'G2', quantity: 1 }], { name: 'A', phone: '+971559452564', city: 'Dubai', line: 'Marina 5' }),
    (error: OrderError) => error.code === 'not_sold_in_market' && error.sku === 'G2',
  );
});

test('getOrder maps items and sorts tracking events', async () => {
  const client = createOrdersClient(config, async () => ({
    ok: true,
    status: 200,
    json: async () => [{
      id: 'o1', number: 'VV-1', market: 'IE', currency: 'EUR', status: 'shipped', total: '100.00', created_at: '2026-11-03T10:00:00Z',
      payment_status: 'unpaid', customer_name: 'Aoife', phone: '+353876251185', city: 'Dublin', area: null, address_line: '5 Grafton St', notes: null,
      subtotal: '100.00', shipping_fee: '0.00', carrier: 'An Post', tracking_number: 'RR123', tracking_url: null,
      order_items: [{ sku: 'G1', product_id: 'gloss', name_ar: 'ج', name_en: 'G', unit_price: '100.00', quantity: 1, line_total: '100.00' }],
      order_events: [{ status: 'shipped', created_at: '2026-11-04T10:00:00Z' }, { status: 'placed', created_at: '2026-11-03T10:00:00Z' }],
    }],
  }));
  const order = await client.getOrder('tok', 'o1');
  assert.equal(order?.items[0].unitPrice, 100);
  assert.deepEqual(order?.events.map((e) => e.status), ['placed', 'shipped']);
  assert.equal(order?.trackingNumber, 'RR123');
});
