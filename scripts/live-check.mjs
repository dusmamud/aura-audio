import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failed = [];
page.on('requestfailed', r => failed.push(r.url()));
page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
await page.goto('https://auraaudioo.pages.dev/', { waitUntil: 'networkidle' });
await page.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y <= h; y += 450) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } window.scrollTo(0, 0); });
await page.waitForTimeout(800);
const info = await page.evaluate(() => ({
  h1: document.querySelector('h1')?.innerText.replaceAll('\n', ' '),
  imgsOk: [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth > 0).length,
  imgsTotal: document.querySelectorAll('img').length,
  avif: [...document.querySelectorAll('img')].filter(i => i.currentSrc.endsWith('.avif')).length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
}));
console.log(JSON.stringify(info));
console.log('FAILED:', failed.length ? failed : 'none');
await page.screenshot({ path: '/home/hatch/workspace/aura-screenshots/live-desktop.png', fullPage: true });
await browser.close();
