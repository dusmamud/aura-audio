import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1919, height: 998 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('requestfailed', r => errors.push('reqfail: ' + r.url()));
await page.goto('https://auraaudioo.pages.dev/?v=3', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const img = document.querySelector('img[alt="Silver AURA over-ear headphones"]');
  if (!img) return { found: false };
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  return {
    found: true,
    currentSrc: img.currentSrc,
    natural: img.naturalWidth + 'x' + img.naturalHeight,
    displayed: Math.round(r.width) + 'x' + Math.round(r.height),
    imgClass: img.className,
    imgBg: cs.backgroundColor,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    parentHtml: img.parentElement.outerHTML.slice(0, 300),
  };
});
console.log(JSON.stringify(info, null, 1));
console.log('ERRORS:', errors.length ? errors : 'none');
await page.screenshot({ path: '/home/hatch/workspace/aura-audio/scripts/live-hero-desktop.png' });
await browser.close();
