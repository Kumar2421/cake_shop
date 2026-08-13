/**
 * Extract a product listing page (e.g. /best-seller) into structured content.
 * Usage: TARGET_URL=https://www.bakingo.com/best-seller node scripts/inspect/content-listing.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, RES_DIR, REF_DIR, ensureDir, TARGET } from './lib.mjs';

const run = async () => {
  await ensureDir(REF_DIR);
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page, 900, 350);
  // Listings lazy-load on scroll; sweep twice so every card is materialised.
  await primeLazyContent(page, 1400, 250);

  const content = await page.evaluate(() => {
    const txt = (el) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
    const src = (el) => el?.currentSrc || el?.src || '';
    const all = (sel, root = document) => [...root.querySelectorAll(sel)];

    const filterRoot = document.querySelector('.listing-filter-container');
    const filters = [...(filterRoot?.children || [])].map((el) => ({
      text: txt(el),
      cls: el.className?.toString().slice(0, 80),
      isSort: /sort/i.test(txt(el)),
    }));
    const chips = all('.border-button-container.sortByTitle').map((el) => ({
      label: txt(el),
      href: el.getAttribute?.('href') || null,
      cls: el.className?.toString().slice(0, 80),
    }));
    const sortButton = {
      label: txt(document.querySelector('.sort-button-wrapper')),
      icon: src(document.querySelector('.sort-button-wrapper img')),
    };

    const products = all('.product-card').map((card) => ({
      name: txt(card.querySelector('.product-card-title')),
      href: card.querySelector('a')?.getAttribute('href') || null,
      img: src(card.querySelector('.product-img')),
      alt: card.querySelector('.product-img')?.alt || '',
      price: txt(card.querySelector('.re-price')),
      rating: txt(card.querySelector('.bk-rating')),
      reviews: txt(card.querySelector('.bk-review')),
      eggless: !!card.querySelector('.status-square.eggless'),
      // Listing cards carry a ribbon the homepage cards do not have.
      // Listing cards carry a ticker ribbon ("Best Seller") the homepage cards lack.
      tag: txt(card.querySelector('.ticker-container')),
      tagKind: card.querySelector('.ticker-container')?.className?.toString().trim().slice(0, 60) || '',
      // The image slot is a mini gallery: several shots per card.
      galleryImages: all('.image-gallery img', card).map((i) => src(i)),
    }));

    const reviewRoot = document.querySelector('.reviewCardContainer');
    const reviewCard = {
      score: txt(reviewRoot?.querySelector('.re-review, [class*="rating"]')),
      raw: txt(reviewRoot).slice(0, 600),
      images: all('img', reviewRoot).map(src),
      viewAll: txt(reviewRoot?.querySelector('a')),
    };

    const breadcrumbs = all('.breadcrumb-container a, .breadcrumb-container span').map((el) => ({
      label: txt(el),
      href: el.getAttribute?.('href') || null,
    }));

    const quickLinkGroups = [...(document.querySelector('.quick-links')?.children || [])]
      .map((g) => ({
        heading: txt(g.querySelector('[class*="title"], h3, h4, b, strong')),
        links: all('a', g).map((a) => ({ label: txt(a), href: a.getAttribute('href') })),
      }))
      .filter((g) => g.links.length);

    return {
      url: location.href,
      title: txt(document.querySelector('.listing-title-text')),
      filters,
      chips,
      sortButton,
      productCount: products.length,
      products,
      reviewCard,
      breadcrumbs,
      seoHeading: txt(document.querySelector('.about-us-title')),
      seoParagraphs: all('.seo-content p').map(txt).filter(Boolean),
      quickLinksHeading: txt(document.querySelector('.d-flex.w-100')),
      quickLinkGroups,
    };
  });

  await writeJson(path.join(RES_DIR, 'content.json'), content);

  for (const [name, sel] of Object.entries({
    filters: '.listing-filter-container',
    reviews: '.reviewCardContainer',
    quicklinks: '.quick_links',
  })) {
    const el = await page.$(sel);
    if (!el) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await el.screenshot({ path: path.join(REF_DIR, `section-${name}.png`) }).catch(() => {});
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(REF_DIR, 'viewport-desktop-1440.png') });

  await browser.close();
  console.log('title:', content.title, '| products:', content.productCount);
  console.log('chips:', content.chips.map((c) => c.label).join(', '));
  console.log('quick link groups:', content.quickLinkGroups.map((g) => g.heading).join(' | '));
};

run().catch((e) => { console.error('FAILED:', e.message, TARGET); process.exit(1); });
