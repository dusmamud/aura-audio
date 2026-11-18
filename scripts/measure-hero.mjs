import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome', args: ['--no-sandbox'] });
for (const [name, w, h] of [['mobile', 390, 844], ['desktop', 1280, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('requestfailed', r => errs.push(r.url()));
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { const hh = document.body.scrollHeight; for (let y = 0; y <= hh; y += 450) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const img = document.querySelector('img[alt="Silver AURA over-ear headphones"]');
    const r = img.getBoundingClientRect();
    return {
      displayed: Math.round(r.width) + 'x' + Math.round(r.height),
      currentSrc: img.currentSrc.split('/').pop(),
      attrs: img.getAttribute('width') + 'x' + img.getAttribute('height'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  console.log(name, JSON.stringify(m), 'errors:', errs.length ? errs : 'none');
  await page.screenshot({ path: `/home/hatch/workspace/aura-audio/scripts/hero-${name}.png` });
  await page.close();
}
await browser.close();
