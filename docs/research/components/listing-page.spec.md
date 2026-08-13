# Best Sellers listing page Specification

Route: `/best-seller`. Source: `https://www.bakingo.com/best-seller`.
Reference: `docs/design-references/www.bakingo.com/best-seller/`.

## Files

| File | Kind | Role |
|------|------|------|
| `src/app/best-seller/page.tsx` | server | page shell, metadata, section order |
| `src/components/site/ListingCard.tsx` | server | 306px product card (listing variant) |
| `src/components/sections/ListingFilters.tsx` | client | Sort button + flavour chips, owns filter state |
| `src/components/sections/ProductGrid.tsx` | client | 4-up grid, applies the active chip + sort |
| `src/components/sections/ReviewStrip.tsx` | server | "4.9 ★ (32.4K Reviews)" carousel strip |
| `src/components/site/Breadcrumbs.tsx` | server | shared `Home > Best Seller` trail |
| `src/components/sections/QuickLinks.tsx` | server | 8-group SEO link block (shared with the product page) |

## Data

```ts
import { catalog } from "@/data/catalog";           // 50 CatalogProduct rows
import {
  listingTitle,        // "Best Sellers"
  listingChips,        // Pineapple, Butterscotch, Fruit, Chocolate, Red velvet, 60 Minute Delivery
  listingSortLabel,    // "Sort"
  listingBreadcrumbs,  // Home > Best Seller
  listingSeoHeading, listingSeoParagraphs,
  quickLinksHeading, quickLinkGroups,
} from "@/data/listing";
```

Never hardcode product, chip or link content.

## Page layout (exact, 1440px)

```
main
├ h1.listing-title-text          top 153, height 36
├ .listing-page-container        width 1296, centred
│ ├ .listing-filter-container    height 37, mb 34, flex justify-between items-center
│ ├ .items-wrapper               the product grid
│ ├ .reviewCardContainer         height 448
│ └ .breadcrumb-container        height 22
├ #seo-container                 the existing SeoAccordion, fed listing SEO copy
└ .quick_links                   height 682
```

Container: `width: 1296px; margin: 0 auto;` — same gutter as the homepage sections.

### `h1.listing-title-text`
`font-size: 30px; font-weight: 600; color: rgb(7, 7, 7); text-align: center;`
`height: 36px; margin: 25px 0 0;`

### `.listing-filter-container`
`width: 1296px; height: 37px; margin-bottom: 34px;`
`display: flex; justify-content: space-between; align-items: center;`

### `.sortByTitle-scroll` (the chip row)
`display: flex; gap: 14px; height: 37px;` — horizontally scrollable, `no-scrollbar`.

### chip — `.border-button-container.sortByTitle`
`font-size: 18px; font-weight: 500; color: rgb(7, 7, 7); text-transform: capitalize;`
`text-align: center; padding: 5px 27px 7px; height: 37px; border-radius: 7px;`
`display: flex; justify-content: center; align-items: center; white-space: nowrap;`
`border: 1px solid rgb(235, 235, 235); transition: background-color 0.3s, color 0.3s; cursor: pointer;`
**Active chip:** background `rgb(252, 0, 21)`, colour `#fff`, border colour `rgb(252, 0, 21)`.
The Sort control is the same pill plus a 21×21 icon (`/images/updownicon-cfbe7839.svg`) and
`gap: 10px`; it sits first in the row.

### grid — `.items-wrapper`
`width: 1296px;` 4 columns of 306px with a 24px column gap; each card carries
`margin-bottom: 38px`. Use `grid grid-cols-4 gap-x-[24px] gap-y-[38px]`.

## ListingCard (exact)

