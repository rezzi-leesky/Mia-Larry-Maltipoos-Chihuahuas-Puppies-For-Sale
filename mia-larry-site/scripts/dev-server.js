'use strict';
// Local development server: serves the static site and mounts the /api/inquiry function.
// Usage: npm run dev   (set variables from .env.example in your shell first to test email delivery)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../api/inquiry.js');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain' };

// Apply the same security headers Vercel will send (from vercel.json) so CSP problems show up locally.
const SECURITY_HEADERS = (JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers || [])
  .filter((h) => h.source === '/(.*)').flatMap((h) => h.headers);

function serve(req, res) {
  for (const { key, value } of SECURITY_HEADERS) res.setHeader(key, value);
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/inquiry') {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 100000) req.destroy(); });
    req.on('end', () => {
      if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        try { req.body = raw ? JSON.parse(raw) : undefined; } catch (_) { req.body = '{'; }
      }
      res.status = (c) => { res.statusCode = c; return res; };
      Promise.resolve(handler(req, res)).catch((e) => { console.error(e); res.statusCode = 500; res.end('{"ok":false}'); });
    });
    return;
  }
  const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = path.normalize(path.join(ROOT, rel));
  const allowed = ['index.html', 'favicon.svg', 'robots.txt'].includes(rel.slice(1)) || /^\/(assets|data)\//.test(rel);
  if (!file.startsWith(ROOT) || !allowed || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}

if (require.main === module) http.createServer(serve).listen(PORT, () => console.log(`http://localhost:${PORT}`));
module.exports = { serve };
