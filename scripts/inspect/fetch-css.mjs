/**
 * Fetch the target's own stylesheets over HTTP (cross-origin blocks cssRules in-page)
 * and index the interactive rules.
 * Usage: node scripts/inspect/fetch-css.mjs [grepPattern]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { HOST, RES_DIR } from './lib.mjs';

const RES = RES_DIR;
const CSSDIR = path.join(RES, 'css');

const run = async () => {
  const recon = JSON.parse(await fs.readFile(path.join(RES, 'recon.json'), 'utf8'));
  const sheets = recon.stack.stylesheets.filter((h) => /bakingo/.test(h));
  await fs.mkdir(CSSDIR, { recursive: true });

  let all = '';
  for (const href of sheets) {
    const res = await fetch(href, { headers: { Referer: `https://${HOST}/` } });
    if (!res.ok) { console.log('FAIL', res.status, href); continue; }
    const css = await res.text();
    const name = path.basename(new URL(href).pathname);
    await fs.writeFile(path.join(CSSDIR, name), css, 'utf8');
    all += `\n/* ==== ${name} ==== */\n` + css;
    console.log('ok', name, Math.round(css.length / 1024) + 'KB');
  }
  await fs.writeFile(path.join(CSSDIR, '_all.css'), all, 'utf8');

  // Split minified CSS into individual rules for grepping
  const rules = all.match(/[^{}]+\{[^{}]*\}/g) || [];
  await fs.writeFile(path.join(CSSDIR, '_rules.txt'), rules.map((r) => r.replace(/\s+/g, ' ').trim()).join('\n'), 'utf8');
  console.log('total rules:', rules.length);

  const pattern = process.argv[2];
  if (pattern) {
    const re = new RegExp(pattern, 'i');
    rules.filter((r) => re.test(r)).slice(0, 60).forEach((r) => console.log(r.replace(/\s+/g, ' ').slice(0, 220)));
  }
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
