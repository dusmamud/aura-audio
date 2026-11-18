// Client-side wishlist store. localStorage only — no server, no account
// backend. Slugs only; product details come from src/data/site.ts.
import { getProduct } from '../data/site';

const KEY = 'aura-wishlist';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((s) => getProduct(s)) : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {
    // Private mode / storage full: wishlist still works in memory.
  }
}

let slugs: string[] = typeof localStorage !== 'undefined' ? read() : [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getSlugs(): string[] {
  return [...slugs];
}

export function getCount(): number {
  return slugs.length;
}

export function isWishlisted(slug: string): boolean {
  return slugs.includes(slug);
}

// Returns true when the product was added, false when removed.
export function toggleWishlist(slug: string): boolean {
  if (!getProduct(slug)) return false;
  const added = !slugs.includes(slug);
  slugs = added ? [...slugs, slug] : slugs.filter((s) => s !== slug);
  write(slugs);
  notify();
  return added;
}

export function removeFromWishlist(slug: string) {
  slugs = slugs.filter((s) => s !== slug);
  write(slugs);
  notify();
}
