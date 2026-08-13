# Behaviors — www.bakingo.com (homepage)

Source data: `behaviors.json`, `behaviors2.json`, `hover-rules.json`.
Scroll is **native** — no Lenis, no Locomotive, `scroll-behavior: auto`, no scroll-snap anywhere.

## 1. Header — scroll-driven row collapse

The only scroll-driven behavior on the page.

- **Element:** `.bk-header` — `position: fixed; top: 0; z-index: 99; width: 100%`
- **Children:** `.header-container` (h=74px, red bar) + `.menu-container` (h=54px, white nav row)
- **Trigger:** `window.scrollY > 0` (measured: state flips between y=0 and y=5 — treat as
  "any scroll away from top")
- **State A (scrollY === 0):** `.bk-header` height **128px**; `.menu-container` class
  `"menu-container "`, height **54px**
- **State B (scrollY > 0):** `.bk-header` height **74px**; `.menu-container` gains class
  `isHidden`, height **0px** (collapses; `display` stays `flex`, `opacity` stays `1` — it is a
  height/overflow collapse, not a fade)
- **Restores:** returning to scrollY 0 restores 128px
- **Transition:** `transition: all` on `.bk-header` (duration comes from the shorthand default —
  clone with `transition: height 0.3s ease`)
- **Implementation:** `useEffect` scroll listener on the client, toggle an `isHidden` class

`.header-container` itself never changes — same 74px at every scroll position.

## 2. Header nav — hover dropdowns

Nine top-level items: Cakes, Bento, Theme Cakes, By Relationship, Desserts & Hampers, Birthday,
Anniversary, Occasions, Customized Cakes.

Exact rules from the target CSS:

```css
.category-underline      { position: absolute; bottom: 2px; height: 3px; width: 100%;
                           border-radius: 12px; background: #fc0015;
                           transform: scaleX(0); transition: transform .3s; }
.subnav:hover > div > .category-underline { transform: scaleX(1); }
.subnav:hover > .subnavbtn > .category-title { color: #fc0015; font-weight: 600; }
.category-title:hover    { color: #fc0015 !important; }
.child-content .category-subchild-title:hover { color: #ff7f7d; }
.submenu-second-column .category-sub-title    { transition: opacity .2s; }
.submenu-second-column .category-sub-title:hover { opacity: .8; }
.moreHeader-item:hover   { background-color: var(--hover-bg-color); }  /* rgba(255,185,202,.18) */
.profile-logged-in:hover .drop-data-header,
.all-content .header-menu-account:hover .drop-data-header { display: block; }
```

- **Interaction model: pure CSS `:hover`** — the mega panel is `display: none → block`, no JS
  state, no animation on the panel itself. Only the underline animates (`scaleX`, 0.3s).
- Programmatic `mouseover` dispatch did **not** open the panels (0/5 hits) — they are CSS-driven
  and require real pointer hover, which confirms the CSS-only model.

## 3. Hero carousel (`.content_7`) — time-driven

- **Library:** `react-responsive-carousel` (`.carousel-root > .carousel.carousel-slider`,
  `.control-dots .dot`, `.control-arrow control-prev/next`)
- **Real slides: 5.** The DOM holds 7 `.slide` nodes (first/last are clones for infinite loop).
- **Autoplay interval: 5000ms.** Measured slide changes at 2794 / 7773 / 12802 ms → deltas
  4979ms and 5029ms.
- **Direction:** forward, infinite loop.
- **Transition:** `.carousel .slider.animated { transition: .35s ease-in-out; }` — horizontal
  translate of the slide track.
- **Dots:**
  ```css
  .control-dots .dot { width: 8px; height: 8px; border-radius: 50%; background: #fff;
                       opacity: .3; box-shadow: rgba(0,0,0,.9) 1px 1px 2px;
                       transition: opacity .25s ease-in; }
  .control-dots .dot.selected, .control-dots .dot:hover { opacity: 1; }
  ```
  On the live homepage the active dot renders **red** (`#fc0015`) — see the hero spec for the
  per-dot computed values.
- **Arrows:** present in the DOM (`.control-arrow control-prev/next`) but carry
  `control-disabled` on the homepage — **not visible, do not build them**.
  (Their rule, for reference: `opacity: .4; transition: .25s ease-in;`
  `:hover { background: rgba(0,0,0,.2) }`.)
- Clicking a dot jumps to that slide and restarts the timer.

## 4. Product cards (`.content_9` bestsellers)

```css
.list-productcard { border-radius: 4px; background: #fff; transition-duration: .3s;
                    width: calc(25% - 30px); }
.product-card, .product-card:hover { text-decoration: none; }
.card1:hover     { border-radius: 8px; box-shadow: 0 0 10px 0 rgba(0,0,0,.12);
                   border: 4px solid #fcc4c5; }
.cardName1:hover { border-radius: 8px; border-color: #ff5f5d; }
@media (max-width: 460px) { .list-productcard:hover { transform: none; } }
```

- Section is a **paged carousel**, not a scroll rail: 2 dot indicators below the row, 5 cards
  visible per page.
- Track transition: `.webProductSlider { transition: transform 4s cubic-bezier(0,1,.3,1) .25s,
  opacity .3s ease-out .25s; width: 90%; }`
- Cards carry a green veg mark (`#00a651`), a wishlist heart, price, and a rating pill
  (`4.9 ★ (8.8K Reviews)`).

## 5. Category rail (`.content_4`)

Horizontally scrollable tile rail. Tiles are links with image + uppercase caption. No JS state —
overflow-x scroll. Hover: no dedicated rule beyond `a:hover { text-decoration: none !important }`.

## 6. Other sections

| Section | Behavior |
|---------|----------|
| `.content_1` Our Promise | fully static |
| `.content_6` Magical Ticket | static; single `UNLOCK NOW` button |
| Social grid | static tiles, 2 rows, horizontal overflow; each tile has a video/reel badge |
| `#seo-container` | click-driven accordion (chevron toggles the SEO copy) |
| Footer | static; newsletter input + arrow submit, link columns, 5 brand social icons |

## 7. Global

- No page-level entrance/scroll-reveal animations (`IntersectionObserver` reveals absent).
- No `animation-timeline`, no parallax.
- Fixed-position elements in scope: `.bk-header` only.
- `a:hover { text-decoration: none !important; }` is global.

## 8. Responsive

Media queries authored by the site (relevant subset):
`480px`, `576px`, `768px`, `992px`, `1024px`, `1100px`, `1200px`, `1300px`, `1440px`.

Clone breakpoints: **≤480 mobile**, **≤768 tablet**, **≥769 desktop**.
Per-section responsive values live in each component spec (measured at 1440 / 768 / 390).
