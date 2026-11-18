// Convert PNG masters (images-src/*.png) to responsive delivery files.
// AVIF (quality 55, effort 4) → WebP (80) → JPG (82, progressive).
// Widths come from each master's real width — never emit a srcset entry
// wider than the master (withoutEnlargement would silently write a smaller
// file under a bigger name). The PNG master is also copied to
// public/images/<name>.png so the original always exists beside its
// derivatives. Run: npm run images   (also runs automatically before build)
import sharp from 'sharp';
import { readdir, mkdir, copyFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const SRC = new URL('../images-src/', import.meta.url);
const OUT = new URL('../public/images/', import.meta.url);
const MIST = '#f5f5f4'; // page background — JPG has no alpha, so transparent
// masters are composited onto it and stay seamless on the page.

const NAMES = {
  // The hero ships as a transparent cutout; the original landscape master
  // stays in images-src as the source archive (see ARCHIVED below).
  'hero-headphones-cutout': 'hero-headphones',
  'media-generation-earcup-closeup-0-d177b216-d9a9-42d3-b6cf-b68d33d5a37b': 'earcup-closeup',
  'media-generation-exploded-view-0-04ea5416-ec3a-417d-bffe-a32d686b514c': 'exploded-view',
  'media-generation-lifestyle-desk-0-8e5eca4c-1c55-43fe-bdfe-01d6e79d3749': 'lifestyle-desk',
  'media-generation-earbuds-0-6be44ade-14f8-4ec3-8c47-01dd9ba23bb0': 'earbuds',
  'media-generation-smartwatch-0-555bd9d2-a54e-4f3c-ae37-6db9c4ab5c77': 'smartwatch',
  'media-generation-speaker-0-c3ce2087-c515-4d55-8899-f162456f3cf7': 'speaker',
  'media-generation-charging-dock-0-f326b26d-29f0-4dbf-a2ca-4962557a99a9': 'charging-dock',
  'media-generation-aura-home-speaker-0-a1994dbf-9850-41d2-ad56-2053ffd9f7b3': 'home-speaker',
  'media-generation-aura-buds-pro-0-d7e382fe-9adf-4eb7-9723-f1cfbbc08fc1': 'buds-pro',
  'media-generation-aura-travel-case-0-56270822-6324-43f4-90e9-ae58b3f68d95': 'travel-case',
};
// Source archive, not a delivery master — skip silently.
const ARCHIVED = new Set(['media-generation-hero-headphones-0-a3375c0a-c21d-44a3-a564-47903a3e9ee2']);

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith('.png'));

for (const file of files) {
  const stem = basename(file, '.png');
  if (ARCHIVED.has(stem)) continue;
  const name = NAMES[stem];
  if (!name) { console.warn(`skip (no mapping): ${file}`); continue; }
  const src = join(SRC.pathname, file);
  const meta = await sharp(src).metadata();
  const fullW = meta.width ?? 1920;
  // Width ladder, capped at the master's real width (deduped). Only the
  // hero needs its full width; the rest keep the 640/800/1280 ladder the
  // components actually request — no unused files in dist.
  const widths = name === 'hero-headphones'
    ? [...new Set([640, 800].filter((w) => w < fullW).concat([fullW]))]
    : [640, 800, 1280];
  await copyFile(src, join(OUT.pathname, `${name}.png`));
  for (const w of widths) {
    const base = sharp(src).resize(w, null, { withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 4 }).toFile(join(OUT.pathname, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 80 }).toFile(join(OUT.pathname, `${name}-${w}.webp`));
    // JPG cannot carry alpha: flatten transparent pixels onto the page
    // background (sharp's default would be black).
    await base.clone().flatten({ background: MIST }).jpeg({ quality: 82, progressive: true }).toFile(join(OUT.pathname, `${name}-${w}.jpg`));
    console.log(`${name} ${w}w → avif + webp + jpg`);
  }
}
console.log(`done: ${files.length} masters converted`);
