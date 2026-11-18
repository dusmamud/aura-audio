// Convert PNG masters (public/images-src/*.png) to responsive delivery files.
// AVIF (quality 55, effort 4) → WebP (80) → JPG (82, progressive) at
// 640 / 800 / 1280w, plus 1600w for the hero. The PNG master is also copied
// to public/images/<name>.png so the original always exists beside its
// derivatives. Run: npm run images   (also runs automatically before build)
import sharp from 'sharp';
import { readdir, mkdir, copyFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const SRC = new URL('../images-src/', import.meta.url);
const OUT = new URL('../public/images/', import.meta.url);

const NAMES = {
  'media-generation-hero-headphones-0-a3375c0a-c21d-44a3-a564-47903a3e9ee2': 'hero-headphones',
  'media-generation-earcup-closeup-0-d177b216-d9a9-42d3-b6cf-b68d33d5a37b': 'earcup-closeup',
  'media-generation-exploded-view-0-04ea5416-ec3a-417d-bffe-a32d686b514c': 'exploded-view',
  'media-generation-lifestyle-desk-0-8e5eca4c-1c55-43fe-bdfe-01d6e79d3749': 'lifestyle-desk',
  'media-generation-earbuds-0-6be44ade-14f8-4ec3-8c47-01dd9ba23bb0': 'earbuds',
  'media-generation-smartwatch-0-555bd9d2-a54e-4f3c-ae37-6db9c4ab5c77': 'smartwatch',
  'media-generation-speaker-0-c3ce2087-c515-4d55-8899-f162456f3cf7': 'speaker',
  'media-generation-charging-dock-0-f326b26d-29f0-4dbf-a2ca-4962557a99a9': 'charging-dock',
};

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith('.png'));

for (const file of files) {
  const stem = basename(file, '.png');
  const name = NAMES[stem];
  if (!name) { console.warn(`skip (no mapping): ${file}`); continue; }
  const src = join(SRC.pathname, file);
  const widths = name === 'hero-headphones' ? [640, 800, 1280, 1600] : [640, 800, 1280];
  await copyFile(src, join(OUT.pathname, `${name}.png`));
  for (const w of widths) {
    const base = sharp(src).resize(w, null, { withoutEnlargement: true });
    await base.clone().avif({ quality: 55, effort: 4 }).toFile(join(OUT.pathname, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 80 }).toFile(join(OUT.pathname, `${name}-${w}.webp`));
    await base.clone().jpeg({ quality: 82, progressive: true }).toFile(join(OUT.pathname, `${name}-${w}.jpg`));
    console.log(`${name} ${w}w → avif + webp + jpg`);
  }
}
console.log(`done: ${files.length} masters converted`);
