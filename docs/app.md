# The Bumpity apps (iPad/iPhone and Android)

The store apps wrap the same game as the website, using [Capacitor](https://capacitorjs.com/) 8. The web version stays the main home; the plan is in [roadmap.md](roadmap.md) ("Phones and tablets, as apps").

## What is different inside the app
All of it is in `src/boot.ts`, `src/app-shell.ts`, `src/platform.ts` and `src/app-lock.ts`. On the web none of it runs.

- **Saved things are mirrored into the app's own storage.** iOS can clear a web view's storage when the device is short of space. Every `tinker.` key is copied to Capacitor Preferences as it is written, and put back on start if it went missing.
- **The voice:** Android's in-app browser has no voices, so on Android the game uses the tablet's text-to-speech engine (`@capacitor-community/text-to-speech`). iOS keeps the browser voice, which picks the nicest English voice.
- **Sharing** opens the phone's share sheet. Share links always point at the public website (`WEB_HOME` in `src/platform.ts`), so anyone can play a shared puzzle in a browser.
- **No offline cache:** the app carries its files, so the service worker is off.
- **Full screen,** and phones are locked sideways. Tablets turn freely.
- **Android's back button** does what the screen's own back, close or home button would. On the front page it puts the app in the background.
- **Android "Lock Bumpity on the screen now"** in the grown-ups' corner (Safety) starts Android's screen pinning (`ScreenLockPlugin.java`). Android asks the grown-up to confirm.
- **Shared links open in the app** when it's installed (Universal Links and App Links, for `https://bumpity.app/play…`). See "The domain" below.
- **App ID:** `app.bumpity.game`. It can't change after the first upload to a store.

## Getting the Android test app
There is no Android SDK needed on your computer: GitHub builds it.

1. Every push to `main` that changes the game runs the **Android app** workflow (or run it by hand from the repository's **Actions** tab).
2. Open the finished run and download **bumpity-android** under *Artifacts*. It's a zip with `app-debug.apk` inside.
3. On the Android tablet or phone, open the APK. Android asks to allow installing apps from that source (the Files app or the browser) the first time.

This is a test build, signed with a throwaway debug key. Store builds (signed with your own key, uploaded as an `.aab`) come with the store step.

## Building it on your own computer (optional)
Install [Android Studio](https://developer.android.com/studio) (it brings Java and the Android SDK), then:

```bash
npm run build
npx cap sync android
npx cap open android
```

and press Run in Android Studio with a tablet plugged in, or with an emulator.

## The icon and splash screen
`node scripts/make-icons.mjs` draws the web icons and the source images in `assets/`. Then `npx capacitor-assets generate --android --ios --iconBackgroundColor '#f4ecdc' --splashBackgroundColor '#e9dcc3'` makes every size both apps need.

## iPad and iPhone, without a Mac
The iOS project is in `ios/` (Capacitor 8 with Swift packages, so no CocoaPods). iPhones play sideways only; iPads turn freely.

GitHub's Mac machines do the building (free, because the repository is public). The **iOS app** workflow:
- **On every push** that changes the game, builds the app for the simulator, runs it on an iPad and an iPhone simulator, and keeps screenshots as **bumpity-ios-screens** on the run's page. That shows it starts and looks right, without a Mac.
- **Run by hand** (Actions › iOS app › Run workflow, with **Send to TestFlight** ticked), signs it and uploads it to App Store Connect. From there TestFlight puts it on your iPad.

### One-time setup for TestFlight
Only you can do these, in your own Apple account:

1. **Join the Apple Developer Program** at [developer.apple.com/programs](https://developer.apple.com/programs/) ($99 a year). It can take a day or two to be approved.
2. **Create the app** in [App Store Connect](https://appstoreconnect.apple.com/) › Apps › **+** › New App:
   - Platforms: iOS. Name: Bumpity. Primary language: English.
   - Bundle ID: register **app.bumpity.game** first, under Certificates, Identifiers & Profiles › Identifiers (an "App IDs" entry; tick the **Associated Domains** capability, so shared links can open in the app), then pick it here.
   - SKU: anything, for example `bumpity`.
3. **Make an API key** so GitHub can sign and upload: App Store Connect › Users and Access › Integrations › App Store Connect API › **+**. Give it the **Admin** role (signing needs it to make the distribution certificate). Download the `.p8` file (you can only download it once) and note the **Key ID** and the **Issuer ID** shown above the list.
4. **Find your Team ID:** developer.apple.com › Account › Membership details.
5. **Add four repository secrets** on GitHub (repository › Settings › Secrets and variables › Actions › New repository secret):
   - `APPLE_TEAM_ID`: the Team ID.
   - `ASC_KEY_ID`: the Key ID.
   - `ASC_ISSUER_ID`: the Issuer ID.
   - `ASC_KEY_P8`: the whole text of the `.p8` file, including the BEGIN and END lines.
6. Run the workflow with **Send to TestFlight** ticked. After it finishes, App Store Connect takes 10–30 minutes to process the build; then add yourself as a tester under TestFlight › Internal Testing, and install the **TestFlight** app on the iPad to get Bumpity.

Signing needs no Mac and no registered device: each run makes an Apple Distribution certificate and an App Store profile through the API (`scripts/apple-signing.mjs`), turns on Associated Domains for the app ID if it's off, signs, uploads, and deletes both again. Builds already uploaded stay valid.

The first upload went through on 24 November 2026.

The build number is the workflow's run number, so every upload is newer than the last. The version shown in the store (1.0) is `MARKETING_VERSION` in the Xcode project.

## Google Play release build
Google Play needs a signed **app bundle** (`.aab`). You sign it with an *upload key* that you
make once and keep safe; Google then signs the copies people download ("Play App Signing").
If the upload key is ever lost, Google can reset it, but it takes a few days.

**One time, on your computer** (needs Java's `keytool`: install the free Temurin JDK 21 from
adoptium.net, or use the one inside Android Studio):

```bash
keytool -genkeypair -v -keystore bumpity-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

It asks for a password and your name; choose a long password and write it down. Keep
`bumpity-upload.jks` somewhere safe outside the project folder (a password manager or a USB
stick), never in the repository.

**Add four secrets** to the GitHub repository (Settings → Secrets and variables → Actions):
- `ANDROID_KEYSTORE_B64`: the key file as text. In PowerShell:
  `[Convert]::ToBase64String([IO.File]::ReadAllBytes("bumpity-upload.jks")) | Set-Clipboard`, then paste.
- `ANDROID_KEYSTORE_PASSWORD`: the password you chose.
- `ANDROID_KEY_ALIAS`: `upload`
- `ANDROID_KEY_PASSWORD`: the same password (keytool uses one for both unless you chose otherwise).

**Each release:** in the Actions tab, run **Android app** with **Google Play build** ticked and the
version (for example `1.0.0`). The signed bundle is attached to the run as **bumpity-play**.
Upload it in the Play Console (first to the closed test track; a new personal account needs a
closed test with 12 testers for 14 days before it can publish). The version code is the run
number, so every upload is higher than the last.

## The domain (bumpity.app)
Registered at Cloudflare on 23 November 2026; live since 24 November 2026, with HTTPS enforced. GitHub Pages serves the site; Cloudflare only
answers DNS (no proxy, so Cloudflare never sees the visits). The site is put together by
`npm run build:site` (`scripts/build-site.mjs`) into `_site/`:
- `/`: the home page for grown-ups (`site/index.html`). A link with `#p=` is passed on to the game.
- `/play/`: the game.
- `/privacy.html`: the privacy policy.
- `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`: they let shared
  links open in the app. Each is written only once its ID is known (step 4).

### 1. DNS records (you, in Cloudflare)
First prove to GitHub that the domain is yours, so nobody else can point a GitHub site at it:
GitHub › your picture › **Settings › Pages › Add a domain** › `bumpity.app`. GitHub shows a TXT
record; add it in Cloudflare and press **Verify**.

Then, in Cloudflare › bumpity.app › **DNS › Records**, add these. Set every one to **DNS only**
(grey cloud), not Proxied: GitHub has to see the visits itself to make the HTTPS certificate.

| Type | Name | Content |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `bahafin.github.io` |
| TXT | (from GitHub's verify step) | (from GitHub) |

### 2. Switch the site to the domain (Claude, once the records answer)
`gh api -X PUT repos/Bahafin/tinker-table/pages -f cname=bumpity.app`, wait for GitHub's
certificate (minutes to an hour; `.app` addresses only work over HTTPS), then
`gh api -X PUT repos/Bahafin/tinker-table/pages -F https_enforced=true`. After that the old
`bahafin.github.io/tinker-table/…` addresses redirect to bumpity.app, so old share links still work.

Saved progress in a **browser** belongs to the address, so a child who plays on the website
starts afresh at bumpity.app (the apps are not affected). Best done before the address is shared.

### 3. The support email (you, in Cloudflare)
Cloudflare › bumpity.app › **Email › Email Routing** › Get started. Create `support@bumpity.app`
and send it on to your own inbox (Cloudflare emails a link to confirm it). Cloudflare adds the
MX and TXT records itself. Free.

### 4. Links into the app (once the store accounts exist)
- **iOS:** the deploy workflow reads the `APPLE_TEAM_ID` secret (the same one TestFlight uses)
  and writes the apple-app-site-association file. The app's side is `ios/App/App/App.entitlements`
  (`applinks:bumpity.app`). Check it with `https://app-site-association.cdn-apple.com/a/v1/bumpity.app`.
- **Android:** Play Console › Bumpity › **Test and release › App integrity › App signing**: copy
  the **SHA-256** fingerprint of the *app signing key* (and the upload key's, for test builds you
  install yourself). Put them, separated by commas, in a repository **variable** (not a secret)
  called `ANDROID_CERT_SHA256`: GitHub › repository › Settings › Secrets and variables › Actions ›
  Variables. The next deploy writes assetlinks.json. The app's side is the intent filter in
  `android/app/src/main/AndroidManifest.xml`.
- Then re-run the deploy (Actions › Deploy to GitHub Pages › Run workflow).

## The voice
Every line the game says is a recorded clip in `public/voice/` (about 120 short MP3s), listed
in `src/ui/voice-clips.json`. The lines come from `src/ui/voice-lines.ts`. The clips are made
with **Kokoro**, an open-source neural voice (Apache 2.0, so fine in a paid app; no account,
no cost), and play through the game's own audio, so every phone, tablet and browser hears the
same voice. The device's own speech is only a fallback for a line without a clip.

**After changing anything the game says** (a level's `voice`, a room name), the test
"every line the game says has a clip" fails. To make the clips:
1. Push the change, then GitHub › Actions › **Voice clips** › Run workflow, on your branch.
   The voice (`af_heart`) and speed (0.92) can be changed there.
2. Download the run's **voice-clips** file and copy its `public/voice/` and
   `src/ui/voice-clips.json` over the repository's. Only new or changed lines are recorded again.
3. The download also has `samples/`: the first "Shh" line with each style of hush, to compare. The hush style is `HUSH` in `scripts/make-voice.py`.
