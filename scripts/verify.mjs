// Full-route verification for the AURA site.
// Visits EVERY route at 390px and 1280px against the preview server
// (http://127.0.0.1:4321 — start with `npm run preview` first) and asserts:
//   - expected HTTP status (200, or 404 for the missing-page route)
//   - zero console errors, pageerrors, failed requests, HTTP >= 400 responses
//   - zero horizontal overflow (document scrollWidth == clientWidth)
//   - every <img> loaded (complete && naturalWidth > 0)
//   - an <h1> is present
// Then exercises the key interactions: PDP add-to-bag (cart count 1 +
// drawer opens), support FAQ accordion, shop filter + sort, mobile menu,
// header search. Screenshots land in scripts/shots/.
// Exits non-zero when anything fails, so it works as a real gate.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:4321';
const SHOTS = '/home/hatch/workspace/aura-audio/scripts/shots';
fs.mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  ['home', '/', 200],
  ['shop', '/products/', 200],
  ['pdp-aura-one', '/products/aura-one/', 200],
  ['pdp-aura-buds', '/products/aura-buds/', 200],
  ['pdp-aura-watch', '/products/aura-watch/', 200],
  ['pdp-aura-speaker', '/products/aura-speaker/', 200],
  ['pdp-aura-dock', '/products/aura-dock/', 200],
  ['pdp-aura-home', '/products/aura-home/', 200],
  ['pdp-aura-buds-pro', '/products/aura-buds-pro/', 200],
  ['pdp-aura-case', '/products/aura-case/', 200],
  ['technology', '/technology/', 200],
  ['story', '/story/', 200],
  ['support', '/support/', 200],
  ['compare', '/compare/', 200],
  ['journal', '/journal/', 200],
  ['journal-inside-the-driver', '/journal/inside-the-driver/', 200],
  ['journal-science-of-silence', '/journal/the-science-of-silence/', 200],
  ['journal-sound-that-fits-your-day', '/journal/sound-that-fits-your-day/', 200],
  ['checkout', '/checkout/', 200],
  ['privacy', '/privacy/', 200],
  ['terms', '/terms/', 200],
  ['404', '/this-page-does-not-exist/', 404],
];

const VIEWPORTS = [
  ['mobile', 390, 844],
  ['desktop', 1280, 900],
];

const failures = [];
const results = [];

function fail(scope, msg) {
  failures.push(`${scope}: ${msg}`);
  console.log(`  FAIL ${scope}: ${msg}`);
}

