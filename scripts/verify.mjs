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
  ['wishlist', '/wishlist/', 200],
  ['track', '/track/', 200],
  ['account', '/account/', 200],
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
    const imgs = [...document.querySelectorAll('img')]
      // Skip images the visitor cannot see (e.g. the lazy sticky-bar
      // thumbnail, hidden on desktop) — a never-loaded hidden image is
      // not a broken image.
      .filter((i) => i.checkVisibility())
      .map((i) => ({
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

  // 6. Wishlist: heart on PDP -> header badge 1 -> /wishlist/ lists it ->
  // move-to-bag -> cart count 1 and wishlist empties.
  {
    const scope = 'interaction wishlist';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    await page.click('#pdp-buybox [data-wishlist-toggle]');
    await page.waitForTimeout(400);
    const badge = await page.evaluate(() => document.querySelector('#wishlist-count')?.textContent?.trim());
    console.log('  wishlist badge after heart:', JSON.stringify(badge));
    if (badge !== '1') fail(scope, `wishlist badge is ${JSON.stringify(badge)}, expected "1"`);
    await page.goto(BASE + '/wishlist/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const listed = await page.evaluate(() => (document.querySelector('#wishlist-grid')?.textContent || '').includes('AURA One'));
    if (!listed) fail(scope, '/wishlist/ does not list AURA One after saving it');
    await page.click('[data-wishlist-move]');
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({
      bag: document.querySelector('#bag-count')?.textContent?.trim(),
      empty: !document.querySelector('#wishlist-empty')?.classList.contains('hidden'),
    }));
    console.log('  after move-to-bag:', JSON.stringify(after));
    if (after.bag !== '1') fail(scope, `bag count after move-to-bag is ${JSON.stringify(after.bag)}, expected "1"`);
    if (!after.empty) fail(scope, 'wishlist empty state did not appear after moving the only item to the bag');
    for (const e of errors) fail(scope, e);
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 7. Promo code: invalid code errors, AURA10 drops the subtotal 10%.
  {
    const scope = 'interaction promo';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    await page.click('[data-add-to-bag]');
    // Wait for the drawer to finish sliding in before touching its footer.
    await page.waitForFunction(() => {
      const d = document.querySelector('#cart-drawer');
      if (!d || d.classList.contains('translate-x-full')) return false;
      return d.getBoundingClientRect().x < window.innerWidth;
    }, null, { timeout: 10000 });
    await page.waitForTimeout(400);
    await page.fill('#promo-input', 'WRONG');
    await page.click('#promo-form button[type="submit"]');
    await page.waitForTimeout(400);
    const badMsg = await page.evaluate(() => document.querySelector('#promo-message')?.textContent?.trim());
    console.log('  invalid promo message:', JSON.stringify(badMsg));
    if (!badMsg || !badMsg.includes('not valid')) fail(scope, `invalid promo did not show an error, got ${JSON.stringify(badMsg)}`);
    // Regression: the submit must NOT trigger an Astro view transition
    // (which would swap the DOM and close the drawer). Wait past the
    // transition window and confirm the drawer is still open.
    await page.waitForTimeout(1200);
    const stillOpen = await page.evaluate(() => !document.querySelector('#cart-drawer')?.classList.contains('translate-x-full'));
    if (!stillOpen) fail(scope, 'drawer closed after promo submit — a view transition swapped the page');
    await page.fill('#promo-input', 'AURA10');
    await page.click('#promo-form button[type="submit"]');
    await page.waitForTimeout(400);
    const totals = await page.evaluate(() => ({
      subtotal: document.querySelector('#cart-subtotal')?.textContent?.trim(),
      discount: document.querySelector('#cart-discount')?.textContent?.trim(),
      total: document.querySelector('#cart-total')?.textContent?.trim(),
    }));
    console.log('  promo totals:', JSON.stringify(totals));
    if (totals.subtotal !== '$349') fail(scope, `subtotal is ${JSON.stringify(totals.subtotal)}, expected "$349"`);
    if (totals.discount !== '−$35') fail(scope, `discount is ${JSON.stringify(totals.discount)}, expected "−$35"`);
    if (totals.total !== '$314') fail(scope, `total is ${JSON.stringify(totals.total)}, expected "$314"`);
    for (const e of errors) fail(scope, e);
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 8. Mock checkout completes: order saved, confetti canvas appears,
  // success links to /track/ with the order number.
  {
    const scope = 'interaction checkout';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    await page.click('[data-add-to-bag]');
    await page.waitForTimeout(600);
    await page.goto(BASE + '/checkout/', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="address"]', '1 Demo Street');
    await page.fill('input[name="city"]', 'Mumbai');
    await page.fill('input[name="pincode"]', '400050');
    await page.click('#step-1 button[type="submit"]');
    await page.waitForTimeout(500);
    await page.fill('input[name="card"]', '4242424242424242');
    await page.click('#step-2 button[type="submit"]');
    await page.waitForTimeout(800);
    const state = await page.evaluate(() => {
      const orders = JSON.parse(localStorage.getItem('aura-orders') || '[]');
      return {
        successVisible: !document.querySelector('#checkout-success')?.classList.contains('hidden'),
        orderNo: document.querySelector('#order-number')?.textContent?.trim(),
        saved: orders.length,
        savedNo: orders[0]?.orderNo,
        savedTotal: orders[0]?.total,
        hasCanvas: !!document.querySelector('body > canvas'),
        trackHref: document.querySelector('#track-order-link')?.getAttribute('href'),
      };
    });
    console.log('  checkout state:', JSON.stringify(state));
    if (!state.successVisible) fail(scope, 'success screen did not appear');
    if (!/^AUR-\d{6}$/.test(state.orderNo || '')) fail(scope, `order number is ${JSON.stringify(state.orderNo)}, expected AUR-######`);
    if (state.saved !== 1) fail(scope, `aura-orders has ${state.saved} orders, expected 1`);
    if (state.savedNo !== state.orderNo) fail(scope, `saved order ${JSON.stringify(state.savedNo)} != shown ${JSON.stringify(state.orderNo)}`);
    if (state.savedTotal !== 349) fail(scope, `saved total is ${state.savedTotal}, expected 349`);
    if (!state.hasCanvas) fail(scope, 'no confetti canvas found after placing the order');
    if (state.trackHref !== `/track/?order=${state.orderNo}`) fail(scope, `track link is ${JSON.stringify(state.trackHref)}`);
    for (const e of errors) fail(scope, e);
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 9. Track page: seeded order renders a 5-step timeline + summary;
  // unknown input shows not-found, demo button recovers.
  {
    const scope = 'interaction track';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('aura-orders', JSON.stringify([{
        orderNo: 'AUR-111111', date: new Date().toISOString(),
        items: [{ slug: 'aura-one', name: 'AURA One', color: 'Silver', qty: 1, price: 349 }],
        subtotal: 349, discount: 0, shipping: 0, total: 349, email: 't@example.com', name: 'Test',
      }]));
    });
    await page.goto(BASE + '/track/?order=AUR-111111', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const found = await page.evaluate(() => ({
      steps: document.querySelectorAll('#track-timeline li').length,
      status: document.querySelector('#track-status')?.textContent?.trim(),
      summary: (document.querySelector('#order-summary')?.textContent || '').includes('$349'),
    }));
    console.log('  track seeded order:', JSON.stringify(found));
    if (found.steps !== 5) fail(scope, `timeline has ${found.steps} steps, expected 5`);
    if (!found.status) fail(scope, 'no status line rendered');
    if (!found.summary) fail(scope, 'order summary does not show the $349 total');
    await page.goto(BASE + '/track/', { waitUntil: 'networkidle' });
    await page.fill('#order-input', 'XYZ');
    await page.click('#track-form button[type="submit"]');
    await page.waitForTimeout(400);
    const notFound = await page.evaluate(() => !document.querySelector('#track-notfound')?.classList.contains('hidden'));
    if (!notFound) fail(scope, 'not-found state did not appear for "XYZ"');
    await page.click('#try-demo');
    await page.waitForTimeout(400);
    const demoSteps = await page.evaluate(() => document.querySelectorAll('#track-timeline li').length);
    if (demoSteps !== 5) fail(scope, `demo order timeline has ${demoSteps} steps, expected 5`);
    for (const e of errors) fail(scope, e);
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 10. Mobile PDP sticky bar: appears after scrolling past the buy box,
  // its Add to bag works.
  {
    const scope = 'interaction sticky-bar';
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    const before = await page.evaluate(() => {
      const bar = document.querySelector('#pdp-sticky-bar');
      return bar ? bar.getBoundingClientRect().top : null;
    });
    // Scroll like a real user, then settle mid-page: the buy box must be
    // off-screen above and the footer far below — at the very bottom the
    // bar hides by design so it never covers the footer.
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.scrollTo(0, 1800));
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => {
      const bar = document.querySelector('#pdp-sticky-bar');
      if (!bar) return null;
      const r = bar.getBoundingClientRect();
      return { top: Math.round(r.top), height: Math.round(r.height), visible: r.top < window.innerHeight && r.bottom > 0 };
    });
    console.log('  sticky bar before scroll:', before, 'after:', JSON.stringify(after));
    if (!after || !after.visible) fail(scope, `sticky bar not visible after scrolling (before top ${before}, after ${JSON.stringify(after)})`);
    await page.click('#pdp-sticky-bar [data-add-to-bag]');
    await page.waitForTimeout(900);
    const count = await page.evaluate(() => document.querySelector('#bag-count')?.textContent?.trim());
    if (count !== '1') fail(scope, `bag count after sticky-bar add is ${JSON.stringify(count)}, expected "1"`);
    for (const e of errors) fail(scope, e);
    await page.screenshot({ path: `${SHOTS}/interaction-sticky-bar-mobile.png` });
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 11. Keyboard: Tab 10x inside the open drawer never leaves it; Esc
  // closes it and focus returns to the bag button.
  {
    const scope = 'interaction focus-trap';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    await page.click('[data-add-to-bag]');
    await page.waitForTimeout(900);
    const escaped = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(80);
      const inside = await page.evaluate(() => {
        const drawer = document.querySelector('#cart-drawer');
        const active = document.activeElement;
        return !!drawer && !!active && drawer.contains(active);
      });
      if (!inside) escaped.push(i + 1);
    }
    console.log('  focus escaped the drawer on Tab presses:', JSON.stringify(escaped));
    if (escaped.length) fail(scope, `focus left the drawer on Tab press(es) ${escaped.join(', ')}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const afterEsc = await page.evaluate(() => ({
      drawerClosed: document.querySelector('#cart-drawer')?.classList.contains('translate-x-full'),
      focusOnBag: document.activeElement?.id === 'bag-btn',
    }));
    console.log('  after Esc:', JSON.stringify(afterEsc));
    if (!afterEsc.drawerClosed) fail(scope, 'drawer did not close on Escape');
    if (!afterEsc.focusOnBag) fail(scope, 'focus did not return to the bag button after Escape');
    for (const e of errors) fail(scope, e);
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 12. Anchor jump: /support/#shipping lands clear of the fixed header.
  {
    const scope = 'interaction anchor-jump';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/support/#shipping', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const pos = await page.evaluate(() => {
      const header = document.querySelector('.fixed.inset-x-0.top-0');
      const target = document.querySelector('#shipping');
      return {
        headerBottom: header ? Math.round(header.getBoundingClientRect().bottom) : null,
        targetTop: target ? Math.round(target.getBoundingClientRect().top) : null,
        scrollPadding: getComputedStyle(document.documentElement).scrollPaddingTop,
      };
    });
    console.log('  anchor positions:', JSON.stringify(pos));
    if (pos.targetTop === null) fail(scope, '#shipping target not found');
    else if (pos.headerBottom !== null && pos.targetTop < pos.headerBottom - 1) {
      fail(scope, `target top ${pos.targetTop}px is under the header (bottom ${pos.headerBottom}px)`);
    }
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 13. Touch targets: header icons + PDP steppers + colour pills >= 44px.
  {
    const scope = 'interaction touch-targets';
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const headerSizes = await page.evaluate(() =>
      ['#search-btn', '#bag-btn', '#menu-btn'].map((sel) => {
        const r = document.querySelector(sel)?.getBoundingClientRect();
        return { sel, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0 };
      }),
    );
    console.log('  header icon sizes:', JSON.stringify(headerSizes));
    for (const s of headerSizes) {
      if (s.w < 44 || s.h < 44) fail(scope, `${s.sel} is ${s.w}x${s.h}, expected >= 44x44`);
    }
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    const pdpSizes = await page.evaluate(() => {
      const out = {};
      for (const sel of ['[data-qty-dec]', '[data-qty-inc]', '[data-color-btn]']) {
        const r = document.querySelector(sel)?.getBoundingClientRect();
        out[sel] = r ? { w: Math.round(r.width), h: Math.round(r.height) } : null;
      }
      return out;
    });
    console.log('  PDP control sizes:', JSON.stringify(pdpSizes));
    for (const [sel, s] of Object.entries(pdpSizes)) {
      if (!s || s.w < 44 || s.h < 44) fail(scope, `${sel} is ${JSON.stringify(s)}, expected >= 44x44`);
    }
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 14. PDP shows a stock signal and a computed delivery estimate.
  {
    const scope = 'interaction pdp-stock-delivery';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/products/aura-one/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const one = await page.evaluate(() => ({
      stock: (document.querySelector('#pdp-buybox')?.textContent || '').includes('In stock'),
      delivery: document.querySelector('#delivery-estimate')?.textContent?.trim(),
    }));
    console.log('  aura-one stock/delivery:', JSON.stringify(one));
    if (!one.stock) fail(scope, 'no "In stock" signal on the AURA One PDP');
    if (!one.delivery || !/arrives \w{3} \d{1,2} \w{3}/.test(one.delivery)) {
      fail(scope, `delivery estimate missing or malformed: ${JSON.stringify(one.delivery)}`);
    }
    await page.goto(BASE + '/products/aura-dock/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const dock = await page.evaluate(() => (document.querySelector('#pdp-buybox')?.textContent || '').includes('Only 3 left'));
    if (!dock) fail(scope, 'no "Only 3 left" low-stock signal on the dock PDP');
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 15. Cookie banner: appears on a fresh load, dismiss persists.
  {
    const scope = 'interaction cookie-banner';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const shown = await page.evaluate(() => !document.querySelector('#cookie-banner')?.classList.contains('hidden'));
    console.log('  cookie banner on fresh load:', shown);
    if (!shown) fail(scope, 'cookie banner did not appear on a fresh load');
    await page.click('[data-consent="accepted"]');
    await page.waitForTimeout(400);
    const stored = await page.evaluate(() => ({
      hidden: document.querySelector('#cookie-banner')?.classList.contains('hidden'),
      consent: localStorage.getItem('aura-consent'),
    }));
    if (!stored.hidden || stored.consent !== 'accepted') {
      fail(scope, `after Accept: hidden=${stored.hidden}, stored=${JSON.stringify(stored.consent)}`);
    }
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const afterReload = await page.evaluate(() => !document.querySelector('#cookie-banner')?.classList.contains('hidden'));
    if (afterReload) fail(scope, 'cookie banner reappeared after reload despite stored consent');
    for (const e of errors) fail(scope, e);
    await page.close();
    if (!failures.some((f) => f.startsWith(scope))) console.log(`  PASS ${scope}`);
  }

  // 16. Newsletter: submit shows the toast and does NOT trigger a view
  // transition (same ClientRouter form-submit trap as the promo form).
  {
    const scope = 'interaction newsletter';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => { window.__nlForm = document.querySelector('#newsletter-form'); });
    await page.fill('#newsletter-email', 'test@example.com');
    await page.click('#newsletter-form button[type="submit"]');
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({
      toastShown: document.querySelector('#toast')?.classList.contains('show'),
      toastText: document.querySelector('#toast')?.textContent?.trim(),
      sameForm: window.__nlForm === document.querySelector('#newsletter-form'),
      emailCleared: document.querySelector('#newsletter-email')?.value === '',
    }));
    console.log('  newsletter state:', JSON.stringify(state));
    if (!state.toastShown) fail(scope, 'toast did not appear after newsletter submit');
    if (!state.toastText?.includes('subscribing')) fail(scope, `toast text wrong: ${JSON.stringify(state.toastText)}`);
    if (!state.sameForm) fail(scope, 'newsletter form node was replaced — a view transition swapped the page');
    if (!state.emailCleared) fail(scope, 'newsletter email was not cleared after submit');
    for (const e of errors) fail(scope, e);
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
