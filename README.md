# Velvety — Beauty Atelier

A luxury beauty shopping app for Egypt, built for **@beautty_with_velvety**.

Expo SDK 58 · React Native 0.88 · New Architecture · Expo Router · Reanimated 4 · Skia · strict TypeScript.

> **Phase 2 status: catalog pipeline and product pages.**
> The app reads the published catalog from Supabase as soon as
> `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set. Without
> them, or until `catalog/catalog.json` is published, it keeps its designed empty
> states. No product, price, shade, ingredient, review or rating in this build is
> invented. The brand identity is **provisional** until `assets/brand/` is
> supplied (see [Provisional identity](#provisional-identity)).

---

## Run it

### Web (no native toolchain required)

```bash
npm install
npx expo start --web
```

Open the printed URL. This path is the quickest way to review the visual
direction, RTL layout, opening veil, hero tilt, drawer perspective, and empty
states. Web uses static gradient fallbacks for the Skia shaders by design;
the native shader path is exercised in a development build.

### Native development build (required for Skia, MMKV, sensors)

Expo Go cannot run this project: it contains native modules from the
development build. Use one of:

```bash
# Local
npx expo run:android
npx expo run:ios

# Cloud (EAS)
npx eas-cli@latest build --profile development --platform android
```

Then start Metro and open the development client:

```bash
npx expo start --dev-client
```

### Quality gates

```bash
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit
npx expo lint
npx expo-doctor
```

TypeScript needs the raised heap on this machine; keep the flag in CI or set it
in the shell that runs the check.

---

## What Phase 1 contains

- **Design system** — aubergine/rose/blush/pearl/champagne tokens, Pearl light
  and Night Velvet dark themes, El Messiri + IBM Plex Sans Arabic + Cormorant
  Garamond + DM Sans, gold hairlines, layered glass, grain.
- **Arabic-first RTL** — Arabic is the default language, English is a toggle,
  layout uses logical start/end, icons mirror directionally, and the runtime
  direction wrapper avoids the restart that `I18nManager.forceRTL` requires.
- **Navigation** — Expo Router stack + custom floating tab bar, in-layout
  drawer that pushes the main screen into perspective, shared header that
  reacts to scroll.
- **Signature motion** — skippable velvet-fold opening veil (full first run,
  shorter repeat run, reduced-motion cut), draggable/tilting hero, product-card
  tilt and sheen, haptic feedback.
- **Home** — hero slider with pearl pagination, house principles, categories,
  new arrivals, offers, atelier note, notify form, footer.
- **Commerce shell** — categories, category detail, search with Arabic
  normalization, wishlist, bag with quantity/totals and a disabled checkout
  note until Phase 2, account, policies, designed empty/error/loading/offline
  states.
- **Motion lab** (`__DEV__` only, `/lab`) — 3D still-vs-perspective comparison,
  FPS sample, shader swatches, tilt sample, device info, reduced-motion and
  opening replay controls.
- **3D evaluation** — see [`docs/3d-evaluation.md`](docs/3d-evaluation.md) for
  the measured comparison and the Android verification protocol.

### Deliberately not in Phase 1

Supabase schema/RLS/auth, real catalog and media, cart persistence to a server,
checkout, Paymob, shipping, admin, push notifications, and release signing.
Those are scheduled for the next phases and are not faked in this build.

---

## Project map

```
src/
  app/                 # Expo Router routes only
    (tabs)/            # home, categories, wishlist, bag, account
    category/[id].tsx  # category tree + product grid
    product/[id].tsx   # product detail: shades, sizes, stock, add to bag
    policies/[slug].tsx
    search.tsx
    lab/               # __DEV__ motion/3D harness
  components/
    brand/             # provisional typographic mark
    chrome/            # header, footer, drawer, tab bar, page, glass, grain
    home/              # hero slider, pagination
    motion/            # Hero3D, shaders, opening veil, reveal, tilt
    product/           # product card
    ui/                # text, button, empty state, skeleton, rules, icons
  data/                # brand, policies, catalog adapter (empty by design)
  hooks/               # network, insets, tilt, frame rate, reduced motion
  lib/                 # i18n, theme, arabic/phone/price helpers, haptics, storage
  stores/              # zustand stores (ui, bag, wishlist, search, preferences)
  theme/               # tokens
  types/               # shared types
