// The Android app's screen pinning (android/.../ScreenLockPlugin.java). Only used when
// PLATFORM is 'android'; nothing on the web or iOS calls it.
import { registerPlugin } from '@capacitor/core';

interface ScreenLockPlugin {
  /** Pin the app to the screen. Android asks the grown-up to confirm. */
  start(): Promise<void>;
  isLocked(): Promise<{ locked: boolean }>;
}

export const ScreenLock = registerPlugin<ScreenLockPlugin>('ScreenLock');
