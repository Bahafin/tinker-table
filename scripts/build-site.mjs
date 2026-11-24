// Puts the website together in _site/ for GitHub Pages:
//   /                 the home page (site/), for grown-ups
//   /play/            the game (dist/, from `npm run build`)
//   /privacy.html     the privacy policy
//   /.well-known/     the files that let shared links open in the app (only when the IDs are known)
// Run: npm run build:site. The deploy workflow passes APPLE_TEAM_ID (a secret) and
// ANDROID_CERT_SHA256 (a repository variable) for the .well-known files.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { androidAssetLinks, appleAssociation } from './site-links.mjs';

const OUT = '_site';
if (!existsSync('dist/index.html')) throw new Error('Build the game first (npm run build).');
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
console.log(`wrote ${OUT}/ (iOS links: ${apple ? 'yes' : 'no Team ID yet'}, Android links: ${android ? 'yes' : 'no fingerprint yet'})`);
