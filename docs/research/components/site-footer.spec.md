# SiteFooter Specification

## Overview
- **Target file:** `src/components/site/SiteFooter.tsx` (server component)
- **Screenshot:** `docs/design-references/www.bakingo.com/section-footer.png`
- **Interaction model:** static; newsletter input + submit arrow, link columns, 5 social icons
- **Data:** `import { footerColumns, footerSocials, footerMeta } from "@/data/footer"`
- **Icons:** `BakingoWordmark`, `SubscribeArrowIcon`, `FacebookIcon`, `InstagramIcon`,
  `TwitterIcon`, `LinkedInIcon`, `YoutubeIcon` from `@/components/icons`

## DOM structure

```
footer.footer-container                    bg-[#fff5ee] flex
└ div.footer-all-content                   mx-[46px] pt-[75px] pr-[118px] pb-[32px] pl-[62px] flex flex-col gap-[50px]
  ├ div.footer-content                     w-[1168px] h-[80px] flex justify-between items-center
  │ ├ div.subscribe-newsletter             "Subscribe To Our Newsletter"
  │ └ div.subscribe-container              w-[551px] flex flex-col gap-[4px]
  │   └ div.subscribe-form                 h-[51px] rounded-[8px] flex items-center gap-[15px] px
  │     ├ input.form-control               w-[468px] h-[20px]
  │     └ SubscribeArrowIcon               29 × 13
  └ div.footer-content-two                 w-[1168px] flex justify-between
    ├ div.bakingo-image-year               w-[245px]
    │ ├ BakingoWordmark                    202 × 60
    │ ├ div.policy                         copyright line
    │ └ div.all-logos                      mt-[15px] flex items-center gap-[18px]
    │   └ ×5 a > social icon
    └ div.footer-menu                      w-[644.344px] flex gap-[75px]
      └ ×3 div.footer-description          flex flex-col gap-[7px]
        ├ div.footer-heading               column title
        └ div.description-bottom           flex flex-col
          └ ×N a.collection-word           link
```

## Computed styles (exact, 1440px)

### `footer.footer-container`
`background-color: rgb(255, 245, 238); width: 1440px; height: 465.219px; display: flex;`
Background art on the target: `/images/footer-background-0f80c8bb.svg` over the cream fill.
Apply it as a `background-image` (`no-repeat`, `cover`) behind the content.

### `.footer-all-content`
`padding: 75px 118px 32px 62px; margin: 0 46px; width: 1348px;`
`display: flex; flex-direction: column; gap: 50px;`

### `.footer-content`
`width: 1168px; height: 80px; display: flex; justify-content: space-between; align-items: center;`

### `.subscribe-newsletter`
`font-size: 28px; font-weight: 600; line-height: 28px; color: rgb(252, 0, 21);`
`text-transform: uppercase; width: 442.688px; height: 28px;`

### `.subscribe-container`
`width: 551px; height: 80px; display: flex; flex-direction: column; gap: 4px;`

### `.subscribe-form`
`padding: 13px 14px 13px 23px; width: 551px; height: 51px; border-radius: 8px;`
`display: flex; align-items: center; gap: 15px; background-color: rgb(255, 255, 255);`

### `input.form-control`
`font-size: 16px; font-weight: 600; line-height: 20px; color: rgb(7, 7, 7);`
`width: 468px; height: 20px; background: transparent; border: 0; outline: none;`
`placeholder: "Enter Email Address"`

### `SubscribeArrowIcon`
`width: 29px; height: 13px; cursor: pointer;` — stroke `#FC0015`.

### `.footer-content-two`
`width: 1168px; height: 228.219px; display: flex; justify-content: space-between;`

### `.bakingo-image-year`
`width: 245px; height: 228.219px;`

### `BakingoWordmark` (`.bakingo-image-bottom`)
`width: 202px; height: 60px;`

### `.policy`
`font-size: 16px; font-weight: 500; line-height: 17.76px; color: rgb(252, 0, 21);`
`text-transform: uppercase; margin-top: 17px; width: 245px;`
Text: `© 2026. FA GIFTS PVT. LTD.`

### `.all-logos`
`margin-top: 15px; width: 245px; height: 26.5px; display: flex; align-items: center; gap: 18px;`
Icon intrinsic sizes — Facebook `13×25`, Instagram `23×23`, Twitter `23×22`,
LinkedIn `22×22`, YouTube `24×17`. All render in `#FC0015`. Preserve those exact sizes;
do not normalise them to a single box.

### `.footer-menu`
`width: 644.344px; height: 228.219px; display: flex; gap: 75px;`

### `.footer-description`
`display: flex; flex-direction: column; gap: 7px;`
Column widths as measured: `102.5px`, `230.312px`, `~180px` (content-driven — let them size
naturally).

### `.footer-heading`
`font-size: 22px; font-weight: 700; line-height: 22px; color: rgb(252, 0, 21);`
`text-transform: uppercase;`

### `a.collection-word`
`font-size: 20px; font-weight: 500; line-height: 33.2px; color: rgb(252, 0, 21);`
`text-transform: capitalize; cursor: pointer;`

## States & behaviors
- No hover rules beyond the global `a:hover { text-decoration: none }`.
- The newsletter form is decorative on the clone: render a real `<form>` that does nothing
  (`onSubmit` prevented is not needed in a server component — omit the handler and leave the
  submit button as `type="button"`).

## Content (verbatim)

**Newsletter:** heading `Subscribe To Our Newsletter`, placeholder `Enter Email Address`
**Copyright:** `© 2026. FA GIFTS PVT. LTD.`

| Column | Links |
|--------|-------|
| Know Us | Our Story, Contact Us, Locate Us, Blog, Media, Careers |
| Need Help | FAQ, Cancellation and Refund, Privacy  Policy, Terms and Conditions, Customer Grievance, Sitemap |
| More Info | Corporate Cakes, Coupons & Offers, Download App |

(Note the double space in `Privacy  Policy` — it is in the source; render the stored string.)

**Socials:**
- Facebook — `https://www.facebook.com/bakingo/`
- Instagram — `https://www.instagram.com/bakingo_official/`
- Twitter — `https://twitter.com/bakingo_online/`
- LinkedIn — `https://www.linkedin.com/company/bakingo/`
- YouTube — `https://www.youtube.com/channel/UC7MsIUZGOOpVE_vHlklwM4Q`

All external links need `target="_blank" rel="noreferrer"`.

## Responsive
- **Desktop (1440px):** as above, footer height 465px, two-row layout.
- **Tablet (768px):** footer height 538px. Newsletter heading and form stack vertically
  (heading `22px`, form full width). The logo/social block sits above the link columns; the three
  link columns stay side by side with `gap: 32px`, headings `18px`, links `16px/28px`.
- **Mobile (390px):** footer height 944px. Everything stacks: newsletter heading `18px`, form
  full width, then the three link columns stack one per row, then the logo, copyright and the
  social row centred. Headings `16px`, links `15px/28px`. Content padding drops to `32px 16px`.
