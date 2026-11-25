'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { memoryCheck, LIMIT, checkRateLimit, _memory } = require('../lib/ratelimit');

test('in-memory limiter blocks after the limit and recovers after the window', () => {
  _memory.clear();
  const t0 = 1_000_000;
  for (let i = 0; i < LIMIT; i++) assert.equal(memoryCheck('a', t0 + i).allowed, true);
  const blocked = memoryCheck('a', t0 + 10);
  assert.equal(blocked.allowed, false); assert.ok(blocked.retryAfter > 0);
  assert.equal(memoryCheck('a', t0 + 11 * 60 * 1000).allowed, true);
  assert.equal(memoryCheck('b', t0).allowed, true);
});
test('uses the shared Redis store when configured and falls back if it fails', async () => {
  _memory.clear();
  const env = { UPSTASH_REDIS_REST_URL: 'https://r.test', UPSTASH_REDIS_REST_TOKEN: 't' };
  const over = await checkRateLimit('x', { env, fetchImpl: async () => ({ ok: true, json: async () => [{ result: LIMIT + 1 }, { result: 1 }] }) });
  assert.equal(over.allowed, false);
  const quiet = console.error; console.error = () => {};
  try {
    const fallback = await checkRateLimit('y', { env, fetchImpl: async () => ({ ok: false, status: 500 }) });
    assert.equal(fallback.allowed, true);
  } finally { console.error = quiet; }
});