async function checkRoute(browser, [name, path, expectedStatus], [vp, w, h]) {
  const scope = `${name} [${vp}]`;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  // The 404 page's own navigation response is a 404 by design — assert its
  // status separately below and don't count it (or the browser's console
  // note about it) as a page error.
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (expectedStatus === 404 && m.text().includes('status of 404')) return;
    errors.push('console: ' + m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url() !== BASE + path) errors.push(`http${r.status()}: ${r.url()}`);
  });

  let status = null;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
    status = resp ? resp.status() : null;
  } catch (e) {
    fail(scope, 'goto failed: ' + e.message);
    await page.close();
    return;
  }

  if (status !== expectedStatus) fail(scope, `status ${status} (expected ${expectedStatus})`);

  // First-screen record, taken on a fresh load before any scrolling:
  // scrolling back to the top after Lenis smooth-scrolls never settles
  // to exactly scrollY 0, which clips the hero in the shot.
  if (['home', 'shop', 'pdp-aura-one'].includes(name)) {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/${name}-${vp}-top.png` });
  }

  // Scroll step by step to the bottom so ScrollTrigger reveals fire and
  // lazy images load. The programmatic loop alone can leave near-bottom
  // reveals unfired (Lenis owns the scroll), so finish with real wheel
  // scrolling — that is also how a visitor scrolls — and audit that every
  // reveal actually became visible.
  await page.evaluate(async () => {
    const total = document.body.scrollHeight;
    for (let y = 0; y <= total; y += 450) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
  });
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
    const done = await page.evaluate(() => window.scrollY + window.innerHeight >= document.body.scrollHeight - 50);
    if (done) break;
  }
  await page.waitForTimeout(900);
  const hiddenReveals = await page.evaluate(() =>
    [...document.querySelectorAll('.reveal, [data-hero]')]
      .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99)
      .map((el) => (el.textContent || '').trim().slice(0, 40)),
  );
  if (hiddenReveals.length) fail(scope, `unrevealed elements after scrolling: ${hiddenReveals.join(' | ')}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  // Give any remaining images a moment to finish loading.
  await page.waitForFunction(
    () => [...document.querySelectorAll('img')].every((i) => i.complete),
    null, { timeout: 10000 },
  ).catch(() => { /* broken images are reported below instead */ });

  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map((i) => ({
      ok: i.complete && i.naturalWidth > 0,
      src: (i.currentSrc || i.src).split('/').pop(),
    }));
    return {
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      h1: document.querySelector('h1')?.innerText?.trim() || null,
      title: document.title,
      brokenImgs: imgs.filter((i) => !i.ok).map((i) => i.src),
      imgCount: imgs.length,
    };
  });

  if (info.scrollW > info.clientW) fail(scope, `horizontal overflow: scrollWidth ${info.scrollW} > clientWidth ${info.clientW}`);
  if (!info.h1) fail(scope, 'no <h1> found');
  if (info.brokenImgs.length) fail(scope, `broken images: ${info.brokenImgs.join(', ')}`);
  for (const e of errors) fail(scope, e);

  const ok = !failures.some((f) => f.startsWith(scope + ':'));
  results.push({ route: name, viewport: vp, status, h1: info.h1, imgs: info.imgCount, ok });
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${scope} — status ${status}, h1: ${JSON.stringify(info.h1)}, imgs: ${info.imgCount}`);
  // Full-page record of the whole route. Note: fullPage captures stitch
  // around the fixed header / hero parallax, so they can look shifted at
  // the very top — the -top.png viewport shot is the true first-screen record.
  await page.screenshot({ path: `${SHOTS}/${name}-${vp}.png`, fullPage: true });
  await page.close();
}

async function checkInteractions(browser) {
  console.log('\n--- interactions ---');

  // 1. PDP add-to-bag: cart count becomes 1 and the drawer opens.
  {
    const scope = 'interaction add-to-bag';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    await page.click('[data-add-to-bag]');
    await page.waitForTimeout(900);
    const state = await page.evaluate(() => {
      const drawer = document.querySelector('#cart-drawer');
      const r = drawer ? drawer.getBoundingClientRect() : null;
      return {
        count: document.querySelector('#bag-count')?.textContent?.trim(),
        drawerVisible: r ? r.x < window.innerWidth && r.width > 0 : false,
        drawerHasItem: (document.querySelector('#cart-items')?.textContent || '').includes('AURA One'),
        subtotal: document.querySelector('#cart-subtotal')?.textContent?.trim(),
      };
    });
    console.log('  add-to-bag state:', JSON.stringify(state));
    if (state.count !== '1') fail(scope, `bag count is ${JSON.stringify(state.count)}, expected "1"`);
    if (!state.drawerVisible) fail(scope, 'cart drawer did not open');
    if (!state.drawerHasItem) fail(scope, 'cart drawer does not list AURA One');
    if (state.subtotal !== '$349') fail(scope, `subtotal is ${JSON.stringify(state.subtotal)}, expected "$349"`);
    for (const e of errors) fail(scope, e);
    await page.screenshot({ path: `${SHOTS}/interaction-cart-drawer-desktop.png` });
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 2. Support FAQ accordion toggles.
  {
    const scope = 'interaction faq-accordion';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/support/', { waitUntil: 'networkidle' });
    const before = await page.evaluate(() => {
      const items = [...document.querySelectorAll('[data-accordion-item]')];
      return items.map((i) => i.classList.contains('open'));
    });
    // Click the second question (first is open by default).
    await page.locator('[data-accordion-btn]').nth(1).click();
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => {
      const items = [...document.querySelectorAll('[data-accordion-item]')];
      return items.map((i) => i.classList.contains('open'));
    });
    console.log('  faq open states before:', JSON.stringify(before), 'after:', JSON.stringify(after));
    if (!after[1]) fail(scope, 'second accordion item did not open on click');
    if (after[0]) fail(scope, 'first accordion item stayed open (accordion should be exclusive)');
    await page.screenshot({ path: `${SHOTS}/interaction-faq-desktop.png` });
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 3. Shop filter + sort change the grid.
  {
    const scope = 'interaction shop-filter-sort';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/products/', { waitUntil: 'networkidle' });
    await page.click('[data-filter="Earbuds"]');
    await page.waitForTimeout(400);
    const filtered = await page.evaluate(() => ({
      count: document.querySelector('#shop-count')?.textContent?.trim(),
      visible: [...document.querySelectorAll('#shop-grid [data-name]')]
        .filter((c) => !c.classList.contains('hidden'))
        .map((c) => c.querySelector('h3')?.textContent?.trim()),
    }));
    console.log('  after Earbuds filter:', JSON.stringify(filtered));
    if (filtered.count !== '2 products') fail(scope, `count is ${JSON.stringify(filtered.count)}, expected "2 products"`);
    await page.selectOption('#sort-select', 'price-asc');
    await page.waitForTimeout(400);
    const sorted = await page.evaluate(() =>
      [...document.querySelectorAll('#shop-grid [data-name]')]
        .filter((c) => !c.classList.contains('hidden'))
        .map((c) => c.querySelector('h3')?.textContent?.trim()),
    );
    console.log('  after price-asc sort:', JSON.stringify(sorted));
    if (sorted[0] !== 'Wireless Earbuds') fail(scope, `first card after price-asc is ${JSON.stringify(sorted[0])}, expected "Wireless Earbuds" ($199 before AURA Buds Pro $249)`);
    await page.screenshot({ path: `${SHOTS}/interaction-shop-filtered-desktop.png` });
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 4. Mobile menu opens.
  {
    const scope = 'interaction mobile-menu';
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.click('#menu-btn');
    await page.waitForTimeout(600);
    const open = await page.evaluate(() => !document.querySelector('#mobile-menu').classList.contains('hidden'));
    console.log('  mobile menu opens:', open);
    if (!open) fail(scope, 'mobile menu did not open');
    await page.screenshot({ path: `${SHOTS}/interaction-mobile-menu.png` });
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 5. Header search finds products live.
  {
    const scope = 'interaction search';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.click('#search-btn');
    await page.waitForTimeout(500);
    await page.fill('#search-input', 'buds');
    await page.waitForTimeout(400);
    const hits = await page.evaluate(() =>
      [...document.querySelectorAll('#search-results a')].map((a) => a.textContent.trim().slice(0, 20)),
    );
    console.log('  search "buds" hits:', JSON.stringify(hits));
    if (hits.length < 2) fail(scope, `expected >= 2 results for "buds", got ${hits.length}`);
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }
}

const exe = process.env.CHROME || '/home/hatch/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
try {
  console.log('--- routes ---');
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) await checkRoute(browser, route, vp);
  }
  await checkInteractions(browser);
} finally {
  await browser.close();
}

const passed = results.filter((r) => r.ok).length;
console.log(`\nROUTES: ${passed}/${results.length} passed`);
console.log(failures.length ? `FAILURES (${failures.length}):\n- ${failures.join('\n- ')}` : 'ERRORS: none');
process.exitCode = failures.length ? 1 : 0;
