/**
 * Mandatory interaction sweep: scroll, hover, click, responsive.
 * Usage: node scripts/inspect/behaviors.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, STYLE_PROPS, VIEWPORTS, HOST, RES_DIR } from './lib.mjs';

const RES = RES_DIR;

const styleOf = async (page, selector) =>
  page.evaluate(
    ({ selector, props }) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const out = { _rect: { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) } };
      props.forEach((p) => { const v = cs[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') out[p] = v; });
      return out;
    },
    { selector, props: STYLE_PROPS }
  );

const diff = (a, b) => {
  if (!a || !b) return { error: 'missing state' };
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const d = {};
  keys.forEach((k) => {
    const av = JSON.stringify(a[k]), bv = JSON.stringify(b[k]);
    if (av !== bv) d[k] = { before: a[k], after: b[k] };
  });
  return d;
};

const run = async () => {
  const report = {};
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  // ---- 1. Header scroll behavior -------------------------------------------
  const headerSelectors = ['.bk-header', '.bk-header > div', '.header-container'];
  report.headerScroll = {};
  for (const sel of headerSelectors) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const at0 = await styleOf(page, sel);
    if (!at0) continue;
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(900);
    const at400 = await styleOf(page, sel);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(900);
    const at1200 = await styleOf(page, sel);
    report.headerScroll[sel] = { diff0to400: diff(at0, at400), diff400to1200: diff(at400, at1200), state0: at0 };
  }

  // find exact scroll threshold where header height changes
  report.headerThreshold = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.querySelector('.bk-header');
    if (!el) return null;
    window.scrollTo(0, 0); await sleep(500);
    const base = Math.round(el.getBoundingClientRect().height);
    for (let y = 20; y <= 600; y += 20) {
      window.scrollTo(0, y); await sleep(120);
      const h = Math.round(el.getBoundingClientRect().height);
      if (h !== base) return { baseHeight: base, changedAt: y, newHeight: h };
    }
    return { baseHeight: base, changedAt: null };
  });

  // ---- 2. Global scroll/animation mechanisms -------------------------------
  report.globalScroll = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const animated = [...document.querySelectorAll('*')].slice(0, 3000)
      .map((el) => ({ el, s: getComputedStyle(el) }))
      .filter(({ s }) => (s.animationName && s.animationName !== 'none') || (s.transition && s.transition !== 'all 0s ease 0s'))
      .slice(0, 40)
      .map(({ el, s }) => ({
        sel: el.tagName.toLowerCase() + '.' + (el.className?.toString().split(' ')[0] || ''),
        animation: s.animationName !== 'none' ? `${s.animationName} ${s.animationDuration} ${s.animationTimingFunction} ${s.animationIterationCount}` : undefined,
        transition: s.transition !== 'all 0s ease 0s' ? s.transition : undefined,
      }));
    const keyframes = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
      .filter((r) => r.constructor.name === 'CSSKeyframesRule')
      .map((r) => r.cssText.slice(0, 600));
    const sticky = [...document.querySelectorAll('*')].slice(0, 3000)
      .filter((el) => ['sticky', 'fixed'].includes(getComputedStyle(el).position))
      .slice(0, 30)
      .map((el) => ({ sel: el.tagName.toLowerCase() + '.' + (el.className?.toString().split(' ').slice(0, 2).join('.') || ''), pos: getComputedStyle(el).position, top: getComputedStyle(el).top, z: getComputedStyle(el).zIndex }));
    return {
      htmlScrollBehavior: cs.scrollBehavior,
      bodyScrollSnap: body.scrollSnapType,
      hasLenis: !!document.querySelector('.lenis'),
      animated, keyframes: keyframes.slice(0, 25), sticky,
    };
  });

  // ---- 3. Hero carousel ----------------------------------------------------
  report.heroCarousel = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const root = document.querySelector('.content_7');
    if (!root) return null;
    const snap = () => ({
      imgs: [...root.querySelectorAll('img')].map((i) => ({ src: i.currentSrc || i.src, alt: i.alt })),
      counter: root.textContent.match(/\d+ of \d+/)?.[0],
      transform: getComputedStyle(root.querySelector('[style*="transform"]') || root).transform,
      html: root.className,
    });
    window.scrollTo(0, 0); await sleep(300);
    const t0 = snap();
    await sleep(5000);
    const t5 = snap();
    const dots = [...root.querySelectorAll('button, .dot, [class*="dot"], [class*="indicator"], [class*="slick-dots"] li')].length;
    const arrows = [...root.querySelectorAll('[class*="arrow"], [class*="prev"], [class*="next"]')].map((e) => e.className?.toString());
    return { autoplayChanged: JSON.stringify(t0) !== JSON.stringify(t5), t0, t5, dots, arrows, classes: root.className };
  });

  // ---- 4. Hover sweep ------------------------------------------------------
  const hoverTargets = [
    { name: 'productCard', sel: '.content_9 a, .content_9 [class*="card"]' },
    { name: 'categoryTile', sel: '.content_4 a' },
    { name: 'navItem', sel: '.bk-header a' },
    { name: 'footerLink', sel: '.footer-container a' },
  ];
  report.hover = {};
  for (const t of hoverTargets) {
    const exists = await page.$(t.sel);
    if (!exists) { report.hover[t.name] = 'selector not found'; continue; }
    const before = await styleOf(page, t.sel);
    try {
      await page.hover(t.sel, { timeout: 5000 });
      await page.waitForTimeout(600);
      const after = await styleOf(page, t.sel);
      report.hover[t.name] = { selector: t.sel, diff: diff(before, after), transition: before?.transition };
    } catch (e) {
      report.hover[t.name] = 'hover failed: ' + e.message.split('\n')[0];
    }
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
  }

  // ---- 5. Clickable / stateful elements ------------------------------------
  report.clickables = await page.evaluate(() => {
    const cs = (el) => getComputedStyle(el);
    return [...document.querySelectorAll('button, [role="button"], [class*="tab"], [class*="pill"], [class*="dot"]')]
      .filter((el) => el.offsetParent !== null)
      .slice(0, 60)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        classes: el.className?.toString().slice(0, 100),
        text: el.textContent?.trim().slice(0, 60),
        cursor: cs(el).cursor,
        rectTop: Math.round(el.getBoundingClientRect().top + window.scrollY),
      }));
  });

  // ---- 6. Responsive sweep -------------------------------------------------
  report.responsive = {};
  const probeSelectors = ['.bk-header', '.content_7', '.content_4', '.content_9', '.content_1', '.content_6', '.footer-container'];
  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(vp);
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await primeLazyContent(page, 1200, 150);
    report.responsive[name] = await page.evaluate(
      ({ sels, props }) => {
        const out = {};
        sels.forEach((s) => {
          const el = document.querySelector(s);
          if (!el) { out[s] = 'absent'; return; }
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const picked = {};
          ['display', 'flexDirection', 'gridTemplateColumns', 'gap', 'padding', 'height', 'fontSize'].forEach((p) => { picked[p] = cs[p]; });
          out[s] = { ...picked, rect: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + window.scrollY) }, visibleChildren: [...el.children].filter((c) => c.getBoundingClientRect().height > 0).length };
        });
        return out;
      },
      { sels: probeSelectors, props: STYLE_PROPS }
    );
  }

  await browser.close();
  await writeJson(path.join(RES, 'behaviors.json'), report);
  console.log('behaviors ->', path.join(RES, 'behaviors.json'));
  console.log('header threshold:', JSON.stringify(report.headerThreshold));
  console.log('carousel autoplay:', report.heroCarousel?.autoplayChanged);
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
