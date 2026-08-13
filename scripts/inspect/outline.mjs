/**
 * Print the child outline of a selector (topology drill-down).
 * Usage: node scripts/inspect/outline.mjs "#bakingoApp" [depth]
 */
import { openPage, primeLazyContent } from './lib.mjs';

const selector = process.argv[2] || 'body';
const depth = Number(process.argv[3] || 1);

const probe = ({ selector, depth }) => {
  const root = document.querySelector(selector);
  if (!root) return { error: 'not found: ' + selector };
  const cs = (el) => getComputedStyle(el);
  const walk = (el, d, pathIdx) => {
    const r = el.getBoundingClientRect();
    const s = cs(el);
    const kids = [...el.children];
    return {
      path: pathIdx,
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      classes: el.className?.toString().slice(0, 120),
      top: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      w: Math.round(r.width),
      pos: s.position,
      z: s.zIndex,
      bg: s.backgroundColor,
      imgs: el.querySelectorAll('img').length,
      links: el.querySelectorAll('a').length,
      heading: el.querySelector('h1,h2,h3,h4')?.textContent?.trim().slice(0, 100),
      text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 140),
      children: d < depth ? kids.map((c, i) => walk(c, d + 1, pathIdx + '>' + i)) : undefined,
    };
  };
  return walk(root, 0, '0');
};

const print = (n, indent = '') => {
  if (!n) return;
  const sel = n.id ? '#' + n.id : n.classes ? '.' + n.classes.split(' ').filter(Boolean)[0] : n.tag;
  console.log(
    `${indent}${n.path} ${n.tag}${n.id ? '#' + n.id : ''} .${(n.classes || '').split(' ').filter(Boolean).slice(0, 3).join('.')} | top=${n.top} h=${n.h} w=${n.w} ${n.pos} imgs=${n.imgs} links=${n.links} | ${(n.heading || n.text || '').slice(0, 110)}`
  );
  (n.children || []).forEach((c) => print(c, indent + '  '));
};

const run = async () => {
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);
  const out = await page.evaluate(probe, { selector, depth });
  if (out.error) console.error(out.error);
  else print(out);
  await browser.close();
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
