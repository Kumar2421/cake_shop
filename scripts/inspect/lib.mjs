import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

export const TARGET = process.env.TARGET_URL || 'https://www.bakingo.com/';
export const ROOT = path.resolve(process.cwd());
export const HOST = new URL(TARGET).hostname;

/** Page slug so several pages of one host keep separate artifacts ("home" for /). */
export const SLUG =
  new URL(TARGET).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';

/** Where this page's research + reference captures live. */
export const RES_DIR =
  SLUG === 'home'
    ? path.join('docs', 'research', HOST)
    : path.join('docs', 'research', HOST, SLUG);
export const REF_DIR =
  SLUG === 'home'
    ? path.join('docs', 'design-references', HOST)
    : path.join('docs', 'design-references', HOST, SLUG);

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

export async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

export async function writeJson(file, data) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  return file;
}

export async function writeText(file, text) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, text, 'utf8');
  return file;
}

/**
 * Launch a browser page at the target URL, ready for evaluation.
 * Blocks nothing by default — the real site's assets are the point.
 */
export async function openPage({ viewport = 'desktop', url = TARGET, wait = 'load' } = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-IN',
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: wait, timeout: 90_000 });
  await page.waitForTimeout(2500);
  return { browser, context, page };
}

/** Scroll the whole page in steps so lazy content loads, then return to top. */
export async function primeLazyContent(page, step = 800, pause = 250) {
  await page.evaluate(
    async ([step, pause]) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const max = () =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      for (let y = 0; y < max(); y += step) {
        window.scrollTo(0, y);
        await sleep(pause);
      }
      window.scrollTo(0, 0);
      await sleep(500);
    },
    [step, pause]
  );
}

/** The computed-style property list from the clone-website skill. */
export const STYLE_PROPS = [
  'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'color',
  'textTransform', 'textDecoration', 'textAlign', 'backgroundColor', 'background',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'width', 'height', 'maxWidth', 'minWidth', 'maxHeight', 'minHeight',
  'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap',
  'gridTemplateColumns', 'gridTemplateRows',
  'borderRadius', 'border', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight',
  'boxShadow', 'overflow', 'overflowX', 'overflowY',
  'position', 'top', 'right', 'bottom', 'left', 'zIndex',
  'opacity', 'transform', 'transition', 'cursor',
  'objectFit', 'objectPosition', 'mixBlendMode', 'filter', 'backdropFilter',
  'whiteSpace', 'textOverflow', 'WebkitLineClamp', 'aspectRatio',
];

/** Walk a subtree and capture computed styles. Runs inside the page. */
export function walkFnSource() {
  return `(selector, props, maxDepth) => {
    const el = document.querySelector(selector);
    if (!el) return { error: 'Element not found: ' + selector };
    const DEFAULTS = new Set(['none','normal','auto','0px','rgba(0, 0, 0, 0)','static','visible','0s']);
    const styles = (node) => {
      const cs = getComputedStyle(node);
      const out = {};
      for (const p of props) {
        const v = cs[p];
        if (v && !DEFAULTS.has(v)) out[p] = v;
      }
      return out;
    };
    const walk = (node, depth) => {
      if (depth > maxDepth) return null;
      const kids = [...node.children];
      const onlyText = node.childNodes.length === 1 && node.childNodes[0].nodeType === 3;
      return {
        tag: node.tagName.toLowerCase(),
        classes: (node.className && node.className.toString ? node.className.toString() : '').split(' ').filter(Boolean).slice(0, 6).join(' '),
        id: node.id || undefined,
        text: onlyText ? node.textContent.trim().slice(0, 300) : undefined,
        styles: styles(node),
        img: node.tagName === 'IMG' ? { src: node.currentSrc || node.src, alt: node.alt, w: node.naturalWidth, h: node.naturalHeight } : undefined,
        childCount: kids.length,
        children: kids.slice(0, 24).map((c) => walk(c, depth + 1)).filter(Boolean),
      };
    };
    return walk(el, 0);
  }`;
}

export async function extractComponent(page, selector, maxDepth = 4) {
  return page.evaluate(
    ({ selector, props, maxDepth, src }) => eval(src)(selector, props, maxDepth),
    { selector, props: STYLE_PROPS, maxDepth, src: walkFnSource() }
  );
}
