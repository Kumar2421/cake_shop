# PromiseSection Specification

## Overview
- **Target file:** `src/components/sections/PromiseSection.tsx` (server component)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-promise.png`
- **Interaction model:** fully static — no hover, no JS
- **Data:** `import { promiseItems, promiseHeading } from "@/data/promise"`
- **Shared:** `SectionHeading` from `@/components/site/SectionHeading`

## DOM structure

```
section.content_1                 bg-[#fff5ee]/70 pt-[41px] pb-[77px] flex flex-col justify-between
├ SectionHeading                  eyebrow "our promise" / subtitle "There's no secret spell…"
└ ul.promise-container            flex justify-center gap-[42px]
  └ ×4 li.feature-item            w-[189px] flex flex-col items-center justify-end
    ├ img                         per-item size, see table
    ├ h5.feature-title            uppercase-ish title
    └ p.feature-description       supporting line
```

## Computed styles (exact, 1440px)

### `section.content_1`
`background-color: rgba(255, 245, 238, 0.7); width: 1440px; height: 426px;`
`padding: 41px 0 77px; display: flex; flex-direction: column; justify-content: space-between;`
Background art on the live site: `/images/bk-half-3e395730.png`,
`no-repeat scroll 0% 0% / 100% 100%` behind the cream tint. Include it as a `background-image`
under the `rgba(255,245,238,.7)` layer.

### `ul.promise-container`
`width: 1440px; height: 173.406px; display: flex; flex-direction: row;`
`justify-content: center; gap: 42px; margin: 0; padding: 0; list-style: none;`

### `li.feature-item`
`width: 189px; height: 173.406px; display: flex; flex-direction: column;`
`justify-content: flex-end; align-items: center;`

### images (each a different intrinsic size — do not normalise)
| item | file | width | height |
|------|------|-------|--------|
| ON-TIME DELIVERY | `/images/on-time-delivery_0.png` | 139px | 78px |
| 500+ DESIGNS | `/images/promise-design_0.png` | 97px | 77px |
| 2 CR+ ORDERS | `/images/promise-order_0.png` | 97px | 77px |
| BAKED FRESH | `/images/promise-baked_0.png` | 97px | 77px |

All four carry `alt="On Time Delivery"` on the target — keep the stored `alt`.

### `h5.feature-title`
`font-size: 20px; font-weight: 600; line-height: 20px; letter-spacing: -0.2px;`
`color: rgb(7, 7, 7); text-transform: capitalize; text-align: center;`
`margin: 15px 0 10px; height: 20px;`
Note: `text-transform: capitalize` on already-uppercase source text renders as uppercase —
render the stored string (`"ON-TIME DELIVERY"`) as-is.

### `p.feature-description`
`font-size: 16px; font-weight: 500; line-height: 19.2px; letter-spacing: -0.16px;`
`color: rgb(81, 81, 81); text-align: center; width: 189px;`

## States & behaviors
None. No hover, no transitions, no scroll reveal. This is the simplest section on the page.

## Content (verbatim)

| title | body |
|-------|------|
| ON-TIME DELIVERY | Because no one likes late surprises. |
| 500+ DESIGNS | Wishes come in all shapes and sizes. |
| 2 CR+ ORDERS | You can close your eyes and trust us. |
| BAKED FRESH | Spreading smiles, one slice at a time. |

Heading: eyebrow `"our promise"`, subtitle `"There’s no secret spell—only honest, hard work!"`
(note the curly apostrophe and em dash — copy exactly).

## Responsive
- **Desktop (1440px):** as above — 4 columns, gap 42px, section 426px tall.
- **Tablet (768px):** section height 304px, padding `44px 0 21px`, wrapper `gap: 19px`;
  the 4 items stay in one row but shrink: image ~72px wide, title `16px`, body `13px/16px`.
- **Mobile (390px):** section height 322px, same padding/gap; items become a **2×2 grid**,
  each cell centred, image ~72px, title `14px`, body `12px/15px`.
