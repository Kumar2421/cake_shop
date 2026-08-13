/**
 * Print an extracted section tree (docs/research/<host>/sections/<key>.json) as an outline.
 * Usage: node scripts/inspect/tree.mjs <key> [maxLines] [--styles]
 */
import fs from 'node:fs';
import path from 'node:path';
import { HOST, RES_DIR } from './lib.mjs';

const key = process.argv[2];
const maxLines = Number(process.argv[3] || 120);
const withStyles = process.argv.includes('--styles');

const file = path.join(RES_DIR, 'sections', `${key}.json`);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

/** Values the walker records but that carry no design information. */
const NOISE = new Set([
  'border', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight',
  'objectFit', 'objectPosition', 'textOverflow', 'flexWrap', 'background',
]);
const NOISE_VALUE = {
  transition: 'all', opacity: '1', flexDirection: 'row', display: 'block',
  fontFamily: '"Isidora Sans Alt"', textAlign: 'left', overflow: 'clip',
  overflowX: 'clip', overflowY: 'clip',
};

const clean = (styles) => {
  const out = {};
  for (const [k, v] of Object.entries(styles || {})) {
    if (NOISE.has(k)) continue;
    if (NOISE_VALUE[k] === v) continue;
    out[k] = v;
  }
  return out;
};

const lines = [];
const walk = (n, d) => {
  if (!n || lines.length > maxLines) return;
  const cls = n.classes ? '.' + n.classes.split(' ').join('.') : '';
  const text = n.text ? ` "${n.text.slice(0, 50)}"` : '';
  const img = n.img ? ` IMG=${n.img.src.split('/').pop()?.slice(0, 40)}` : '';
  const st = withStyles && n.styles ? ' ' + JSON.stringify(clean(n.styles)) : '';
  lines.push(`${'  '.repeat(d)}${n.tag}${cls}${text}${img}${st}`);
  (n.children || []).forEach((c) => walk(c, d + 1));
};
walk(data.tree, 0);
console.log(lines.join('\n'));
