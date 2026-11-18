// Client behaviour for the whole site.
// Architecture notes:
// - Astro view transitions (ClientRouter) re-execute this script after every
//   navigation, while window/document persist. So: one-time global wiring
//   (Lenis, document-level delegation, cart subscription) is guarded by a
//   window flag and runs once; per-page work (reveals, accordions, cart
//   badge) runs on every `astro:page-load`.
// - GSAP + ScrollTrigger own scroll reveals and the hero parallax.
// - `motion` (Motion One successor) owns micro-interactions: drawer and
//   overlay entrances, accordion height, button press feedback.
// - Everything respects prefers-reduced-motion: no smooth scroll, no
//   reveals, no animated entrances — content is visible by default.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { animate } from 'motion';
import {
  addToCart, setQty, removeLine, getResolvedLines, getCount, getSubtotal,
  freeShippingProgress, freeShippingRemaining, subscribe, FREE_SHIPPING_THRESHOLD,
} from './cart';
import { formatPrice, getProduct } from '../data/site';

declare global {
  interface Window {
    __auraGlobal?: boolean;
    __auraToastTimer?: number;
  }
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector(sel) as T | null;

// ---------- toast (the #toast element lives in Footer) ----------
function showToast(msg: string) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  window.clearTimeout(window.__auraToastTimer);
  window.__auraToastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---------- cart drawer ----------
function renderCart() {
  const lines = getResolvedLines();
  const count = getCount();
  const badge = $('#bag-count');
  if (badge) {
    badge.textContent = String(count);
    badge.classList.toggle('hidden', count === 0);
    badge.classList.toggle('grid', count > 0);
  }
  const drawerCount = $('#cart-drawer-count');
  if (drawerCount) drawerCount.textContent = count > 0 ? `(${count} item${count > 1 ? 's' : ''})` : '';
  const itemsEl = $('#cart-items');
  const emptyEl = $('#cart-empty');
  const footerEl = $('#cart-footer');
  const shipText = $('#cart-shipping-text');
  const shipBar = $('#cart-shipping-bar');
  const subtotalEl = $('#cart-subtotal');
  if (!itemsEl || !emptyEl || !footerEl) return;

  if (lines.length === 0) {
    itemsEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    emptyEl.classList.add('flex');
    footerEl.classList.add('hidden');
    if (shipText) shipText.textContent = `Free shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`;
    if (shipBar) shipBar.style.width = '0%';
    return;
  }
  emptyEl.classList.add('hidden');
  emptyEl.classList.remove('flex');
  footerEl.classList.remove('hidden');
  itemsEl.innerHTML = lines
    .map(
      (l) => `
      <article class="flex gap-3 py-3" data-line="${l.slug}__${l.color}">
        <a href="/products/${l.slug}/" data-close-cart class="shrink-0 overflow-hidden rounded-xl bg-card">
          <img src="/images/${l.img}-640.jpg" alt="" width="72" height="72" class="h-[72px] w-[72px] object-cover" loading="lazy" decoding="async" />
        </a>
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <a href="/products/${l.slug}/" data-close-cart class="block truncate text-sm font-medium hover:underline">${l.name}</a>
              <p class="mt-0.5 text-xs text-grey">${l.color}</p>
            </div>
            <p class="shrink-0 text-sm font-medium">${formatPrice(l.lineTotal)}</p>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <div class="flex items-center rounded-full ring-1 ring-black/10">
              <button type="button" data-cart-dec="${l.slug}" data-color="${l.color}" aria-label="Decrease quantity" class="grid h-7 w-7 place-items-center rounded-full transition hover:bg-ink/5">−</button>
              <span class="w-7 text-center text-xs font-medium">${l.qty}</span>
              <button type="button" data-cart-inc="${l.slug}" data-color="${l.color}" aria-label="Increase quantity" class="grid h-7 w-7 place-items-center rounded-full transition hover:bg-ink/5">+</button>
            </div>
            <button type="button" data-cart-remove="${l.slug}" data-color="${l.color}" class="text-xs text-grey underline-offset-2 transition hover:text-ink hover:underline">Remove</button>
          </div>
        </div>
      </article>`,
    )
    .join('');
  if (subtotalEl) subtotalEl.textContent = formatPrice(getSubtotal());
  const remaining = freeShippingRemaining();
  if (shipText) {
    shipText.textContent =
      remaining > 0
        ? `You're ${formatPrice(remaining)} away from free shipping.`
        : 'You have unlocked free shipping.';
  }
  if (shipBar) shipBar.style.width = `${Math.round(freeShippingProgress() * 100)}%`;
}

let lenis: Lenis | null = null;

function openCart() {
  const drawer = $('#cart-drawer');
  const backdrop = $('#cart-backdrop');
  if (!drawer || !backdrop) return;
  renderCart();
  drawer.classList.remove('translate-x-full');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.classList.remove('hidden');
  document.documentElement.style.overflow = 'hidden';
  lenis?.stop();
  drawer.querySelector<HTMLButtonElement>('button')?.focus();
  if (!reduced()) animate(drawer, { x: ['100%', '0%'] }, { type: 'spring', stiffness: 260, damping: 30 });
}

function closeCart() {
  const drawer = $('#cart-drawer');
  const backdrop = $('#cart-backdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.add('translate-x-full');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.classList.add('hidden');
  document.documentElement.style.overflow = '';
  lenis?.start();
  $('#bag-btn')?.focus();
}

// ---------- search overlay ----------
interface SearchEntry {
  slug: string;
  name: string;
  price: number;
  img: string;
  category: string;
  rating: number;
}

function searchData(): SearchEntry[] {
  try {
    return JSON.parse($('#search-data')?.textContent ?? '[]') as SearchEntry[];
  } catch {
    return [];
  }
}

function searchRow(p: SearchEntry): string {
  return `
    <li>
      <a href="/products/${p.slug}/" class="flex items-center gap-3 py-3 transition hover:opacity-70">
        <img src="/images/${p.img}-640.jpg" alt="" width="48" height="48" class="h-12 w-12 shrink-0 rounded-lg bg-card object-cover" loading="lazy" decoding="async" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">${p.name}</span>
          <span class="block text-xs text-grey">${p.category}</span>
        </span>
        <span class="text-sm font-medium">${formatPrice(p.price)}</span>
      </a>
    </li>`;
}

function renderSearch(query: string) {
  const list = $('#search-results');
  const label = $('#search-label');
  const empty = $('#search-empty');
  if (!list || !label || !empty) return;
  const data = searchData();
  const q = query.trim().toLowerCase();
  const results = q
    ? data.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q)).slice(0, 6)
    : [...data].sort((a, b) => b.rating - a.rating).slice(0, 4);
  list.innerHTML = results.map(searchRow).join('');
  label.textContent = q ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Popular right now';
  empty.classList.toggle('hidden', results.length > 0 || !q);
}

