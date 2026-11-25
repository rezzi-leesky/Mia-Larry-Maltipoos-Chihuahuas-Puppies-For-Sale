'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { sendInquiry, buildMessage, NotConfiguredError } = require('../lib/mailer');

const data = { name: 'Jane Doe', email: 'jane@example.com', phone: '', message: 'Hello there, is Mell available?' };

test('throws NotConfiguredError without any provider settings', async () => {
  await assert.rejects(() => sendInquiry(data, 'Mell', { env: {}, fetchImpl: async () => { throw new Error('should not be called'); } }), NotConfiguredError);
});
test('uses Resend with reply-to and plain text only', async () => {
  let call;
  const env = { RESEND_API_KEY: 'k', INQUIRY_TO_EMAIL: 'owner@example.com', INQUIRY_FROM_EMAIL: 'Site <site@example.com>' };
  await sendInquiry(data, 'Mell', { env, fetchImpl: async (url, init) => { call = { url, init }; return { ok: true }; } });
  const sent = JSON.parse(call.init.body);
  assert.equal(call.url, 'https://api.resend.com/emails');
  assert.equal(call.init.headers.Authorization, 'Bearer k');
  assert.deepEqual(sent.to, ['owner@example.com']); assert.equal(sent.reply_to, 'jane@example.com');
  assert.ok(sent.text.includes('Puppy: Mell') && !('html' in sent));
});
test('falls back to Web3Forms and surfaces rejections', async () => {
  const env = { WEB3FORMS_ACCESS_KEY: 'abc' };
  const r = await sendInquiry(data, '', { env, fetchImpl: async () => ({ ok: true, json: async () => ({ success: true }) }) });
  assert.equal(r.provider, 'web3forms');
  await assert.rejects(() => sendInquiry(data, '', { env, fetchImpl: async () => ({ ok: true, json: async () => ({ success: false }) }) }));
  await assert.rejects(() => sendInquiry(data, '', { env, fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) }) }));
});
test('subject is a single line', () => {
  assert.ok(!/[\r\n]/.test(buildMessage({ ...data, name: 'A\r\nBcc: x' }, 'Mell').subject));
});
