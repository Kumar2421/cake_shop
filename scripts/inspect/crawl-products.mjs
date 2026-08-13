/**
 * Visit every product linked from a listing page and extract its detail content,
 * so the dynamic product route renders real data for each SKU.
 * Usage: node scripts/inspect/crawl-products.mjs [listingSlug] [concurrency]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { HOST, VIEWPORTS, ensureDir } from './lib.mjs';

const LISTING = process.argv[2] || 'best-seller';
const CONCURRENCY = Number(process.argv[3] || 4);
const LISTING_DIR = path.join('docs', 'research', HOST, LISTING);
const OUT_DIR = path.join('docs', 'research', HOST, 'products');

/** Runs in the page; mirrors scripts/inspect/content-product.mjs. */
const probe = () => {
  const txt = (el) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
  const src = (el) => el?.currentSrc || el?.src || '';
  const all = (sel, root = document) => [...root.querySelectorAll(sel)];

  return {
    url: location.href,
    sku: txt(document.querySelector('.sku-text')),
    title: txt(document.querySelector('.product-heading')),
    rating: txt(document.querySelector('.product__review-cnt .re-review')),
    reviewCount: txt(document.querySelector('.product__review-cnt a')),
    price: txt(document.querySelector('.price-content')),
    description: txt(document.querySelector('.product-description')),
    chefTitle: txt(document.querySelector('.Our-Chefs-words')),
    chefWord: txt(document.querySelector('.chef-word-desc')),
    weights: all('.weight-attr-container > *').map((el) => ({
      raw: txt(el),
      selected: /selected|active/i.test(el.className?.toString() || ''),
    })),
    servingInfo: txt(document.querySelector('.serving-info')),
    gallery: all('.cake-images img').map((i) => ({ src: src(i), alt: i.alt })),
    breadcrumbs: all('.breadcrumb-container-details a, .breadcrumb-container-details span').map((el) => ({
      label: txt(el),
      href: el.getAttribute?.('href') || null,
    })),
    alsoLike: all('.more-prods-container .product-card').map((card) => ({
      name: txt(card.querySelector('.product-card-title')),
      href: card.querySelector('a')?.getAttribute('href') || null,
      img: src(card.querySelector('.product-img')),
      price: txt(card.querySelector('.re-price')),
    })),
    reviewsRaw: txt(document.querySelector('.review-rating-container')).slice(0, 1200),
  };
};

const slugOf = (href) => href.split('/').filter(Boolean).pop();

const run = async () => {
  const listing = JSON.parse(await fs.readFile(path.join(LISTING_DIR, 'content.json'), 'utf8'));
  const targets = [...new Map(
    listing.products.filter((p) => p.href).map((p) => [p.href, p])
  ).values()];
  await ensureDir(OUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-IN',
  });

  let done = 0;
  const failures = [];
  const worker = async (queue) => {
    const page = await context.newPage();
    while (queue.length) {
      const p = queue.shift();
      const slug = slugOf(p.href);
      const file = path.join(OUT_DIR, `${slug}.json`);
      try {
        await fs.access(file);
        done++;
        continue;
      } catch {}
      try {
        await page.goto(`https://${HOST}${p.href}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForTimeout(2200);
        const data = await page.evaluate(probe);
        if (!data.title) throw new Error('no title rendered');
        await fs.writeFile(file, JSON.stringify({ ...data, listingHref: p.href, slug }, null, 2));
      } catch (e) {
        failures.push({ href: p.href, error: e.message.split('\n')[0] });
      }
      done++;
      process.stdout.write(`\r${done}/${targets.length}   `);
    }
    await page.close();
  };

  const queue = [...targets];
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
  process.stdout.write('\n');
  await browser.close();

  console.log('crawled:', targets.length - failures.length, 'failed:', failures.length);
  failures.slice(0, 10).forEach((f) => console.log('  FAIL', f.href, f.error));
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
