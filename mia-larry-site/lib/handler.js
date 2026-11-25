'use strict';

const { validateInquiry } = require('./validate');
const { checkRateLimit } = require('./ratelimit');
const { sendInquiry, NotConfiguredError } = require('./mailer');

const MAX_BODY_CHARS = 8000;

function json(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
}

function clientId(req) {
  const raw = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown';
  return String(raw).split(',')[0].trim().slice(0, 64);
}

function originAllowed(req, env) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients; still validated and rate limited
  let host;
  try { host = new URL(origin).host; } catch (_) { return false; }
  if (host === req.headers.host) return true;
  const extra = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin);
}

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return req.body;
  }
  return null;
}

function createHandler({ puppies, env = process.env, send = sendInquiry, rateLimit = checkRateLimit } = {}) {
  const ids = puppies.map((p) => p.id);
  const names = Object.fromEntries(puppies.map((p) => [p.id, p.name]));

  return async function handler(req, res) {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });
    if (!originAllowed(req, env)) return json(res, 403, { ok: false, error: 'forbidden' });

    const type = String(req.headers['content-type'] || '');
    if (!type.includes('application/json')) return json(res, 415, { ok: false, error: 'unsupported_media_type' });

    let body;
    try {
      body = readBody(req);
    } catch (_) {
      return json(res, 400, { ok: false, error: 'invalid_json' });
    }
    if (!body || typeof body !== 'object' || JSON.stringify(body).length > MAX_BODY_CHARS) {
      return json(res, 400, { ok: false, error: 'invalid_request' });
    }

    const limit = await rateLimit(clientId(req), { env });
    if (!limit.allowed) {
      return json(res, 429, { ok: false, error: 'rate_limited' }, { 'Retry-After': String(limit.retryAfter) });
    }

    const result = validateInquiry(body, ids);
    if (result.spam) return json(res, 200, { ok: true }); // pretend success so bots learn nothing
    if (!result.ok) return json(res, 400, { ok: false, error: 'validation_failed', errors: result.errors });

    try {
      await send(result.value, names[result.value.puppy] || '', { env });
      return json(res, 200, { ok: true });
    } catch (err) {
      if (err instanceof NotConfiguredError) {
        console.error('Inquiry not delivered: no email provider configured (see README.md).');
        return json(res, 503, { ok: false, error: 'not_configured' });
      }
      console.error('Inquiry delivery failed:', err.message);
      return json(res, 502, { ok: false, error: 'delivery_failed' });
    }
  };
}

module.exports = { createHandler };