```
article.product-card.listing_product    w 306, h 390.281, flex col, relative, cursor-pointer
                                        transition: transform .3s ease-in-out
├ .product-card-image                   w 306, h 306, relative
│ ├ .eggStatus-container.listing        absolute top 14 left 14, 17.27×17.27, z-1
│ │ └ .status-square.eggless.listing    white, padding 2, flex centre
│ │   └ .status-circle                  9.27×9.27, border-radius 10px, bg rgb(0,166,81)
│ ├ .image-gallery                      w 306, h 306, border-radius 7px, overflow hidden
│ │ └ img                               object-cover, fills
│ └ .ticker-container.best_seller       absolute top 284 left 0, h 22, padding 0 9px
│                                       bg rgb(246, 179, 8), border-radius 0 7px 0 7px
│   └ span                              12.96px/19.44px, weight 600, tracking -0.12px, #070707
├ p.product-card-title                  17.28px/17.28px, weight 600, tracking -0.22px, #070707
│                                       capitalize, mt 8, w 306, one line, ellipsis
├ .pnw-container                        mt 12, h 24, flex justify-between items-center
│ ├ .re-price-container                 flex items-baseline gap 7, h 18
│ │ └ .re-price                         18px/18px, weight 600, tracking -0.24px, #070707
│ └ .wishlist-container                 20×24, HeartIcon 20×20
└ .rnr-container                        rating row, same as the homepage card
```

Differences from the existing `ProductCard` (homepage, 249px): width 306 not 249, image 306 not
250, title `line-height: 17.28px` and `margin-top: 8px` with **no bottom margin**, price row has
`margin-top: 12px`, the eggless mark is 17.27px not 15px, and the card adds the ticker ribbon.
Build `ListingCard` as its own component — do not try to parameterise `ProductCard`.

Hover (from the target CSS): `.card1:hover { border-radius: 8px; box-shadow: 0 0 10px 0
rgba(0,0,0,.12); border: 4px solid #fcc4c5; }`, `transition-duration: .3s`, disabled below 460px.

Each card links to `product.href` (`/p/<category>/<slug>`).

## Filtering behaviour

- Chips are **single-select toggles**. Clicking an active chip clears it.
- A chip matches a product when its label appears in the product `name` or `description`
  (case-insensitive). `60 Minute Delivery` has no catalog field — treat it as a no-op filter that
  selects nothing extra and simply highlights; do not hide products for it.
- Sort cycles: default (catalog order) → price ascending → price descending. Parse the price with
  `Number(price.replace(/[^\d]/g, ""))`.
- Filtering is client-side over the imported catalog; no network calls.
- When a filter empties the grid, render "No cakes match this filter." centred at 18px `#515151`.

## ReviewStrip (`.reviewCardContainer`, height 448)

Header row: `4.9` + `★` + `(32.4K Reviews)` then a `View All` link on the right.
Below it a horizontally scrolling row of review cards; each holds a quote in quotes, the product
name, the reviewer name with a `Verified` chip, a city, a date and an occasion.
The extracted raw text is in `docs/research/www.bakingo.com/best-seller/content.json` under
`reviewCard.raw` — parse what you need from `sections/listing-reviews.json` if you want the exact
DOM. **Only the aggregate header and 4 sample review cards are in scope**; build them from a
small `const` array in the component and mark it clearly as sampled review copy.

## Breadcrumbs

`Home > Best Seller`, `height: 22px`, `font-size: 14px`, `color: rgb(81, 81, 81)`,
current page not a link. Reuse for the product page.

## QuickLinks (`.quick_links`, height 682)

Heading block then 8 groups: TOP CAKE DELIVERY CITIES, Birthday Cakes For, Theme Cakes,
TRENDING CAKES BY TYPE, BEST CAKES BY FLAVOUR, Most Celebrated, Occasion Special Cakes,
Top Searches. Each group is a heading plus links joined by ` | ` separators, wrapping.
Heading: `font-size: 14px; font-weight: 700; text-transform: uppercase; color: rgb(7, 7, 7);`
Links: `font-size: 13px; color: rgb(81, 81, 81);` separator `|` in `#d9d9d9`.

## Responsive

- **Desktop (≥1024px):** 4 columns, container 1296px.
- **Tablet (768–1023px):** 3 columns, container `padding: 0 20px`, card width fluid,
  image keeps a 1:1 ratio, title 16px.
- **Mobile (≤480px):** 2 columns, `gap-x-[12px] gap-y-[24px]`, container `padding: 0 16px`,
  title 15px, price 16px, ticker 11px. The chip row scrolls horizontally.