tests/                 # node:test unit tests
scripts/               # asset generators (brand icons, grain tile)
docs/                  # 3D evaluation, phase notes
catalog/               # catalog.json source of truth (format in catalog/README.md)
supabase/migrations/   # database schema + Row Level Security
assets/brand/          # (to be supplied) real logo and brand assets
```

---

## Provisional identity

The workspace did **not** contain `catalog/catalog.json` or `assets/brand/`.
Rather than invent a logo or merchandise, Phase 1 derives a typographic
wordmark and the supplied palette, and flags it in `src/data/brand.ts`
(`isProvisional: true`). The public Instagram handle is the only identity fact
used.

To adopt the real identity:

1. Drop the official logo files into `assets/brand/`.
2. Set `logoSource` and `isProvisional: false` in `src/data/brand.ts`.
3. Add `catalog/catalog.json` and replace the empty adapter in
   `src/data/catalog.ts` with the catalog/Supabase source.
4. Regenerate icons if the palette changed:
   `node scripts/generate-brand-assets.mjs`.

No customer-facing copy claims ingredients, results, reviews, or stock that
the catalog does not provide.

---

## Environment

Copy `.env.example` to `.env` when Phase 2 begins. Phase 1 needs no secrets.
Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are ever
client-safe; every service-role or payment secret stays server-side and must
never be prefixed with `EXPO_PUBLIC_`.

---

## Connect the live catalog (Phase 2)

1. Create a Supabase project, then run
   `supabase/migrations/20261102000000_catalog.sql` in the SQL editor (or
   `supabase db push`). It creates the catalog, wishlist and bag tables, with
   Row Level Security on every table.
2. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Write `catalog/catalog.json` (format in [`catalog/README.md`](catalog/README.md)),
   then run `npm run catalog:check` and `npm run catalog:import`.
4. Restart Metro. Home, categories, search and the new product page fill from
   Supabase.

5. **Email sign-in:** in Supabase → Authentication → Email Templates → *Magic
   Link*, put the code in the email body, e.g. `Your Velvety code: {{ .Token }}`.
   The app asks for that code (no links, no passwords). For real volume, set a
   custom SMTP sender under Authentication → SMTP, because Supabase's built-in
   sender is rate-limited.

The service-role key is used only by the importer on your machine. It is never
prefixed with `EXPO_PUBLIC_` and never reaches the app bundle.

## What Phase 2 adds

- **Catalog validation** (`src/data/catalogSchema.ts`): zod rules for prices,
  unique SKUs, category links and compare-at prices. A broken catalog is
  rejected instead of shown.
- **Supabase catalog reader** (`src/data/supabaseCatalog.ts`): PostgREST over
  plain `fetch`, so no new native module. Published rows are validated again
  before they render.
- **Database schema and RLS** (`supabase/migrations/`): public read of active
  catalog rows only; shoppers read and write only their own wishlist and bag.
- **Importer** (`scripts/import-catalog.ts`): validates, then upserts the
  catalog in dependency order.
- **Product page** (`src/app/product/[id].tsx`): gallery, shade swatches, size
  choice, stock state, savings, a quantity stepper clamped to stock,
  add-to-bag and wishlist. Product cards and search results open it.
- **Email-code sign-in** (`src/app/sign-in.tsx`, `src/lib/auth.ts`,
  `src/stores/session.ts`): the shopper enters her email and then a 6-digit
  code; Arabic-Indic digits are accepted. Only the refresh token is stored, in
  the device keychain via `expo-secure-store`; the access token stays in memory
  and refreshes automatically.
- **Bag and wishlist sync** (`src/lib/accountSync.ts`,
  `src/hooks/useAccountSync.ts`): on sign-in the device and server copies are
  merged (the larger quantity wins, never doubled), then later changes are
  pushed. Prices always come from the catalog, never from the server copy.
- **Tests**: 22 new unit tests (38 total), plus browser checks of the product →
  bag flow and the full sign-in → merge → reload → sign-out flow against a
  mocked Supabase.

### Layout fixes to Phase 1

- **RTL double mirroring:** rows are mirrored by hand, but on the web
  `<html dir="rtl">` mirrored them again, and Android does the same on phones
  set to Arabic. The layout engine now stays LTR everywhere: web `dir` is
  `ltr`, and `app.json` sets expo-localization `supportsRTL: false`. Arabic
  screens now read right-to-left correctly.
- **Floating header:** `AppHeader` (menu, search, bag) was never mounted, so
  the drawer could not be opened. The tab layout now renders it.
- **Drawer:** the closed drawer was half visible in Arabic. It is now anchored
  to the correct edge.
- **Arrows:** the back chevron and the hero previous/next arrows now point the
  right way in both languages.

---

## Phase plan

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Tokens, RTL, navigation, chrome, hero, opening, measured 3D comparison | Complete |
| 2 | Supabase schema/RLS, catalog ingestion, product detail | **Complete. Needs your Supabase project and catalog** |
| 2b | Supabase Auth (email code) and wishlist/bag server sync | **Complete. Needs the email template change above** |
| 3 | Checkout, Paymob, shipping, orders, notifications | Next. Needs Paymob and courier accounts |
| 4 | Admin, inventory, release hardening, store submission | Planned |
