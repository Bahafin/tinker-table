// Puts the website together in _site/ for GitHub Pages:
//   /                 the home page (site/), for grown-ups
//   /play/            the game (dist/, from `npm run build`)
//   /privacy.html     the privacy policy
//   /.well-known/     the files that let shared links open in the app (only when the IDs are known)
// Run: npm run build:site. The deploy workflow passes APPLE_TEAM_ID (a secret) and
// ANDROID_CERT_SHA256 (a repository variable) for the .well-known files.
// WEB_EDITION=taster (a repository variable, set on the day pre-orders open) puts the free
// taster at /play/ instead of the whole game; see docs/roadmap.md, "The web taster".
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { androidAssetLinks, appleAssociation } from './site-links.mjs';

const OUT = '_site';
const TASTER = process.env.WEB_EDITION === 'taster';
if (process.env.WEB_EDITION && !TASTER) throw new Error(`WEB_EDITION is "${process.env.WEB_EDITION}"; leave it empty or set it to taster.`);
execSync(`npx vite build${TASTER ? ' --mode taster' : ''}`, { stdio: 'inherit' });
if (TASTER) checkTaster();
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
cpSync('site', OUT, { recursive: true });
for (const f of ['logo.svg', 'favicon.svg', 'privacy.html', 'icons']) cpSync(`public/${f}`, `${OUT}/${f}`, { recursive: true });
cpSync('dist', `${OUT}/play`, { recursive: true });
writeFileSync(`${OUT}/.nojekyll`, '');

const wk = `${OUT}/.well-known`;
mkdirSync(wk);
const apple = appleAssociation(process.env.APPLE_TEAM_ID);
const android = androidAssetLinks(process.env.ANDROID_CERT_SHA256);
if (apple) writeFileSync(`${wk}/apple-app-site-association`, JSON.stringify(apple, null, 2));
if (android) writeFileSync(`${wk}/assetlinks.json`, JSON.stringify(android, null, 2));
console.log(`wrote ${OUT}/ (${TASTER ? 'the web taster' : 'the whole game'} at /play/; iOS links: ${apple ? 'yes' : 'no Team ID yet'}, Android links: ${android ? 'yes' : 'no fingerprint yet'})`);

/** The taster must not carry any level outside the Workshop (they'd be free to play). */
function checkTaster() {
  const src = readFileSync('src/levels/index.ts', 'utf8');
  const workshop = src.match(/const WORKSHOP = \[([^\]]*)\]/)[1].split(',').map((v) => v.trim());
  const files = Object.fromEntries([...src.matchAll(/import (l\d+) from '\.\/(.+)\.json'/g)].map((m) => [m[1], m[2]]));
  const js = readdirSync('dist/assets').filter((f) => f.endsWith('.js')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
  const has = (file) => new RegExp(`id:["'\`]${JSON.parse(readFileSync(`src/levels/${file}.json`, 'utf8')).id}["'\`]`).test(js);
  const leaked = Object.entries(files).filter(([v, f]) => !workshop.includes(v) && has(f)).map(([, f]) => f);
  const missing = workshop.filter((v) => !has(files[v]));
  if (leaked.length || missing.length) throw new Error(`Taster bundle is wrong. Other rooms' levels in it: ${leaked.join(', ') || 'none'}. Workshop levels missing: ${missing.join(', ') || 'none'}.`);
  console.log(`taster: the ${workshop.length} Workshop levels, and no others`);
}
