# Tinker Table roadmap

What we plan to build next, in order. Every feature has to keep three rules:
- **No text the child needs to read.** Pictures, icons and the voice carry everything. Simple word labels (room names) may sit next to pictures, and they are read aloud when tapped.
- **No fail state.** Nothing scores, times or tells the child off.
- **Free to run.** No servers, no accounts and no analytics. Everything stays on the device or inside a link.

The current game (ages 5–8): 60 levels in six rooms of ten (the sixth is the Music room), a front page you swipe along, the toy box, guess the path, the film strip, the sticker book, the grown-ups' corner, offline play, and the web version on GitHub Pages. See [design.md](design.md).

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
  - (Reworked in Milestone 4.5: the front page now shows rooms, not levels.)

## Milestone 4.5: rooms that feel like rooms (done)
- **Why:** a different background alone made rooms feel thin. Each room should have its own things to play with.
- **Done:**
  - The front page shows the rooms as big tiles, with the Toy box (and the puzzle maker) as the sixth room.
  - Each room draws the parts as its own things (an apple and a flower pot in the garden, a screw and a toolbox in the workshop), and the voice uses the same words. See [design.md](design.md).
- **Next: one new part per room**, each with its own physics and 2–3 new levels in its room:
  - **Playroom: done.** The toy car drives as soon as Go is pressed, pushes things and carries a ball. Three new levels: the first of the Playroom and its last two (the room now has nine).
  - **Workshop: done.** A spring-loaded hammer on a hinge that whacks when bumped. Three new levels after the six Workshop tutorials (the room now has nine).
  - **Kitchen: done.** A toaster that catches what drops in and pops it up and over with a ding. Three new levels after the Kitchen's first six (the room now has nine).
  - **Garden: done.** A watering can that tips and pours real water drops, and a thirsty flower (a new target) that blooms when watered. The garden's star became a butterfly. Three new levels after the Garden's first six (the room now has nine).
  - **Attic: done.** A ball on a rope (it swings if turned) and scissors that cut ropes and pop balloons. Three new levels after the Attic's first six.
- Every room now has nine levels (45 in all) and its own part.
- This replaces the "new parts" list in Milestone 6 (musical parts stay there).

## Milestone 4.6: ten levels a room, in order of difficulty (done)
- Five new levels, one per room, each using that room's part: 50 levels, ten in every room.
- Every level has a measured `difficulty` score (see "Difficulty order" in [design.md](design.md)).
- The levels were re-sorted so that inside a room each level is harder than the last, and each room's Nth level is harder than the previous room's Nth level. A test checks both, and that no level appears twice.
- To make that work, the rooms are now in the order Workshop, Playroom, Attic, Kitchen, Garden. Progress is kept by level, so finished levels stay finished in their new places.
- A room page shows its ten levels as two rows of five.

## Milestone 5: thinking out loud (done)
- **Guess the path:**
  - A pencil button sits in the top bar. Tap it, then draw with a finger where you think the ball will go. The pencil stays out until its button is tapped again (or Go is pressed), and every line drawn while it's out is kept; a quick tap on the table is ignored. Taking the pencil out again starts a fresh guess.
  - While the machine runs, the real path appears as teal dots next to the red crayon guess, and both stay on the table after the run until something is moved.
  - It's the "guess, try, look" loop made visible, and it gives the grown-up something to talk about. There's no scoring.
- **Film strip:** after a win, five snapshots of the run pop in as little photos, the last one with the confetti. The child tells the story of the machine, and tapping a photo replays the run slowly.
- **Sticker book:**
  - A book button on the front page. Each finished level gives a sticker: the most special part in that level, drawn in its room's look on a round backing in the room's colours.
  - Drag stickers from the strip onto the page, anywhere. Drag one off the page to put it back. A red dot on the book means there are stickers waiting.
  - It rewards finishing without scoring how well the child did. Kept on the device.

## Milestone 5.5: a front page to swipe, and first words (done)
- The rooms are now a row you swipe along (or move with big arrows), in order of difficulty, with the next room peeking in. It opens on the room the child is working on.
- Room names appear as word labels next to their pictures, and the voice says them when a room comes to the middle or the name is tapped.
- The target age is now **5–8**, with younger children welcome alongside a grown-up.

## Milestone 5.6: playtest fixes (done)
- Parts stay wholly on the table, at any angle.
- A sleeping hamster only hears a pop (or a bell) within 5 cells, and a dotted ring shows how far the sound reaches.
- The pencil stays out until its button is tapped again.
- Every run the child starts counts towards a hint, including ones stopped by hand.
- The Toy box and the Puzzle maker are separate rooms. Toy-box machines can be kept (heart button) and reopened.
- The toy box tray has room tabs and page arrows, and parts from different rooms can share the table, each in its room's look.
- Dominoes stand on things, and no domino level can be won with a domino left out (checked by `scripts/domino-check`).
- Look-alike levels were mirrored, and a test stops two levels from looking and playing the same.

## Milestone 6: new things to play with
- **Musical parts (done):**
  - Five xylophone bars (a pentatonic scale), a bell and a drum play their sound when something hits them.
  - In the toy box, machines become songs (the Music room tab), and a kept machine keeps its song.
  - The Music room: ten levels after the Garden, most with a tune as the goal.
- **Room parts** (rope and scissors, toy car and the others) moved to Milestone 4.5.
- **Later parts:** a magnet, gears. A tune goal in the puzzle maker.
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

The level tests also fail if any one part of a solution can be removed and the level still works, if a solution part sticks out of the table, or if a solution domino isn't standing on something.

For levels with dominoes, also check that none can be left out (the remaining parts are moved everywhere to look for a way):

```bash
DOMINO=1 npx vitest run scripts/domino-check
```

```bash
TUNE=src/levels/10-boing.json npm run search
```
