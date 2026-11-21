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
`node scripts/make-icons.mjs` draws the web icons and the source images in `assets/`. Then `npx capacitor-assets generate --android --iconBackgroundColor '#f4ecdc' --splashBackgroundColor '#e9dcc3'` makes every size the app needs (add `--ios` once the iOS project exists).

## iPad and iPhone
Next step: the iOS project, built and sent to TestFlight by GitHub's Mac machines, since there is no Mac here. That needs an Apple Developer account ($99 a year).
