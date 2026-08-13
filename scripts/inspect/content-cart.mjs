/**
 * Extract the cart page (empty state) plus the product page's sticky add-to-cart bar.
 * Usage: TARGET_URL=https://www.bakingo.com/cart node scripts/inspect/content-cart.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, extractComponent, RES_DIR, REF_DIR, ensureDir } from './lib.mjs';

const run = async () => {
  await ensureDir(REF_DIR);
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  const content = await page.evaluate(() => {
    const txt = (el) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
    const src = (el) => el?.currentSrc || el?.src || '';
    return {
      url: location.href,
      emptyMessage: txt(document.querySelector('.your-cart')),
      ctaLabel: txt(document.querySelector('.back-home')),
      ctaHref: document.querySelector('.back-home')?.getAttribute('href') || null,
      emptyImage: src(document.querySelector('.empty-cart-image img')),
      pageBackground: getComputedStyle(document.querySelector('.mycartpage') || document.body).backgroundColor,
    };
  });

  const tree = await extractComponent(page, '.mycartpage', 5);
  await writeJson(path.join(RES_DIR, 'content.json'), { ...content, tree });

  const el = await page.$('.emptycart');
  if (el) {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await el.screenshot({ path: path.join(REF_DIR, 'section-emptycart.png') }).catch(() => {});
  }
  await page.screenshot({ path: path.join(REF_DIR, 'viewport-desktop-1440.png') });
  await browser.close();

  console.log('empty message:', content.emptyMessage);
  console.log('cta:', content.ctaLabel, '->', content.ctaHref);
  console.log('image:', content.emptyImage);
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
