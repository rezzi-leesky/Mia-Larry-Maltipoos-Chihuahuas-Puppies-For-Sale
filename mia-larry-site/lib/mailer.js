'use strict';

class NotConfiguredError extends Error {
  constructor() {
    super('No email provider is configured');
    this.name = 'NotConfiguredError';
  }
}

const oneLine = (s) => String(s).replace(/[\r\n]+/g, ' ').trim();

function buildMessage(data, puppyName) {
  const subject = oneLine(`New website inquiry${puppyName ? ` about ${puppyName}` : ''} from ${data.name}`).slice(0, 150);
  const text = [
    'New inquiry from the Mia & Larry website',
    '',
    `Puppy: ${puppyName || 'General question'}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || 'not provided'}`,
    '',
    'Message:',
    data.message,
    '',
    '(Reply to this email to answer the sender directly.)',
  ].join('\n');
  return { subject, text };
}

/**
 * Deliver an inquiry using the first configured provider:
 *   1. Resend       (RESEND_API_KEY + INQUIRY_TO_EMAIL + INQUIRY_FROM_EMAIL)
 *   2. Web3Forms    (WEB3FORMS_ACCESS_KEY), called from the server so the key stays private
 * Throws NotConfiguredError when neither is set, and Error when the provider rejects the request.
 */
async function sendInquiry(data, puppyName, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const { subject, text } = buildMessage(data, puppyName);

  if (env.RESEND_API_KEY && env.INQUIRY_TO_EMAIL && env.INQUIRY_FROM_EMAIL) {
    const res = await fetchImpl(env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.INQUIRY_FROM_EMAIL,
        to: [env.INQUIRY_TO_EMAIL],
        reply_to: data.email,
        subject,
        text,
      }),
    });
    if (!res.ok) throw new Error(`Resend responded with status ${res.status}`);
    return { provider: 'resend' };
  }

  if (env.WEB3FORMS_ACCESS_KEY) {
    const res = await fetchImpl(env.WEB3FORMS_API_URL || 'https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_ACCESS_KEY,
        subject,
        from_name: 'Mia & Larry website',
        name: data.name,
        email: data.email,
        phone: data.phone || 'not provided',
        puppy: puppyName || 'General question',
        message: data.message,
      }),
    });
    let ok = res.ok;
    try {
      const json = await res.json();
      ok = ok && json.success !== false;
    } catch (_) { /* non-JSON body: rely on status */ }
    if (!ok) throw new Error(`Web3Forms rejected the request (status ${res.status})`);
    return { provider: 'web3forms' };
  }

  throw new NotConfiguredError();
}

module.exports = { sendInquiry, buildMessage, NotConfiguredError };
