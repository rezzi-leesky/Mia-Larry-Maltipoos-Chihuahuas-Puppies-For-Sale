// Mia & Larry website — puppy listings, hash routing, menu and inquiry form.
// Contact details live in the HTML; puppy facts live in data/puppies.json.

const CONTACT = { phone: '+19145407148', phoneLabel: '+1 (914) 540-7148', whatsapp: 'https://wa.me/19145407148', email: 'georgelarri01@gmail.com' };
const BASE_TITLE = document.title;
const STATUS_LABEL = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (name) => `assets/img/${esc(name)}.webp`;

const home = $('#home');
const detail = $('#detail');
const grid = $('#puppy-grid');
const header = $('#site-header');
let puppies = [];
let byId = new Map();
let inDetail = false;

/* ---------- Data ---------- */
async function loadPuppies() {
  const res = await fetch('data/puppies.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`puppies.json: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.puppies) ? data.puppies : [];
}

const metaLine = (p) => [p.breed, p.color, p.sex, p.age].filter(Boolean).join(' · ');
const statusClass = (p) => (STATUS_LABEL[p.status] ? p.status : 'available');

/* ---------- Home: cards ---------- */
function renderCards() {
  if (!puppies.length) {
    grid.innerHTML = `<p class="notice">No puppies are listed right now. Please <a href="#contact">contact us</a> to ask about upcoming availability.</p>`;
    return;
  }
  grid.innerHTML = puppies.map((p) => `
    <article class="card">
      <div class="card-media">
        <img src="${img(p.photos[0])}" alt="${esc(p.name)}, a ${esc((p.color || '').toLowerCase())} ${esc(p.breed || 'puppy')}" width="450" height="600" loading="lazy">
        <span class="badge ${statusClass(p)}">${STATUS_LABEL[statusClass(p)]}</span>
      </div>
      <div class="card-body">
        <h3><a href="#${esc(p.id)}">${esc(p.name)}<span class="sr-only">, view details</span></a></h3>
        <p class="meta">${esc(metaLine(p))}</p>
        ${p.price ? `<p class="price">${money.format(p.price)}</p>` : ''}
      </div>
    </article>`).join('');
}

function fillPuppySelect() {
  const select = $('#f-puppy');
  puppies.filter((p) => p.status !== 'sold').forEach((p) => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = `About ${p.name}`;
    select.append(o);
  });
}

