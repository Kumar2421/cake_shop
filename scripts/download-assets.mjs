/**
 * Download every asset discovered by recon into public/.
 * Usage: node scripts/download-assets.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const TARGET = process.env.TARGET_URL || 'https://www.bakingo.com/';
const HOST = process.env.TARGET_HOST || new URL(TARGET).hostname;
/** Matches scripts/inspect/lib.mjs so each page keeps its own recon artifacts. */
const SLUG =
  new URL(TARGET).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';
const RES_DIR =
  SLUG === 'home'
    ? path.join('docs', 'research', HOST)
    : path.join('docs', 'research', HOST, SLUG);
const RECON = path.join(RES_DIR, 'recon.json');

/** Hosts whose assets are third-party widgets we do not clone. */
const SKIP_HOSTS = [/limechat/i, /googletagmanager/i, /doubleclick/i, /criteo/i, /facebook/i];

const slug = (u) => {
  const url = new URL(u);
  const base = path.basename(url.pathname) || 'asset';
  const clean = base
    .replace(/\.(?=[^.]*\.)/g, '-')          // collapse cache-busting hashes: a.1b2c3.png -> a-1b2c3.png
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase();
  return clean;
};

const bucketFor = (u, kind) => {
  if (kind === 'font') return path.join('public', 'fonts');
  if (kind === 'seo') return path.join('public', 'seo');
  const h = new URL(u).hostname;
  if (/cdninstagram/.test(h)) return path.join('public', 'images', 'instagram');
  return path.join('public', 'images');
};

const download = async (url, kind) => {
  const dir = bucketFor(url, kind);
  const file = path.join(dir, slug(url));
  try {
    await fs.access(file);
    return { url, file, status: 'cached' };
  } catch {}
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Referer: `https://${HOST}/`,
    },
  });
  if (!res.ok) return { url, file, status: 'HTTP ' + res.status };
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, buf);
  return { url, file, status: 'ok', bytes: buf.length };
};

const batch = async (items, size, fn) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
    process.stdout.write(`\r${Math.min(i + size, items.length)}/${items.length}   `);
  }
  process.stdout.write('\n');
  return out;
};

const run = async () => {
  const recon = JSON.parse(await fs.readFile(RECON, 'utf8'));

  const imgUrls = recon.images.map((i) => i.src).filter(Boolean);
  const bgUrls = recon.backgroundImages
    .flatMap((b) => [...b.url.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]))
    .filter((u) => u.startsWith('http'));
  const fontUrls = recon.fontFaces
    .flatMap((f) => [...(f.src || '').matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]))
    .filter((u) => u.startsWith('http'));
  const seoUrls = recon.favicons.map((f) => f.href).filter(Boolean);
  const ogUrls = recon.meta.og.filter((o) => o.p === 'og:image').map((o) => o.c).filter(Boolean);

  const keep = (u) => u.startsWith('http') && !SKIP_HOSTS.some((r) => r.test(u));
  const jobs = [
    ...[...new Set([...imgUrls, ...bgUrls])].filter(keep).map((u) => ({ u, kind: 'image' })),
    ...[...new Set(fontUrls)].filter(keep).map((u) => ({ u, kind: 'font' })),
    ...[...new Set([...seoUrls, ...ogUrls])].filter(keep).map((u) => ({ u, kind: 'seo' })),
  ];

  console.log(`downloading ${jobs.length} assets...`);
  const results = await batch(jobs, 6, ({ u, kind }) => download(u, kind).catch((e) => ({ url: u, status: 'ERR ' + e.message })));

  const failed = results.filter((r) => r.status !== 'ok' && r.status !== 'cached');
  const manifest = results.map((r) => ({ url: r.url, file: r.file?.replace(/\\/g, '/'), status: r.status }));
  await fs.writeFile(path.join(RES_DIR, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`ok: ${results.filter((r) => r.status === 'ok').length}, cached: ${results.filter((r) => r.status === 'cached').length}, failed: ${failed.length}`);
  failed.slice(0, 20).forEach((f) => console.log('  FAIL', f.status, f.url));
};

run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
