// What the store apps need that a browser doesn't. Loaded by boot.ts only inside the app.
import { SystemBars } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';

/** Saved things all live under keys starting with this (the game's old name; kept so nothing is lost). */
const PREFIX = 'tinker.';

/**
 * iOS can clear a web view's localStorage when the device is short of space, so every saved
 * key is also kept in the app's own storage. On start, anything missing from localStorage is
 * put back from there; after that, every write to a game key goes to both.
 */
export async function mirrorStorage() {
  try {
    const { keys } = await Preferences.keys();
    for (const k of keys) {
      if (!k.startsWith(PREFIX) || localStorage.getItem(k) !== null) continue;
      const { value } = await Preferences.get({ key: k });
      if (value !== null) localStorage.setItem(k, value);
    }
    // Anything only in localStorage (saved before the mirror existed) is copied across.
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX) && !keys.includes(k)) await Preferences.set({ key: k, value: localStorage.getItem(k) ?? '' });
    }
  } catch { /* the game still works with localStorage alone */ }
  const proto = Storage.prototype;
  const set = proto.setItem, remove = proto.removeItem;
  proto.setItem = function (this: Storage, key: string, value: string) {
    set.call(this, key, value);
    if (this === localStorage && key.startsWith(PREFIX)) Preferences.set({ key, value: String(value) }).catch(() => {});
  };
  proto.removeItem = function (this: Storage, key: string) {
    remove.call(this, key);
    if (this === localStorage && key.startsWith(PREFIX)) Preferences.remove({ key }).catch(() => {});
  };
}

/** Is it a phone (rather than a tablet)? Phones play sideways only. */
const isPhone = () => Math.min(screen.width, screen.height) < 600;

/** Full screen, phones locked sideways, Android's back button, then the splash screen goes. */
export async function setUpApp() {
  try { await SystemBars.hide(); } catch { /* not everywhere */ }
  if (isPhone()) { try { await ScreenOrientation.lock({ orientation: 'landscape' }); } catch { /* fine */ } }
  App.addListener('backButton', goBack).catch(() => {});
  // A share link opened on a device with the app installed arrives here (once links are set up).
  App.addListener('appUrlOpen', ({ url }) => {
    const hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
    if (hash.startsWith('#p=')) location.hash = hash;
  }).catch(() => {});
  try { await SplashScreen.hide(); } catch { /* fine */ }
}

const visible = (sel: string) => {
  const el = document.querySelector<HTMLElement>(sel);
  return el && el.offsetParent !== null ? el : null;
};

/**
 * Android's back button: the same as tapping the screen's own back, close or home button,
 * whichever is showing on top. On the front page it puts the app in the background.
 */
function goBack() {
  const target =
    visible('.pinpad-wrap .pin-close') ??
    visible('.photo-big') ??
    visible('.welcome-wrap [data-w="close"]') ??
    visible('#btn-gu-close') ??
    visible('#btn-book-close') ??
    visible('#play #btn-home') ??
    visible('#levels .back');
  if (target) target.click();
  else App.minimizeApp().catch(() => {});
}
