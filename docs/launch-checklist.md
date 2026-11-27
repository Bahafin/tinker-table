# Bumpity: launch checklist (App Store and Google Play)

Written 22 November 2026. Who does what, in order. Tick items off here as they land.
Pricing, timing and marketing are in [marketing-plan.md](marketing-plan.md): pay once,
US$2.99 / CA$3.99 in launch week, then US$3.99 / CA$4.99 (Canada set by hand), pre-orders in January 2027, launch around February 2027.

**You** = things only you can do: accounts, money, legal, signing keys, testing with real hands.
**Claude** = things I can do in the code and docs, now or as soon as you unblock them.

## Already done
- [x] The game: 100 levels in ten rooms, toy box, puzzle maker, sticker book, grown-ups' corner, PIN.
- [x] Phone layout, Android app wrapper, iOS project built on GitHub's Macs (simulator screenshots on every push).
- [x] Privacy page, logo, iPad and Google Play screenshots (60-level era; to be retaken).
- [x] Name chosen (Bumpity), first trademark searches clean.

## 1. Accounts and legal (you, start now: they take days to weeks)
- [ ] **Trademark lawyer:** clearance search for BUMPITY in class 9, then file (US, plus UK/EU if selling there). A few hundred dollars. Put off until the app picks up (your call, 25 November 2026); the risk is having to rename later. See [release-prep.md](release-prep.md).
- [x] **Domain:** `bumpity.app` registered at Cloudflare (23 November 2026).
- [ ] **Social handles** for Bumpity.
- [x] **Support email:** `support@bumpity.app`, forwarded to your inbox with Cloudflare Email Routing (free, 5 minutes; steps in [app.md](app.md), "The domain"). The stores require one, and the home page and privacy page already show it.
- [x] **Apple Developer Program:** $99/year. Enrol as an individual (fastest) or as a company (needs a D-U-N-S number, which takes 1–2 weeks). Approval can take a day or two.
- [ ] **Google Play Console:** $25 once. New personal accounts must verify identity, and **must run a closed test with at least 12 testers for 14 days** before they can publish. Start this early.
- [ ] **Tax and banking:** Apple's Paid Apps agreement signed (25 November 2026); the Canadian GST/HST (RT) number is still to sort out with the CRA. Fill in the tax forms and bank details in App Store Connect (Agreements, Tax and Banking: the "Paid Apps" agreement) and in the Play Console payments profile. A paid app can't go on sale without them.
- [x] **Small Business Program:** applied (25 November 2026). Apply in App Store Connect so Apple keeps 15%, not 30% (Google does this automatically).

## 2. Signing and test builds (you set up once, I wire the rest)
- [x] **You, Apple:** create the app in App Store Connect (bundle ID `app.bumpity.game`), the API key and the four GitHub secrets. Steps in [app.md](app.md).
- [x] **Claude:** run the "iOS app" workflow with "Send to TestFlight" ticked, and fix whatever the first real upload turns up. (First build uploaded 24 November 2026; signing now goes through the API, no device needed.)
- [ ] **You, Android:** make the upload key (one command, below) and add four GitHub secrets. Steps in [app.md](app.md), "Google Play release build".
- [x] **Claude:** release workflow that builds a signed `.aab` for Google Play from those secrets, with a version number that rises on every build.
- [x] **You:** TestFlight groups made (internal, and "family-friends" with a public link). Build 10 sent to Beta App Review on 24 November 2026; once approved, the public link works and later 1.0 builds reach testers without a full review.
- [ ] **You:** install the TestFlight build on the iPad and the Android test build on a phone or tablet. Play with your son, and tell me what feels off.

