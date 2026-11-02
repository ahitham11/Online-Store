-- Velvety Phase 2: catalog, wishlist and bag tables with Row Level Security.
--
-- Security model
--   * Anonymous and signed-in shoppers can READ active catalog rows only.
--   * Nobody can write catalog rows from the app. The importer
--     (scripts/import-catalog.ts) uses the service-role key server-side, which
--     bypasses RLS by design.
--   * Signed-in shoppers can read and write only their own wishlist and bag.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id          text primary key check (id ~ '^[a-z0-9][a-z0-9_-]*$'),
  parent_id   text references public.categories (id) on delete set null,
  name_ar     text not null check (length(trim(name_ar)) > 0),
  name_en     text not null check (length(trim(name_en)) > 0),
  image       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (parent_id is distinct from id)
);

create table public.products (
  id              text primary key check (id ~ '^[a-z0-9][a-z0-9_-]*$'),
  category_id     text not null references public.categories (id) on delete restrict,
  name_ar         text not null check (length(trim(name_ar)) > 0),
  name_en         text not null check (length(trim(name_en)) > 0),
  description_ar  text not null default '',
  description_en  text not null default '',
  sold_as         text not null default 'piece' check (sold_as in ('piece', 'box', 'set', 'bundle')),
  images          text[] not null default '{}',
  tags            text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_category_idx on public.products (category_id) where is_active;

create table public.product_variants (
  sku                   text primary key check (length(trim(sku)) > 0),
  product_id            text not null references public.products (id) on delete cascade,
  barcode               text,
  shade_name_ar         text,
  shade_name_en         text,
  shade_hex             text check (shade_hex is null or shade_hex ~ '^#[0-9A-Fa-f]{6}$'),
  size                  text,
  images                text[] not null default '{}',
  price_egp             numeric(12, 2) not null check (price_egp > 0),
  compare_at_price_egp  numeric(12, 2) check (compare_at_price_egp is null or compare_at_price_egp > price_egp),
  available             integer not null default 0 check (available >= 0),
  low_stock_threshold   integer not null default 3 check (low_stock_threshold >= 0),
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id);

create table public.hero_slides (
  id          text primary key,
  eyebrow_ar  text,
  eyebrow_en  text,
  title_ar    text not null,
  title_en    text not null,
  body_ar     text,
  body_en     text,
  image       text,
  product_id  text references public.products (id) on delete set null,
  deep_link   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.banners (
  id          text primary key,
  placement   text not null check (placement in ('full', 'two-up')),
  title_ar    text not null,
  title_en    text not null,
  image       text,
  deep_link   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();
create trigger hero_slides_touch before update on public.hero_slides
  for each row execute function public.touch_updated_at();
create trigger banners_touch before update on public.banners
  for each row execute function public.touch_updated_at();

alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.hero_slides      enable row level security;
alter table public.banners          enable row level security;

create policy "catalog: read categories" on public.categories
  for select to anon, authenticated using (true);

create policy "catalog: read active products" on public.products
  for select to anon, authenticated using (is_active);

create policy "catalog: read variants of active products" on public.product_variants
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.is_active
  ));

create policy "catalog: read active hero slides" on public.hero_slides
  for select to anon, authenticated using (is_active);

create policy "catalog: read active banners" on public.banners
  for select to anon, authenticated using (is_active);

-- ---------------------------------------------------------------------------
-- Shopper data (requires Supabase Auth)
-- ---------------------------------------------------------------------------
create table public.wishlist_items (
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  text not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.bag_items (
  user_id     uuid not null references auth.users (id) on delete cascade,
  sku         text not null references public.product_variants (sku) on delete cascade,
  quantity    integer not null check (quantity between 1 and 99),
  updated_at  timestamptz not null default now(),
  primary key (user_id, sku)
);

create trigger bag_items_touch before update on public.bag_items
  for each row execute function public.touch_updated_at();

alter table public.wishlist_items enable row level security;
alter table public.bag_items      enable row level security;

create policy "wishlist: owner reads" on public.wishlist_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "wishlist: owner inserts" on public.wishlist_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wishlist: owner deletes" on public.wishlist_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "bag: owner reads" on public.bag_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "bag: owner inserts" on public.bag_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "bag: owner updates" on public.bag_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "bag: owner deletes" on public.bag_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Explicit grants: the anon role gets read access to the catalog only.
revoke all on public.categories, public.products, public.product_variants,
  public.hero_slides, public.banners, public.wishlist_items, public.bag_items
  from anon, authenticated;
grant select on public.categories, public.products, public.product_variants,
  public.hero_slides, public.banners to anon, authenticated;
grant select, insert, update, delete on public.wishlist_items, public.bag_items to authenticated;
