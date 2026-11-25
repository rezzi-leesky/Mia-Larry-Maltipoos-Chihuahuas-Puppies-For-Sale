'use strict';
// Static project checks: data file shape, image references, anchors, and no leftover secrets/placeholders.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const problems = [];
const fail = (m) => problems.push(m);

const { puppies } = JSON.parse(read('data/puppies.json'));
const ids = new Set();
for (const p of puppies) {
  if (!/^[a-z0-9-]+$/.test(p.id || '')) fail(`puppy id invalid: ${p.id}`);
  if (ids.has(p.id)) fail(`duplicate puppy id: ${p.id}`);
  ids.add(p.id);
  if (!p.name) fail(`${p.id}: missing name`);
  if (!['available', 'reserved', 'sold'].includes(p.status)) fail(`${p.id}: status must be available, reserved or sold`);
  if (p.price !== null && !(Number.isFinite(p.price) && p.price > 0)) fail(`${p.id}: price must be a positive number or null`);
  if (!Array.isArray(p.photos) || !p.photos.length) fail(`${p.id}: needs at least one photo`);
  for (const ph of p.photos || []) if (!fs.existsSync(path.join(root, 'assets/img', `${ph}.webp`))) fail(`${p.id}: missing image assets/img/${ph}.webp`);
}

const html = read('index.html');
const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!htmlIds.has(m[1]) && !ids.has(m[1])) fail(`dead anchor: #${m[1]}`);
for (const m of html.matchAll(/(?:src|href)="((?:assets|data)\/[^"]+)"/g)) if (!fs.existsSync(path.join(root, m[1]))) fail(`missing file: ${m[1]}`);
if (/style="/.test(html)) fail('inline style attribute found in index.html (blocked by the Content-Security-Policy)');
if (/<script(?![^>]*src=)[^>]*>/.test(html)) fail('inline <script> found in index.html (blocked by the Content-Security-Policy)');
for (const label of html.matchAll(/<label for="([^"]+)"/g)) if (!htmlIds.has(label[1])) fail(`label points to missing field: ${label[1]}`);

const everything = ['index.html', 'assets/js/app.js', 'api/inquiry.js', 'lib/mailer.js'].map(read).join('\n');
if (/re_[A-Za-z0-9]{20,}|access_key["']?\s*:\s*["'][0-9a-f-]{20,}/.test(everything)) fail('possible hard-coded API key found');

if (problems.length) { console.error(problems.map((p) => `✗ ${p}`).join('\n')); process.exit(1); }
console.log(`✓ ${puppies.length} puppies, images, anchors and CSP rules look good`);
