// Which game this build is. `npm run build` makes the whole game (the store apps, and the
// website until pre-orders open); `npm run build:taster` makes the free web taster: the
// Workshop, the toy box and the puzzle maker. See docs/roadmap.md, "The web taster".
// Vite replaces import.meta.env.MODE when it builds, so the taster's bundle leaves the other
// rooms' levels out altogether (levels/index.ts), rather than only hiding them.
export const TASTER = import.meta.env.MODE === 'taster';

/**
 * The store pages, for "The whole game" in the grown-ups' corner (web only). Fill these in once
 * the store pages exist; the section stays hidden while both are empty.
 */
export const STORE = {
  apple: '', // e.g. https://apps.apple.com/app/id0000000000
  google: '', // e.g. https://play.google.com/store/apps/details?id=app.bumpity
};
