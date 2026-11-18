# Tinker Table (working title)

A calm chain-reaction puzzle game for kids aged 4–7, built as a web app for the iPad. The design is in [docs/design.md](docs/design.md).

## Play it

The game is live at **https://bahafin.github.io/tinker-table/**. Every push to `main` runs the tests, builds the game and publishes it there (`.github/workflows/deploy.yml`).

On the iPad, open it in Safari, tap Share, then **Add to Home Screen**. Open it once while online, and after that it plays offline.

## Run it

Install and start the game:

```bash
npm install
```

```bash
npm run dev
```

Vite prints a `Network:` address, something like `http://192.168.1.20:5173`.

### Play on the iPad

1. Open that address in Safari on the iPad. The iPad must be on the same Wi-Fi as the PC.
2. Tap Share, then **Add to Home Screen**. The game then opens full screen like an app.
3. If the iPad can't reach it, Windows Firewall is probably blocking Node. Allow Node.js on private networks when Windows asks, or in the firewall settings.

### Offline play

The built game (`npm run build`) saves its own files the first time it is opened, then plays without internet. This only works when it is served over HTTPS, as on GitHub Pages above. It does not work from the PC over home Wi-Fi.

## Tests

```bash
npm test
```

The tests run every level without a browser. They check four things:
- the level's reference solution reaches the goal;
- the empty level does not solve itself;
- the solution only uses parts from the tray, on the grid, without overlapping;
- the same machine plays out the same way twice.

## Adding a level

1. Copy one of the files in `src/levels/`.
2. Change the fixed parts, the tray, the voice line and the `solution`.
3. Add it to `src/levels/index.ts`.
4. Run `npm test`. It tells you whether the level works and isn't already solved.
