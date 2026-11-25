'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInquiry } = require('../lib/validate');

const ids = ['mell', 'bale'];
const good = { name: 'Jane Doe', email: 'jane@example.com', phone: '', puppy: 'mell', message: 'Is Mell still available?' };

test('accepts a valid inquiry and normalises it', () => {
  const r = validateInquiry({ ...good, name: '  Jane   Doe ' }, ids);
  assert.equal(r.ok, true);
  assert.equal(r.value.name, 'Jane Doe');
});
test('phone is optional but validated when present', () => {
  assert.equal(validateInquiry({ ...good, phone: '+1 (914) 555-0100' }, ids).ok, true);
  assert.ok(validateInquiry({ ...good, phone: 'abc' }, ids).errors.phone);
  assert.ok(validateInquiry({ ...good, phone: '123' }, ids).errors.phone);
});
test('rejects bad email, short name, short message', () => {
  const r = validateInquiry({ name: 'J', email: 'nope', message: 'hi' }, ids);
  assert.ok(r.errors.name && r.errors.email && r.errors.message);
});
test('rejects email with header-injection characters', () => {
  assert.ok(validateInquiry({ ...good, email: 'a@b.com\nBcc: x@y.com' }, ids).errors.email);
});
test('puppy must be one of the known ids (or empty for a general question)', () => {
  assert.ok(validateInquiry({ ...good, puppy: 'unknown' }, ids).errors.puppy);
  assert.equal(validateInquiry({ ...good, puppy: '' }, ids).ok, true);
});
test('honeypot marks submission as spam', () => {
  assert.equal(validateInquiry({ ...good, website: 'http://spam' }, ids).spam, true);
});
test('truncates over-long values and strips control characters', () => {
  const r = validateInquiry({ ...good, message: 'x'.repeat(5000) + '\u0000' }, ids);
  assert.equal(r.value.message.length, 2000);
  assert.equal(validateInquiry(null, ids).ok, false);
});