function openSearch() {
  const overlay = $('#search-overlay');
  const input = $('#search-input') as HTMLInputElement | null;
  if (!overlay || !input) return;
  renderSearch('');
  overlay.classList.remove('hidden');
  document.documentElement.style.overflow = 'hidden';
  lenis?.stop();
  input.focus();
  if (!reduced()) {
    const panel = $('#search-panel');
    if (panel) animate(panel, { y: [-12, 0], opacity: [0, 1] }, { duration: 0.35, easing: 'ease-out' });
  }
}

function closeSearch() {
  const overlay = $('#search-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  document.documentElement.style.overflow = '';
  lenis?.start();
  $('#search-btn')?.focus();
}

// ---------- scroll reveals + parallax (per page) ----------
function setupReveals() {
  if (reduced()) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.getAll().forEach((t) => t.kill());

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

  const parallax = document.querySelector<HTMLElement>('[data-parallax]');
  if (parallax) {
    gsap.to(parallax, {
      yPercent: 4,
      ease: 'none',
      scrollTrigger: { trigger: parallax, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

// ---------- accordions (support FAQ, PDP mini-FAQ) ----------
function setupAccordions() {
  document.querySelectorAll<HTMLElement>('[data-accordion-item]').forEach((item) => {
    const panel = item.querySelector<HTMLElement>('[data-accordion-panel]');
    const btn = item.querySelector<HTMLButtonElement>('[data-accordion-btn]');
    if (!panel || !btn) return;
    const open = item.hasAttribute('data-open');
    btn.setAttribute('aria-expanded', String(open));
    panel.style.overflow = 'hidden';
    panel.style.height = open ? 'auto' : '0px';
    item.classList.toggle('open', open);
  });
}

function toggleAccordion(btn: HTMLButtonElement) {
  const item = btn.closest<HTMLElement>('[data-accordion-item]');
  const panel = item?.querySelector<HTMLElement>('[data-accordion-panel]');
  if (!item || !panel) return;
  const isOpen = item.classList.contains('open');
  // Exclusive within a group: close siblings first.
  const group = item.closest<HTMLElement>('[data-accordion-group]');
  if (group && !isOpen) {
    group.querySelectorAll<HTMLElement>('[data-accordion-item].open').forEach((other) => {
      if (other === item) return;
      const otherPanel = other.querySelector<HTMLElement>('[data-accordion-panel]');
      const otherBtn = other.querySelector<HTMLButtonElement>('[data-accordion-btn]');
      other.classList.remove('open');
      otherBtn?.setAttribute('aria-expanded', 'false');
      if (otherPanel) {
        if (reduced()) otherPanel.style.height = '0px';
        else animate(otherPanel, { height: 0, opacity: 0 }, { duration: 0.25 });
      }
    });
  }
  item.classList.toggle('open', !isOpen);
  btn.setAttribute('aria-expanded', String(!isOpen));
  if (reduced()) {
    panel.style.height = isOpen ? '0px' : 'auto';
  } else if (isOpen) {
    animate(panel, { height: 0, opacity: 0 }, { duration: 0.3 });
  } else {
    animate(panel, { height: 'auto', opacity: [0, 1] }, { duration: 0.35, easing: 'ease-out' });
  }
}

// ---------- per-page init (runs on first load AND every view transition) ----------
function initPage() {
  renderCart();
  setupReveals();
  setupAccordions();
  // PDP gallery thumbnails: first thumb is active by default.
  document.querySelectorAll<HTMLElement>('[data-gallery-thumb]').forEach((thumb, i) => {
    thumb.classList.toggle('ring-2', i === 0);
    thumb.classList.toggle('ring-ink', i === 0);
  });
}

// ---------- one-time global wiring ----------
function setupGlobal() {
  // Smooth scroll (skipped for reduced motion — native scroll stays).
  if (!reduced()) {
    gsap.registerPlugin(ScrollTrigger);
    lenis = new Lenis({ autoRaf: true });
    lenis.on('scroll', ScrollTrigger.update);
  }

  // Safety net: content must never get stuck invisible.
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

  // Cart state → badge + drawer, on every change.
  subscribe(renderCart);

  // Announcement rotator.
  const annEl = $('#announcement-text');
  const messages: string[] = (() => {
    try {
      return JSON.parse(annEl?.dataset.messages ?? '[]') as string[];
    } catch {
      return [];
    }
  })();
  if (annEl && messages.length > 1 && !reduced()) {
    let i = 0;
    window.setInterval(() => {
      i = (i + 1) % messages.length;
      annEl.style.opacity = '0';
      window.setTimeout(() => {
        annEl.textContent = messages[i];
        annEl.style.opacity = '1';
      }, 350);
    }, 4000);
  }

  // Back-to-top visibility.
  const toTop = $('#back-to-top');
  const onScroll = () => toTop?.classList.toggle('show', window.scrollY > 600);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { immediate: reduced() });
    else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
  });

  // Escape closes drawer / search / mobile menu.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeCart();
    closeSearch();
    $('#mobile-menu')?.classList.add('hidden');
    $('#menu-btn')?.setAttribute('aria-expanded', 'false');
  });

  // Delegated clicks — survives view transitions (document persists).
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const closest = (sel: string) => t.closest<HTMLElement>(sel);

    const menuBtn = closest('#menu-btn');
    if (menuBtn) {
      const panel = $('#mobile-menu');
      const open = panel?.classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', String(open));
      return;
    }
    if (closest('#mobile-menu a')) {
      $('#mobile-menu')?.classList.add('hidden');
      $('#menu-btn')?.setAttribute('aria-expanded', 'false');
      return;
    }

    if (closest('#bag-btn')) {
      openCart();
      return;
    }
    if (closest('[data-close-cart]')) {
      closeCart();
      return;
    }
    if (closest('#search-btn')) {
      openSearch();
      return;
    }
    if (closest('[data-close-search]')) {
      closeSearch();
      return;
    }

    const addBtn = closest('[data-add-to-bag]');
    if (addBtn) {
      const slug = addBtn.dataset.addToBag ?? '';
      const product = getProduct(slug);
      if (!product) return;
      const qtyEl = $('#pdp-qty');
      const qty = qtyEl ? Math.max(1, Number(qtyEl.textContent) || 1) : 1;
      const color =
        document.querySelector<HTMLElement>('[data-color-btn][aria-pressed="true"]')?.dataset.color ??
        product.colors[0];
      addToCart(slug, qty, color);
      showToast(`${product.name} added to your bag.`);
      const bagBtn = $('#bag-btn');
      if (bagBtn && !reduced()) animate(bagBtn, { scale: [1, 1.25, 1] }, { duration: 0.4 });
      openCart();
      return;
    }

    const buyBtn = closest('[data-buy-now]');
    if (buyBtn) {
      const slug = buyBtn.dataset.buyNow ?? '';
      const product = getProduct(slug);
      if (!product) return;
      const qtyEl = $('#pdp-qty');
      const qty = qtyEl ? Math.max(1, Number(qtyEl.textContent) || 1) : 1;
      const color =
        document.querySelector<HTMLElement>('[data-color-btn][aria-pressed="true"]')?.dataset.color ??
        product.colors[0];
      addToCart(slug, qty, color);
      window.location.href = '/checkout/';
      return;
    }

    const dec = closest('[data-cart-dec]');
    if (dec) {
      const slug = dec.dataset.cartDec ?? '';
      const color = dec.dataset.color ?? '';
      const line = getResolvedLines().find((l) => l.slug === slug && l.color === color);
      if (line) setQty(slug, color, line.qty - 1);
      return;
    }
    const inc = closest('[data-cart-inc]');
    if (inc) {
      const slug = inc.dataset.cartInc ?? '';
      const color = inc.dataset.color ?? '';
      const line = getResolvedLines().find((l) => l.slug === slug && l.color === color);
      if (line) setQty(slug, color, line.qty + 1);
      return;
    }
    const rem = closest('[data-cart-remove]');
    if (rem) {
      removeLine(rem.dataset.cartRemove ?? '', rem.dataset.color ?? '');
      return;
    }

    const accBtn = closest<HTMLButtonElement>('[data-accordion-btn]');
    if (accBtn) {
      toggleAccordion(accBtn);
      return;
    }

    const colorBtn = closest('[data-color-btn]');
    if (colorBtn) {
      document.querySelectorAll('[data-color-btn]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      colorBtn.setAttribute('aria-pressed', 'true');
      const nameEl = $('#selected-color-name');
      if (nameEl) nameEl.textContent = colorBtn.dataset.color ?? '';
      return;
    }

    const qtyDec = closest('[data-qty-dec]');
    if (qtyDec) {
      const el = $('#pdp-qty');
      if (el) el.textContent = String(Math.max(1, (Number(el.textContent) || 1) - 1));
      return;
    }
    const qtyInc = closest('[data-qty-inc]');
    if (qtyInc) {
      const el = $('#pdp-qty');
      if (el) el.textContent = String(Math.min(99, (Number(el.textContent) || 1) + 1));
      return;
    }

    const thumb = closest('[data-gallery-thumb]');
    if (thumb) {
      const name = thumb.dataset.galleryThumb ?? '';
      const pic = $('#pdp-gallery');
      const widths = (pic?.dataset.widths ?? '640,800,1280').split(',');
      const sources = pic?.querySelectorAll('source');
      if (sources && sources.length >= 2) {
        sources[0].setAttribute('srcset', widths.map((w) => `/images/${name}-${w}.avif ${w}w`).join(', '));
        sources[1].setAttribute('srcset', widths.map((w) => `/images/${name}-${w}.webp ${w}w`).join(', '));
      }
      const img = pic?.querySelector('img');
      if (img) {
        const last = widths[widths.length - 1];
        img.src = `/images/${name}-${last}.jpg`;
        img.srcset = widths.map((w) => `/images/${name}-${w}.jpg ${w}w`).join(', ');
        img.alt = thumb.querySelector('img')?.alt ?? img.alt;
      }
      document.querySelectorAll('[data-gallery-thumb]').forEach((th) => {
        th.classList.remove('ring-2', 'ring-ink');
      });
      thumb.classList.add('ring-2', 'ring-ink');
      return;
    }

    // Same-page anchor links: smooth-scroll instead of a jump.
    const anchor = closest('a[href^="#"]');
    if (anchor) {
      const id = anchor.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -90 });
          else target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
        }
      }
    }
  });

  // Search input (element is replaced on navigation — wire per page).
  document.addEventListener('input', (e) => {
    if ((e.target as HTMLElement)?.id === 'search-input') {
      renderSearch((e.target as HTMLInputElement).value);
    }
  });

  // Newsletter (mock — no network, toast confirms).
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    if (form.id === 'newsletter-form') {
      e.preventDefault();
      form.reset();
      showToast('Thanks for subscribing — welcome to AURA.');
    }
  });
}

// ---------- boot ----------
if (!window.__auraGlobal) {
  window.__auraGlobal = true;
  setupGlobal();
}
document.addEventListener('astro:page-load', initPage);
initPage();
