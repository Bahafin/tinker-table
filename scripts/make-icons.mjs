// Draws the app icon (paper table, ramp, ball) and writes PNGs to public/icons (web), and
// to assets/ the source images @capacitor/assets turns into the apps' icons and splash screens.
// No dependencies: shapes are rasterised with supersampling and encoded with zlib.
// Run: node scripts/make-icons.mjs, then npx capacitor-assets generate (see docs/app.md).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const BG = hex('#e9dcc3');
const PAPER = hex('#f4ecdc'), KRAFT = hex('#b98a5a'), TOMATO = hex('#e5583f'), CREAM = hex('#fbf6ea'), BASKET = hex('#8f6640');

// Shapes in a 0..1 unit square, drawn in order (later wins).
function colourAt(x, y) {
  let c = PAPER;
  // Ramp: a rotated rounded bar from top-left to the middle.
  const a = 0.42, cx = 0.42, cy = 0.5;
  const lx = (x - cx) * Math.cos(a) + (y - cy) * Math.sin(a);
  const ly = -(x - cx) * Math.sin(a) + (y - cy) * Math.cos(a);
  if (Math.abs(lx) < 0.3 && Math.abs(ly) < 0.045) c = KRAFT;
  // Basket at the bottom right.
  const inBasket = x > 0.62 && x < 0.9 && y > 0.66 && y < 0.86;
  const inside = x > 0.66 && x < 0.86 && y > 0.6 && y < 0.82;
  if (inBasket && !inside) c = BASKET;
  // Motion dots behind the ball.
  if (Math.hypot(x - 0.14, y - 0.2) < 0.026 && c === PAPER) c = mix(PAPER, TOMATO, 0.45);
  if (Math.hypot(x - 0.08, y - 0.135) < 0.018 && c === PAPER) c = mix(PAPER, TOMATO, 0.3);
  // Ball on the ramp.
  const d = Math.hypot(x - 0.3, y - 0.32);
  if (d < 0.13) c = TOMATO;
  if (d > 0.06 && d < 0.085 && Math.atan2(y - 0.32, x - 0.3) > -0.6 && Math.atan2(y - 0.32, x - 0.3) < 1.3) c = CREAM;
  return c;
}

/**
 * A size×size PNG of `at(x, y)` (x, y in 0..1), which gives a colour or null (see-through).
 * With `alpha`, see-through stays see-through; otherwise the picture is solid.
 */
function png(size, at = colourAt, alpha = false, S = 4) {
  const ch = alpha ? 4 : 3;
  const raw = Buffer.alloc(size * (size * ch + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * ch + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const c = at((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size);
        if (!c) continue;
        r += c[0]; g += c[1]; b += c[2]; n++;
      }
      const o = py * (size * ch + 1) + 1 + px * ch;
      const k = Math.max(1, n);
      raw[o] = r / k; raw[o + 1] = g / k; raw[o + 2] = b / k;
      if (alpha) raw[o + 3] = Math.round((255 * n) / (S * S));
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2; // 8-bit RGBA or RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
for (const size of [180, 192, 512]) writeFileSync(`public/icons/icon-${size}.png`, png(size));
console.log('wrote public/icons/icon-{180,192,512}.png');

/** The picture shrunk to `k` of the square, centred; outside it, `outside` (null: see-through). */
const inset = (k, outside, keepPaper = true) => (x, y) => {
  const u = (x - (1 - k) / 2) / k, v = (y - (1 - k) / 2) / k;
  if (u < 0 || u > 1 || v < 0 || v > 1) return outside;
  const c = colourAt(u, v);
  return !keepPaper && c === PAPER ? outside : c;
};
mkdirSync('assets', { recursive: true });
// iOS and older Android: the whole square icon.
writeFileSync('assets/icon-only.png', png(1024));
// Android's shaped icons: the ramp, ball and basket on their own, inside the middle 2/3
// that every launcher shape keeps, over a plain paper background.
writeFileSync('assets/icon-foreground.png', png(1024, inset(0.62, null, false), true));
writeFileSync('assets/icon-background.png', png(1024, () => PAPER));
// Splash: the icon small in the middle of the game's background colour.
const splash = png(2732, (x, y) => {
  const k = 0.2, u = (x - 0.4) / k, v = (y - 0.4) / k;
  if (u < 0 || u > 1 || v < 0 || v > 1) return BG;
  // Round the icon's corners like the web icon.
  const r = 0.22, cu = Math.min(Math.max(u, r), 1 - r), cv = Math.min(Math.max(v, r), 1 - r);
  return Math.hypot(u - cu, v - cv) > r ? BG : colourAt(u, v);
}, false, 2);
writeFileSync('assets/splash.png', splash);
writeFileSync('assets/splash-dark.png', splash);
console.log('wrote assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png');
