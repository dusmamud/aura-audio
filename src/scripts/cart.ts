// Client-side cart store. localStorage only — no server, no checkout
// backend. All prices are mock data from src/data/site.ts.
import { products, getProduct, FREE_SHIPPING_THRESHOLD } from '../data/site';

export { FREE_SHIPPING_THRESHOLD };

export interface CartLine {
  slug: string;
  color: string;
  qty: number;
}

export interface CartLineResolved extends CartLine {
  name: string;
  price: number;
  img: string;
  alt: string;
  lineTotal: number;
}

const KEY = 'aura-cart';

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    // Drop lines for products that no longer exist (mock data churn).
    return parsed.filter((l) => l && getProduct(l.slug) && l.qty > 0);
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private mode / storage full: cart still works in memory for the session.
  }
}

let lines: CartLine[] = typeof localStorage !== 'undefined' ? read() : [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getLines(): CartLine[] {
  return [...lines];
}

export function getCount(): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function getSubtotal(): number {
  return lines.reduce((sum, l) => {
    const p = getProduct(l.slug);
    return sum + (p ? p.price * l.qty : 0);
  }, 0);
}

export function getResolvedLines(): CartLineResolved[] {
  return lines
    .map((l) => {
      const p = getProduct(l.slug);
      if (!p) return null;
      return { ...l, name: p.name, price: p.price, img: p.img, alt: p.alt, lineTotal: p.price * l.qty };
    })
    .filter((l): l is CartLineResolved => l !== null);
}

export function addToCart(slug: string, qty = 1, color?: string) {
  const product = getProduct(slug);
  if (!product) return;
  const chosen = color ?? product.colors[0];
  const existing = lines.find((l) => l.slug === slug && l.color === chosen);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 99);
  } else {
    lines.push({ slug, color: chosen, qty: Math.min(qty, 99) });
  }
  write(lines);
  notify();
}

export function setQty(slug: string, color: string, qty: number) {
  const line = lines.find((l) => l.slug === slug && l.color === color);
  if (!line) return;
  if (qty <= 0) {
    lines = lines.filter((l) => l !== line);
  } else {
    line.qty = Math.min(qty, 99);
  }
  write(lines);
  notify();
}

export function removeLine(slug: string, color: string) {
  lines = lines.filter((l) => !(l.slug === slug && l.color === color));
  write(lines);
  notify();
}

export function clearCart() {
  lines = [];
  write(lines);
  notify();
}

// Progress toward free shipping, 0–1.
export function freeShippingProgress(): number {
  return Math.min(getSubtotal() / FREE_SHIPPING_THRESHOLD, 1);
}

export function freeShippingRemaining(): number {
  return Math.max(FREE_SHIPPING_THRESHOLD - getSubtotal(), 0);
}

// Mock promo code — one code only, demo store. The code lives in
// localStorage so the drawer and the checkout summary agree.
export const PROMO_CODE = 'AURA10';
export const PROMO_RATE = 0.1;
const PROMO_KEY = 'aura-promo';

export function getPromoCode(): string {
  try {
    return localStorage.getItem(PROMO_KEY) ?? '';
  } catch {
    return '';
  }
}

// Returns true only for the valid code; anything else clears the promo.
export function applyPromo(code: string): boolean {
  const ok = code.trim().toUpperCase() === PROMO_CODE;
  try {
    if (ok) localStorage.setItem(PROMO_KEY, PROMO_CODE);
    else localStorage.removeItem(PROMO_KEY);
  } catch {
    // Private mode: promo applies for this session only.
  }
  notify();
  return ok;
}

export function clearPromo() {
  try {
    localStorage.removeItem(PROMO_KEY);
  } catch {
    // Nothing to clear.
  }
  notify();
}

// 10% off the subtotal when the promo is applied, rounded to dollars.
export function getDiscount(): number {
  return getPromoCode() ? Math.round(getSubtotal() * PROMO_RATE) : 0;
}

export { products };
