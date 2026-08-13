# BestsellersSection + ProductCard Specification

Two files, one builder. `ProductCard` is a pure presentational server component; the section owns
the pager state.

## Overview
- **Target files:**
  - `src/components/site/ProductCard.tsx` (server component)
  - `src/components/sections/BestsellersSection.tsx` (client component — `"use client"`)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-bestsellers.png`
- **Interaction model:** click-driven paged carousel (2 pages, dots below) + card hover
- **Data:** `import { bestsellers, bestsellersHeading } from "@/data/products"` — 20 cards
- **Shared:** `SectionHeading` from `@/components/site/SectionHeading`,
  `HeartIcon` from `@/components/icons`

## DOM structure

```
section.content_9                        bg-white py-[52px] flex flex-col
├ SectionHeading                          eyebrow "india loves" + star, subtitle "Bestsellers…"
├ div.product-cards.cards-slider          pt-[53px] px-[65px] pb-[10px] flex gap-[29px] overflow-hidden
│ └ ×N ProductCard                        w-[249px] flex-shrink-0
├ a "VIEW ALL"                            centered underlined link
└ ul dots                                 2 dots, same styling as the hero dots

ProductCard
└ article.product-card                   w-[249px] h-[333px] flex flex-col relative cursor-pointer
  ├ div.product-card-image               w-[250px] h-[250px] relative
  │ ├ div.eggStatus-container            absolute top-[14px] left-[12px] w-[15px] h-[15px] z-[1]
  │ │ └ div.status-square.eggless        w-[15px] h-[15px] bg-white p-[2px] flex center
  │ │   └ inner dot                      green #00a651 circle
  │ └ img.product-img                    w-[250px] h-[250px] rounded-[8px] object-cover
  ├ p.product-card-title                 name, single line, ellipsis
  ├ div.pnw-container                    flex justify-between items-center h-[24px]
  │ ├ div.re-price-container             flex items-baseline gap-[7px]
  │ │ └ span.re-price                    "₹549"
  │ └ div.wishlist-container             w-[20px] h-[24px]
  │   └ HeartIcon                        20×20
  └ div.rnr-container                    mt-[5px] flex items-center gap-[5px] h-[16px]
    ├ div.re-review                      flex items-center gap-[3px]
    │ ├ span.bk-rating                   "4.9"
    │ └ span.product-star                "★"
    └ span.bk-review                     "(8.8K Reviews)"
```

## Computed styles (exact, 1440px)

### `section.content_9`
`background-color: rgb(255, 255, 255); width: 1440px; height: 882.75px;`
`padding: 52px 0; display: flex; flex-direction: column;`

### `.heading-title-text` star icon (`/images/re-star.png`)
`position: absolute; top: -15px; left: -41px; width: 56px; height: 54px;`
(already handled by `SectionHeading`'s `starIcon` prop)

### `.product-cards.menu-item-cards.cards-slider`
`padding: 53px 65px 10px; width: 1440px; height: 398px;`
`display: flex; gap: 29px; overflow-x: hidden;`

### `.product-card.homepage_product`
`width: 249px; height: 333px; display: flex; flex-direction: column;`
`position: relative; cursor: pointer; flex-shrink: 0;`

### `.product-card-image`
`width: 250px; height: 250px; position: relative;`

### `img.product-img`
`width: 250px; height: 250px; border-radius: 8px; aspect-ratio: 1 / 1;`
`background-color: rgb(248, 249, 250); transition: opacity 0.3s ease-in-out; object-fit: cover;`

### `.eggStatus-container.homepage`
`position: absolute; top: 14px; left: 12px; width: 15px; height: 15px; z-index: 1;`
`display: flex; flex-direction: column; align-items: center; gap: 3px;`

### `.status-square.eggless.homepage`
`background-color: rgb(255, 255, 255); padding: 2px; width: 15px; height: 15px;`
`display: flex; justify-content: center; align-items: center;`
`border: 1px solid rgb(0, 166, 81);` — inner mark is a `#00a651` filled circle (~7px).

