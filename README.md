# Velvety — Beauty Atelier

A luxury beauty shopping app for Egypt, built for **@beautty_with_velvety**.

Expo SDK 58 · React Native 0.88 · New Architecture · Expo Router · Reanimated 4 · Skia · strict TypeScript.

> **Phase 1 status — foundation and signature chrome.**
> The app is intentionally running against an **empty catalog**. No product,
> price, shade, ingredient, review, or rating in this build is invented. Where
> the catalog is empty you will see a designed empty state, not placeholder
> merchandise. The brand identity is **provisional** until `assets/brand/` and
> `catalog/catalog.json` are supplied (see [Provisional identity](#provisional-identity)).

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
catalog/               # (to be supplied) real catalog source of truth
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

## Phase plan

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Tokens, RTL, navigation, chrome, hero, opening, measured 3D comparison | **Complete — awaiting approval** |
| 2 | Supabase schema/RLS/auth, catalog ingestion, product detail, cart server sync | Next |
| 3 | Checkout, Paymob, shipping, orders, notifications | Planned |
| 4 | Admin, inventory, release hardening, store submission | Planned |

Phase 2 starts only after Phase 1 approval.
