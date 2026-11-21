// The page's entry point. Inside the store apps, saved progress is restored from the app's
// own storage first (main.ts reads it as it starts); on the web the game starts straight away.
import { NATIVE } from './platform';

if (NATIVE) {
  const shell = await import('./app-shell');
  await shell.mirrorStorage();
  await import('./main');
  await shell.setUpApp();
} else {
  await import('./main');
}
