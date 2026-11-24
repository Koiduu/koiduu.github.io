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

// Hire me opens the price list
const hire = document.querySelector('#hire');
document.querySelectorAll('[data-hire]').forEach(a => a.addEventListener('click', e => {
  if (e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  hire.showModal();
}));
hire.addEventListener('click', e => { if (e.target === hire) hire.close(); });
