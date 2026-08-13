/**
 * Follow-up sweep: exact header threshold, :hover CSS rules, carousel timing, mega-menu.
 * Usage: node scripts/inspect/behaviors2.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, HOST, RES_DIR } from './lib.mjs';

const RES = RES_DIR;

const run = async () => {
  const out = {};
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  // ---- exact header shrink threshold ---------------------------------------
  out.headerShrink = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const h = document.querySelector('.bk-header');
    const snap = () => {
      const s = getComputedStyle(h);
      return {
        height: Math.round(h.getBoundingClientRect().height),
        classes: h.className,
        transition: s.transition,
        kids: [...h.children].map((c) => ({
          cls: c.className?.toString().slice(0, 60),
          h: Math.round(c.getBoundingClientRect().height),
          display: getComputedStyle(c).display,
          opacity: getComputedStyle(c).opacity,
          transform: getComputedStyle(c).transform,
        })),
      };
    };
    window.scrollTo(0, 0); await sleep(600);
    const base = snap();
    let threshold = null, after = null;
    for (let y = 5; y <= 400; y += 5) {
      window.scrollTo(0, y); await sleep(160);
      const cur = snap();
      if (cur.height !== base.height || cur.classes !== base.classes) { threshold = y; after = cur; break; }
    }
    window.scrollTo(0, 600); await sleep(800);
    const settled = snap();
    window.scrollTo(0, 0); await sleep(800);
    return { base, threshold, after, settled, restored: snap() };
  });

  // ---- :hover rules from stylesheets ---------------------------------------
  out.hoverRules = await page.evaluate(() => {
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const r of list) {
        const txt = r.cssText || '';
        if (r.selectorText && r.selectorText.includes(':hover')) {
          rules.push({ selector: r.selectorText, css: txt.slice(0, 400) });
        } else if (r.constructor.name === 'CSSMediaRule') {
          for (const sub of r.cssRules) {
            if (sub.selectorText && sub.selectorText.includes(':hover')) {
              rules.push({ media: r.conditionText, selector: sub.selectorText, css: sub.cssText.slice(0, 400) });
            }
          }
        }
      }
    }
    return rules.slice(0, 200);
  });

  // ---- media queries in use (breakpoints) ----------------------------------
  out.breakpoints = await page.evaluate(() => {
    const conds = new Set();
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const r of list) if (r.constructor.name === 'CSSMediaRule') conds.add(r.conditionText);
    }
    return [...conds];
  });

  // ---- carousel autoplay interval ------------------------------------------
  out.carousel = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const root = document.querySelector('.content_7');
    window.scrollTo(0, 0); await sleep(500);
    const active = () => root.querySelector('.carousel .slide.selected img')?.src || root.querySelector('img')?.src;
    const timeline = [];
    let last = active();
    const t0 = performance.now();
    for (let i = 0; i < 160; i++) {
      await sleep(100);
      const cur = active();
      if (cur !== last) { timeline.push(Math.round(performance.now() - t0)); last = cur; }
      if (timeline.length >= 3) break;
    }
    const slides = [...root.querySelectorAll('.slide')].map((s) => {
      const img = s.querySelector('img');
      const a = s.querySelector('a');
      return { src: img?.src, alt: img?.alt, href: a?.getAttribute('href'), selected: s.className.includes('selected') };
    });
    const dots = [...root.querySelectorAll('.control-dots .dot')].map((d) => ({
      cls: d.className,
      style: d.getAttribute('style'),
      bg: getComputedStyle(d).backgroundColor,
      w: getComputedStyle(d).width,
      h: getComputedStyle(d).height,
      opacity: getComputedStyle(d).opacity,
      boxShadow: getComputedStyle(d).boxShadow,
    }));
    const wrapperCls = root.querySelector('.carousel-root')?.className;
    const transition = getComputedStyle(root.querySelector('.slider') || root).transition;
    return { changeTimestampsMs: timeline, slideCount: slides.length, slides, dots, wrapperCls, transition };
  });

  // ---- nav mega-menu on hover ----------------------------------------------
  out.megaMenu = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const navItems = [...document.querySelectorAll('.bk-header a, .bk-header li')]
      .filter((el) => /^(Cakes|Bento|Theme Cakes|By Relationship|Desserts & Hampers|Birthday|Anniversary|Occasions|Customized Cakes)$/i.test(el.textContent.trim()));
    const results = [];
    for (const item of navItems.slice(0, 9)) {
      const before = document.body.innerHTML.length;
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await sleep(600);
      const panel = document.querySelector('[class*="mega"], [class*="dropdown"]:not([style*="display: none"]), [class*="submenu"]');
      results.push({
        label: item.textContent.trim(),
        href: item.getAttribute?.('href'),
        domGrew: document.body.innerHTML.length - before,
        panelClass: panel?.className?.toString().slice(0, 120),
        panelVisible: panel ? getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().height > 0 : false,
        panelText: panel?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 300),
      });
      item.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await sleep(300);
    }
    return results;
  });

  await browser.close();
  await writeJson(path.join(RES, 'behaviors2.json'), out);
  console.log('threshold:', JSON.stringify(out.headerShrink.threshold), 'base h:', out.headerShrink.base.height, 'after h:', out.headerShrink.after?.height);
  console.log('hover rules:', out.hoverRules.length, '| breakpoints:', out.breakpoints.length);
  console.log('carousel slides:', out.carousel.slideCount, 'changes at ms:', out.carousel.changeTimestampsMs);
  console.log('mega menu hits:', out.megaMenu.filter((m) => m.panelVisible).length, '/', out.megaMenu.length);
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
