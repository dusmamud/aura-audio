import { chromium } from 'playwright-core';
const exe = process.env.CHROME || '/home/hatch/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const errors = [];
for (const [name, w, h] of [['mobile', 390, 844], ['desktop', 1280, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
  page.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push(name + ' reqfail: ' + r.url()));
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // Scroll like a real user, step by step to the bottom, so ScrollTrigger
  // reveals fire exactly as they do for a visitor (a fullPage capture on
  // its own does not scroll, and would photograph unrevealed sections).
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 450) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map(i => ({ alt: i.alt.slice(0,30), ok: i.complete && i.naturalWidth > 0, src: i.currentSrc.split('/').pop() }));
    return {
      scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
      h1: document.querySelector('h1')?.innerText, imgs,
      nav: [...document.querySelectorAll('header nav a')].map(a => a.textContent.trim()),
      products: [...document.querySelectorAll('#products h3')].map(e => e.textContent),
      cta: document.querySelector('#story h2')?.innerText,
      footer: document.body.innerText.includes('PRIVACY') && document.body.innerText.includes('CAREERS'),
    };
  });
  console.log(`--- ${name} ${w}x${h} ---`);
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: `/home/hatch/workspace/aura-audio/scripts/aura-${name}.png`, fullPage: true });
  // mobile menu interaction
  if (name === 'mobile') {
    await page.click('#menu-btn');
    const open = await page.evaluate(() => !document.querySelector('#mobile-menu').classList.contains('hidden'));
    console.log('mobile menu opens:', open);
    await page.screenshot({ path: '/home/hatch/workspace/aura-audio/scripts/aura-mobile-menu.png' });
  }
  await page.close();
}
console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
