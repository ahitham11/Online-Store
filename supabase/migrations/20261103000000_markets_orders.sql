-- VEIVETY: multi-market prices, shipping rates, cash-on-delivery orders and
-- order tracking.
--
-- Security model
--   * Shoppers never write orders directly. public.place_order() (security
--     definer) re-reads prices, stock and the shipping rate on the server, so
--     a modified app cannot change what an order costs.
--   * Shoppers can read only their own orders, items and tracking events.
--   * The owner updates status / tracking number from the Supabase dashboard;
--     every status change is recorded in order_events automatically.

-- ---------------------------------------------------------------------------
-- Prices per market (EG/AE/SA/IE) instead of a single EGP price
-- ---------------------------------------------------------------------------
alter table public.product_variants drop column if exists compare_at_price_egp;
alter table public.product_variants drop column if exists price_egp;
alter table public.product_variants
  add column if not exists prices jsonb not null default '{}'::jsonb,
  add column if not exists compare_at jsonb not null default '{}'::jsonb;

-- Safe to re-run: drop first. NOT VALID skips old rows; new and updated rows are checked.
alter table public.product_variants drop constraint if exists product_variants_prices_markets;
alter table public.product_variants
  add constraint product_variants_prices_markets
    check (prices ?| array['EG', 'AE', 'SA', 'IE'] and not (prices - array['EG', 'AE', 'SA', 'IE'] <> '{}'::jsonb)) not valid;

-- ---------------------------------------------------------------------------
-- Shipping rates (standard delivery per market)
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_rates (
  market        text primary key check (market in ('EG', 'AE', 'SA', 'IE')),
  currency      text not null check (currency in ('EGP', 'AED', 'SAR', 'EUR')),
  fee           numeric(12, 2) not null check (fee >= 0),
  free_over     numeric(12, 2) check (free_over is null or free_over > 0),
  eta_min_days  integer not null check (eta_min_days >= 0),
  eta_max_days  integer not null check (eta_max_days >= eta_min_days),
  is_active     boolean not null default true,
  updated_at    timestamptz not null default now()
);

insert into public.shipping_rates (market, currency, fee, free_over, eta_min_days, eta_max_days) values
  ('EG', 'EGP', 60, 1000, 2, 4),
  ('AE', 'AED', 25, 300, 1, 3),
  ('SA', 'SAR', 25, 300, 2, 5),
  ('IE', 'EUR', 5, 60, 3, 6)
on conflict (market) do nothing;

alter table public.shipping_rates enable row level security;
drop policy if exists "shipping: read active rates" on public.shipping_rates;
create policy "shipping: read active rates" on public.shipping_rates
  for select to anon, authenticated using (is_active);
revoke all on public.shipping_rates from anon, authenticated;
grant select on public.shipping_rates to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  number           text not null unique,
  user_id          uuid not null references auth.users (id) on delete restrict,
  market           text not null check (market in ('EG', 'AE', 'SA', 'IE')),
  currency         text not null,
  status           text not null default 'placed'
                   check (status in ('placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  payment_method   text not null default 'cod' check (payment_method in ('cod')),
  payment_status   text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  customer_name    text not null check (length(trim(customer_name)) between 2 and 120),
  phone            text not null check (phone ~ '^\+[0-9]{8,15}$'),
  email            text,
  city             text not null check (length(trim(city)) between 2 and 80),
  area             text,
  address_line     text not null check (length(trim(address_line)) between 5 and 300),
  notes            text check (notes is null or length(notes) <= 500),
  subtotal         numeric(12, 2) not null check (subtotal >= 0),
  shipping_fee     numeric(12, 2) not null check (shipping_fee >= 0),
  total            numeric(12, 2) not null check (total >= 0),
  carrier          text,
  tracking_number  text,
  tracking_url     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id             bigint generated always as identity primary key,
  order_id       uuid not null references public.orders (id) on delete cascade,
  sku            text not null,
  product_id     text not null,
  name_ar        text not null,
  name_en        text not null,
  shade_name_ar  text,
  shade_name_en  text,
  image          text,
  unit_price     numeric(12, 2) not null check (unit_price > 0),
  quantity       integer not null check (quantity between 1 and 99),
  line_total     numeric(12, 2) not null check (line_total > 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      text not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Every status change (from the dashboard or elsewhere) becomes a tracking event.
create or replace function public.record_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  elsif new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_record_event on public.orders;
create trigger orders_record_event after insert or update of status on public.orders
  for each row execute function public.record_order_event();

alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "orders: owner reads" on public.orders;
create policy "orders: owner reads" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "order items: owner reads" on public.order_items;
create policy "order items: owner reads" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = (select auth.uid())));
drop policy if exists "order events: owner reads" on public.order_events;
create policy "order events: owner reads" on public.order_events
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_events.order_id and o.user_id = (select auth.uid())));

