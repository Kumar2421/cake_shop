/**
 * The mobile header is a structurally different component (56px, hamburger).
 * Extract it at 390px and screenshot it.
 * Usage: node scripts/inspect/mobile-header.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, extractComponent, HOST, RES_DIR, REF_DIR } from './lib.mjs';

const RES = path.join(RES_DIR, 'sections');
const REF = REF_DIR;

const run = async () => {
  const { browser, page } = await openPage({ viewport: 'mobile', wait: 'domcontentloaded' });
  await primeLazyContent(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  const tree = await extractComponent(page, '.bk-header', 6);
  const content = await page.evaluate(() => {
    const txt = (el) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
    const h = document.querySelector('.bk-header');
    return {
      html: h?.innerHTML.slice(0, 4000),
      imgs: [...(h?.querySelectorAll('img') || [])].map((i) => ({ src: i.currentSrc || i.src, cls: i.className?.toString(), alt: i.alt })),
      texts: [...new Set([...(h?.querySelectorAll('span,div,a,button') || [])].map(txt).filter((t) => t && t.length < 40))],
      placeholder: h?.querySelector('input')?.placeholder || '',
    };
  });

  await page.screenshot({ path: path.join(REF, 'section-header-mobile.png'), clip: { x: 0, y: 0, width: 390, height: 120 } });
  await writeJson(path.join(RES, 'header-mobile.json'), { tree, content });
  console.log('mobile header texts:', content.texts.join(' | '));
  console.log('imgs:', content.imgs.map((i) => i.cls).join(', '));
  await browser.close();
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
