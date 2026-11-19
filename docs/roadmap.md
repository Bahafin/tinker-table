# Tinker Table roadmap

What we plan to build next, in order. Every feature has to keep three rules:
- **No text for the child.** Pictures, icons and the voice only.
- **No fail state.** Nothing scores, times or tells the child off.
- **Free to run.** No servers, no accounts and no analytics. Everything stays on the device or inside a link.

The current game: 30 levels, the toy box, the grown-ups' corner, offline play, and the web version on GitHub Pages. See [design.md](design.md).

## Decisions so far
- **The web version stays the main home.** A store app later wraps the same code with Capacitor.
- **Hints are ghost parts, never words.**
- **The puzzle maker lives inside the toy box,** not on its own screen.
- **Sharing puts the puzzle itself in the link.** No server stores it.
- **Sharing is a grown-up action,** so it sits behind the press-and-hold gate.

## Milestone 4: help, make and organise (done)

### Hints
- **Why:** the first playtest showed that later levels need help, and a stuck child gives up.
- **Kid UX:**
  - After two missed runs, a hint button gently pulses in the top bar.
  - Tapping it shows a faint "ghost" of one missing part, in its place and at its angle, for a few seconds.
  - Each tap shows the next missing part.
- **Grown-ups:** each talk card gets a "Show the answer" button, so a parent can coach without needing to know the answer.
- **Data:** uses each level's existing `solution`. Nothing new is stored.

### Puzzle maker and share links
- **Why:** swapping roles. A parent makes a puzzle for the child, and the child makes one for the parent ("can Dad solve mine?"). To build a puzzle that works, the child has to think about cause and effect from the other side.
- **Kid UX (inside the toy box):**
  1. Build a machine as usual, then tap the "make a puzzle" button.
  2. Tap the thing that has to travel (a ball, the balloon, the hamster or the pulley), then where it has to go (a basket, star or cheese).
  3. Tap parts to pin them down. Pinned parts are the puzzle. Unpinned parts go into the tray for the solver.
  4. Tap the tick. The game checks that the machine works with all the parts, and that it does *not* work with only the pinned ones. A puzzle that fails a check gets a wiggle and a "hmm", never an error.
- **Saved puzzles:** they appear in a "my puzzles" row on the map, kept on this device (20 at most).
- **Sharing:**
  - In the grown-ups' corner, each saved puzzle has a Share button. It uses the device's share sheet, or copies a link if there isn't one.
  - The whole puzzle is packed into the link (`…/tinker-table/#p=…`).
  - Opening the link starts the puzzle straight away.
- **Safety:** shared links are untrusted input. The game checks every value (part kinds, positions on the grid and inside the table, angles, size limits) and ignores anything wrong.

### Rooms
- **Why:** 30 levels in one long grid is a lot. Rooms give a feeling of a journey and make room for new parts.
- **Kid UX:**
  - The map has five rooms of six levels: Workshop, Garden, Kitchen, Playroom, Attic.
  - Each room has a picture banner (no words) and its own paper tint, which carries on to the table in play.
  - After the rooms come the toy box and "my puzzles".

## Milestone 5: thinking out loud
- **Guess the path:**
  - Before pressing Go, the child draws with a finger where they think the ball will go.
  - After the run, their line and the real path show together.
  - It's the "guess, try, look" loop made visible, and it gives the grown-up something to talk about. There's no scoring.
- **Film strip:** after a win, 4–5 snapshots of the run appear in order. The child tells the story of the machine, and tapping a frame replays the run.
- **Sticker book:**
  - Each finished level gives a sticker (a character or a part) to place freely on a page.
  - It rewards finishing without scoring how well the child did.
  - Kept on the device.

## Milestone 6: new things to play with
- **Musical parts:**
  - Bells, xylophone bars and a drum play a note when something hits them.
  - In the toy box, machines become songs.
  - A room of musical levels.
- **Rope and scissors:**
  - A ball hangs on a rope until something cuts it.
  - This gives "cut it, pop it, drop it" a natural reason.
- **Later parts:** a magnet, gears, a toy car.
- **A second character:** a friend for the hamster, to give levels little stories (the "why?" lesson from the first playtest).

## Later
- **The parent's recorded voice:**
  - A parent records each level's line, behind the grown-ups' gate.
  - Recordings stay on the device, and a voice pack can be exported and imported as a file. No server.
- **Taking turns:** a two-player mode where you place one part each and pass the iPad.
- **Level generator:**
  - Uses the level search tool to invent layouts and keeps only those that work, don't solve themselves, and need every part.
  - It could give a new machine every day, with no server.
- **Tilt puzzles:** tilt the iPad to tilt the table.
- **Art pass:** hand-drawn paper sprites in place of the flat shapes.
- **App stores:**
  - Wrap the game with Capacitor for iPad and Android.
  - Costs: $99 a year for Apple, $25 once for Google.
  - Before release: a privacy policy page, a trademark check on the name, logo letters turned into outlines, and screenshots.

## How new levels are made
Run the search tool. It tries every grid position and angle for the tray parts, and reports:
- whether the level solves itself;
- whether the reference solution works;
- how many placements work.

The level tests also fail if any one part of a solution can be removed and the level still works.

```bash
TUNE=src/levels/10-boing.json npm run search
```
