// Turns the logo's letters into outlines, so it looks the same on every device and needs no font.
// Reads scripts/logo-source.svg (letters as <text>, easy to edit) and writes public/logo.svg
// (letters as <path>), drawn with Nunito ExtraBold (SIL Open Font License, so outlines may ship).
// Run: node scripts/make-logo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const fontFile = require.resolve('@fontsource/nunito/files/nunito-latin-800-normal.woff');
const buf = readFileSync(fontFile);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const src = readFileSync('scripts/logo-source.svg', 'utf8');
const num = (s, name) => {
  const m = new RegExp(`\\s${name}="([-\\d.]+)"`).exec(s);
  return m ? Number(m[1]) : undefined;
};
const r = (v) => Math.round(v * 100) / 100;

let fontSize = 42; // the TINKER letters take their size from their group
const out = src
  .replace(/^<!--[\s\S]*?-->\s*/, '')
  // The font stack is no longer needed once the letters are shapes.
  .replace(/\s+font-family="[^"]*"/g, '')
  .replace(/\s+font-weight="[^"]*"/g, '')
  .replace(/\s+text-anchor="[^"]*"/g, '')
  .replace(/<g([^>]*)>|<text([^>]*)>([^<]*)<\/text>/g, (whole, gAttrs, tAttrs, str) => {
    if (gAttrs !== undefined) {
      const fs = num(gAttrs, 'font-size');
      if (fs) fontSize = fs;
      return whole.replace(/\s+font-size="[^"]*"/, '');
    }
    const size = num(tAttrs, 'font-size') ?? fontSize;
    const spacing = num(tAttrs, 'letter-spacing') ?? 0;
    const x = num(tAttrs, 'x'), y = num(tAttrs, 'y');
    const fill = /\sfill="([^"]*)"/.exec(tAttrs)?.[1];
    // Lay the glyphs out left to right, then centre them on x (text-anchor="middle").
    const scale = size / font.unitsPerEm;
    const glyphs = font.stringToGlyphs(str);
    let width = 0;
    glyphs.forEach((g, i) => { width += g.advanceWidth * scale + (i < glyphs.length - 1 ? spacing : 0); });
    let pen = x - width / 2;
    const d = glyphs.map((g) => {
      const p = g.getPath(pen, y, size).toPathData(2);
      pen += g.advanceWidth * scale + spacing;
      return p;
    }).join('');
    return `<path aria-hidden="true"${fill ? ` fill="${fill}"` : ''} d="${d}"/>`;
  });

if (/<text/.test(out)) throw new Error('some text was not converted');
writeFileSync('public/logo.svg', `<!-- Made by scripts/make-logo.mjs from scripts/logo-source.svg. Edit that file, not this one. -->\n${out}`);
console.log(`wrote public/logo.svg (${r(out.length / 1024)} KB)`);
