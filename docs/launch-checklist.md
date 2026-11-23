# Bumpity: launch checklist (App Store and Google Play)

Written 22 November 2026. Who does what, in order. Tick items off here as they land.
Pricing, timing and marketing are in [marketing-plan.md](marketing-plan.md): pay once,
$4.99 at launch then $5.99, pre-orders in January 2027, launch around February 2027.

**You** = things only you can do: accounts, money, legal, signing keys, testing with real hands.
**Claude** = things I can do in the code and docs, now or as soon as you unblock them.

## Already done
- [x] The game: 100 levels in ten rooms, toy box, puzzle maker, sticker book, grown-ups' corner, PIN.
- [x] Phone layout, Android app wrapper, iOS project built on GitHub's Macs (simulator screenshots on every push).
- [x] Privacy page, logo, iPad and Google Play screenshots (60-level era; to be retaken).
- [x] Name chosen (Bumpity), first trademark searches clean.

## 1. Accounts and legal (you, start now: they take days to weeks)
- [ ] **Trademark lawyer:** clearance search for BUMPITY in class 9, then file (US, plus UK/EU if selling there). A few hundred dollars. Do this before announcing the name. See [release-prep.md](release-prep.md).
- [ ] **Domain:** register `bumpity.app` (about $15/year), and the social handles.
- [ ] **Support email:** a dedicated address (for example support@bumpity.app once the domain exists). The stores require one.
- [ ] **Apple Developer Program:** $99/year. Enrol as an individual (fastest) or as a company (needs a D-U-N-S number, which takes 1–2 weeks). Approval can take a day or two.
- [ ] **Google Play Console:** $25 once. New personal accounts must verify identity, and **must run a closed test with at least 12 testers for 14 days** before they can publish. Start this early.
- [ ] **Tax and banking:** fill in the tax forms and bank details in App Store Connect (Agreements, Tax and Banking: the "Paid Apps" agreement) and in the Play Console payments profile. A paid app can't go on sale without them.
- [ ] **Small Business Program:** apply in App Store Connect so Apple keeps 15%, not 30% (Google does this automatically).

## 2. Signing and test builds (you set up once, I wire the rest)
- [ ] **You, Apple:** create the app in App Store Connect (bundle ID `app.bumpity.game`), the API key and the four GitHub secrets. Steps in [app.md](app.md).
- [ ] **Claude:** run the "iOS app" workflow with "Send to TestFlight" ticked, and fix whatever the first real upload turns up.
- [ ] **You, Android:** make the upload key (one command, below) and add four GitHub secrets. Steps in [app.md](app.md), "Google Play release build".
- [x] **Claude:** release workflow that builds a signed `.aab` for Google Play from those secrets, with a version number that rises on every build.
- [ ] **You:** install the TestFlight build on the iPad and the Android test build on a phone or tablet. Play with your son, and tell me what feels off.

## 3. Things I can do now (no waiting)
- [x] Bring the marketing plan and the web taster plan into the repository, updated for 100 levels.
- [x] This checklist.
- [x] App icon for the stores: 1024×1024, no transparency.
- [x] Google Play feature graphic: 1024×500.
- [x] Store listing text for both stores: name, subtitle, short and long descriptions, keywords, age rating and privacy answers ([store-listing.md](store-listing.md)).
- [x] Android release build workflow (signed `.aab`), waiting only for your key.
- [ ] Retake all store screenshots with the ten rooms, and add the iPhone sizes Apple needs (6.9-inch, 2868×1320, landscape), since the app runs on iPhones.
- [ ] **Play timer** (the last safety item in Milestone 7): the room winds down to sleep after 15, 20 or 30 minutes, and only the PIN wakes it. It's a big part of the "calm by design" promise, so it should be in version 1.0.
- [ ] **Web taster build** (Workshop, toy box and puzzle maker only), ready but switched off until pre-orders open.
- [ ] A "The whole game" section and store badges in the grown-ups' corner, behind the PIN. Shown only once the store pages exist.

## 4. Once the domain exists (you register it, then I do the rest)
- [ ] **Claude:** move the website to the domain (GitHub Pages custom domain), with share links as `https://bumpity.app/play#p=…`.
- [ ] **Claude:** Universal Links (iOS) and App Links (Android), so shared puzzles open in the app when it's installed.
- [ ] **Claude:** a simple home page at the domain: the promise, a video, the safety page, the privacy page and the store badges.
- [ ] **You:** add the domain's DNS records (I'll give you the exact lines).

## 5. Store pages (you click, I give you the words)
- [ ] **You, App Store Connect:**
  - Price tier.
  - Kids category, age band "6–8".
  - Privacy label "Data Not Collected", privacy URL, support URL.
  - Paste the listing text, upload the screenshots and the preview video.
  - Answer the age rating questions (answers in [store-listing.md](store-listing.md)).
  - Export compliance: none (already set in the app).
  - Turn on the education volume discount.
- [ ] **You, Play Console:**
  - Paid app at the price.
  - Target audience 5–8 and the Families policy.
  - Data safety "No data collected".
  - Content rating questionnaire (IARC).
  - Listing text, the 1024×500 graphic, and the screenshots.
- [ ] **You:** the 15–30 second preview video, from clips of real play. I can script it, and record the screen in the browser if you'd like.
- [ ] **You:** Apple's "Get featured" nomination 6–8 weeks before launch, and pre-orders (Apple) or pre-registration (Google).

## 6. Before pressing "Submit" (both of us)
- [ ] Playtest on a real iPad and an Android device: all ten rooms, the toy box, the puzzle maker, the sticker book, sharing a puzzle, the PIN, the lock-to-app guide.
- [ ] **Claude:** version 1.0.0 everywhere, a final check that nothing in the app talks to the internet except shared links and the grown-ups' links, and every test passing.
- [ ] **Claude:** switch the website to the taster on the day pre-orders open (see "The web taster" in [roadmap.md](roadmap.md)).
- [ ] **You:** submit for review. Apple usually takes 1–3 days; Kids apps get a closer look. Google's first review of a new account can take up to a week.

## Costs, all in
- Apple $99 a year, Google $25 once, domain about $15 a year.
- Lawyer and trademark filing: a few hundred dollars, once.
- GitHub stays free while the repository is public (see the open question in the web taster plan).
