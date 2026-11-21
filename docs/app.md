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
   - Bundle ID: register **app.bumpity.game** first, under Certificates, Identifiers & Profiles › Identifiers (an "App IDs" entry, no extra capabilities), then pick it here.
   - SKU: anything, for example `bumpity`.
3. **Make an API key** so GitHub can sign and upload: App Store Connect › Users and Access › Integrations › App Store Connect API › **+**. Give it the **Admin** role (signing needs it to make the distribution certificate). Download the `.p8` file (you can only download it once) and note the **Key ID** and the **Issuer ID** shown above the list.
4. **Find your Team ID:** developer.apple.com › Account › Membership details.
5. **Add four repository secrets** on GitHub (repository › Settings › Secrets and variables › Actions › New repository secret):
   - `APPLE_TEAM_ID`: the Team ID.
   - `ASC_KEY_ID`: the Key ID.
   - `ASC_ISSUER_ID`: the Issuer ID.
   - `ASC_KEY_P8`: the whole text of the `.p8` file, including the BEGIN and END lines.
6. Run the workflow with **Send to TestFlight** ticked. After it finishes, App Store Connect takes 10–30 minutes to process the build; then add yourself as a tester under TestFlight › Internal Testing, and install the **TestFlight** app on the iPad to get Bumpity.

The build number is the workflow's run number, so every upload is newer than the last. The version shown in the store (1.0) is `MARKETING_VERSION` in the Xcode project.
