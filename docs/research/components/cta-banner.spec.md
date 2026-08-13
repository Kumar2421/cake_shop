# CtaBanner Specification

## Overview
- **Target file:** `src/components/sections/CtaBanner.tsx` (server component)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-cta.png`
- **Interaction model:** static image + one clickable button overlay
- **Data:** `import { ctaContent } from "@/data/cta"`

## DOM structure

```
section.content_6                bg-white py-[52px] flex flex-col justify-center
└ div.reminder-container         mx-[72px] relative
  ├ img.promotional-banner       full-width artwork
  └ a.unlock                     absolute red pill button
    └ span "UNLOCK NOW"
```

## Computed styles (exact, 1440px)

### `section.content_6`
`background-color: rgb(255, 255, 255); width: 1440px; height: 577.172px;`
`padding: 52px 0; display: flex; flex-direction: column; justify-content: center;`

### `.reminder-container`
`margin: 0 72px; width: 1296px; height: 473.172px; position: relative;`

### `img.promotional-banner`
`/images/occ-rem-desktop.png`, `width: 1296px; height: 473.172px;` (intrinsic ratio 1296/473.172).
This artwork contains all the banner text — "The Magical Ticket", "Add 3 reminders in your
account. Win offers worth Rs. 750", the scalloped gold frame and the confetti.
**Do not recreate any of that in markup.** Only the button is a real element.

### `.unlock` (the button)
`position: absolute; background-color: rgb(252, 0, 21); border-radius: 6.9px;`
`width: 231.344px; height: 57.578px; display: flex; justify-content: center; align-items: center;`
`cursor: pointer;`
Positioning as measured: `left: 648px; top: 354.875px;` with
`transform: matrix(1, 0, 0, 1, -115.672, -28.789)` — i.e. it is **centred horizontally** at 50% of
the container and offset vertically. Implement as:
`left-1/2 top-[354.875px] -translate-x-1/2 -translate-y-1/2` (the matrix offsets are exactly half
the button's width and height).
Because the button must track the artwork when the container scales, express both offsets in
percentages of the container: `top: 75%` (354.875 / 473.172 = 0.75), `left: 50%`.

### `span` inside the button
`font-size: 26px; font-weight: 600; line-height: 28.8px; color: rgb(255, 255, 255);`
`text-align: center; padding: 14.4px 28.8px; cursor: pointer;`

## States & behaviors
- No scroll or time behavior.
- Hover: no dedicated rule in the target CSS. Add nothing beyond the global
  `a:hover { text-decoration: none }`. Keep `cursor: pointer`.

## Content (verbatim)
- Button label: `UNLOCK NOW`
- Banner alt text: use the stored `ctaContent.alt` (empty on the target — supply
  `alt="The Magical Ticket — add 3 reminders in your account and win offers worth Rs. 750"`
  since the artwork carries meaningful text).
- `ctaContent.href` is `null` on the target (the click is JS-driven). Render the button as a
  `<button type="button">` rather than a link.

## Responsive
- **Desktop (1440px):** section 577px tall, container `mx-[72px]`, button 231×58 at 75%/50%.
- **Tablet (768px):** section height 357px, padding `45px 17px 45px 20px`; container margin
  collapses to the section padding; button scales to ~168×42, font `19px`.
- **Mobile (390px):** section height 219px, same padding; button ~120×32, font `14px`,
  `border-radius: 5px`.
- Keep the button sized in percentages of the banner width so it stays glued to the artwork:
  `width: 17.85%` (231.344 / 1296), `height: 12.17%` (57.578 / 473.172), with the font size
  stepping down at the two breakpoints.
