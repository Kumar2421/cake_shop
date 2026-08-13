# Product detail page Specification

Route: `/p/[category]/[slug]` (dynamic). Source: `https://www.bakingo.com/p/cake/<sku-slug>`.
Reference: `docs/design-references/www.bakingo.com/p-cake-fresh-fruit-cake0014frui/`.

## Files

| File | Kind | Role |
|------|------|------|
| `src/app/p/[category]/[slug]/page.tsx` | server | dynamic route, `generateStaticParams`, `generateMetadata` |
| `src/components/sections/ProductGallery.tsx` | client | thumbnail rail + main image |
| `src/components/sections/ProductPurchasePanel.tsx` | client | title, price, weight, message, pincode |
| `src/components/sections/ProductReviews.tsx` | server | "Ratings & Reviews" block |
| `src/components/sections/RelatedRail.tsx` | server | "You may also like" |

## Data — this route is fully dynamic

```ts
import { catalog, getProduct, getRelated } from "@/data/catalog";
```

- `generateStaticParams()` returns `catalog.map(p => ({ category: p.category, slug: p.slug }))`
  — 50 pages, all prerendered.
- The page resolves its product with `getProduct(slug)` and calls `notFound()` when missing.
- `generateMetadata` sets the title to `${product.name} | Bakingo` and the description to
  `product.description`, with `openGraph.images = [product.image]`.
- Related products come from `getRelated(slug)` — the real "You may also like" slugs, padded
  from the catalog so the rail is never short.
- **Nothing about a product may be hardcoded.** Every field (name, price, gallery, weights,
  SKU, chef's word, breadcrumbs) comes from the catalog row.

## Page layout (exact, 1440px)

```
main
└ .product-detail-conatiner
  ├ .breadcrumb-container-details   height 22 — Home > Cake Delivery > <product name>
  ├ .productPage
  │ └ .rowContainer                 width 1296, flex
  │   ├ .columnContainer            width 674, position: sticky (gallery)
  │   └ .columnContainerContent     width 622 (purchase panel + reviews)
  ├ hr.section-separator            full width, 1px
  ├ .more-prods-container           height 410 — You may also like
  └ .quick_links                    the shared QuickLinks block
```

`.rowContainer` gap is the gallery's own `padding-right: 27px`.
`.columnContainer` is `position: sticky` — it pins while the right column scrolls.

## ProductGallery (`.cake-images`, 673.9 × 637)

`padding-right: 27px; display: flex; gap: 19px; position: relative;`

- **Thumbnail rail** `ol.image-small`: `width: 117.73px; height: 621px; margin-bottom: 16px;`
  `display: flex; flex-direction: column; gap: 20px; overflow-y: auto; min-width: 100px;`
  Each thumb is `117.73 × 117.73`, `border-radius: 7px`, `object-fit: cover`, `cursor: pointer`.
- **Main image** `.image-big`: fills the remaining width, `object-fit: cover`,
  `transition: all 200ms`, `cursor: crosshair`, and brightens slightly on hover
  (`hover:brightness-105`). The target implements a zoom lens — **render the hover brightness
  only, skip the lens**.
- Clicking a thumbnail swaps the main image. First image active on load.
- **Badges over the gallery** (absolutely positioned, top-left of the main image):
  - `.ticker-container.best_seller.detail` — `background: rgb(246, 179, 8)`,
    `border-radius: 0 7px 0 7px`, `height: 22px`, `padding: 0 9px`; label `Best Seller`
    at `12.96px/19.44px`, weight 600, tracking -0.12px, `#070707`.
    Render only when `product.tag` is non-empty.
  - `.eggStatus-container.detail` — the green square mark plus an `EGGLESS` caption at
    `8px/8.64px`, weight 600, tracking -0.08px, `#fff`, uppercase, centred.
    Render only when `product.eggless`.

## ProductPurchasePanel (`.product-content`, width 622)

Vertical order and exact type:

| Element | Styles |
|---|---|
| `h1.product-heading` | 24px, weight 600, `#070707`, height 28 |
| `.product__review-cnt` | rating `4.9` then `(2.4K Reviews)` as a link, 14px, height 17, mt 11 |
| `.price-content` | 24px, weight 600, `#070707`; the `(Inclusive of GST)` note at 12px `#515151` |
| `.wishlist-container.detail` | 29×29 heart on the right of the price row |
| `.product-description` | 16px/22px, `#515151`, mt 20 |
| `.attr-container` (weight) | mt 20; label `Select Weight` 18px weight 600; `Serving info` link 14px `#fc0015` |
| `.weight-attr-container` | flex row, gap 12, each option a 7px-radius pill, `border: 1px solid #ebebeb`, padding `8px 16px`, 16px weight 500. Selected: border + text `#fc0015`, background `#fff5ee`. Sub-label (`4 - 5 People`) 12px `#515151` |
| `.attr-container` (message) | label `Cake Message`, counter `0/25` at 12px `#515151` |
| `.input-cakemessage` | height 48, full width, `border: 1px solid #ebebeb`, radius 7px, padding 0 16px, `maxLength={25}` |
| `.delivery-content` | label `Delivery Location*` 18px weight 600; a pincode input + `Check Availability` button; helper `Available in limited cities*` 12px `#515151` |
| `.sku-photo` | `SKU Number` 13px `#515151`, value 13px `#070707` |
| `.Rectangle-1510` | chef block: `"In Our Chef's Word"` 16px weight 600 and the quote 14px/18px `#515151`, on a `#fff5ee` panel with 8px radius and 20px padding |

Interactive state (all client-side, no network):
- Weight selection defaults to the first option; selecting one updates the pill styling.
- The cake message input updates the `n/25` counter live.
- `Check Availability` validates a 6-digit pincode and shows either
  "Delivery available in your area." (`#1c9550`) or the target's error copy
  "Please enter your delivery location to proceed" (`#fc0015`). No real lookup.

## ProductReviews (`.review-rating-container`, width 622, height 168)

Heading `Ratings & Reviews`, the aggregate `4.9/5`, a `+263` overflow chip and a row of small
review thumbnails. Build from the catalog row's `rating` / `reviews`; the thumbnails are the
product's own gallery images.

## RelatedRail (`.more-prods-container`, height 410)

Heading `You may also like` on the left with a `View All` link on the right, then a horizontal
rail of the homepage-sized `ProductCard` (249px) — reuse `@/components/site/ProductCard`.
Feed it `getRelated(slug)`.

## Breadcrumbs

From `product.breadcrumbs` (already deduped): `Home > Cake Delivery > <product name>`.
Reuse `@/components/site/Breadcrumbs`.

## Responsive

- **Desktop (≥1024px):** two columns as specified; gallery sticky.
- **Tablet (768–1023px):** columns stack — gallery on top (thumbnail rail becomes a horizontal
  row under the main image, thumbs 88×88), panel below at full width; sticky is dropped.
- **Mobile (≤480px):** same stack; main image is full-bleed square, thumbs 64×64,
  `h1` 20px, price 20px, weight pills wrap, the related rail scrolls horizontally.
