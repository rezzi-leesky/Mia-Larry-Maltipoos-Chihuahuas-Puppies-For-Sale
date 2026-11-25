'use strict';

// Remove control characters (including newlines in single-line fields) and trim.
function clean(value, max, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  const pattern = multiline
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, multiline ? '' : ' ').replace(/\s+/g, multiline ? (m) => m : ' ').trim().slice(0, max);
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

/**
 * Validate and normalise an inquiry. Returns { ok, errors, value, spam }.
 * `spam` is true when the hidden honeypot field was filled in.
 */
function validateInquiry(body, allowedPuppyIds = []) {
  const input = body && typeof body === 'object' ? body : {};
  const errors = {};

  const name = clean(input.name, 100);
  if (name.length < 2) errors.name = 'Please enter your name.';

  const email = clean(input.email, 254);
  if (!email) errors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const phone = clean(input.phone, 30);
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (!/^[+0-9().\-\s]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
      errors.phone = 'Please enter a valid phone number, or leave it blank.';
    }
  }

  const puppy = clean(input.puppy, 40);
  if (puppy && !allowedPuppyIds.includes(puppy)) errors.puppy = 'Please choose a puppy from the list.';

  const message = clean(input.message, 2000, { multiline: true });
  if (message.length < 10) errors.message = 'Please write a short message (at least 10 characters).';

  const spam = typeof input.website === 'string' && input.website.trim() !== '';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    spam,
    value: { name, email, phone, puppy, message },
  };
}

module.exports = { validateInquiry, clean, EMAIL_RE };
