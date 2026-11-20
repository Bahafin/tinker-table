# Getting ready for the app stores

The four jobs the roadmap lists before release, and where each one stands.

## 1. Privacy policy page: done
- [public/privacy.html](../public/privacy.html), live at `https://bahafin.github.io/tinker-table/privacy.html` once merged to `main`. Use that address as the privacy policy URL in App Store Connect and the Play Console.
- It says what the game really does: it collects nothing, keeps progress, stickers, kept machines and made puzzles only on the device, uses the device's own voice, and puts only the puzzle into a shared link.
- The grown-ups' corner links to it (behind the grown-ups' PIN, or the press-and-hold until a PIN is set; Apple's Kids category asks for a parental gate on any link out of the game).
- **Still to decide:** the contact line points to GitHub issues. Parents may not have a GitHub account, and the stores ask for a support email anyway, so a dedicated address (not a personal one) would be better there.
- **Store forms that follow from it:** Apple's privacy label is "Data Not Collected". Google's Data safety form is "No data collected, no data shared". For Google's Families policy, the target age group is 5–8.
- If the Capacitor app ever adds anything (analytics, crash reports, purchases), the page and both forms have to change first.

## 2. Trademark check on "Tinker Table": first look done, not cleared
A web search on 20 November 2026 found:
- **No live trademark for "Tinker Table"** turned up. The closest was TINKER TABLES (furniture, class 20), cancelled in 2018.
- **Same name, other things:** a classroom table sold by Furnware, a crafting item in some games (Tinkers' Construct, Miner's Haven, Tinkerlands), and tinkertable.io, a card-game playtesting tool.
- **"Tinker" marks near our field:** KiwiCo's TINKER CRATE (kids' science kits), THINKER-TINKER (plush toys and children's educational software), TINKER GAMES (card games), and a TINKER application covering online games and game apps (serial 98471370; its owner and status couldn't be read, so check this one first). Disney guards TINKER BELL hard, but "Tinker Table" isn't close to it.

This is a search, not legal clearance. Before paying for the store accounts:
1. Search the [USPTO trademark search](https://tmsearch.uspto.gov/) for "tinker table" and "tinker" in classes 9 (apps) and 28 (games and toys), and open serial 98471370.
2. Do the same in the [UK IPO](https://trademarks.ipo.gov.uk/ipo-tmtext) and [EUIPO](https://euipo.europa.eu/eSearch/) searches if the game will be sold there.
3. Search both stores for "Tinker Table" and "Tinker" kids' games.
4. If nothing close turns up, consider filing for the name in class 9 (and 28 if there might be toys later). A trademark lawyer's clearance search costs a few hundred dollars and is worth it before the name goes on a store page.

## 3. Logo letters as outlines: done
- [public/logo.svg](../public/logo.svg) now draws its letters as shapes, so it looks the same on every device and needs no font. Before, each device fell back to whatever rounded font it had.
- The letters use **Nunito ExtraBold**, which is under the SIL Open Font License, so outlines of it can ship in a paid app.
- The editable version, with the letters as text, is [scripts/logo-source.svg](../scripts/logo-source.svg). After changing it, run:

```bash
node scripts/make-logo.mjs
```

## 4. Screenshots: done for iPad and Google Play
- Seven pictures in each size, in [store/screenshots](../store/screenshots): the rooms, a machine running, building, a win with the film strip, the sticker book, the toy box, and the grown-ups' corner.
  - `ipad-2732x2048`: the App Store's 13-inch iPad size, landscape.
  - `play-2560x1440`: 16:9 landscape, which Google Play takes for phones and for 7- and 10-inch tablets.
- The level and room pictures are now drawn at the screen's pixel density, so they're sharp on the iPad itself as well as in the screenshots.
- To take them again (for example after the art pass), build the game and serve it with `npm run preview`, then run the script below. It uses the installed Edge or Chrome:

```bash
node scripts/store-shots.mjs
```

- **Not made:** iPhone screenshots. The game is designed for the iPad. If the store app also runs on iPhones, Apple needs a 6.9-inch iPhone set as well (2868×1320 landscape), and the game should get a playtest on a phone screen first.
- The stores also want an app icon at 1024×1024 with no transparency, and Google wants a 1024×500 feature graphic. Neither exists yet.
