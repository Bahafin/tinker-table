// Records the App Store preview videos from the built game: real play, with the game's own
// sound and voice. Runs in GitHub Actions (Actions > Store previews), which encodes them with
// ffmpeg to Apple's format: H.264, 30 fps, stereo AAC, at most 30 seconds. Locally:
//   npm run build && npm run preview      (serves http://localhost:4173)
//   node scripts/store-preview.mjs        (frames and sound only, unless ffmpeg is installed)
// Writes store/previews/<size>.mp4.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const URL = process.env.URL ?? 'http://localhost:4173/';
const channel = process.env.BROWSER ?? (process.platform === 'win32' ? 'msedge' : 'chrome');
const MAX = 30; // seconds: Apple takes 15 to 30

// Apple's preview sizes, landscape: iPad 13" (1600x1200) and iPhone 6.9"/6.5"/6.3" (1920x886).
// The page is laid out at the device's own size, and the pixel ratio makes the video's.
const SIZES = [
  { name: 'ipad-1600x1200', width: 1366, height: 1024, out: [1600, 1200] },
  { name: 'iphone-1920x886', width: 960, height: 443, out: [1920, 886] },
].filter((s) => !process.env.SIZE || s.name === process.env.SIZE);

// Progress for the video: a few rooms done, so the front page shows ticks.
const DONE = [
  '06-hamster', '34-hammer', '01-roll', '46-belt-hammer', '10-boing', '13-wind', '16-pusher', '36-hammer-dominoes', '03-seesaw', '35-hammer-face',
  '31-car-push', '11-pop', '08-wake-up', '05-chain', '20-goes-up', '12-uphill', '49-car-jump', '17-safe-balloon', '32-car-ride',
];
const BOOK = {
  '06-hamster': [0.14, 0.2, -8], '34-hammer': [0.3, 0.32, 6], '01-roll': [0.48, 0.18, -4], '46-belt-hammer': [0.68, 0.26, 10],
  '10-boing': [0.86, 0.18, -6], '13-wind': [0.18, 0.55, 4], '31-car-push': [0.4, 0.5, -10], '11-pop': [0.62, 0.58, 7],
  '08-wake-up': [0.84, 0.5, -3], '05-chain': [0.12, 0.84, 9], '20-goes-up': [0.34, 0.8, -5],
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function tapRoomName(page, name) {
  await page.click(`.stop .room-name:text-is("${name}")`);
  await wait(900);
}
async function openLevel(page, room, n) {
  await tapRoomName(page, room);
  await page.click('.stop.here .room-tile');
  await wait(500);
  await page.click(`#levels .card >> nth=${n - 1}`);
  await wait(700);
}
/** Put all but the last `leaveOut` parts of the answer on the table. */
async function placeSolution(page, leaveOut = 0) {
  await page.evaluate((k) => {
    const g = window.tinker();
    const sol = g.level.solution ?? [];
    g.placements = sol.slice(0, sol.length - k).map((p) => ({ ...p }));
    g.preview = null;
  }, leaveOut);
  await wait(200);
}
/** Drag the answer's next part from the tray to its place, like a finger would, then let it settle exactly. */
async function dragNextPart(page) {
  const at = await page.evaluate(() => {
    const g = window.tinker();
    const sol = g.level.solution;
    const p = sol[g.placements.length];
    const L = g.L;
    const r = g.canvas.getBoundingClientRect();
    const k = g.level.tray.findIndex((t) => t.part === p.part);
    const it = L.items.find((x) => x.i === k);
    return {
      from: { x: r.left + it.x + L.item / 2, y: r.top + it.y + L.item / 2 },
      to: { x: r.left + L.ox + p.x * L.scale, y: r.top + L.oy + p.y * L.scale },
    };
  });
  await page.mouse.move(at.from.x, at.from.y);
  await wait(250);
  await page.mouse.down();
  await wait(150);
  const steps = 18;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; // ease in and out
    // A little arc, the way a hand carries things.
    await page.mouse.move(at.from.x + (at.to.x - at.from.x) * e, at.from.y + (at.to.y - at.from.y) * e - Math.sin(t * Math.PI) * 60);
  }
  await page.mouse.up();
  await page.evaluate(() => {
    const g = window.tinker();
    const i = g.placements.length - 1;
    g.placements[i] = { ...g.level.solution[i] };
    g.preview = null;
  });
  await wait(500);
}

