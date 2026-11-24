# Getting ready for the app stores

The four jobs the roadmap lists before release, and where each one stands.

## 1. Privacy policy page: done
- [public/privacy.html](../public/privacy.html), live at `https://bumpity.app/privacy.html` (and at `https://bahafin.github.io/tinker-table/privacy.html` until the domain is switched on). Use that address as the privacy policy URL in App Store Connect and the Play Console.
- It says what the game really does: it collects nothing, keeps progress, stickers, kept machines and made puzzles only on the device, uses the device's own voice, and puts only the puzzle into a shared link.
- The grown-ups' corner links to it (behind the grown-ups' PIN, or the press-and-hold until a PIN is set; Apple's Kids category asks for a parental gate on any link out of the game).
- **Still to decide:** the contact line points to GitHub issues. Parents may not have a GitHub account, and the stores ask for a support email anyway, so a dedicated address (not a personal one) would be better there.
- **Store forms that follow from it:** Apple's privacy label is "Data Not Collected". Google's Data safety form is "No data collected, no data shared". For Google's Families policy, the target age group is 5–8.
- If the Capacitor app ever adds anything (analytics, crash reports, purchases), the page and both forms have to change first.

## 2. The name: renamed to Bumpity, first checks clean
The game was called **Tinker Table** until 20 November 2026. It was dropped because "Tinker" is crowded in exactly our field: the Boston Children's Museum holds a live TINKER registration for children's educational kits (US serial 98471370, class 28), and KiwiCo holds TINKER CRATE (kids' craft and activity kits).

Names that were looked at and dropped:
- **Fiddlebox:** no trademark anywhere, but a puzzle game called "Fiddlebox: Block Games" came out on Google Play on 21 October 2026.
- **Whatchamachine:** hard to say. **Clink & Clunk:** close to the kids' app Clink & Think. **Paper Rumpus:** Rumpus has toy trademarks. **Tip & Tumble:** an existing tilt-maze app. **Roll & Rattle:** close to Oball's Rattle and Roll baby toy.

What the checks on **Bumpity** found (20 November 2026):
- **App Store and Google Play:** no app called Bumpity. The nearest are "Bump" social apps and Bumpi, a baby heartbeat app.
- **Registers** (USPTO directly, and TMview, which covers the EUIPO, the UK IPO and about 70 other offices): no mark that is just BUMPITY. Two nearby ones for a lawyer to weigh:
  - JUMPITY BUMPITY: registered in the US in 2025 for entertainment services (class 41, serial 99386628). It seems to be a children's play place.
  - BUMPIT: registered in the US in 2025 for toys (class 28, serial 98938571). It matters only if Bumpity toys are ever planned.
  - Mattel's BUMPITY THUMPITY (toys) has ended.
- **Web addresses:** bumpity.app, playbumpity.com and bumpitygame.com were free; bumpity.com is taken.

This is a search, not legal clearance. Before paying for the store accounts:
1. Have a trademark lawyer run a clearance search for BUMPITY in class 9 (apps), and in 41 and 28 if those matter. It costs a few hundred dollars.
2. File for the name in class 9 (the US, and the UK/EU if the game is sold there). Filing for class 9 only keeps clear of the BUMPIT toy mark.
3. Register bumpity.app (or playbumpity.com) and the social handles before the name is announced.
4. bumpity.app is registered (23 November 2026, at Cloudflare); see [app.md](app.md), "The domain". The saved-progress keys in the browser still start with `tinker.`. The keys stay as they are, so nobody loses their progress. Renaming the GitHub repo would change the address; GitHub redirects the old repo URL but not the Pages address, so it is best done before the address is shared widely.

## 3. Logo letters as outlines: done
- [public/logo.svg](../public/logo.svg) now draws its letters as shapes, so it looks the same on every device and needs no font. Before, each device fell back to whatever rounded font it had.
- The letters use **Nunito ExtraBold**, which is under the SIL Open Font License, so outlines of it can ship in a paid app.
- The editable version, with the letters as text, is [scripts/logo-source.svg](../scripts/logo-source.svg). After changing it, run:

```bash
node scripts/make-logo.mjs
```

## 4. Screenshots: done for iPad, iPhone and Google Play
- Seven pictures in each size, in [store/screenshots](../store/screenshots): the rooms, a machine running, building, a win with the film strip, the sticker book, the toy box, and the grown-ups' corner.
  - `ipad-2732x2048`: the App Store's 13-inch iPad size, landscape.
  - `iphone-2868x1320`: the App Store's 6.9-inch iPhone size, landscape (the phone layout).
  - `play-2560x1440`: 16:9 landscape, which Google Play takes for phones and for 7- and 10-inch tablets.
- The level and room pictures are now drawn at the screen's pixel density, so they're sharp on the iPad itself as well as in the screenshots.
- To take them again (for example after the art pass), build the game and serve it with `npm run preview`, then run the script below. It uses the installed Edge or Chrome:

```bash
node scripts/store-shots.mjs
```

- The store icons (1024×1024 for Apple, 512×512 for Google) and Google's 1024×500 feature graphic are in [store](../store), made by `node scripts/store-graphics.mjs`.
