/**
 * Visual QA: screenshot the local clone at the same viewports as the reference captures
 * and report per-section geometry against the live measurements.
 * Requires `npm run dev` (or `npm start`) to be serving CLONE_URL.
 * Usage: node scripts/inspect/qa-compare.mjs [http://localhost:3000]
 */
import path from 'node:path';
import { chromium } from 'playwright';
import { VIEWPORTS, ensureDir, writeJson, HOST, RES_DIR } from './lib.mjs';

const CLONE_URL = process.argv[2] || 'http://localhost:3000';
const OUT = path.join('docs', 'design-references', 'clone');
const RES = RES_DIR;

/** Live measurements from behaviors.json, keyed by clone section index. */
const SECTIONS = ['header', 'hero', 'categories', 'bestsellers', 'promise', 'cta', 'social', 'seo', 'footer'];

const run = async () => {
  await ensureDir(OUT);
  const browser = await chromium.launch({ headless: true });
  const report = {};

  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(CLONE_URL, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await sleep(120); }
      window.scrollTo(0, 0); await sleep(400);
    });
    await page.waitForTimeout(1200);

    await page.screenshot({ path: path.join(OUT, `full-${name}-${vp.width}.png`), fullPage: true });
    if (name === 'desktop') await page.screenshot({ path: path.join(OUT, 'viewport-desktop-1440.png') });

    report[name] = await page.evaluate(() => ({
      docHeight: document.documentElement.scrollHeight,
      sections: [...(document.querySelector('main')?.children || [])].map((el) => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), top: Math.round(r.top + window.scrollY), h: Math.round(r.height), w: Math.round(r.width) };
      }),
      headerHeight: Math.round(document.querySelector('header')?.getBoundingClientRect().height || 0),
      footerHeight: Math.round(document.querySelector('footer')?.getBoundingClientRect().height || 0),
    }));

    if (name === 'desktop') {
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(800);
      report.headerAfterScroll = Math.round(
        await page.evaluate(() => document.querySelector('header')?.getBoundingClientRect().height || 0)
      );
    }
    await context.close();
    console.log(name, 'height', report[name].docHeight);
  }

  await browser.close();
  await writeJson(path.join(RES, 'qa-clone.json'), report);
  console.log('\nsection geometry (desktop):');
  report.desktop.sections.forEach((s, i) => console.log(' ', SECTIONS[i + 1] ?? '?', `top=${s.top} h=${s.h}`));
  console.log('header 128 ->', report.headerAfterScroll, '(expect 74)');
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
