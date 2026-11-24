# Store listing text

Ready to paste into App Store Connect and the Play Console. Character limits are noted; every
line here fits. Words are for parents (the buyers), never aimed at children. Never name another
game in any of these fields.

Graphics live in [store](../store): `icon-1024.png` (App Store), `play-icon-512.png` and
`feature-1024x500.png` (Google Play), and the screenshots. Remake them with
`node scripts/store-graphics.mjs` and `node scripts/store-shots.mjs`.

## Both stores
- **Name** (Apple 30, Google 30): `Bumpity`
- **Price:** $4.99 at launch, $5.99 after launch week (see [marketing-plan.md](marketing-plan.md)). Paid up front: no in-app purchases, no ads, no subscription.
- **Privacy policy URL:** `https://bumpity.app/privacy.html`
- **Support URL:** `https://bumpity.app/` (Apple), **email:** `support@bumpity.app` (Google; set up with Cloudflare Email Routing, see [app.md](app.md), "The domain").
- **Marketing URL** (Apple, optional) and **website** (Google): `https://bumpity.app/`
- **Category:** Apple: Games › Puzzle, plus the Kids category, age band 6–8. Google: Game › Puzzle, plus the Families programme, target age 5–8.

## App Store (Apple)
**Copyright** (required): `2026 ` followed by your full legal name, or your company's name if you sell as a company. For example `2026 Jane Example`. No © sign needed.

**Screenshots:** iPad 13-inch from `store/screenshots/ipad-2732x2048`; iPhone 6.9-inch from `iphone-2868x1320`; iPhone 6.3-inch ("medium display with Dynamic Island") from `iphone-2622x1206`.

**Subtitle** (30): `Calm chain-reaction puzzles`

**Promotional text** (170, can change any time without a new review):
> Pay once. No ads, no purchases, no data collected. 100 puzzles in ten rooms, a toy box to build anything, and a puzzle maker to share with grandparents.

**Keywords** (100, commas, no spaces):
`physics,kids puzzle,machine,chain reaction,cause and effect,logic,building,toddler,preschool,STEM`

**Description** (4000):
> Pay once. No ads, no purchases, no data collected. Ever.
>
> Bumpity is a calm puzzle game for 5 to 8 year olds. Each puzzle is a little machine with a piece missing: a ball has to reach a basket, a sleeping hamster has to find his cheese, a rocket has to reach the stars. Your child adds ramps, springs, fans, magnets, dominoes and more, presses Go, and watches what happens.
>
> Nothing to read, nothing to lose
> • A friendly voice explains each puzzle, and pictures do the rest.
> • There is no score, no timer and no "game over". A run that misses simply resets, ready to try again.
> • Stuck? A hint shows a faint ghost of one missing part.
>
> 100 puzzles in ten rooms
> Workshop, Playroom, Bathroom, Attic, Space, Kitchen, Bedroom, Garden, Garage and the Music room, each with its own toy to discover: a hammer, a toy car, slippery soap, scissors, a rocket with a parachute, a toaster, a soft pillow, a watering can, a magnet, and bells and drums that play a tune.
>
> Thinking, not tapping
> • Guess the path: draw where you think the ball will go, then watch.
> • A film strip of every winning machine to look back at together.
> • A sticker book that fills up as rooms are finished.
>
> Make and share
> • The toy box: build anything with every part, no goal at all.
> • The puzzle maker: build a machine, turn it into a puzzle, and send it to grandparents. It opens in any web browser.
>
> Made for grown-ups too
> • A grown-ups' PIN keeps the settings and every link out of the game away from small fingers.
> • Step-by-step help to lock the iPad to the game with Guided Access.
> • Talk cards for every puzzle: what it teaches, questions to ask, and something to try at home.
> • Works offline. Everything stays on the device.
>
> Bumpity was made by a parent, for their own child, who playtested every room.

**What's New** (version 1.0): `The first version: 100 puzzles in ten rooms.`

**Age rating questions:** answer "None" to every content question (no violence, no mature themes, no gambling, no contests, no unrestricted web access, no user-generated content shared inside the app). Result: 4+. Made for Kids: yes, age band 6–8.

**App Privacy:** Data Not Collected.

**Export compliance:** no encryption beyond the system's (already set in the app: `ITSAppUsesNonExemptEncryption = false`).

**Review notes** (for Apple's reviewer):
> The grown-ups' corner opens with a press-and-hold on the top-right button (or a 4-digit PIN, if one is set on first launch). All links out of the app (privacy page, store links) are behind it. The game needs no account and makes no network requests except when a grown-up shares a puzzle link.

## Google Play
**Short description** (80):
`Calm chain-reaction puzzles for kids 5–8. Pay once: no ads, no purchases.`

**Full description** (4000): the same as the App Store description above.

**Tags:** Puzzle, Educational, Kids.

**Content rating (IARC questionnaire):** category "Game"; answer No to violence, fear, sexuality, gambling, language, controlled substances, user interaction, sharing of location, and purchases. Expected result: Everyone / PEGI 3.

**Target audience and content:** ages 5–8 only. "Appeals to children": yes. No ads.

**Data safety:** No data collected, no data shared. Data is not encrypted in transit because none is sent; the shared-puzzle link is made by the user and contains only the puzzle.

**Families policy:** no ads SDK, no analytics, no third-party login. The app uses Android's own text-to-speech.

## Screenshot captions
Short captions for the screenshots (parents read these):
1. Add a part. Press Go. Watch what happens.
2. 100 puzzles in ten rooms.
3. No score, no timer, no game over.
4. Guess the path, then see if you were right.
5. Stickers for every room.
6. A toy box to build anything.
7. Safe to hand over: PIN, offline, no ads.
