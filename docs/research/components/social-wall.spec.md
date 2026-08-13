# SocialWall Specification

## Overview
- **Target file:** `src/components/sections/SocialWall.tsx` (server component)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-social.png`
- **Interaction model:** static; two horizontally scrolling rows (native overflow, no JS)
- **Data:** `import { socialRows, socialHeading } from "@/data/social"`
- **Icons:** `StoryIcon` from `@/components/icons` (`/images/storyman-fc229179.svg`)

## DOM structure

```
section (unnamed wrapper)              w-full h-[756px]
└ div.insta-story-wrapper              mb-[54px] text-center
  ├ div.insta-container                h-[132px] flex justify-center items-center relative
  │ ├ div.insta-text                   mr-[15px] flex flex-col items-center relative
  │ │ ├ div.insta-heading              "What’s In Your Heart?"
  │ │ └ div.insta-subHeading           "A glimpse from our social world!"
  │ └ img.story-man                    44.44 × 58
  └ div                                h-[624px]
    └ div.insta-carousel-container     flex justify-center items-center relative
      └ div.insta-scroll-wrapper       py-[10px] flex flex-col gap-[18px] max-w-full
        └ ×2 div.insta-row             px-[15px] flex gap-[12px] h-[293px] overflow-x-scroll
          └ ×N tile                    h-[293px], variable width, rounded, relative
            ├ img                      object-cover, fills the tile
            └ img.insta-icon           24×24 reel badge, absolute top-right
```

## Computed styles (exact, 1440px)

### wrapper
`width: 1440px; height: 756px;`

### `.insta-story-wrapper`
`margin-bottom: 54px; text-align: center; width: 1440px; height: 756px;`

### `.insta-container`
`width: 1440px; height: 132px; display: flex; justify-content: center; align-items: center;`
`position: relative;`

### `.insta-text`
`margin-right: 15px; width: 439.141px; height: 132px;`
`display: flex; flex-direction: column; align-items: center; position: relative;`

### `.insta-heading`
`font-size: 36px; font-weight: 600; line-height: 36px; color: rgb(252, 0, 21);`
`text-align: center; margin-bottom: 12px; height: 36px;`
**Note:** this section does *not* use the shared `SectionHeading` — the eyebrow is 36px here,
not 42px, and there is no `capitalize` transform. Build it inline.

### `.insta-subHeading`
`font-size: 30px; font-weight: 500; line-height: 30px; letter-spacing: -0.3px;`
`color: rgb(81, 81, 81); text-align: center; margin-bottom: 54px; position: relative;`

### `img.story-man`
`width: 44.4375px; height: 58px;` — sits to the right of the text block.

### `.insta-carousel-container`
`width: 1440px; height: 624px; display: flex; justify-content: center; align-items: center;`
`position: relative;`

### `.insta-scroll-wrapper`
`padding: 10px 0; width: 1440px; height: 624px; max-width: 100%;`
`display: flex; flex-direction: column; gap: 18px;`

### `.insta-row` (×2)
`padding: 0 15px; width: 1440px; height: 293px; display: flex; gap: 12px;`
`overflow-x: scroll; overflow-y: auto;`
Hide the scrollbar with the `no-scrollbar` utility from `globals.css`.

### tiles
All tiles are **293px tall**; widths vary by source aspect ratio — measured widths include
`165`, `220`, `234`, `235`, `293`, `521`. Do **not** normalise them: render each tile at
`height: 293px; width: auto;` with the image at `height: 100%; width: auto; object-fit: cover;`
and let the intrinsic ratio set the width. Add `border-radius: 8px; overflow: hidden;` and
`flex-shrink: 0`.

### reel badge (`img.insta-icon`, `alt="Instagram Reel"`)
`width: 24px; height: 24px;` positioned at the tile's top-right with a small inset (~8px).
Only some tiles carry it — the data marks them via `alt === "Instagram Reel"` on the badge
entries. In `socialRows` the badge images appear as their own 24×24 entries interleaved with the
photo entries; when building, treat a `24×24` entry as the badge belonging to the **preceding**
photo tile, not as a tile of its own.

## States & behaviors
- No hover rules, no JS, no autoplay. Rows scroll natively and independently.
- Row 1 holds 53 entries, row 2 holds 50 (photos + interleaved badges).

## Content
- Heading: `"What’s In Your Heart?"` (curly apostrophe — copy exactly)
- Subheading: `"A glimpse from our social world!"`
- Tiles: `socialRows[0]` and `socialRows[1]`, images under `/images/instagram/`.
  Alt text is empty on the photos — use `alt=""` and mark them `aria-hidden` is **not** correct
  since they are content; use `alt="Bakingo on Instagram"`.
- Use `next/image` with explicit `width`/`height` from the data (`width`, `height` fields) and
  `unoptimized` is unnecessary — these are local files.

## Responsive
- **Desktop (1440px):** two rows, 293px tall, gap 12px, row padding `0 15px`.
- **Tablet (768px):** identical structure; tiles shrink to `height: 220px`, row gap `10px`.
- **Mobile (390px):** identical structure; tiles `height: 170px`, row gap `8px`,
  heading `24px/26px`, subheading `16px/20px`, and the `story-man` image drops to `32px` wide.
- The rows always scroll horizontally — they never wrap or stack.
