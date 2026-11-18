# AURA — Premium Audio

Premium audio landing page — “Crafted for Focus. Designed for Life.”

Built with **Astro 7.4.12** + **Tailwind CSS 4.3.5** + **GSAP 3.15.1** + **Lenis 1.3.27**,
Inter self-hosted via `@fontsource` (no Google Fonts CDN). Static output,
deploys to Cloudflare Pages. Light grey `#f5f5f4` + ink `#0b0b0b`.

Same tech stack as [creatix](https://github.com/dusmamud/creatix) — same pinned
versions, same deploy setup, same image discipline.

## Images — AVIF → WebP → JPG, PNG master

Every photo is generated once as a PNG master in `images-src/`
(never shipped to the browser). `npm run images` (Sharp 0.35.5) converts each
master to responsive widths:

| format | quality | widths |
| --- | --- | --- |
| AVIF | 55, effort 4 | 640 / 800 / 1280 / 1600 (hero) |
| WebP | 80 | 640 / 800 / 1280 / 1600 (hero) |
| JPG | 82, progressive | 640 / 800 / 1280 / 1600 (hero) |
| PNG | master copy | full 1920px, kept as the `<img>` fallback source |

Pages use `<picture>` in this exact order — AVIF `<source>` first, WebP
second, `<img src="….jpg">` as the mandatory fallback (a `<picture>` with no
`<img>` renders nothing). Hero is `fetchpriority="high"`, everything else
`loading="lazy"` + `decoding="async"`, all with intrinsic `width`/`height`
so there is no layout shift.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # images first, then astro build → dist/
npm run preview
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml` (build +
`wrangler pages deploy dist --project-name=aura-audio`). It needs these two
repository secrets:

- `CLOUDFLARE_API_TOKEN` — custom API token with **Account → Cloudflare Pages → Edit**
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID

Live URL (after the first successful deploy): https://aura-audio.pages.dev

## Notes

All values (product names, prices $199/$299/$149/$99, email, social links)
are placeholders in `src/data/site.ts` — replace before launch. The bag icon
is a cart placeholder (no checkout backend). Footer links are `#` placeholders.
