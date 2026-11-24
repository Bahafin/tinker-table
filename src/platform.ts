// Where the game is running: a browser, or the iPad/iPhone or Android app (Capacitor).
// Everything here is safe to use on the web, where it does nothing special.
import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android';

export const PLATFORM = Capacitor.getPlatform() as Platform;
/** True inside the store apps. */
export const NATIVE = Capacitor.isNativePlatform();

/**
 * The game's public web address. Share links always point here, so whoever gets one can
 * play in a browser even without the app. (Inside the app, location is a local address.)
 * The home page for grown-ups is the domain's root; the game is in /play/.
 */
export const WEB_HOME = 'https://bumpity.app/play/';

/** Where share links should send people: this page on the web, the public site from the app. */
export function gameAddress(): string {
  return NATIVE ? WEB_HOME : `${location.origin}${location.pathname}`;
}
