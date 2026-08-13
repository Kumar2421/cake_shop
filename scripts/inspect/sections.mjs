/**
 * Per-section deep extraction: computed styles tree, text, assets, section screenshots.
 * Usage: node scripts/inspect/sections.mjs [sectionKey]
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, ensureDir, extractComponent, HOST, RES_DIR, REF_DIR } from './lib.mjs';

const RES = path.join(RES_DIR, 'sections');
const REF = REF_DIR;

/** Section sets per page type; choose with SECTION_SET=home|listing|product. */
export const SECTION_SETS = {
  listing: [
    { key: 'listing-title', sel: '.listing-title-text', depth: 3 },
    { key: 'listing-filters', sel: '.listing-quick-filter-container', depth: 4 },
    { key: 'listing-grid', sel: '.listing-content-container', depth: 3 },
    { key: 'listing-card', sel: '.product-card.listing_product', depth: 5 },
    { key: 'listing-reviews', sel: '.reviewCardContainer', depth: 5 },
    { key: 'listing-breadcrumb', sel: '.breadcrumb-container', depth: 3 },
    { key: 'quicklinks', sel: '.quick_links', depth: 4 },
  ],
  product: [
    { key: 'product-breadcrumb', sel: '.breadcrumb-container-details', depth: 3 },
    { key: 'product-gallery', sel: '.cake-images', depth: 5 },
    { key: 'product-content', sel: '.product-content', depth: 5 },
    { key: 'product-reviews', sel: '.review-rating-container', depth: 5 },
    { key: 'product-alsolike', sel: '.more-prods-container', depth: 4 },
    { key: 'quicklinks', sel: '.quick_links', depth: 4 },
  ],
};

export const SECTIONS = SECTION_SETS[process.env.SECTION_SET] ?? [
  { key: 'header', sel: '.bk-header', depth: 6 },
  { key: 'hero', sel: '.content_7', depth: 6 },
  { key: 'categories', sel: '.content_4', depth: 6 },
  { key: 'bestsellers', sel: '.content_9', depth: 6 },
  { key: 'promise', sel: '.content_1', depth: 6 },
  { key: 'cta', sel: '.content_6', depth: 6 },
  { key: 'social', sel: '.home-page-container > div:nth-child(6)', depth: 5 },
  { key: 'seolinks', sel: '#seo-container', depth: 4 },
  { key: 'footer', sel: '.footer-container', depth: 6 },
];

const textDump = (selector) => {
  const root = document.querySelector(selector);
  if (!root) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out = [];
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (t) out.push(t);
  }
  return [...new Set(out)];
};

const assetDump = (selector) => {
  const root = document.querySelector(selector);
  if (!root) return null;
  const imgs = [...root.querySelectorAll('img')].map((i) => ({
    src: i.currentSrc || i.src,
    alt: i.alt,
    w: i.naturalWidth,
    h: i.naturalHeight,
    cls: i.className?.toString().slice(0, 80),
    parentCls: i.parentElement?.className?.toString().slice(0, 80),
    rect: (() => { const r = i.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
  }));
  const bgs = [...root.querySelectorAll('*')]
    .map((el) => ({ el, bg: getComputedStyle(el).backgroundImage }))
    .filter(({ bg }) => bg && bg !== 'none')
    .map(({ el, bg }) => ({
      cls: el.className?.toString().slice(0, 80),
      url: bg,
      size: getComputedStyle(el).backgroundSize,
      position: getComputedStyle(el).backgroundPosition,
      repeat: getComputedStyle(el).backgroundRepeat,
    }));
  const svgs = [...root.querySelectorAll('svg')].map((s) => s.outerHTML.slice(0, 1500));
  const links = [...root.querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 80) }));
  return { imgs, bgs, svgs, links };
};

const run = async () => {
  const only = process.argv[2];
  const list = only ? SECTIONS.filter((s) => s.key === only) : SECTIONS;
  await ensureDir(RES);
  await ensureDir(REF);

  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  for (const s of list) {
    const exists = await page.$(s.sel);
    if (!exists) { console.log('MISSING', s.key, s.sel); continue; }

    const tree = await extractComponent(page, s.sel, s.depth);
    const text = await page.evaluate(textDump, s.sel);
    const assets = await page.evaluate(assetDump, s.sel);

    await writeJson(path.join(RES, `${s.key}.json`), { key: s.key, selector: s.sel, tree, text, assets });

    try {
      const el = await page.$(s.sel);
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      await el.screenshot({ path: path.join(REF, `section-${s.key}.png`) });
    } catch (e) {
      // fixed/overflowing elements can fail element screenshots — fall back to viewport
      await page.screenshot({ path: path.join(REF, `section-${s.key}.png`) });
    }
    console.log('ok', s.key, 'imgs=' + assets.imgs.length, 'texts=' + text.length);
  }

  await browser.close();
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
