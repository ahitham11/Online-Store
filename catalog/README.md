# Catalog source of truth

Put the house catalog in `catalog/catalog.json`. The app never invents a
product, price, shade or stock level, so this file (published to Supabase) is
the only place merchandise comes from.

```bash
npm run catalog:check      # validate only, no secrets needed
npm run catalog:import     # validate, then publish to Supabase (reads .env)
npm run catalog:import -- --deactivate-missing   # also hide products removed from the file
```

## Format

The structure below is a template. Every value in it is a placeholder to
replace.

```jsonc
{
  "updatedAt": "2026-11-02T12:00:00+02:00",
  "categories": [
    { "id": "lips", "parentId": null, "nameAr": "…", "nameEn": "…", "image": "https://…", "sortOrder": 1 }
  ],
  "products": [
    {
      "id": "product-id",            // lowercase letters, digits, - and _
      "categoryId": "lips",          // must match a category id
      "nameAr": "…", "nameEn": "…",
      "descriptionAr": "…", "descriptionEn": "…",
      "soldAs": "piece",             // piece | box | set | bundle
      "images": ["https://…"],
      "tags": ["…"],
      "isActive": true,
      "variants": [
        {
          "sku": "SKU-001",          // unique across the whole catalog
          "barcode": null,
          "shadeNameAr": "…", "shadeNameEn": "…", "shadeHex": "#B4566E",
          "size": "3.5 g",
          "images": ["https://…"],
          "priceEgp": 0,             // required, must be > 0
          "compareAtPriceEgp": null, // optional, must be higher than priceEgp
          "available": 0,            // units in stock
          "lowStockThreshold": 3
        }
      ]
    }
  ],
  "heroSlides": [
    { "id": "…", "titleAr": "…", "titleEn": "…", "image": "https://…", "productId": "product-id" }
  ],
  "banners": [
    { "id": "…", "placement": "full", "titleAr": "…", "titleEn": "…", "image": "https://…", "sortOrder": 1 }
  ]
}
```

Images must be full `https://` URLs. Upload product photos to a public
Supabase Storage bucket and paste their public URLs.

Validation rejects:

- a missing or zero price
- a duplicate SKU, product id or category id
- a product in an unknown category
- a compare-at price that is not higher than the price
- a hero slide pointing at an unknown product

If anything fails, nothing is published.
