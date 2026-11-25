'use strict';

// Sliding-window limiter: LIMIT requests per WINDOW_SECONDS per client.
// - If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, a shared Redis counter is used
//   (reliable across serverless instances).
// - Otherwise an in-memory limiter is used. On Vercel each instance has its own memory, so this is a
//   best-effort safeguard only. See README.md.

const LIMIT = 5;
const WINDOW_SECONDS = 600;
const memory = new Map();

function memoryCheck(key, now = Date.now()) {
  const windowMs = WINDOW_SECONDS * 1000;
  const hits = (memory.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= LIMIT) {
    memory.set(key, hits);
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 5000) for (const [k, v] of memory) if (!v.length || now - v[v.length - 1] > windowMs) memory.delete(k);
  return { allowed: true, retryAfter: 0 };
}

async function redisCheck(key, env, fetchImpl) {
  const res = await fetchImpl(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['INCR', key], ['EXPIRE', key, String(WINDOW_SECONDS), 'NX']]),
  });
  if (!res.ok) throw new Error(`rate limit store responded ${res.status}`);
  const [{ result: count }] = await res.json();
  return count > LIMIT ? { allowed: false, retryAfter: WINDOW_SECONDS } : { allowed: true, retryAfter: 0 };
}

async function checkRateLimit(clientId, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const key = `inquiry:${clientId}`;
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await redisCheck(key, env, fetchImpl);
    } catch (err) {
      console.error('rate limit store unavailable, using in-memory limiter:', err.message);
    }
  }
  return memoryCheck(key);
}

module.exports = { checkRateLimit, memoryCheck, LIMIT, WINDOW_SECONDS, _memory: memory };
