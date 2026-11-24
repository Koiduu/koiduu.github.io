// Click a picture to see it full size
const box = document.querySelector('#viewer');
const big = box.querySelector('img');
const pics = [...document.querySelectorAll('a[href$=".webp"]')];
let at = 0;

function show(i) {
  at = (i + pics.length) % pics.length;
  big.src = pics[at].href;
  const img = pics[at].querySelector('img');
  big.alt = img ? img.alt : pics[at].textContent;
}
pics.forEach((a, i) => a.addEventListener('click', e => {
  if (e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  show(i);
  box.showModal();
}));
big.addEventListener('click', () => box.close());
box.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') show(at + 1);
  if (e.key === 'ArrowLeft') show(at - 1);
});

// Copy Discord name
const btn = document.querySelector('[data-copy]');
btn.addEventListener('click', async () => {
  const note = btn.parentNode.querySelector('[role=status]');
  try {
    await navigator.clipboard.writeText(btn.dataset.copy);
    note.textContent = 'Copied';
  } catch {
    note.textContent = '';
  }
});

// Hire me opens the price list and cart
const hire = document.querySelector('#hire');
const cartKey = 'koidu-cart';
let cart = {};
try { cart = JSON.parse(localStorage.getItem(cartKey)) || {}; } catch { cart = {}; }
const tiers = [...hire.querySelectorAll('.add')].map(b => ({ size: b.dataset.size, price: +b.dataset.price }));
cart = Object.fromEntries(tiers.filter(t => Number.isInteger(cart[t.size]) && cart[t.size] > 0).map(t => [t.size, Math.min(cart[t.size], 20)]));
const list = hire.querySelector('.items');
const empty = hire.querySelector('.empty');
const mailLink = hire.querySelector('#mailto');
const form = hire.querySelector('#order-form');
const statusEl = hire.querySelector('.status');
const orderEndpoint = 'https://formsubmit.co/ajax/koidusupport@gmail.com';
let order = { lines: [], total: 0, count: 0 };

function el(tag, props = {}, data = {}) {
  const node = Object.assign(document.createElement(tag), props);
  Object.assign(node.dataset, data);
  return node;
}

function render() {
  try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch {}
  list.replaceChildren();
  let total = 0, count = 0;
  const lines = [];
  for (const t of tiers) {
    const q = cart[t.size];
    if (!q) continue;
    total += q * t.price;
    count += q;
    lines.push(`${q} x ${t.size} map ($${q * t.price} CAD)`);
    const qty = el('span', { className: 'qty' });
    qty.append(
      el('button', { type: 'button', textContent: '−', ariaLabel: `One less ${t.size}` }, { act: 'dec', size: t.size }),
      el('output', { textContent: q }),
      el('button', { type: 'button', textContent: '+', ariaLabel: `One more ${t.size}` }, { act: 'inc', size: t.size })
    );
    const li = el('li');
    li.append(
      el('span', { className: 'name', textContent: `${t.size} map` }),
      qty,
      el('span', { className: 'line', textContent: `$${q * t.price}` }),
      el('button', { type: 'button', className: 'drop', textContent: 'Remove', ariaLabel: `Remove ${t.size}` }, { act: 'drop', size: t.size })
    );
    list.append(li);
  }
  order = { lines, total, count };
  empty.hidden = count > 0;
  hire.querySelector('#total').textContent = `$${total}`;
  document.querySelectorAll('.cart .count').forEach(c => { c.textContent = count; c.hidden = !count; });
  document.querySelectorAll('.cart').forEach(c => c.setAttribute('aria-label', count ? `Open cart, ${count} items` : 'Open cart'));
  const mail = 'mailto:koidusupport@gmail.com';
  if (count) {
    const body = `Hi Koidu, I would like to order:\n\n${lines.join('\n')}\n\nTotal: $${total} CAD\n\n`;
    mailLink.href = `${mail}?subject=${encodeURIComponent('Map order')}&body=${encodeURIComponent(body)}`;
  } else {
    mailLink.href = mail;
  }
}

hire.addEventListener('click', e => {
  if (e.target === hire) return hire.close();
  const b = e.target.closest('button[data-size]');
  if (!b) return;
  const k = b.dataset.size, act = b.dataset.act || 'inc';
  if (act === 'inc') cart[k] = Math.min((cart[k] || 0) + 1, 20);
  if (act === 'dec') cart[k] = (cart[k] || 0) - 1;
  if (act === 'drop' || cart[k] <= 0) delete cart[k];
  render();
});
document.querySelectorAll('[data-hire]').forEach(a => a.addEventListener('click', e => {
  if (e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  hire.showModal();
}));

// Send the order straight to Koidu's inbox
form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(form);
  if (data.get('_honey')) return;
  if (!order.count) { statusEl.textContent = 'Add at least one map first.'; statusEl.className = 'status err'; return; }
  const email = form.elements.email;
  if (!email.value.trim() || !email.checkValidity()) { statusEl.textContent = 'Please enter a valid email so I can reply.'; statusEl.className = 'status err'; email.focus(); return; }
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  statusEl.className = 'status';
  statusEl.textContent = 'Sending…';
  try {
    const res = await fetch(orderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Map order: $${order.total} CAD`,
        _template: 'table',
        _captcha: 'false',
        email: data.get('email'),
        order: order.lines.join(' | '),
        total: `$${order.total} CAD`,
        note: data.get('note') || '(none)'
      })
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.success === false || out.success === 'false') throw new Error('send failed');
    statusEl.className = 'status ok';
    statusEl.textContent = `Order sent. I will reply to ${data.get('email')} soon.`;
    cart = {};
    render();
    form.reset();
  } catch {
    statusEl.className = 'status err';
    statusEl.textContent = 'Sorry, that did not send. Please email me at koidusupport@gmail.com instead.';
  } finally {
    button.disabled = false;
  }
});
render();
