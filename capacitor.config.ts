import type { CapacitorConfig } from '@capacitor/cli';

// The store apps wrap the same built game (dist/). See docs/roadmap.md, "Phones and tablets, as apps".
const config: CapacitorConfig = {
  // The store ID can't change after the first upload to a store.
  appId: 'app.bumpity.game',
  appName: 'Bumpity',
  webDir: 'dist',
  backgroundColor: '#e9dcc3',
  android: {
    // Kids' app: nothing to debug from outside in a release build.
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'never',
  },
  plugins: {
    // Hidden by the app itself once the game has started (src/app-shell.ts).
    SplashScreen: { launchAutoHide: false, backgroundColor: '#e9dcc3', showSpinner: false },
    // Edge to edge; the page already pads itself with env(safe-area-inset-*).
    SystemBars: { insetsHandling: 'native' },
  },
};

export default config;