/* ---------- Detail view ---------- */
function renderDetail(p) {
  const facts = [['Status', STATUS_LABEL[statusClass(p)]], ['Breed', p.breed], ['Color', p.color], ['Sex', p.sex], ['Age', p.age]]
    .filter(([, v]) => v);
  const others = puppies.filter((o) => o.id !== p.id);
  detail.innerHTML = `
  <div class="wrap detail">
    <a class="back" href="#puppies">&lsaquo; All puppies</a>
    <div class="detail-grid">
      <div>
        <div class="gallery-main"><img id="gallery-img" src="${img(p.photos[0])}" alt="${esc(p.name)}, photo 1 of ${p.photos.length}" width="900" height="1200"></div>
        <div class="thumbs" role="group" aria-label="${esc(p.name)} photos">
          ${p.photos.map((ph, i) => `<button type="button" class="thumb" data-photo="${esc(ph)}" data-n="${i + 1}" aria-pressed="${i === 0}" aria-label="Show photo ${i + 1} of ${p.photos.length}"><img src="${img(ph)}" alt="" width="72" height="72" loading="lazy"></button>`).join('')}
        </div>
      </div>
      <div>
        <span class="status-pill ${statusClass(p)}">${STATUS_LABEL[statusClass(p)]}</span>
        <h1 id="detail-title" tabindex="-1">${esc(p.name)}</h1>
        ${p.price ? `<p class="price">${money.format(p.price)}</p>` : ''}
        <p class="fine">Price and availability are confirmed with you directly.</p>
        ${p.appearance ? `<p>${esc(p.appearance)}</p>` : ''}
        <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <p class="fine">A non-refundable $300 deposit reserves a puppy. Please read our <a href="#policies">policies</a> first.</p>
        <div class="actions">
          <button type="button" class="btn" id="ask-btn">Ask about ${esc(p.name)}</button>
          <a class="btn btn-outline" href="tel:${CONTACT.phone}">Call</a>
          <a class="btn btn-outline" href="${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi Mia & Larry, I'm interested in ${p.name}.`)}" target="_blank" rel="noopener noreferrer">WhatsApp<span class="sr-only"> (opens in a new tab)</span></a>
        </div>
      </div>
    </div>
    ${others.length ? `<h2 class="more-title">More puppies</h2>
    <div class="more-links">${others.map((o) => `<a href="#${esc(o.id)}"><img src="${img(o.photos[0])}" alt="" width="40" height="40" loading="lazy">${esc(o.name)}</a>`).join('')}</div>` : ''}
  </div>`;

  const main = $('#gallery-img', detail);
  const thumbs = detail.querySelectorAll('.thumb');
  thumbs.forEach((t) => t.addEventListener('click', () => {
    main.src = img(t.dataset.photo);
    main.alt = `${p.name}, photo ${t.dataset.n} of ${p.photos.length}`;
    thumbs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
  }));
  $('#ask-btn', detail).addEventListener('click', () => openContact(p.id));
}

function openContact(puppyId) {
  if (puppyId !== undefined) $('#f-puppy').value = puppyId;
  $('#contact').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
  $('#f-message').focus({ preventScroll: true });
}

/* ---------- Routing (hash based: #mell shows Mell's page; #faq scrolls to the FAQ) ---------- */
function route() {
  const id = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  const p = byId.get(id);
  closeMenu();
  if (p) {
    renderDetail(p);
    home.hidden = true;
    detail.hidden = false;
    inDetail = true;
    document.title = `${p.name} | ${BASE_TITLE}`;
    window.scrollTo(0, 0);
    $('#detail-title', detail).focus({ preventScroll: true });
    return;
  }
  const wasDetail = inDetail;
  detail.hidden = true;
  home.hidden = false;
  inDetail = false;
  document.title = BASE_TITLE;
  const target = id && document.getElementById(id);
  requestAnimationFrame(() => {
    if (target) target.scrollIntoView({ behavior: wasDetail || reduceMotion() ? 'auto' : 'smooth' });
    else if (wasDetail) window.scrollTo(0, 0);
  });
}

/* ---------- Mobile menu ---------- */
const menuBtn = $('#menu-btn');
function closeMenu() { header.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
menuBtn.addEventListener('click', () => {
  const open = header.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); menuBtn.focus(); } });
$('#primary-nav').addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });

/* ---------- Inquiry form ---------- */
const form = $('#inquiry-form');
const statusBox = $('#form-status');
const submitBtn = $('#submit-btn');
const FIELDS = ['name', 'email', 'phone', 'puppy', 'message'];
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!v.email.trim()) e.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.';
  const digits = v.phone.replace(/\D/g, '');
  if (v.phone.trim() && (!/^[+0-9().\-\s]+$/.test(v.phone) || digits.length < 7 || digits.length > 15)) e.phone = 'Please enter a valid phone number, or leave it blank.';
  if (v.message.trim().length < 10) e.message = 'Please write a short message (at least 10 characters).';
  return e;
}

function showErrors(errors) {
  let first = null;
  FIELDS.forEach((f) => {
    const input = $(`#f-${f}`);
    const out = $(`#e-${f}`);
    if (errors[f]) {
      out.textContent = errors[f]; out.hidden = false;
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', `e-${f}`);
      first = first || input;
    } else {
      out.hidden = true; out.textContent = '';
      input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby');
    }
  });
  if (first) first.focus();
}

function contactFallback() {
  return `<p>You can also reach us directly: <a href="tel:${CONTACT.phone}">${CONTACT.phoneLabel}</a>, <a href="${CONTACT.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a> or <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>.</p>`;
}

function setStatus(kind, html, { focus = true } = {}) {
  statusBox.className = `status-box ${kind}`;
  statusBox.innerHTML = html;
  statusBox.hidden = false;
  if (focus) statusBox.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const v = Object.fromEntries(new FormData(form).entries());
  FIELDS.concat('website').forEach((k) => { v[k] = (v[k] || '').toString(); });
  const errors = validate(v);
  showErrors(errors);
  if (Object.keys(errors).length) { setStatus('bad', '<p>Please fix the highlighted fields and try again.</p>', { focus: false }); return; }

  submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
  statusBox.hidden = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('/api/inquiry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ name: v.name, email: v.email, phone: v.phone, puppy: v.puppy, message: v.message, website: v.website }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      form.reset();
      setStatus('ok', `<p><strong>Thank you, your message was sent.</strong></p><p>We will reply to ${esc(v.email)} to confirm availability and the next steps.</p>`);
    } else if (res.status === 400 && data.errors) {
      showErrors(data.errors);
      setStatus('bad', '<p>Please check the highlighted fields and try again.</p>', { focus: false });
    } else if (res.status === 429) {
      setStatus('bad', `<p>You have sent several messages in a short time. Please wait a few minutes and try again.</p>${contactFallback()}`);
    } else {
      setStatus('bad', `<p><strong>We could not send your message online.</strong> Nothing was sent.</p>${contactFallback()}`);
    }
  } catch (_) {
    setStatus('bad', `<p><strong>We could not send your message online.</strong> Please check your connection and try again. Nothing was sent.</p>${contactFallback()}`);
  } finally {
    clearTimeout(timer);
    submitBtn.disabled = false; submitBtn.textContent = 'Send inquiry';
  }
});

/* ---------- Start ---------- */
(async function init() {
  try {
    puppies = await loadPuppies();
    byId = new Map(puppies.map((p) => [p.id, p]));
    renderCards();
    fillPuppySelect();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="notice">The puppy listings could not be loaded. Please <a href="#contact">contact us</a> to see who is available.</p>`;
  }
  addEventListener('hashchange', route);
  route();
})();