## 3. Things I can do now (no waiting)
- [x] Bring the marketing plan and the web taster plan into the repository, updated for 100 levels.
- [x] This checklist.
- [x] App icon for the stores: 1024×1024, no transparency.
- [x] Google Play feature graphic: 1024×500.
- [x] Store listing text for both stores: name, subtitle, short and long descriptions, keywords, age rating and privacy answers ([store-listing.md](store-listing.md)).
- [x] Android release build workflow (signed `.aab`), waiting only for your key.
- [x] Retake all store screenshots with the ten rooms, and add the iPhone size Apple needs (6.9-inch, 2868×1320, landscape), since the app runs on iPhones.
- [x] **Play timer** (the last safety item in Milestone 7): the room winds down to sleep after 15, 20 or 30 minutes, and only the PIN wakes it. It's a big part of the "calm by design" promise, so it should be in version 1.0.
- [x] **Parental gate:** the press-and-hold (which a child can learn) is replaced by a sum in words, or the PIN when one is set (build 12, 24 November 2026).
- [x] **Recorded voice:** every line is a clip from an open-source neural voice, the same on every device (build 12). "Shh" re-recorded as a hush.
- [x] **Web taster build** (Workshop, toy box and puzzle maker only), ready but switched off until pre-orders open: `npm run build:taster`; the site switches when the `WEB_EDITION` variable is `taster` (25 November 2026).
- [x] A "The whole game" section in the grown-ups' corner, behind the gate, on the web only: what the app adds, "pay once", and store buttons. In the whole game it shows only once a store link is filled in (`src/edition.ts`, `STORE`); in the taster it always shows (25 November 2026).
- [ ] **Claude, once the store pages exist:** put their links in `STORE`, and swap the text buttons for Apple's and Google's official badges (their artwork rules ask for the official badge).

## 4. Once the domain exists (you register it, then I do the rest)
- [x] **Claude:** the site rebuilt for the domain: home page at `/`, the game at `/play/`, share links as `https://bumpity.app/play/#p=…`, old `#p=` links passed on.
- [x] **Claude:** switch GitHub Pages to bumpity.app and turn on HTTPS (live 24 November 2026; old addresses redirect).
- [x] **Claude:** Universal Links (iOS) and App Links (Android), so shared puzzles open in the app when it's installed. The files go live by themselves once the `APPLE_TEAM_ID` secret and the `ANDROID_CERT_SHA256` variable exist.
- [ ] **You:** after the Play Console app exists, copy its signing fingerprint into `ANDROID_CERT_SHA256` (steps in [app.md](app.md)).
- [x] **Claude:** a simple home page at the domain: the promise, screenshots, safety, privacy and support. Later: the preview video and the store badges.
- [x] **You:** verify the domain with GitHub and add the DNS records in Cloudflare (exact lines in [app.md](app.md), "The domain").

## 5. Store pages (you click, I give you the words)
- [ ] **You, App Store Connect:**
  - Price: base country US at US$2.99 for launch week, then US$3.99; change Canada by hand to CA$3.99, then CA$4.99.
  - Kids category, age band "6–8".
  - Privacy label "Data Not Collected", privacy URL, support URL.
  - Copyright: "2026 " plus your full legal name (or company name).
  - Paste the listing text, upload the screenshots (including the 6.3-inch iPhone set) and the preview video. The iPhone screenshots were retaken on 26 November 2026 for the new phone layout: upload those, not earlier ones. The iPad set changed only in 6-toybox.
  - Answer the age rating questions (answers in [store-listing.md](store-listing.md)).
  - Export compliance: none (already set in the app).
  - Turn on the education volume discount.
- [ ] **You, Play Console:**
  - Paid app at the same prices; edit Canada's price by hand.
  - Target audience 5–8 and the Families policy.
  - Data safety "No data collected".
  - Content rating questionnaire (IARC).
  - Listing text, the 1024×500 graphic, and the screenshots.
- [ ] **You:** the 15–30 second preview video, from clips of real play. I can script it, and record the screen in the browser if you'd like.
- [ ] **You:** Apple's "Get featured" nomination 6–8 weeks before launch, and pre-orders (Apple) or pre-registration (Google).

## 6. Before pressing "Submit" (both of us)
- [ ] Playtest on a real iPad and an Android device: all ten rooms, the toy box, the puzzle maker, the sticker book, sharing a puzzle, the PIN, the lock-to-app guide.
- [x] **Claude:** version 1.0 everywhere (matches App Store Connect), a final check that nothing in the app talks to the internet except shared links and the grown-ups' links (the only fetch is the bundled voice clips), and every test passing (25 November 2026).
- [ ] **Switch the website to the taster** on the day pre-orders open (see "The web taster" in [roadmap.md](roadmap.md)): GitHub › the repository › Settings › Secrets and variables › Actions › Variables › `WEB_EDITION` = `taster`, then re-run "Deploy to GitHub Pages". Either of us can do it; deleting the variable switches back.
- [ ] **You:** submit for review. Apple usually takes 1–3 days; Kids apps get a closer look. Google's first review of a new account can take up to a week.

## Costs, all in
- Apple $99 a year, Google $25 once, domain about $15 a year.
- Lawyer and trademark filing: a few hundred dollars, once.
- GitHub stays free while the repository is public (see the open question in the web taster plan).
