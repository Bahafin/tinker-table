# Tinker Table (working title)

A calm chain-reaction puzzle game for kids aged 5–8 (younger ones with a grown-up), built as a web app for the iPad. The design is in [docs/design.md](docs/design.md).

## Play it

The game is live at **https://bahafin.github.io/tinker-table/**. Every push to `main` runs the tests, builds the game and publishes it there (`.github/workflows/deploy.yml`).

On the iPad, open it in Safari, tap Share, then **Add to Home Screen**. Open it once while online, and after that it plays offline.

### For grown-ups

Press and hold the small grown-ups button in the top corner of the level map. It opens a guide on what the game practises, how to play together, and a talk card for each level with questions to ask. You can print the guide or save it as a PDF.

### A nicer voice

The game picks the most natural English voice the device has. To get a much better one:
- **iPad / Mac:** Settings → Accessibility → Spoken Content → Voices → English. Download a voice marked **Premium** or **Enhanced**, for example "Ava (Premium)". Then close and reopen the game.
- **Windows:** open the game in **Microsoft Edge**, which has "Natural" voices built in (they need internet).

To see which voice was chosen, run `tinkerVoices()` in the browser console.

## What's next

Next up: guess the path, a film strip of each run, and a sticker book. The full plan is in [docs/roadmap.md](docs/roadmap.md).

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
3. Add it to `src/levels/index.ts`, and add its talk card to `src/parents/content.ts`.
4. Run `npm test`. It tells you whether the level works and isn't already solved.
