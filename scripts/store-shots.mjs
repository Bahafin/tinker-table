// Takes the app store screenshots from the built game, at the exact sizes the stores ask for.
// Uses an installed Edge or Chrome (no browser download). Steps:
//   npm run build
//   npm run preview        (in another terminal; serves http://localhost:4173)
//   node scripts/store-shots.mjs [only-this-shot]
// Writes store/screenshots/<size>/<n>-<name>.png. BROWSER=chrome to use Chrome instead of Edge.
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const URL = process.env.URL ?? 'http://localhost:4173/';
const channel = process.env.BROWSER ?? (process.platform === 'win32' ? 'msedge' : 'chrome');
const only = process.argv[2];

// iPad 12.9"/13" (App Store), iPhone 6.9" held sideways (App Store, since the app runs on
// iPhones too), and a 16:9 landscape that Google Play takes for phones and tablets.
// SIZE=iphone-2868x1320 takes only one size.
const SIZES = [
  { name: 'ipad-2732x2048', width: 1366, height: 1024, scale: 2 },
  { name: 'iphone-2868x1320', width: 956, height: 440, scale: 3 },
  { name: 'play-2560x1440', width: 1280, height: 720, scale: 2 },
].filter((s) => !process.env.SIZE || s.name === process.env.SIZE);

// Progress for the screenshots: Workshop, Playroom and Bathroom finished, half the Attic.
const DONE = [
  '61-soap-squirt', '62-soap-push', '63-soap-turn', '64-soap-slide', '65-soap-fan', '66-soap-hamster', '67-soap-roll', '68-soap-two', '69-soap-lift', '70-bath-blow',
  '06-hamster', '34-hammer', '01-roll', '46-belt-hammer', '10-boing', '13-wind', '16-pusher', '36-hammer-dominoes', '03-seesaw', '35-hammer-face',
  '31-car-push', '11-pop', '08-wake-up', '05-chain', '20-goes-up', '12-uphill', '49-car-jump', '17-safe-balloon', '32-car-ride', '33-car-catapult',
  '43-snip', '04-balloon', '02-dominoes', '44-swing-snip', '22-catapult',
];
// Stickers already stuck in the book: [x, y] as fractions of the page, and a tilt.
const BOOK = {
  '06-hamster': [0.14, 0.2, -8], '34-hammer': [0.3, 0.32, 6], '01-roll': [0.48, 0.18, -4], '46-belt-hammer': [0.68, 0.26, 10],
  '10-boing': [0.86, 0.18, -6], '13-wind': [0.18, 0.55, 4], '31-car-push': [0.4, 0.5, -10], '11-pop': [0.62, 0.58, 7],
  '08-wake-up': [0.84, 0.5, -3], '05-chain': [0.12, 0.84, 9], '20-goes-up': [0.34, 0.8, -5], '43-snip': [0.56, 0.86, 3], '32-car-ride': [0.78, 0.82, -7],
};

// The toy box machine: a big level's parts, each drawn in a different room's look.
const big = JSON.parse(readFileSync('src/levels/30-grand-finale.json', 'utf8'));
const LOOKS = ['kitchen', 'garden', 'playroom', 'attic', 'workshop'];
const TOY = [...big.fixed, ...big.solution].filter((p) => p.part !== 'cheese').map(({ id, ...p }, k) => ({ ...p, skin: LOOKS[k % LOOKS.length] }));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Open a room from the front page: tap its name to bring it to the middle, then tap the room. */
async function openRoom(page, name) {
  await page.click(`.stop .room-name:text-is("${name}")`);
  await wait(900);
  await page.click('.stop.here .room-tile');
  await wait(400);
}
async function openLevel(page, room, n) {
  await openRoom(page, room);
  await page.click(`#levels .card >> nth=${n - 1}`);
  await wait(600);
}
/** Put the level's answer on the table (all of it, or all but `leaveOut` parts). */
async function placeSolution(page, leaveOut = 0) {
  await page.evaluate((k) => {
    const g = window.tinker();
    const sol = g.level.solution ?? [];
    g.placements = sol.slice(0, sol.length - k).map((p) => ({ ...p }));
    g.preview = null; // the game caches the table's picture until something moves
  }, leaveOut);
  await wait(300);
}

const SHOTS = {
  // 1. The front page: a row of rooms to swipe along.
  rooms: async () => {},
  // 2. A big machine mid-run in the Kitchen.
  machine: async (page) => {
    await openLevel(page, 'Kitchen', 10);
    await placeSolution(page);
    await page.click('#btn-go');
    await wait(Number(process.env.AT ?? 2600));
  },
  // 3. Building: the rocket's grand launch in Space, one part still to place.
  build: async (page) => {
    await openLevel(page, 'Space', 10);
    await placeSolution(page, 1);
  },
  // 4. A win, with the film strip of the run.
  win: async (page) => {
    await openLevel(page, 'Playroom', 10);
    await placeSolution(page);
    await page.click('#btn-go');
    await page.waitForSelector('#won:not(.hidden)', { timeout: 30000 });
    await wait(2500);
  },
  // 5. The sticker book.
  stickers: async (page) => {
    await page.click('#btn-book');
    await wait(1200);
  },
  // 6. The toy box: free building, with parts from every room.
  toybox: async (page) => {
    await openRoom(page, 'Toy box');
    await page.click('#levels .card.new-card');
    await wait(600);
    await page.evaluate((toy) => { const g = window.tinker(); g.placements = toy; g.preview = null; }, TOY);
    await wait(400);
  },
  // 7. The grown-ups' corner: talk cards for every level.
  grownups: async (page) => {
    const b = await page.locator('#btn-grownups').boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await wait(1800);
    await page.mouse.up();
    await wait(500);
  },
};

const browser = await chromium.launch({ channel });
for (const size of SIZES) {
  mkdirSync(`store/screenshots/${size.name}`, { recursive: true });
  let n = 0;
  for (const [name, setUp] of Object.entries(SHOTS)) {
    n++;
    if (only && only !== name) continue;
    const ctx = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: size.scale,
      hasTouch: true,
      serviceWorkers: 'block',
    });
    await ctx.addInitScript(({ done, book }) => {
      localStorage.setItem('tinker.done', JSON.stringify(done));
      localStorage.setItem('tinker.book', JSON.stringify(book));
      localStorage.setItem('tinker.welcomed', '1'); // skip the first-launch card for grown-ups
      localStorage.setItem('tinker.gu', 'talk'); // the grown-ups' corner opens on the talk cards
      // Quiet: no voice while taking pictures.
      if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    }, { done: DONE, book: BOOK });
    const page = await ctx.newPage();
    await page.goto(URL);
    await wait(1200);
    await setUp(page);
    const file = `store/screenshots/${size.name}/${n}-${name}.png`;
    await page.screenshot({ path: file });
    console.log('wrote', file);
    await ctx.close();
  }
}
await browser.close();