revoke all on public.orders, public.order_items, public.order_events from anon, authenticated;
grant select on public.orders, public.order_items, public.order_events to authenticated;

-- ---------------------------------------------------------------------------
-- place_order: the only way to create an order
-- ---------------------------------------------------------------------------
-- items: [{"sku": "VV-GL-01", "quantity": 2}, ...]
-- address: {"name": "...", "phone": "+2010...", "email": "...", "city": "...",
--           "area": "...", "line": "...", "notes": "..."}
create or replace function public.place_order(p_market text, p_items jsonb, p_address jsonb)
returns table (order_id uuid, order_number text, order_total numeric, order_currency text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rate public.shipping_rates%rowtype;
  v_order_id uuid;
  v_number text;
  v_subtotal numeric(12, 2) := 0;
  v_shipping numeric(12, 2);
  v_item jsonb;
  v_qty integer;
  v_price numeric(12, 2);
  v_variant record;
begin
  if v_user is null then
    raise exception 'sign_in_required' using errcode = '28000';
  end if;

  select * into v_rate from public.shipping_rates where market = p_market and is_active;
  if not found then
    raise exception 'market_unavailable' using errcode = '22023';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'empty_bag' using errcode = '22023';
  end if;

  -- Order number: VV-YYMMDD-XXXXX (random, unique)
  loop
    v_number := 'VV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5));
    exit when not exists (select 1 from public.orders where number = v_number);
  end loop;

  insert into public.orders (
    number, user_id, market, currency, customer_name, phone, email, city, area, address_line, notes,
    subtotal, shipping_fee, total
  ) values (
    v_number, v_user, p_market, v_rate.currency,
    trim(p_address->>'name'), trim(p_address->>'phone'), nullif(trim(p_address->>'email'), ''),
    trim(p_address->>'city'), nullif(trim(p_address->>'area'), ''), trim(p_address->>'line'),
    nullif(trim(p_address->>'notes'), ''),
    0, 0, 0
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    select pv.sku, pv.product_id, pv.shade_name_ar, pv.shade_name_en, pv.available, pv.prices, pv.images,
           p.name_ar, p.name_en, p.images as product_images
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id and p.is_active
     where pv.sku = v_item->>'sku'
       for update of pv;
    if not found then
      raise exception 'unknown_item:%', v_item->>'sku' using errcode = '22023';
    end if;

    v_price := (v_variant.prices->>p_market)::numeric;
    if v_price is null or v_price <= 0 then
      raise exception 'not_sold_in_market:%', v_variant.sku using errcode = '22023';
    end if;
    if v_variant.available < v_qty then
      raise exception 'out_of_stock:%', v_variant.sku using errcode = '22023';
    end if;

    update public.product_variants set available = available - v_qty where sku = v_variant.sku;

    insert into public.order_items (order_id, sku, product_id, name_ar, name_en, shade_name_ar, shade_name_en, image, unit_price, quantity, line_total)
    values (
      v_order_id, v_variant.sku, v_variant.product_id, v_variant.name_ar, v_variant.name_en,
      v_variant.shade_name_ar, v_variant.shade_name_en,
      coalesce(v_variant.images[1], v_variant.product_images[1]),
      v_price, v_qty, v_price * v_qty
    );
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  v_shipping := case when v_rate.free_over is not null and v_subtotal >= v_rate.free_over then 0 else v_rate.fee end;
  update public.orders set subtotal = v_subtotal, shipping_fee = v_shipping, total = v_subtotal + v_shipping
   where id = v_order_id;

  -- Empty the shopper's synced bag; the order is placed.
  delete from public.bag_items where user_id = v_user;

  return query select v_order_id, v_number, v_subtotal + v_shipping, v_rate.currency;
end;
$$;

revoke all on function public.place_order(text, jsonb, jsonb) from public, anon;
grant execute on function public.place_order(text, jsonb, jsonb) to authenticated;
