# CategoryRail Specification

## Overview
- **Target file:** `src/components/sections/CategoryRail.tsx` (server component — no client JS)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-categories.png`
- **Interaction model:** static; horizontally scrollable overflow rail (native scroll, no JS)
- **Data:** `import { categoryTiles } from "@/data/categories"` and
  `import { categoryHeading } from "@/data/categoriesHeading"`
- **Shared:** `import { SectionHeading } from "@/components/site/SectionHeading"`

## DOM structure

```
section.content_4                     bg-[#ffe8ee] py-[52px] flex flex-col justify-center
├ SectionHeading                      eyebrow "menu" / subtitle "What will you wish for?"
└ div.category-cards.cards-slider     pt-[53px] px-[65px] flex gap-[29px] overflow-x-auto
  └ ×9 a.category-card                w-[227px] flex flex-col items-center gap-[18px]
    ├ div.category-card-image-container  w-[227px] h-[286px]
    │ └ img.category-img                 w-[227px] h-[286px] rounded-[12px] object-cover
    └ span.category-card-title           uppercase caption
```

## Computed styles (exact, 1440px)

### `section.content_4`
`background-color: rgb(255, 232, 238); width: 1440px; height: 586px;`
`padding: 52px 0; display: flex; flex-direction: column; justify-content: center;`
There is also a decorative background image on this container on the live site
(`/images/bk-half-3e395730.png`, `no-repeat 0% 0% / 100% 100%`) — apply it only if it does not
change the flat pink appearance; the visible result at 1440px is the flat `#ffe8ee` fill, so a
plain background colour is acceptable and preferred.

### `.category-cards.cards-slider`
`padding: 53px 65px 0; width: 1440px; height: 394px;`
`display: flex; gap: 29px; overflow-x: auto; overflow-y: hidden;`
Hide the scrollbar with the project utility `no-scrollbar` (already in `globals.css`).

### `a.category-card`
`width: 227px; height: 341px; display: flex; flex-direction: column; align-items: center;`
`gap: 18px; cursor: pointer; flex-shrink: 0;`

### `.category-card-image-container`
`width: 227px; height: 286px;`

### `img.category-img`
`width: 227px; height: 286px; border-radius: 12px; object-fit: cover;`

### `span.category-card-title`
`font-size: 22px; font-weight: 600; color: rgb(7, 7, 7);`
`text-transform: uppercase; text-align: center; height: 31px;`

## States & behaviors
- No hover rule beyond the global `a:hover { text-decoration: none }`.
- No JS. The rail scrolls natively; 9 tiles at 227px + 29px gap overflow 1440px, so roughly
  5.5 tiles are visible and the rest scroll into view.
- No arrows, no dots on this section.

## Content (verbatim, from `@/data/categories`, in order)

| label | href | image |
|-------|------|-------|
| CLASSIC | `/cakes` | `/images/regular-cake.jpg` |
| Bento | `/bento-cakes` | `/images/bento-cake_1.jpg` |
| Kids | `/cakes/for-kids` | `/images/kids-theme-cake-20-2-_0.jpg` |
| GOURMET | `/gourmet-cakes` | `/images/signature.jpg` |
| PHOTO CAKES | `/photo-cakes` | `/images/photo-20cake_4_2.jpg` |
| DESIGNER | `/designer-cakes` | `/images/theme-cake-20-2-.jpg` |
| 60 Minutes | `/60-minutes-delivery` | `/images/60min-delivery-20-1-_0.jpg` |
| Desserts | `/all-desserts` | `/images/dessert-20-2-.jpg` |
| Hampers | `/bakery-baskets` | `/images/hamper-20-2-.jpg` |

Every image has `alt="Cake Category"` on the target. Keep that alt.
The labels are stored with mixed casing but render uppercase via CSS — render the stored string
and let `uppercase` do the work.

Heading content: eyebrow `"menu"`, subtitle `"What will you wish for?"`.

## Responsive
- **Desktop (1440px):** section height 586px, padding `52px 0`, rail padding `53px 65px 0`,
  tiles 227×286, gap 29px.
- **Tablet (768px):** section height 940px, padding `52px 0 31px` — the rail **wraps into a grid**
  rather than scrolling: tiles shrink and lay out in rows. Use a 3-column grid at ≤768px with the
  same 12px image radius; tile width becomes fluid (`minmax(0, 1fr)`), image keeps a 227/286
  aspect ratio.
- **Mobile (390px):** section height 624px, same padding as tablet, **2-column** grid,
  caption font-size drops to `16px`.
- Heading sizes at ≤768px: eyebrow `28px/32px`, subtitle `18px/22px` (handled by `SectionHeading`).
