// Draws the app icon (paper table, ramp, ball) and writes PNGs to public/icons.
// No dependencies: shapes are rasterised with 4x4 supersampling and encoded with zlib.
// Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
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
  // Ball on the ramp.
  const d = Math.hypot(x - 0.3, y - 0.32);
  if (d < 0.13) c = TOMATO;
  if (d > 0.06 && d < 0.085 && Math.atan2(y - 0.32, x - 0.3) > -0.6 && Math.atan2(y - 0.32, x - 0.3) < 1.3) c = CREAM;
  return c;
}

function png(size) {
  const S = 4;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const c = colourAt((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = py * (size * 3 + 1) + 1 + px * 3;
      raw[o] = r / (S * S); raw[o + 1] = g / (S * S); raw[o + 2] = b / (S * S);
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
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
for (const size of [180, 192, 512]) writeFileSync(`public/icons/icon-${size}.png`, png(size));
console.log('wrote public/icons/icon-{180,192,512}.png');
