# SeoAccordion Specification

## Overview
- **Target file:** `src/components/sections/SeoAccordion.tsx` (client component — `"use client"`)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-seolinks.png`
- **Interaction model:** click-driven accordion (chevron toggles the SEO copy)
- **Data:** `import { seoHeading, seoParagraphs, seoLinks } from "@/data/seo"`

## DOM structure

```
section#seo-container.sub-footer-container   bg-[#fff5ee] pt-[32px] pb-[20px] flex flex-col overflow-hidden
└ div.footer-about-us                        mx-[72px]
  ├ button.about-us-header                   pb-[44px] mb-[34px] flex items-center w-full
  │ ├ h1.about-us-title                      the heading, flex-1, centred
  │ └ svg chevron                            19.7 × 20
  └ div.seo-content                          mx-auto w-[90%] — collapsed by default
    ├ ×16 p                                  SEO paragraphs
    └ link groups                            51 flavour/city links
```

## Computed styles (exact, 1440px)

### `#seo-container.sub-footer-container`
`background-color: rgb(255, 245, 238); width: 1440px; height: 100px;`
`padding: 32px 0 20px; display: flex; flex-direction: column;`
`overflow: hidden; color: rgb(7, 7, 7); text-align: center;`
The **100px collapsed height** is the closed state — the content below the header is clipped by
`overflow: hidden`.

### `.footer-about-us`
`margin: 0 72px; width: 1296px;`

### `.about-us-header`
`padding-bottom: 44px; margin-bottom: 34px; width: 1296px; height: 70.078px;`
`display: flex; align-items: center; text-align: center;`

### `h1.about-us-title`
`font-size: 22px; font-weight: 600; line-height: 25.08px; letter-spacing: -0.22px;`
`color: rgb(7, 7, 7); text-align: center; width: 1276.3px;`

### chevron `svg`
`width: 19.7031px; height: 20px; cursor: pointer;`
Points **down** when collapsed, rotates 180° when expanded.
Add `transition: transform 0.3s ease`. Draw it inline (a simple chevron path, `stroke: #070707`)
— it is not in `icons.tsx`.

### `.seo-content`
`margin: 0 auto; width: 90%; color: rgb(7, 7, 7); font-size: 16px; line-height: 24px;`
Paragraph spacing ~12px; link rows are inline-wrapped lists.

## States & behaviors

### Accordion
- **Trigger:** click on the header row (title + chevron).
- **Collapsed (default):** container height 100px, `.seo-content` not visible.
- **Expanded:** container grows to fit; `.seo-content` visible; chevron rotated 180°.
- **Transition:** animate with `grid-template-rows: 0fr → 1fr` (or `max-height`) over
  `0.3s ease`; the target itself just toggles, so any smooth 0.3s reveal is faithful enough.
- Use a real `<button>` with `aria-expanded` and `aria-controls`.

## Content
- **Heading (verbatim):**
  `Bakingo - Your Trusted FSSAI Certified Online Bakery for Every Celebration`
  Rendered as an `<h1>` on the target — keep it an `<h1>`.
- **`seoParagraphs`** — 16 paragraphs of marketing copy. First one begins:
  *"We are exactly what you are looking for. Yes, we are an FSSAI certified online cake and Bakery
  Company that specializes in delivering absolutely lip-smacking delicacies…"*
  Render all 16 in order.
- **`seoLinks`** — 51 links (flavours then cities): Red Velvet, Butterscotch, Strawberry,
  Chocolate, Vanilla, Blueberry, Pineapple, Coffee, Mango, Ferrero Rocher, … Render them as a
  wrapped inline list separated by a thin `|` divider, `font-size: 14px`, `color: rgb(7, 7, 7)`.

## Responsive
- **Desktop (1440px):** margins `0 72px`, title 22px, collapsed height 100px.
- **Tablet (768px):** margins `0 20px`, title `18px/21px`, collapsed height ~86px.
- **Mobile (390px):** margins `0 16px`, title `15px/19px` and left-aligned with the chevron
  pinned right, collapsed height ~76px; link list font `12px`.
