# HeroCarousel Specification

## Overview
- **Target file:** `src/components/sections/HeroCarousel.tsx` (client component — `"use client"`)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-hero.png`
- **Interaction model:** time-driven autoplay (5000ms) + dot click
- **Data:** `import { heroSlides } from "@/data/hero"` — 5 slides
- **No dependencies.** Do **not** install a carousel library; the original uses
  `react-responsive-carousel` but a plain translate track reproduces it exactly.

## DOM structure

```
section.content_7                w-full bg-[#ffe8ee] flex flex-col justify-center relative
└ div.carousel-wrapper           w-full h-[672.75px]
  └ div.carousel-slider          w-full h-full overflow-hidden relative
    ├ div.slider-wrapper         w-full h-full overflow-hidden
    │ └ ul.slider                w-full h-full flex relative, transform: translateX(-index*100%)
    │   └ ×5 li.slide            min-w-full h-full relative text-center
    │     └ a[href] > img        w-full h-full object-cover
    └ ul.control-dots            absolute bottom-[23px] w-full h-[24px] text-center z-[1]
      └ ×5 li.dot                inline-block w-[9px] h-[9px] rounded-full mx-[8px]
```

## Computed styles (exact, 1440px)

### `.content_7`
`background-color: rgb(255, 232, 238); width: 1440px; height: 672.75px;`
`display: flex; flex-direction: column; justify-content: center; position: relative;`
Height is driven by the banner aspect ratio — set `aspect-ratio` from the slide images
(3668×1714 ≈ 2.14) or hard-code `height: 672.75px` on desktop. Prefer the aspect ratio so the
scalloped bottom of the artwork lines up at every width.

### `.slider-wrapper.axis-horizontal`
`width: 1440px; height: 672.75px; overflow: hidden; transition: height 0.15s ease-in;`

### `ul.slider.animated`
`width: 100%; height: 100%; display: flex; position: relative;`
`transition: 0.5s ease-in-out;` (the library's own rule is `.35s ease-in-out`; the measured
computed value on the homepage is **0.5s ease-in-out** — use 0.5s)
`transform: translateX(-<activeIndex> * 100%)`

### `li.slide`
`width: 1440px; height: 672.75px; min-width: 100%; position: relative; text-align: center;`
Image fills the slide: `width: 100%; height: 100%; object-fit: cover;`

### `ul.control-dots`
`position: absolute; bottom: 23px; width: 100%; height: 24px; text-align: center; z-index: 1;`
`margin: 0; padding: 0;`

### `li.dot` (inactive)
`display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin: 0 8px;`
`background-color: rgba(255, 255, 255, 0.75); opacity: 1;`
`transition: opacity 0.25s ease-in; cursor: pointer; box-shadow: none;`

### `li.dot.selected` (active)
identical **except** `background-color: rgb(252, 0, 21);`

Note: the upstream library stylesheet says `opacity: .3` + a `box-shadow`, but the homepage
overrides both — the measured values above (opacity 1, no shadow, red active dot) are correct.

## States & behaviors

### Autoplay
- **Interval: 5000ms** (measured deltas 4979ms / 5029ms), forward, infinite loop.
- `useEffect` with `setInterval`; clear on unmount.
- Clicking a dot sets the index **and restarts the timer**.
- Wrap with modulo: `next = (index + 1) % heroSlides.length`.
- Respect `prefers-reduced-motion: reduce` by skipping the interval.

### Arrows
The DOM contains `.control-arrow control-prev/next` but they carry `control-disabled` and compute
to `opacity: 0` on this page. **Do not render arrows.**

### Hover
No hover state on the slides. Dots: `opacity` transition only (already at 1, so visually inert) —
keep the `transition: opacity .25s ease-in` for fidelity.

## Content (verbatim, from `@/data/hero`)

| # | alt | href | image |
|---|-----|------|-------|
| 1 | Anniversary Cakes | `/anniversary-cakes` | `/images/anniversary-desktop_0.png` |
| 2 | Gourmet Cakes | `/gourmet-collection` | `/images/gaourmet-banner-web_desktop-banner_1.png` |
| 3 | Theme Cakes | `/designer-cakes` | `/images/3668x1714-theme-cake-20-2-.png` |
| 4 | Birthday Cakes | `/birthday-cakes` | `/images/banner-birthday-web.png` |
| 5 | Regular Cakes | `/cakes` | `/images/regular-cake-desktop-20-1-.png` |

Slide 1 is active on load. Each slide is wrapped in a `next/link` to its `href`.
Use `next/image` with `priority` on the first slide only, `sizes="100vw"`.

The banner artwork already contains its own headline typography ("CRAFTED LIKE FINE ART" etc.)
and the ORDER NOW button — **do not overlay any text or buttons.** The slide is just the image.

## Responsive
- **Desktop (1440px):** height 672.75px, dots at `bottom: 23px`.
- **Tablet (768px):** height 597px — same structure, image still `object-fit: cover`.
- **Mobile (390px):** height 597px, same structure. Dots stay at the same offset.
- The section never stacks or changes layout — only the height follows the image aspect ratio.
