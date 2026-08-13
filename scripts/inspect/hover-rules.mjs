/**
 * Extract :hover / :active / transition rules authored by the target site only
 * (skips Bootstrap + FontAwesome + Toastify vendor noise).
 * Usage: node scripts/inspect/hover-rules.mjs
 */
import path from 'node:path';
import { openPage, primeLazyContent, writeJson, HOST, RES_DIR } from './lib.mjs';

const RES = RES_DIR;

const run = async () => {
  const { browser, page } = await openPage({ viewport: 'desktop', wait: 'domcontentloaded' });
  await primeLazyContent(page);

  const out = await page.evaluate(() => {
    const VENDOR = /(^|\.)(btn|navbar|list-group|breadcrumb|badge|alert|modal|popover|tooltip|custom-|page-link|dropdown-item|card-link|table|form-control|input-group|close|nav-tabs|nav-pills|carousel-control|Toastify|fa-|swal|blockquote)/;
    // Inline <style> sheets (href === null) hold the app CSS — keep them.
    const isVendorSheet = (href) => /bootstrap|fontawesome|use\.fontawesome|toastify/i.test(href || '');

    const own = [];
    for (const sheet of document.styleSheets) {
      if (isVendorSheet(sheet.href)) continue;
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      const visit = (rules, media) => {
        for (const r of rules) {
          if (r.constructor.name === 'CSSMediaRule') { visit(r.cssRules, r.conditionText); continue; }
          const sel = r.selectorText;
          if (!sel) continue;
          const interesting = /:hover|:active|:focus-visible|transition|animation/.test(r.cssText);
          if (!interesting) continue;
          if (VENDOR.test(sel)) continue;
          own.push({ media, selector: sel.slice(0, 200), css: r.cssText.replace(/\s+/g, ' ').slice(0, 400) });
        }
      };
      visit(list);
    }
    return own.slice(0, 400);
  });

  await writeJson(path.join(RES, 'hover-rules.json'), out);
  console.log('own interactive rules:', out.length);
  out.slice(0, 80).forEach((r) => console.log((r.media ? '@' + r.media + ' ' : '') + r.css.slice(0, 190)));
  await browser.close();
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