### `p.product-card-title`
`font-size: 17.28px; font-weight: 600; line-height: 20px; letter-spacing: -0.22px;`
`color: rgb(7, 7, 7); text-transform: capitalize; margin: 8px 0 10px;`
`width: 249px; height: 20px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`

### `.pnw-container`
`width: 249px; height: 24px; display: flex; justify-content: space-between; align-items: center;`

### `.re-price-container`
`display: flex; align-items: baseline; gap: 7px; height: 18px;`

### `span.re-price`
`font-size: 18px; font-weight: 600; line-height: 18px; letter-spacing: -0.24px;`
`color: rgb(7, 7, 7); text-transform: uppercase;`
The stored value already includes the ₹ glyph.

### `.wishlist-container`
`width: 20px; height: 24px;` — icon `width: 20px; height: 20px;`
`transform: scaleX(-1) scaleZ(-1)` on the target; render the icon unflipped (visually identical
for this symmetric heart). `transition: opacity 0.3s ease-in-out;`

### `.rnr-container`
`margin-top: 5px; width: 249px; height: 16px; display: flex; align-items: center; gap: 5px;`
`.re-review` — `display: flex; align-items: center; gap: 3px;`
Rating + star + review text all render at `font-size: 13px; font-weight: 600; letter-spacing: -0.15px;`
Star colour `#00a651`; rating and review text colour `rgb(81, 81, 81)`.

### VIEW ALL link
Centred below the row, `text-decoration: underline`, `color: rgb(7, 7, 7)`, `font-size: 16px`,
`font-weight: 600`. Links to `/cakes`.

### Dots
Two dots, styled exactly like the hero dots:
`w-[9px] h-[9px] rounded-full mx-[8px] inline-block cursor-pointer transition-opacity duration-[250ms]`
inactive `background: rgba(255, 255, 255, 0.75)` — **but this section is on a white background**,
so the measured inactive dot reads as a light grey ring. Use `background: #e5e5e5` for inactive
and `background: rgb(252, 0, 21)` for the selected dot.

## States & behaviors

### Paging
- 20 cards, **10 per page**, 2 pages. Only ~5 cards are visible at 1440px; the row is a flex
  track whose transform shifts by one page width per dot.
- Track transition: `transition: transform 4s cubic-bezier(0, 1, 0.3, 1) 0.25s, opacity 0.3s ease-out 0.25s;`
  That 4s duration is the site's actual value — keep it; it produces the slow glide.
- **No autoplay.** Page changes only on dot click.

### Card hover
```css
.card1:hover     { border-radius: 8px; box-shadow: 0 0 10px 0 rgba(0,0,0,.12);
                   border: 4px solid #fcc4c5; }
.cardName1:hover { border-radius: 8px; border-color: #ff5f5d; }
.list-productcard { transition-duration: .3s; }
@media (max-width: 460px) { .list-productcard:hover { transform: none; } }
```
Apply the shadow + `4px solid #fcc4c5` border on the card wrapper at hover, with a 0.3s transition.
Compensate the border with a matching negative margin so the layout does not shift.

## Content
`bestsellers` (20 items) and `bestsellersHeading`
(`eyebrow: "india loves"`, `subtitle: "Bestsellers from across the country"`).
Every card is eggless (`eggless: true`). Prices range ₹529–₹1479, ratings 4.8–5,
review counts like `"8.8K"`, `"31"`, `"1.0K"`.
Card 1: "Rich Chocolate Truffle Cake", ₹549, 4.9, 8.8K, `/p/cake/choco-truffle-cake0005choc`.

## Responsive
- **Desktop (1440px):** cards 249px wide, gap 29px, rail padding `53px 65px 10px`, section 883px tall.
- **Tablet (768px):** section height 605px, padding `50px 0 45px`; cards shrink to ~200px,
  rail padding drops to `32px 20px`; ~3 cards visible.
- **Mobile (390px):** section height 553px, same padding as tablet; cards ~160px wide, gap 14px;
  title `15px`, price `16px`; ~2 cards visible. Hover effects disabled below 460px.