// The story, under 30 seconds: the rooms, building the Kitchen's big machine, the win, stickers.
let T0 = 0;
const mark = (what) => console.log(`  ${((Date.now() - T0) / 1000).toFixed(1)} s  ${what}`);
async function story(page) {
  T0 = Date.now();
  await wait(1000);
  await tapRoomName(page, 'Space');
  await tapRoomName(page, 'Garden');
  await tapRoomName(page, 'Kitchen');
  await page.click('.stop.here .room-tile');
  await wait(600);
  await page.click('#levels .card >> nth=9');
  mark('level open');
  await wait(900);
  await placeSolution(page, 1);
  await wait(600);
  await dragNextPart(page);
  mark('go');
  await page.click('#btn-go');
  await page.waitForSelector('#won:not(.hidden)', { timeout: 30000 });
  mark('won');
  await wait(2600);
  await page.click('#btn-home');
  await wait(300);
  await page.click('[aria-label="Back to the rooms"]');
  await wait(500);
  await page.click('#btn-book');
  await wait(2200);
  mark('end');
}

function hasFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

const browser = await chromium.launch({ channel, args: ['--autoplay-policy=no-user-gesture-required'] });
for (const size of SIZES) {
  const dir = resolve(`store/previews/work-${size.name}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.out[0] / size.width,
    serviceWorkers: 'block',
  });
  await ctx.addInitScript(({ done, book }) => {
    localStorage.setItem('tinker.done', JSON.stringify(done));
    localStorage.setItem('tinker.book', JSON.stringify(book));
    localStorage.setItem('tinker.welcomed', '1');
    // Record everything the game plays: each sound that goes to the speakers also goes to a tape.
    const Real = window.AudioContext;
    const tapes = new WeakMap();
    window.__sound = { chunks: [], start: 0, rec: null };
    window.AudioContext = class extends Real {
      constructor(...a) {
        super(...a);
        const tape = this.createMediaStreamDestination();
        tapes.set(this.destination, tape);
        const rec = new MediaRecorder(tape.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 });
        rec.ondataavailable = (e) => window.__sound.chunks.push(e.data);
        rec.start(500);
        window.__sound.start = Date.now();
        window.__sound.rec = rec;
      }
    };
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (to, ...rest) {
      const tape = tapes.get(to);
      if (tape) connect.call(this, tape);
      return connect.call(this, to, ...rest);
    };
  }, { done: DONE, book: BOOK });
  const page = await ctx.newPage();
  await page.goto(URL);
  await wait(1500);

  // The screen, frame by frame, with when each frame was drawn.
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  const writes = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    frames.push({ file, t: metadata.timestamp });
    writes.push(Promise.resolve().then(() => writeFileSync(file, Buffer.from(data, 'base64'))));
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: size.out[0], maxHeight: size.out[1], everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  await story(page);
  const t1 = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await Promise.all(writes);

  const sound = await page.evaluate(async () => {
    const s = window.__sound;
    if (!s.rec) return null;
    await new Promise((r) => { s.rec.onstop = r; s.rec.stop(); });
    const blob = new Blob(s.chunks, { type: 'audio/webm' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { b64: btoa(bin), start: s.start / 1000 };
  });
  await ctx.close();

  // The frames as a timed list for ffmpeg; the first frame is held from the start.
  const start = Math.min(t0, frames[0].t);
  const lines = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : t1;
    const from = i === 0 ? start : f.t;
    lines.push(`file '${f.file.replace(/\\/g, '/')}'`, `duration ${Math.max(0.001, next - from).toFixed(4)}`);
  });
  lines.push(`file '${frames[frames.length - 1].file.replace(/\\/g, '/')}'`);
  writeFileSync(join(dir, 'frames.txt'), lines.join('\n'));
  const length = t1 - start;
  console.log(`${size.name}: ${frames.length} frames over ${length.toFixed(1)} s (${(frames.length / length).toFixed(1)} fps drawn)${sound ? ', with sound' : ', no sound'}`);
  let audioArgs = ['-f', 'lavfi', '-t', String(MAX), '-i', 'anullsrc=r=48000:cl=stereo'];
  if (sound) {
    writeFileSync(join(dir, 'sound.webm'), Buffer.from(sound.b64, 'base64'));
    audioArgs = ['-itsoffset', (sound.start - start).toFixed(3), '-i', join(dir, 'sound.webm')];
  }
  if (length > MAX) console.log(`  longer than ${MAX} s: the end is cut. Shorten the story.`);
  if (!hasFfmpeg()) { console.log('  no ffmpeg here: frames and sound kept in', dir); continue; }
  const out = resolve(`store/previews/${size.name}.mp4`);
  const [w, h] = size.out;
  execFileSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'frames.txt'), ...audioArgs,
    '-map', '0:v', '-map', '1:a',
    '-vf', `scale=${w}:${h}:flags=lanczos,fps=30,format=yuv420p,setsar=1`,
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-preset', 'slow', '-crf', '16', '-r', '30',
    '-af', 'apad', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2',
    '-t', String(Math.min(MAX, length)), '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  console.log('wrote', out);
}
await browser.close();
