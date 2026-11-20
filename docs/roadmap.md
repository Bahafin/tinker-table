# Bumpity roadmap

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
- **Sharing is a grown-up action,** so it sits behind the grown-ups' gate (now the PIN).

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
- **Film strip:** after a win, five snapshots of the run pop in as little photos, the last one with the confetti. The child tells the story of the machine, and tapping a photo shows it big in the middle of the screen (tap anywhere to put it back). The replay button watches the run again.
- **Sticker book:**
  - A book button on the front page. Each finished level gives a sticker: the most special part in that level, drawn in its room's look on a round backing in the room's colours.
  - Drag stickers from the strip onto the page, anywhere. Drag one off the page to put it back. A red dot on the book means there are stickers waiting.
  - The strip has a round tab for each room (a red dot where stickers are waiting). A room's stickers show once per kind, with a dot for each copy earned: filled while it's still to stick, hollow once it's on the page. The book opens on a room with stickers waiting.
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

## Sounds by material (done)
- Every knock sounds like what met: wood (planks, dominoes, blocks), metal (pins, hammer, toaster, pot), plastic (balls, hamster, car), a heavy thud (the heavy ball), the paper table, or barely anything (balloons, cheese, flowers).
- The drum is a real tom (a beater click and a fast drop in pitch); the spring's boing now wobbles, so the two don't sound alike.

## Milestone 6: new things to play with
- **Musical parts (done):**
  - Five xylophone bars (a pentatonic scale), a bell and a drum play their sound when something hits them.
  - In the toy box, machines become songs (the Music room tab), and a kept machine keeps its song.
  - The Music room: ten levels after the Garden, most with a tune as the goal.
- **Room parts** (rope and scissors, toy car and the others) moved to Milestone 4.5.
- **Later parts:** a magnet, gears. A tune goal in the puzzle maker.
- **A second character:** a friend for the hamster, to give levels little stories (the "why?" lesson from the first playtest).

## Milestone 7: before the app store
Safety first, then the wrapper, then the paperwork. The order inside each part is the order to build it in.

### Safety for a child alone with the tablet
- **Why:** a child left alone with the tablet wanders off into other apps and places they shouldn't be. Keeping them safely inside the game fits its calm, no-pressure feel.
- **Grown-ups' PIN (first): done.**
  - A 4-digit PIN, offered on the first-launch card, replaces the press-and-hold gate (which stays only until a PIN is set).
  - It guards the grown-ups' corner, and is asked again before clearing progress or changing the PIN. The play timer below will use the same pad.
  - The number pad shows digits (it's for grown-ups), rests after 3 wrong tries, and a forgotten PIN can be reset with a sum in words a young child can't do yet.
- **A tidier grown-ups' corner: done.** The one long page became five short sections (Safety, Play together, Talk cards by room, Made here, Settings), with talk cards closed to one line until tapped, and printing by room.
- **Play timer that winds down (second):**
  - The parent picks 15, 20 or 30 minutes, or no limit.
  - No countdown is shown. When time is up, the hamster yawns, the machine finishes its run, the room "goes to sleep" with a lullaby, and only the PIN wakes it.
- **Staying inside the game (third):**
  - An app can't stop the home swipe on an iPad. The real lock is the device's own: **Guided Access** on iPad (triple-click the side button; leaving needs the parent's passcode) and **screen pinning** on Android.
  - Done: a first-launch card for parents, "Before you hand it over", and step-by-step pictures for both in the corner's Safety section.
  - Still to do in the app wrapper: on Android the app can start screen pinning itself, from a "lock" button in the Safety section.
- **Smaller ones:**
  - An eye-rest break about every 20 minutes: the hamster stretches and invites the child to look out of the window for 20 seconds.
  - Volume limit and a quiet mode in the grown-ups' settings.
  - "Show me what you made": at the end of a session, a page of the film strips and kept machines to look at together.
  - Nothing leaves the game without the grown-ups' gate: no ads, no links out, no tracking (already true; the app keeps it so).

### Playtest on the iPad
With a real finger, before wrapping: the Music room, the toy box tabs and arrows, the sticker book, the pencil, the new sounds, the bin and the puzzle maker.

### The app wrapper (Capacitor)
- Saved progress, stickers and kept machines move from browser storage to app storage (iOS can clear browser storage).
- Check that sound starts after the first tap, and that the voice still picks a nice English voice inside the app.
- Sharing uses the native share sheet.
- Safe areas round the notch, orientation locked to landscape on phones, app icon and splash screen.
- A test release through TestFlight (and Google's internal testing) for real play before going public.

### Paperwork
- Privacy page, logo letters as outlines, and store screenshots: done. See [release-prep.md](release-prep.md).
- Name: renamed from Tinker Table to Bumpity (20 November 2026). First searches are clean; a lawyer's clearance and a class 9 filing are still to do. See [release-prep.md](release-prep.md).
- A support email for the privacy page and the store listings.
- Apple's age questions and the Kids section rules (parental gate, no third-party analytics or ads).
- Costs: $99 a year for Apple, $25 once for Google.

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
