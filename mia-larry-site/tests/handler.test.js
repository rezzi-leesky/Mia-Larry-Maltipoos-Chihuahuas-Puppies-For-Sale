'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../lib/handler');
const { NotConfiguredError } = require('../lib/mailer');

const puppies = [{ id: 'mell', name: 'Mell' }];
const body = { name: 'Jane Doe', email: 'jane@example.com', phone: '', puppy: 'mell', message: 'Is Mell still available?', website: '' };

function run(handler, { method = 'POST', headers = {}, payload = body } = {}) {
  return new Promise((resolve) => {
    const req = { method, headers: { 'content-type': 'application/json', host: 'site.test', origin: 'https://site.test', ...headers }, body: payload, socket: { remoteAddress: '1.2.3.4' } };
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(data) { resolve({ status: this.statusCode, headers: this.headers, json: data ? JSON.parse(data) : null }); } };
    handler(req, res);
  });
}
const allow = async () => ({ allowed: true, retryAfter: 0 });

test('delivers a valid inquiry with the puppy name', async () => {
  let sent;
  const h = createHandler({ puppies, send: async (d, n) => { sent = { d, n }; }, rateLimit: allow });
  const r = await run(h);
  assert.equal(r.status, 200); assert.equal(r.json.ok, true);
  assert.equal(sent.n, 'Mell'); assert.equal(sent.d.email, 'jane@example.com');
  assert.equal(r.headers['Cache-Control'], 'no-store');
});
test('rejects non-POST, wrong content type, foreign origin', async () => {
  const h = createHandler({ puppies, send: async () => {}, rateLimit: allow });
  assert.equal((await run(h, { method: 'GET' })).status, 405);
  assert.equal((await run(h, { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await run(h, { headers: { origin: 'https://evil.test' } })).status, 403);
});
test('returns field errors for invalid input and does not send', async () => {
  let called = false;
  const h = createHandler({ puppies, send: async () => { called = true; }, rateLimit: allow });
  const r = await run(h, { payload: { ...body, email: 'bad' } });
  assert.equal(r.status, 400); assert.ok(r.json.errors.email); assert.equal(called, false);
});
test('honeypot gets a silent success and nothing is sent', async () => {
  let called = false;
  const h = createHandler({ puppies, send: async () => { called = true; }, rateLimit: allow });
  const r = await run(h, { payload: { ...body, website: 'spam' } });
  assert.equal(r.status, 200); assert.equal(called, false);
});
test('rate limited requests get 429 with Retry-After', async () => {
  const h = createHandler({ puppies, send: async () => {}, rateLimit: async () => ({ allowed: false, retryAfter: 42 }) });
  const r = await run(h);
  assert.equal(r.status, 429); assert.equal(r.headers['Retry-After'], '42');
});
test('reports 503 when no email provider is configured and 502 when delivery fails', async () => {
  const quiet = console.error; console.error = () => {};
  try {
    const none = createHandler({ puppies, send: async () => { throw new NotConfiguredError(); }, rateLimit: allow });
    assert.equal((await run(none)).json.error, 'not_configured');
    const bad = createHandler({ puppies, send: async () => { throw new Error('boom secret'); }, rateLimit: allow });
    const r = await run(bad);
    assert.equal(r.status, 502); assert.ok(!JSON.stringify(r.json).includes('secret'));
  } finally { console.error = quiet; }
});
