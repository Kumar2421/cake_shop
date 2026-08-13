/**
 * Extract a product detail page (/p/<category>/<sku>) into structured content.
 * Usage: TARGET_URL=https://www.bakingo.com/p/cake/<sku> node scripts/inspect/content-product.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, RES_DIR, REF_DIR, ensureDir, TARGET } from './lib.mjs';

const run = async () => {
  await ensureDir(REF_DIR);
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  const content = await page.evaluate(() => {
    const txt = (el) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
    const src = (el) => el?.currentSrc || el?.src || '';
    const all = (sel, root = document) => [...root.querySelectorAll(sel)];

    const root = document.querySelector('.product-detail-conatiner');
    const content = document.querySelector('.product-content');

    const breadcrumbs = all('.breadcrumb-container-details a, .breadcrumb-container-details span').map((el) => ({
      label: txt(el),
      href: el.getAttribute?.('href') || null,
    }));

    const galleryRoot = document.querySelector('.cake-images');
    const gallery = {
      images: all('img', galleryRoot).map((i) => ({
        src: src(i),
        alt: i.alt,
        cls: i.className?.toString().slice(0, 60),
        w: Math.round(i.getBoundingClientRect().width),
        h: Math.round(i.getBoundingClientRect().height),
      })),
      badges: all('[class*="badge"], [class*="tag"], [class*="bestseller"], [class*="egg"]', galleryRoot)
        .map((el) => ({ cls: el.className?.toString().slice(0, 60), text: txt(el) }))
        .filter((b) => b.text),
    };

    const weights = all('.weight-attr-container > *').map((el) => ({
      label: txt(el.querySelector('[class*="weight"], span') || el).split(' ')[0],
      raw: txt(el),
      selected: /selected|active/i.test(el.className?.toString() || ''),
      classes: el.className?.toString().slice(0, 80),
    }));

    const reviewsRoot = document.querySelector('.review-rating-container');
    const reviews = {
      heading: txt(reviewsRoot?.querySelector('[class*="heading"], h2, h3')),
      score: txt(reviewsRoot?.querySelector('[class*="rating-value"], [class*="score"]')),
      raw: txt(reviewsRoot).slice(0, 400),
      images: all('img', reviewsRoot).map((i) => src(i)),
    };

    const alsoLikeRoot = document.querySelector('.more-prods-container');
    const alsoLike = {
      heading: txt(alsoLikeRoot?.querySelector('[class*="heading"], h2, h3')),
      products: all('.product-card', alsoLikeRoot).map((card) => ({
        name: txt(card.querySelector('.product-card-title')),
        href: card.querySelector('a')?.getAttribute('href') || null,
        img: src(card.querySelector('.product-img')),
        alt: card.querySelector('.product-img')?.alt || '',
        price: txt(card.querySelector('.re-price')),
        rating: txt(card.querySelector('.bk-rating')),
        reviews: txt(card.querySelector('.bk-review')),
        eggless: !!card.querySelector('.status-square.eggless'),
      })),
    };

    const quickLinks = all('.quick-links a').map((a) => ({ label: txt(a), href: a.getAttribute('href') }));
    const quickLinkGroups = all('.quick-links > *').map((g) => ({
      heading: txt(g.querySelector('[class*="title"], h3, h4, b, strong')),
      links: all('a', g).map((a) => ({ label: txt(a), href: a.getAttribute('href') })),
    })).filter((g) => g.links.length);

    return {
      url: location.href,
      sku: txt(document.querySelector('.sku-text')),
      breadcrumbs,
      gallery,
      title: txt(document.querySelector('.product-heading')),
      rating: txt(document.querySelector('.product__review-cnt .re-review')),
      reviewCount: txt(document.querySelector('.product__review-cnt a')),
      price: txt(document.querySelector('.price-content')),
      description: txt(document.querySelector('.product-description')),
      weightHeading: txt(document.querySelector('.weight-heading.weight .attr-heading')),
      servingInfoLabel: txt(document.querySelector('.serving-info')),
      weights,
      messageHeading: txt(document.querySelector('.weight-heading.message .attr-heading')),
      messageCounter: txt(document.querySelector('.message-length')),
      messagePlaceholder: document.querySelector('.input-cakemessage')?.placeholder || '',
      deliveryHeading: txt(document.querySelector('.delivery-location')),
      deliveryBox: txt(document.querySelector('.deliver-pincode')),
      deliveryError: txt(document.querySelector('.err-select-location')),
      skuLabel: txt(document.querySelector('.sku')),
      chefTitle: txt(document.querySelector('.Our-Chefs-words')),
      chefWord: txt(document.querySelector('.chef-word-desc')),
      // Everything below the chef block, so nothing is silently dropped.
      remainingBlocks: [...(content?.children || [])].slice(7).map((el) => ({
        cls: el.className?.toString().slice(0, 80),
        text: txt(el).slice(0, 400),
        imgs: all('img', el).map((i) => src(i)),
      })),
      reviews,
      alsoLike,
      quickLinks,
      quickLinkGroups,
      seoHeading: txt(document.querySelector('.about-us-title')),
    };
  });

  await writeJson(path.join(RES_DIR, 'content.json'), content);

  for (const [name, sel] of Object.entries({
    gallery: '.cake-images',
    detail: '.product-content',
    reviews: '.review-rating-container',
    alsolike: '.more-prods-container',
  })) {
    const el = await page.$(sel);
    if (!el) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await el.screenshot({ path: path.join(REF_DIR, `section-${name}.png`) }).catch(() => {});
  }

  await browser.close();
  console.log('title:', content.title, '| price:', content.price, '| sku:', content.sku);
  console.log('gallery imgs:', content.gallery.images.length, '| weights:', content.weights.map((w) => w.label).join(', '));
  console.log('also like:', content.alsoLike.products.length, '| quick link groups:', content.quickLinkGroups.length);
  console.log('remaining blocks:', content.remainingBlocks.map((b) => b.cls).join(' | '));
};

run().catch((e) => { console.error('FAILED:', e.message, TARGET); process.exit(1); });
