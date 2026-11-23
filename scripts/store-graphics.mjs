// Makes the store graphics that aren't screenshots:
//   store/icon-1024.png        App Store icon (1024×1024, no transparency): a copy of assets/icon-only.png
//   store/play-icon-512.png    Google Play icon (512×512)
//   store/feature-1024x500.png Google Play feature graphic: the logo and four rooms' pictures on paper
// Uses the running game for the room pictures, like store-shots.mjs:
//   npm run build && npm run preview     (serves http://localhost:4173)
//   node scripts/store-graphics.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const URL = process.env.URL ?? 'http://localhost:4173/';
const channel = process.env.BROWSER ?? (process.platform === 'win32' ? 'msedge' : 'chrome');
mkdirSync('store', { recursive: true });
copyFileSync('assets/icon-only.png', 'store/icon-1024.png');

const browser = await chromium.launch({ channel });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await page.addInitScript(() => { try { localStorage.setItem('tinker.welcomed', '1'); } catch { /* */ } });
await page.goto(URL);
await page.waitForSelector('.room-tile canvas');

// The Play icon: the store icon scaled down by the browser (smooth, no extra tools).
await page.evaluate(async () => {
  const img = new Image();
  img.src = 'icons/icon-512.png';
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  c.getContext('2d').drawImage(img, 0, 0, 512, 512);
  c.id = 'out-icon';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  document.body.append(c);
});
await page.locator('#out-icon').screenshot({ path: 'store/play-icon-512.png' });
await page.evaluate(() => document.getElementById('out-icon').remove());

// The feature graphic. Google crops nothing but may cover the middle with a play button
// when there's a video, so the logo sits left and the pictures right.
await page.evaluate(async () => {
  const W = 1024, H = 500;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#e9dcc3'; g.fillRect(0, 0, W, H);
  // Soft paper dots.
  g.fillStyle = '#ddcdb0';
  for (let x = 12; x < W; x += 24) for (let y = 12; y < H; y += 24) g.fillRect(x - 1.5, y - 1.5, 3, 3);
  const logo = new Image();
  logo.src = 'logo.svg';
  await logo.decode();
  const lw = 400, lh = (logo.naturalHeight / logo.naturalWidth) * lw;
  g.drawImage(logo, 50, H / 2 - lh / 2 - 30, lw, lh);
  g.fillStyle = '#3b2f2a';
  g.font = '600 30px Nunito, "Segoe UI", sans-serif';
  g.fillText('Chain-reaction puzzles', 58, H / 2 + lh / 2 + 10);
  g.fillText('for 5 to 8 year olds', 58, H / 2 + lh / 2 + 48);
  const tiles = [...document.querySelectorAll('.room-tile')];
  const pic = (name) => tiles.find((t) => t.getAttribute('aria-label') === name).querySelector('canvas');
  const cards = [['Space', 640, 120, -6], ['Bathroom', 860, 140, 5], ['Music room', 650, 360, 4], ['Garage', 870, 370, -5]];
  for (const [name, x, y, tilt] of cards) {
    const src = pic(name);
    const w = 230, h = (src.height / src.width) * w;
    g.save();
    g.translate(x, y); g.rotate((tilt * Math.PI) / 180);
    g.shadowColor = 'rgba(80,55,30,0.3)'; g.shadowBlur = 12; g.shadowOffsetY = 5;
    g.fillStyle = '#fff'; g.fillRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16);
    g.shadowColor = 'transparent';
    g.drawImage(src, -w / 2, -h / 2, w, h);
    g.restore();
  }
  c.id = 'out-feature';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  document.body.append(c);
});
await page.locator('#out-feature').screenshot({ path: 'store/feature-1024x500.png' });
await browser.close();
console.log('wrote store/icon-1024.png, store/play-icon-512.png, store/feature-1024x500.png');
