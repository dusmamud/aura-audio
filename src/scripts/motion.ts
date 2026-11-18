import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Respect reduced motion: no smooth scroll, no reveal animation, and
// content stays visible (it is visible by default in CSS).
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ autoRaf: true });
  lenis.on('scroll', ScrollTrigger.update);

  // Hero: gentle rise, staggered. Feature + product sections: fade-up on enter.
  gsap.from('[data-hero]', {
    y: 24,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.1,
    clearProps: 'all',
  });

  gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      clearProps: 'all',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // Safety net: content must never get stuck invisible. If a reveal is
  // already in the viewport a moment after load but its trigger never
  // fired (deep-link load, a stalled ticker, a capture tool that does not
  // scroll), show it immediately. Below-fold reveals are untouched.
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
    window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0 && getComputedStyle(el).opacity === '0') {
          gsap.set(el, { opacity: 1, y: 0, clearProps: 'all' });
        }
      });
    }, 1500);
  });
  const parallax = document.querySelector<HTMLElement>('[data-parallax]');
  if (parallax) {
    gsap.to(parallax, {
      yPercent: 4,
      ease: 'none',
      scrollTrigger: { trigger: parallax, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

// Mobile menu toggle (button + panel are in Header.astro).
const menuBtn = document.querySelector<HTMLButtonElement>('#menu-btn');
const menuPanel = document.querySelector<HTMLElement>('#mobile-menu');
menuBtn?.addEventListener('click', () => {
  const open = menuPanel?.classList.toggle('hidden') === false;
  menuBtn.setAttribute('aria-expanded', String(open));
});
menuPanel?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    menuPanel.classList.add('hidden');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }),
);

// Bag button is a placeholder — no checkout backend yet.
document.querySelector('#bag-btn')?.addEventListener('click', () => {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = 'Your bag is empty — checkout is coming soon.';
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
});
