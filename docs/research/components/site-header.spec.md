# SiteHeader Specification

## Overview
- **Target file:** `src/components/site/SiteHeader.tsx` (client component — `"use client"`)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-header.png`
- **Interaction model:** scroll-driven (nav row collapses) + CSS hover dropdowns
- **Data:** `import { headerContent, navItems } from "@/data/header"`
- **Icons:** `BakingoLogo`, `SearchIcon`, `CartIcon`, `UserIcon`, `TrackOrderIcon` from `@/components/icons`
  (the target uses `<img>` for these; use the icon components — they are the same SVGs)

## DOM structure

```
header.bk-header                       fixed top-0 z-[99] w-full bg-[#fc0015] flex flex-col
├ div.header-container                 h-[74px] mx-[72px] flex items-center
│ ├ div.section-one                    w-[135px] h-[40px] flex items-center gap-[10px] relative
│ │ └ a[href="/"] > BakingoLogo        135×40
│ ├ div.location-container             ml-[33px] h-[26px] flex items-center cursor-pointer
│ │ ├ pin svg 14×17 (white)
│ │ ├ span.location-text "Delivering to"
│ │ └ chevron svg 12×12 (white, mt-[3px])
│ └ div.header-section-two             ml-auto h-[49px] flex items-center gap-[46px]
│   ├ div.search                       w-[410px] h-[42px] bg-white rounded-[6px] pr-[10px] flex items-center
│   │ ├ img search icon 17×17          mx: ml-[17px] mr-[20px]
│   │ └ input.search-input             w-[344px] h-[36px]
│   └ div.profile-container            h-[49px] flex items-center gap-[26px] justify-around
│     └ ×3 action                      flex flex-col items-center (icon then label)
└ nav.menu-container                   h-[54px] bg-white flex justify-center shadow relative
  └ div.navbar-menu-container          w-[1296px] h-[54px] flex justify-center items-center gap-[30px]
    └ ×9 div.subnav                    h-[54px] flex justify-center items-center relative group
      ├ div.subnavbtn                  py-[8px] px-[2px] flex flex-col items-center cursor-pointer
      │ ├ div.category-title           label
      │ └ div.category-underline       absolute bottom-[2px] h-[3px] w-full
      └ div.subnav-content             absolute dropdown panel
```

## Computed styles (exact, from getComputedStyle at 1440px)

### `.bk-header`
`position: fixed; top: 0; z-index: 99; width: 100%; height: 128px;`
`background-color: rgb(252, 0, 21); display: flex; flex-direction: column;`
`transition: all` → implement as `transition: height 0.3s ease`

### `.header-container`
`height: 74px; margin: 0 72px; width: 1296px; display: flex; align-items: center;`

### `.bakingo-logo`
`width: 135px; height: 40px; position: relative;`

### `.location-container-deskotp`
`margin-left: 33px; width: 151.891px; height: 26px; display: flex; align-items: center; cursor: pointer;`

### `.location-text`
`font-size: 18px; font-weight: 600; color: rgb(255, 255, 255); text-transform: capitalize;`
`margin: 0 6px 0 8px; height: 26px; white-space: nowrap; overflow: hidden;`

### `.header-section-two`
`margin-left: 290.312px` (achieved with `ml-auto`); `width: 685.797px; height: 49px;`
`display: flex; align-items: center; gap: 46px;`

### `.search.desktop-search`
`background-color: rgb(255, 255, 255); width: 410px; height: 42px; border-radius: 6px;`
`padding-right: 10px; display: flex; align-items: center; position: relative;`

### `.header-search-icon`
`width: 17px; height: 17px; margin: 0 20px 0 17px;`

### `.search-input`
`font-size: 14px; font-weight: 600; color: rgb(7, 7, 7); text-transform: capitalize;`
`background-color: rgb(255, 255, 255); width: 344px; height: 36px;`
`placeholder: "Search for cakes, occasion, flavour and more..."` (renders capitalized by CSS)

### `.profile-container`
`width: 229.797px; height: 49px; display: flex; justify-content: space-around; align-items: center; gap: 26px;`

### each action (`a.track-order-link` and siblings)
`display: flex; flex-direction: column; align-items: center; color: rgb(255, 255, 255); height: 49px;`
icon sizes — Track Order `26×28`, Cart `30×28`, Login/Signup `21×27`

### `.profileTitle`
`font-size: 12px; font-weight: 600; letter-spacing: 0.12px; color: rgb(255, 255, 255);`
`text-align: center; margin-top: 4px; height: 17px;`

### `.menu-container`
`background-color: rgb(255, 255, 255); width: 100%; height: 54px; display: flex;`
`justify-content: center; box-shadow: rgba(0, 0, 0, 0.25) 0px 4px 4px 0px; position: relative;`

### `.navbar-menu-container`
`width: 1296px; height: 54px; display: flex; justify-content: center; align-items: center; gap: 30px;`

### `.subnavbtn`
`padding: 8px 2px; display: flex; flex-direction: column; align-items: center; cursor: pointer;`

### `.category-title`
`font-size: 18px; font-weight: 600; color: rgb(7, 7, 7); text-transform: capitalize;`
`height: 26px; display: flex; white-space: nowrap;`

### `.category-underline`
`position: absolute; bottom: 2px; height: 3px; width: 100%; border-radius: 12px;`
`background-color: rgb(252, 0, 21); transform: scaleX(0); transition: transform 0.3s;`

### `.subnav-content` (dropdown panel)
`position: absolute; top: calc(100% - 1px); left: 50%; transform: translateX(-50%);`
`background-color: rgb(255, 242, 233); width: fit-content; z-index: 99999;`
`border-radius: 0 0 7px 7px; box-shadow: rgba(0, 0, 0, 0.25) 1px 6px 11px 2px;`
Hidden by default (`opacity: 0` / not rendered), shown on hover of the `.subnav`.
Inner `ul.submenu-list` is `display: flex` — one column per `NavItem.columns` entry.

## States & behaviors

### Scroll-driven nav collapse (the only scroll behavior on the page)
- **Trigger:** `window.scrollY > 0`
- **State A (scrollY === 0):** header `height: 128px`; `.menu-container` `height: 54px`
- **State B (scrollY > 0):** header `height: 74px`; `.menu-container` `height: 0`, contents clipped
  (`overflow: hidden`). `display` stays `flex`, `opacity` stays `1` — it is a height collapse, not a fade.
- **Restores** to 128px when back at scrollY 0.
- **Transition:** `transition: height 0.3s ease` on both the header and `.menu-container`.
- **Implementation:** `useEffect` + `window.addEventListener("scroll", …, { passive: true })`,
  store a boolean in state, add/remove the collapsed classes.

### Nav hover (pure CSS — use Tailwind `group`/`group-hover`)
- `.subnav:hover > .subnavbtn > .category-title` → `color: rgb(252, 0, 21); font-weight: 600`
- `.subnav:hover > div > .category-underline` → `transform: scaleX(1)` (`transition: transform .3s`)
- `.subnav:hover .subnav-content` → visible
- `.submenu-second-column .category-sub-title:hover` → `opacity: .8` (`transition: opacity .2s`)
- `.child-content .category-subchild-title:hover` → `color: rgb(255, 127, 125)`
- Sub-link base style: `font-size: 13px; font-weight: 600; letter-spacing: 0.25px; white-space: nowrap;`
- Column heading style: `font-size: 14px; font-weight: 700;`

## Content
Everything comes from `@/data/header`:
- `headerContent.locationLabel` = `"Delivering to"`
- `headerContent.searchPlaceholder` = `"Search for cakes, occasion, flavour and more..."`
- `headerContent.actions` = Track Order (`/trackorder`), Cart (`/cart`), Login/Signup (dropdown of 8 items)
- `navItems` = 9 entries: Cakes, Bento, Theme Cakes, By Relationship, Desserts & Hampers,
  Birthday, Anniversary, Occasions, Customized Cakes (`/customised-cakes`, no dropdown).
  Each has `columns: { heading, links[] }[]`; render one flex column per entry.
  `Customized Cakes` has `columns.length === 0` — render it as a plain link with no panel.

## Responsive
- **Desktop (≥769px):** as specified above; header 128px → 74px on scroll.
- **Tablet (≤768px) and mobile (≤480px):** header is a single **56px** bar.
  `.menu-container` is hidden entirely (the site swaps to a hamburger drawer).
  Show: logo (smaller), search icon button, cart icon, profile icon. Hide the location text label,
  the full-width search field, and the nav row. Do **not** implement the drawer contents — render a
  hamburger button that toggles a simple panel listing `navItems` labels.
- **Body offset:** the page content starts at `top: 128px` on desktop and `98px` at ≤768px.
  Export the heights as constants so `page.tsx` can pad the main element.
