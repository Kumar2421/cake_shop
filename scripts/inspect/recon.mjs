/**
 * Phase 1 reconnaissance: screenshots, global tokens, asset inventory, page topology.
 * Usage: node scripts/inspect/recon.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, ensureDir, VIEWPORTS, TARGET, HOST, RES_DIR, REF_DIR } from './lib.mjs';

const REF = REF_DIR;
const RES = RES_DIR;

const globalProbe = () => {
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const cs = (el) => getComputedStyle(el);

  const images = [...document.querySelectorAll('img')].map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.alt,
    w: img.naturalWidth,
    h: img.naturalHeight,
    loading: img.loading,
    parentClasses: img.parentElement?.className?.toString().slice(0, 120),
    siblingImgs: img.parentElement ? img.parentElement.querySelectorAll('img').length : 0,
    position: cs(img).position,
    zIndex: cs(img).zIndex,
  }));

  const videos = [...document.querySelectorAll('video')].map((v) => ({
    src: v.src || v.querySelector('source')?.src,
    poster: v.poster,
    autoplay: v.autoplay,
    loop: v.loop,
    muted: v.muted,
  }));

  const backgroundImages = [...document.querySelectorAll('*')]
    .map((el) => ({ el, bg: cs(el).backgroundImage }))
    .filter(({ bg }) => bg && bg !== 'none')
    .slice(0, 200)
    .map(({ el, bg }) => ({
      url: bg,
      element: el.tagName.toLowerCase() + '.' + (el.className?.toString().split(' ')[0] || ''),
      size: cs(el).backgroundSize,
      repeat: cs(el).backgroundRepeat,
      position: cs(el).backgroundPosition,
    }));

  const fonts = uniq([...document.querySelectorAll('*')].slice(0, 800).map((el) => cs(el).fontFamily));

  const fontLinks = [...document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]')]
    .map((l) => l.href)
    .filter((h) => /font/i.test(h));

  const fontFaces = [...document.styleSheets]
    .flatMap((s) => {
      try {
        return [...s.cssRules];
      } catch {
        return [];
      }
    })
    .filter((r) => r.constructor.name === 'CSSFontFaceRule')
    .map((r) => ({
      family: r.style.fontFamily,
      weight: r.style.fontWeight,
      style: r.style.fontStyle,
      src: r.style.src?.slice(0, 400),
    }));

  const favicons = [...document.querySelectorAll('link[rel*="icon"], link[rel="manifest"], link[rel="apple-touch-icon"]')]
    .map((l) => ({ rel: l.rel, href: l.href, sizes: l.sizes?.toString() }));

  const meta = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    og: [...document.querySelectorAll('meta[property^="og:"]')].map((m) => ({ p: m.getAttribute('property'), c: m.content })),
    themeColor: document.querySelector('meta[name="theme-color"]')?.content,
    lang: document.documentElement.lang,
  };

  // Color census across visible elements
  const colorCount = {};
  const bump = (map, key) => { if (key) map[key] = (map[key] || 0) + 1; };
  [...document.querySelectorAll('*')].slice(0, 2500).forEach((el) => {
    const s = cs(el);
    bump(colorCount, 'color:' + s.color);
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') bump(colorCount, 'bg:' + s.backgroundColor);
    if (s.borderTopColor && s.borderTopWidth !== '0px') bump(colorCount, 'border:' + s.borderTopColor);
  });
  const colors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 60);

  // Typography census
  const typoCount = {};
  [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,li,label')].slice(0, 1500).forEach((el) => {
    const s = cs(el);
    bump(typoCount, `${el.tagName.toLowerCase()} ${s.fontFamily.split(',')[0]} ${s.fontSize}/${s.lineHeight} w${s.fontWeight} ls${s.letterSpacing}`);
  });
  const typography = Object.entries(typoCount).sort((a, b) => b[1] - a[1]).slice(0, 60);

  const cssVars = (() => {
    const out = {};
    const s = cs(document.documentElement);
    for (let i = 0; i < s.length; i++) {
      const p = s[i];
      if (p.startsWith('--')) out[p] = s.getPropertyValue(p).trim();
    }
    return out;
  })();

  const stack = {
    next: !!document.querySelector('#__NEXT_DATA__') || !!window.__NEXT_DATA__,
    nuxt: !!window.__NUXT__,
    react: !!document.querySelector('[data-reactroot]') || !!window.React,
    angular: !!document.querySelector('[ng-version]'),
    jquery: !!window.jQuery,
    lenis: !!document.querySelector('.lenis') || !!window.Lenis,
    locomotive: !!document.querySelector('[data-scroll-container]'),
    gsap: !!window.gsap,
    swiper: !!document.querySelector('.swiper, .swiper-container') || !!window.Swiper,
    slick: !!document.querySelector('.slick-slider'),
    owl: !!document.querySelector('.owl-carousel'),
    bootstrap: !!window.bootstrap || !!document.querySelector('[class*="col-md-"]'),
    tailwind: [...document.querySelectorAll('*')].slice(0, 500).some((el) => /(^| )(flex|grid|text-\w+|px-\d)( |$)/.test(el.className?.toString() || '')),
    scripts: [...document.querySelectorAll('script[src]')].map((s) => s.src).slice(0, 60),
    stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href).slice(0, 40),
  };

  // Topology: direct children of body/main that form page sections
  const topoRoot =
    document.querySelector('main') ||
    document.querySelector('#root') ||
    document.querySelector('.wrapper') ||
    document.body;
  const sections = [...topoRoot.children].map((el, i) => {
    const r = el.getBoundingClientRect();
    const s = cs(el);
    return {
      index: i,
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      classes: el.className?.toString().slice(0, 160),
      top: Math.round(r.top + window.scrollY),
      height: Math.round(r.height),
      position: s.position,
      zIndex: s.zIndex,
      background: s.backgroundColor,
      display: s.display,
      childCount: el.children.length,
      heading: el.querySelector('h1,h2,h3')?.textContent?.trim().slice(0, 120),
      imgCount: el.querySelectorAll('img').length,
      linkCount: el.querySelectorAll('a').length,
      text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 200),
    };
  });

  return {
    url: location.href,
    docHeight: document.documentElement.scrollHeight,
    meta,
    fonts,
    fontLinks,
    fontFaces,
    favicons,
    colors,
    typography,
    cssVars,
    stack,
    counts: { images: images.length, videos: videos.length, svg: document.querySelectorAll('svg').length, bg: backgroundImages.length },
    images,
    videos,
    backgroundImages,
    topoRootSelector: topoRoot.tagName.toLowerCase() + (topoRoot.id ? '#' + topoRoot.id : ''),
    sections,
  };
};

const run = async () => {
  await ensureDir(REF);
  await ensureDir(RES);

  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  const data = await page.evaluate(globalProbe);
  await writeJson(path.join(RES, 'recon.json'), data);
  console.log('sections:', data.sections.length, 'images:', data.counts.images, 'height:', data.docHeight);

  await page.screenshot({ path: path.join(REF, 'full-desktop-1440.png'), fullPage: true });
  await page.screenshot({ path: path.join(REF, 'viewport-desktop-1440.png') });

  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    if (name === 'desktop') continue;
    await page.setViewportSize(vp);
    await page.waitForTimeout(1200);
    await primeLazyContent(page);
    await page.screenshot({ path: path.join(REF, `full-${name}-${vp.width}.png`), fullPage: true });
  }

  await browser.close();
  console.log('recon done ->', RES);
};

run().catch((e) => {
  console.error('RECON FAILED:', e.message);
  process.exit(1);
});
