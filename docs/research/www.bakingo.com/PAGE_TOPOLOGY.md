# Page Topology — www.bakingo.com (homepage)

Captured at 1440×900, document height **4648px**. Root render tree:

```
body
└ #bakingoApp
  └ #bk-main-container.main-container
    ├ .bk-header            fixed, z-index 99, h=128 (74 + 54)
    ├ .main-body            top=128, h=4055
    │ └ .home-page-container
    │   ├ .content_7   top=128   h=673   Hero carousel
    │   ├ .content_4   top=801   h=586   Menu / category tiles
    │   ├ .content_9   top=1387  h=883   India Loves (bestsellers)
    │   ├ .content_1   top=2270  h=426   Our Promise
    │   ├ .content_6   top=2696  h=577   Magical Ticket CTA
    │   ├ div          top=3273  h=756   What's In Your Heart (social grid, 100 imgs)
    │   └ #seo-container.sub-footer-container top=4083 h=100  SEO link accordion
    └ .footer-container.landing_page  top=4183 h=465
```

Third-party overlays present on the live site but **out of scope** (chat widget, ad pixels,
Expertrec search suggest, ReactModal portals): `.woot--bubble-holder`, `#criteo-tags-div`,
`ci-suggest`, `#er_quick_view_container`.

## Section inventory

| # | Key | Selector | Name | Interaction model | Complexity |
|---|-----|----------|------|-------------------|-----------|
| 0 | `header` | `.bk-header` | Site header (red utility bar + white nav bar) | scroll-driven (nav row collapses) + hover dropdowns | high — split into 3 builders |
| 1 | `hero` | `.content_7` | Hero banner carousel, 5 slides | time-driven autoplay (5s) + dot click | medium |
| 2 | `categories` | `.content_4` | "Menu / What will you wish for?" category rail | horizontal scroll rail, hover lift | medium |
| 3 | `bestsellers` | `.content_9` | "India Loves" product carousel | paged carousel (2 pages) + hover | high — split card / section |
| 4 | `promise` | `.content_1` | "Our Promise" 4 icon columns | static | low |
| 5 | `cta` | `.content_6` | "The Magical Ticket" banner | static + button hover | low |
| 6 | `social` | `.home-page-container > div:nth-child(6)` | "What's In Your Heart?" Instagram grid | static grid, 2 rows × ~10 tiles, horizontal overflow | medium |
| 7 | `seolinks` | `#seo-container` | SEO description accordion | click-driven accordion | low |
| 8 | `footer` | `.footer-container` | Newsletter + link columns + socials | static + hover | medium |

## Layout architecture

- Single scroll container (`document`), no scroll-snap, `scroll-behavior: auto`, **no Lenis /
  Locomotive**. Native scrolling.
- Only fixed element in scope: `.bk-header` (`position: fixed; top: 0; z-index: 99`).
  `.main-body` starts at `top: 128px` — the page reserves header height with top padding/margin,
  it does not overlap.
- Content width: sections are full-bleed 1440px; inner content is centered with per-section
  max-widths (see individual specs).
- Backgrounds alternate: hero image → pink `#ffe8ee`-family tint (categories) → white
  (bestsellers) → cream `#fff5ee` (promise) → white (cta) → white (social) → cream (footer).
- `.content_4` and `.content_6` carry decorative background art
  (`/images/bk-half-3e395730.png`); the footer carries `/images/footer-background-0f80c8bb.svg`.

## Breakpoints in the target CSS

Bootstrap-ish plus custom. The ones that matter for the clone:

`480px`, `576px`, `768px`, `992px`, `1024px`, `1100px`, `1200px`, `1300px`, `1440px`.

Clone targets: **mobile ≤480**, **tablet ≤768**, **desktop ≥769** (default), with a
`min-width: 1300px` refinement for the wide hero/product rails.

## Tech stack (target)

- React SSR (Create React App chunk naming: `static/js/5.10eb634d.chunk.js`), Redux
  (`__PRELOADED_STATE__`), `react-responsive-carousel` (`.carousel-root`, `.control-dots .dot`,
  `.control-arrow`), `react-modal`, `react-toastify`, Font Awesome 5, Bootstrap grid remnants.
- Fonts: **Isidora Sans Alt** self-hosted, weights 100/300/400/500/600/700/900 + italics.
- Assets on `bkmedia.bakingo.com` and `bkassets.bakingo.com`; Instagram tiles on
  `scontent-*.cdninstagram.com`.

## Clone equivalents

| Target | Clone |
|--------|-------|
| CRA + Redux SSR | Next.js 16 App Router, server components + `"use client"` islands |
| `react-responsive-carousel` | hand-rolled client carousel (dots + 5s autoplay) — no dependency |
| Font Awesome | downloaded brand SVGs in `public/images/` + `src/components/icons.tsx` |
| Bootstrap grid | Tailwind v4 utilities |
| Self-hosted webfont | `next/font/local` over `public/fonts/isidorasansalt-*.woff2` |
