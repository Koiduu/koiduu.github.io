// Subtle scroll animations. Skipped entirely for people who prefer reduced motion.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion');

  const targets = document.querySelectorAll(
    '.clients > h2, .clients li, .project > .text, .project > .full, .shot, .project .row, .pics, details, .about > *, .sky > *, footer .contact, footer .links'
  );
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  let i = 0;
  targets.forEach(el => {
    if (el.parentElement.closest('details')) return; // pictures inside a dropdown just open normally
    if (el.getBoundingClientRect().top < innerHeight) return; // already on screen at load
    if (el.matches('.clients li')) el.style.setProperty('--d', (i++ % 4) * 0.07 + 's');
    el.classList.add('rv');
    io.observe(el);
  });
})();
