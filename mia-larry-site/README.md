# Mia & Larry — Maltipoos | Chihuahuas

Static website plus one serverless function, deployed on Vercel.

## How it works

| Part | Where | Notes |
| --- | --- | --- |
| Page | `index.html`, `assets/css/styles.css`, `assets/js/app.js` | Plain HTML, CSS and JavaScript. No build step, no frameworks, no third-party scripts or fonts. |
| Puppies | `data/puppies.json` | The only file you edit to add, change or hide a puppy. |
| Photos | `assets/img/*.webp` | Puppy photos are named in `puppies.json` without the `.webp` extension. |
| Inquiry form | `api/inquiry.js` → `lib/` | Vercel serverless function: validates, rate limits, then sends an email to the owner. |
| Security headers | `vercel.json` | Content-Security-Policy and friends. All scripts and styles are external files, so do not add inline `<script>` or `style=""`. |

Puppy pages use the address hash (for example `/#mell`), so existing links keep working.

## Run it locally

Requires Node.js 18 or newer. There is nothing to install.

```bash
npm run dev      # http://localhost:3000 (static site + /api/inquiry, same security headers as Vercel)
npm run verify   # project checks + unit tests
```

To test real email delivery locally, export the variables from `.env.example` in your shell first.

## Deploy (Vercel)

The project needs no build command. In Vercel: Framework Preset **Other**, Build Command empty, Output Directory empty (project root). Pushing to the connected branch deploys it.

### Make the inquiry form deliver email (required, one-time)

Until this is done the form tells visitors "We could not send your message online" and shows your phone, WhatsApp and email. It never pretends to have sent.

Pick **one** option and add the variables in Vercel → Project → Settings → Environment Variables, then redeploy.

**Option A: Resend (recommended)**
1. Create an account at resend.com and verify a sending domain (or use their test sender while trying it out).
2. Create an API key.
3. Add `RESEND_API_KEY`, `INQUIRY_TO_EMAIL` (where you want to receive inquiries) and `INQUIRY_FROM_EMAIL` (an address on the verified domain, for example `Mia & Larry <inquiries@yourdomain.com>`).

**Option B: Web3Forms**
1. Get an access key at web3forms.com using the inbox that should receive inquiries.
2. Add `WEB3FORMS_ACCESS_KEY` in Vercel. Do not put the key in any file. If Web3Forms rejects server-side calls on your plan, use Option A.

**Strongly recommended: shared rate limiting.** Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (free Upstash Redis database). Without them the function falls back to an in-memory limit that each serverless instance keeps separately, which only slows abuse.

If you later add a custom domain, add it to `ALLOWED_ORIGINS` (for example `https://www.yourdomain.com`) so the form keeps working.

## What the form endpoint does

`POST /api/inquiry` accepts JSON: `name`, `email`, `phone` (optional), `puppy` (optional id from `puppies.json`), `message`, plus a hidden `website` honeypot.

- Same-origin only, JSON only, body size capped.
- Validates every field on the server (the browser also validates for a quicker experience).
- Rate limited per visitor (5 per 10 minutes).
- Spam honeypot answers "success" but sends nothing.
- Sends a plain-text email only (no HTML), with the visitor's address as reply-to.
- Returns generic errors (`validation_failed`, `rate_limited`, `not_configured`, `delivery_failed`). Details are logged to Vercel's function logs without personal data.
- Nothing is stored. Inquiries exist only as the emails you receive.

## Editing content

- **Puppies:** edit `data/puppies.json`. Set `status` to `available`, `reserved` or `sold`. Use `null` for anything you do not want to show (age, sex, price). Add photos to `assets/img/` as `.webp` and list their names. Run `npm run check` to catch typos.
- **Contact details:** the phone number, WhatsApp number and email appear in `index.html` (several places) and at the top of `assets/js/app.js`. Search for `914` and `georgelarri01` when they change.
- **Policies and reviews:** edit directly in `index.html`.

See `OWNER-TODO.md` for everything that needs the owner's confirmation before launch.
