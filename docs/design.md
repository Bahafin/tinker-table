# Tinker Table — design doc

*Working title. Check the name before any release.*

## The game in one paragraph
A calm chain-reaction puzzle game for ages 4–7, played with a parent on a tablet. Each level shows a little scene on a paper craft table and a goal shown as a picture ("ball → basket"), which a voice reads out. The child drags a few big paper parts from the tray, presses the big green **Go** button and watches the machine run. If it misses, everything gently resets to where the parts were placed, with no fail screen. If it works, there is confetti, a happy sound and a slow-motion replay. A **toy box** with every part and no goal is open from day one.

## Who it's for
- **The child (4–7):** cannot read, has imprecise fingers and a short attention span. They love watching things fall over.
- **The parent:** grew up with 90s contraption games and wants to share the feeling. Plays next to the child and sometimes "helps".

## Kid-UX rules (enforced in code)
1. **No text anywhere in the game.** Goals are pictures and a voice. Buttons are icons.
2. **Touch targets at least 64 px.** A part can be grabbed anywhere on it plus a generous margin around it.
3. **Snap everything.** Positions snap to a half-cell grid, and angles to 15° steps.
4. **Rotate with big arrow buttons.** Placing a part, or tapping it, selects it: a dashed outline appears round it, and two round 64 px buttons pop up above it. ↺ turns it 15° anticlockwise and ↻ turns it 15° clockwise, so a wrong turn is one tap to undo. Tapping the part itself never turns it. Tapping empty table hides the buttons. Parts whose angle doesn't matter (ball, block) give a little wiggle and show no buttons. A finger may slide up to 22 px and still count as a tap.
5. **Drag a part back onto the tray to remove it.** There is no delete button and no long-press.
6. **Parts that came with the level are fixed:** they can't be moved and have a small brass pin on them. Parts the child placed can always be moved.
7. **No fail state, no timer, no score.** A missed run softly resets after the machine settles, with a gentle "hmm" sound.
8. **Success = confetti, a chime and a slow replay.** Then three big icons appear: replay, next and home.
9. **A slow-motion toggle** (snail button) is always available.
10. **One voice line per level,** and the speaker button replays it.
11. **Hints are ghosts, not words.** After two missed runs a hint button pulses. Each tap shows a faint ghost of one missing part, in place and at its angle, for a few seconds.
12. **Making puzzles uses taps, not menus.** In the toy box: tap what travels, tap where it goes, tap parts to pin them, then tap the tick. A puzzle that doesn't check out gets a wiggle and a hmm.

## World and physics
- **The world is 16 × 10 cells,** and 1 cell = 1 physics unit (metre). The screen's y axis points down, and gravity is +10 in y.
- **Physics engine:** planck.js (Box2D). Fixed step of 1/60 s, with 8 velocity and 3 position iterations, so the same machine always plays out the same way.
- **Edges:** an invisible floor, walls and ceiling keep everything on the table.
- **The build phase has no physics.** The level is a list of placements (the model). Pressing **Go** builds a fresh physics world from that model, and **Reset** throws the world away. The headless tests do exactly the same.
- **A run ends** on success (the goal is held for 0.3 s), when every body is asleep, or after 25 s.

## Parts (Milestone 1)
| Part | Size (cells) | Body | Behaviour |
|---|---|---|---|
| Ball | Ø 0.7 | dynamic | Rolls and bounces a little. |
| Heavy ball | Ø 0.9 | dynamic, 4× density | Rolls and knocks things over. |
| Ramp | 3 × 0.25 | static | A plank that can be rotated. |
| Short ramp | 2 × 0.25 | static | A shorter plank. |
| Block | 1 × 1 | static | A wall or shelf. |
| Basket | 1.6 × 1.2 | static, U shape | Goal: catches a ball. |
| Star | Ø 1 | sensor | Goal: something touches it. |
| Domino | 0.25 × 1.5 | dynamic | Topples and knocks the next one. |
| See-saw | 4 × 0.2 on a pivot | dynamic plank on a hinge | Tips when weight lands on one side. |
| Balloon | Ø 0.9 | dynamic, floats | Rises and pops when it touches a pin. The bang wakes any sleeping hamster. |
| Pin | 0.6 | static spike | Pops balloons. |
| Fan | 1 × 1 | static | Starts when anything bumps it, then blows along its facing (4 cells reach). |
| Spring pad | 1.4 × 0.3 | static, very bouncy | Throws things back up. |
| Pulley bucket | 3 × 4 | bucket + counterweight on a pulley rope | A ball in the bucket lifts the weight. |
| Hamster ball | Ø 1 | dynamic | Asleep until something bumps it or a balloon pops, then rolls steadily the way it faces. A tap flips its facing. |
| Conveyor belt | 3 × 0.4 | static | Carries things along its top at 2.5 cells/s. A tap flips its direction. |
| Cheese | 1 × 0.7 | sensor | Goal: the hamster reaches it. |
| Toy car | 1.2 × 0.75 | dynamic, two motor wheels | A wind-up pickup truck. Drives the way it faces from the moment Go is pressed, pushes what's in front (even the heavy ball) and carries a ball on its flat back. Climbs gentle (15°) ramps; its wheels slip on 30°. A tap flips its facing. The Playroom's own part. |
| Hammer | 0.8 × 2.1 | dynamic head on a hinge, static base | Stands upright, held still, until anything bumps it. Then it's spring-loaded: it snaps down the way it faces (up to a little past flat) and whacks what's in its arc. The head reaches about 1.6–1.9 cells from the hinge, so a ball to whack should sit a bit above the hinge, not level with it (level with it, the head lands on top of the ball). A tap flips its facing. The Workshop's own part. |
| Toaster | 1.7 × 1 | static, wide slot on top | Anything whose centre sits in the slot for 0.4 s pops out with a "ding": straight up about 4 cells and tossed 1.5 cells/s the way the toaster faces (it lands about 2.6 cells away). It's a lift, not a bounce: it pops to the same height however gently things arrive. The slot is wide (1.2) so a ball dropped within ±0.5 of the middle is caught; things rolling along the floor can't get in, they have to drop in. A tap flips its facing. The Kitchen's own part. |
| Watering can | 0.9 × 0.9 (+ spout) | static | Any bump (not its own water) tips it 45° toward its spout, and it pours 18 water drops (small dynamic circles) over about 1.2 s. Water runs down ramps and splashes off things, can wake the hamster or switch on a fan, and soaks away when it reaches the floor, the table's edge, or sits still for half a second. A tap flips its facing. The Garden's own part. |
| Flower | 0.9 × 1.2 | sensor, in a pot | A target: drops that reach it soak in, and it opens up as it drinks. The goal (can → flower) is reached at 6 drops. |
| Rope | hook + ball Ø 0.7 on a 2.5 rope | static hook, dynamic ball, rope joint | A ball hanging from a hook. Turning it starts the ball raised to one side, so it swings when Go is pressed. As a goal object, the ball counts. A ball left swinging on an uncut rope stops counting as movement after 6 s, so a missed run still ends. The Attic's own part. |
| Scissors | 0.9 × 0.6 | static sensor | Cuts any rope that touches its blades (anywhere along them), and pops balloons like a pin. Things pass through them. The Attic's own part. |

Parts that only face left or right (hamster, conveyor, car, hammer, toaster, watering can) get one ↔ flip button instead of the two turn buttons.

A run also ends when nothing has moved for 1.5 s, because a hamster or a fan can keep pushing something against a wall forever.

## Level format (`src/levels/*.json`)
```json
{
  "id": "01-roll",
  "voice": "Help the ball into the basket!",
  "goal": { "type": "reach", "object": "ball1", "target": "basket1" },
  "fixed":  [ { "part": "ball", "id": "ball1", "x": 2, "y": 1 },
              { "part": "basket", "id": "basket1", "x": 13, "y": 9 } ],
  "tray":   [ { "part": "ramp", "count": 2 } ],
  "solution": [ { "part": "ramp", "x": 4, "y": 3, "rot": 15 } ]
}
```
- `x` and `y` are cell coordinates of the part's centre, on a 0.5 grid. `rot` is in degrees, clockwise, in 15° steps.
- **The goal is reached** when the centre of `object` is inside `target`'s goal zone (the inside of the basket, or the star's area). For a pulley, the centre of its weight counts.
- **Every level must pass two automated checks:** its `solution` reaches the goal, and the level with nothing placed does **not**.

## Milestone 1 levels
1. **Roll:** guide a ball down to the basket using ramps.
2. **Dominoes:** a ball rolls into a row of dominoes, and the last one tips into the basket area.
3. **See-saw:** drop the heavy ball on a see-saw to launch the other ball.
4. **Balloon:** guide a balloon up to the star.
5. **Chain:** a three-step machine that combines what came before.

Added in Milestone 2:

6. **Hamster:** drop a ball on the sleeping hamster to wake him, and he rolls to the cheese.
7. **Conveyor:** two belts carry the ball to the basket. They start running the wrong way, so the lesson is "tap to turn it around".
8. **Wake up:** the ball rolls down to the hamster asleep on a shelf. He wakes, rolls off the shelf and finds the cheese.

Added in Milestone 3. Each one teaches an idea no earlier level does:

9. **Bridge:** fill the gap between two shelves with a short plank so the ball can roll across.
10. **Boing:** a wall is too tall to roll past, so put the spring pad where the ball lands and bounce it over.
11. **Pop:** a loud pop wakes the sleeping hamster, who rolls to the cheese. The balloon floats along two slanted ceilings, so guess its path and put the pin in its way. (The first version had popping as the goal itself. In the first playtest the child asked "why?", so now the pop has a job to do.)
12. **Uphill:** a bump wakes the hamster, and a ramp lets him climb *up* onto the cheese shelf (ramps so far only went down).
13. **Wind:** place the fan where a falling ball switches it on, and point it at the other ball to blow it off the shelf into the basket.
14. **Lift:** put a block in the ball's way so it drops into the pulley bucket. The bucket goes down and the weight goes up to the star.

Added after the first playtest: a 5-year-old finished 13 levels in about 10 minutes, so these are harder. Most need two or three parts, and a test checks that removing any one part of the solution makes the level fail.

15. **Bank shot:** the ball flies past the basket. Stand the spring up like a wall so the ball bounces back.
16. **Pusher:** place the hamster yourself, under a falling ball and facing the right way, so he pushes another ball off a shelf. A low roof stops you dropping things straight onto that ball.
17. **Safe balloon:** a row of pins hangs from the ceiling. One ramp is too short, so join two ramps into a path under the pins to the star.
18. **Belt and boing:** the ball starts only a little above a low shelf, so a spring alone has nothing to work with. The belt carries it off the edge, and then the spring bounces it up into the basket.
19. **Big machine:** belt, fan and ramp. The ball rides the belt onto the fan and switches it on, the fan blows the balloon out from under a shelf, and the ramp steers it past the pins to the star.

Levels 20–30 go further. Each brings a new idea or a new pairing of parts:

20. **Goes up:** the fan hangs under the ceiling, and the tray has a ball and a balloon. Only the balloon can reach the fan, and it has to go above a slanted plank.
21. **Hold it down:** point the fan *down* so the wind keeps a floating balloon in its basket.
22. **Catapult:** the child places the see-saw so a heavy ball and a little ball land on opposite ends.
23. **Domino switch:** a domino chain switches on a fan, and the fan blows the ball off a shelf. Roofs stop anyone dropping things onto the fan or the ball.
24. **Under the belt:** a balloon floats up against the underside of belts, which carry it the *opposite* way to their arrows. Two belts, both turned around, take it past the pins.
25. **Ski jump:** a steep ramp for speed and a short upturned plank to launch the ball over a wall.
26. **Pop motor:** pin, then pop, then the hamster wakes and pushes a ball off a shelf. The child places both the pin and the hamster.
27. **Domino stairs:** the chain climbs three steps, one domino at a time, and nudges a ball off the top step.
28. **Hopscotch:** two holes in the floor, with a spring in each to hop over them.
29. **Catch and carry:** drop the heavy ball on the see-saw to fling the little one, and catch it in the air with a belt that carries it into a basket on a tower.
30. **Grand finale:** dominoes, fan, balloon, pin, hamster, ramp. Four placements in one long chain.

The hammer levels come after the six Workshop tutorials:

34. **Hammer** (7th in the Workshop): the hammer is already there. Drop a ball on it, and it whacks the other ball off a low shelf into the toolbox. Teaches "bump it and it whacks".
35. **Face the hammer:** a ball rolls in from the right. Place the hammer in its path, turned to face the ball on the shelf.
36. **Hammer dominoes:** a falling domino starts the line; add two dominoes so the line reaches the hammer, which whacks the ball across the room.

The rope and scissors levels come after the Attic's first six:

43. **Snip!:** cut the hanging rope; the ball drops onto a ramp that rolls it into the trunk.
45. **Car snip:** snip the ball down onto the shelf and send the car to push it off the end into the trunk. Both parts are needed.
44. **Swing and snip:** the ball swings from a raised start. Where the scissors meet the rope decides when it's cut, and so where the ball flies.

The watering can levels come after the Garden's first six:

40. **Watering can:** bump the can with a ball, and it waters the thirsty flower below.
41. **Water path:** water runs downhill. Join two ramps into a path that carries the water to the flower on a shelf.
42. **Water wake:** place the can under a falling ball, spout pointing at the sleeping hamster; the splash wakes him and he rolls to the cheese.

The toaster levels come after the Kitchen's first six:

37. **Toaster:** a ball falls from the top. Put the toaster under it, facing the counter, and it pops the ball into the pot.
38. **Over the wall:** a belt drops the ball by a tall wall. The toaster has to face away from the belt to pop it over into the pot.
39. **Toaster hamster:** drop a ball to wake the hamster; he rolls off his shelf into the toaster, which pops him up to the cheese.

The toy car levels sit in the Playroom (its first level and its last two), so the map order differs from the file numbers:

31. **Car push** (first in the Playroom): place the car on the shelf facing the ball; it pushes the ball off into the basket. Introduces the car and its facing.
32. **Car ride:** the ball rides on the car's back. Build a ramp road from the low shelf up to the star's shelf; the ball can't climb, but the car can carry it.
33. **Car catapult:** place the car and the see-saw. The car pushes the heavy ball off its shelf onto the see-saw, which flings the little ball into the basket.

Tried and dropped: a fan blowing a ball uphill (its reach is too short to climb a real slope), and a falling domino used as a bridge (too chaotic: random placements won).

The front page shows six big tiles: five **rooms** of six levels (Workshop, Garden, Kitchen, Playroom, Attic) and the **Toy box** as a sixth room. Each tile shows the room's own things and one dot per level, which fills in when the level is done. Tapping a tile opens the room, with a back button. The puzzle maker and the puzzles made on this device live in the Toy box room.

Each room draws the same parts as its own things (`src/render/skins.ts`). The physics, size and outline never change, so a slope always looks like a slope and a target is always an open container:

| Part | Workshop | Garden | Kitchen | Playroom | Attic |
|---|---|---|---|---|---|
| Ball | steel ball | apple | orange | beach ball | marble |
| Heavy ball | (plain) | pumpkin | melon | bowling ball | globe |
| Ramp | nailed plank | branch | cutting board | toy track | floorboard |
| Block | wooden crate | hay bale | toast | toy block | cardboard box |
| Basket | toolbox | flower pot | cooking pot | toy chest | trunk |
| Star | gear | butterfly | star cookie | star | moon |
| Pin | screw | cactus | fork | drawing pin | needle |
| Domino | wooden slat | fence picket | cereal box | crayon | book |
| Balloon | red | yellow | pink | blue | purple |

The spoken goal uses the room's words too (`roomVoice` in `src/levels/index.ts`), so in the garden "the ball" becomes "the apple". The hamster, cheese, fan, belt, spring, see-saw and pulley look the same everywhere.

Plus the **toy box**: every part except the goal-only star and cheese, unlimited, no goal.

## Look: paper craft
- **Background:** warm off-white paper with a faint dot grid.
- **Parts:** flat paper colours (tomato, mustard, teal, sky, kraft brown), each with a soft drop shadow so it looks cut out and lifted off the table.
- **Fixed parts** have a small brass pin drawn on them.
- **Paper grain:** a generated paper-fibre texture is multiplied over the whole table, parts included.
- **Later**, hand-drawn sprites replace the flat shapes. Each part's draw function is isolated so this swap doesn't touch the physics.

## Grown-ups' corner
- A small button in the map's top corner opens it, but only after it is **held for 1.5 s**. A ring fills while it's held, and a quick tap just wiggles it, so a child can't wander in by accident. This is also the parental gate the App Store expects for parent-only areas.
- It is the only place with text. It covers:
  - what the game practises (cause and effect, guess-try-look-change, space and angles, planning in steps, sticking with it, movement words, careful hands);
  - a four-step routine for each level: **Look, Guess, Go, Talk**;
  - tips for playing together.
- **A talk card for every level and the toy box**, each with:
  - the one idea the level is about;
  - questions to ask before Go and after the run;
  - words to use;
  - a "try at home" activity;
  - a "Play this level" button.
- The content lives in `src/parents/content.ts`. A test fails if a level has no talk card.
- "Print the talk cards" prints just this content, or saves it as a PDF.

## Logo and icons
- **Logo** (`public/logo.svg`): the app emblem next to "TINKER" on six paper letter tiles in the game's colours, with "TABLE" resting on a wooden plank.
- **Emblem:** a ball rolling down a ramp towards a basket, on a paper tile. The same emblem is the favicon (`public/favicon.svg`) and the home-screen icon. `node scripts/make-icons.mjs` regenerates the icon PNGs.
- The wordmark uses rounded system fonts, so the letters can look slightly different on each device. Turn the letters into outlines before any print or store use.

## Sound and voice
- **Sound effects** are synthesised with Web Audio: place, rotate, clack, pop, boing, whoosh, chime and hmm.
- **The voice** is `speechSynthesis` for now. The game scores the installed voices and picks the most natural English one. Microsoft "Natural", Apple "Premium" or "Enhanced", and Google voices score highest. Apple's novelty voices are never picked. Pitch is only raised for the plain old voices, because it makes modern ones sound odd. Later it will be the parent's own recorded voice.

## Home-screen app
- A web manifest and app icon let the game be added to the iPad home screen and open full screen.
- A service worker (`public/sw.js`) saves the game's files on the first online visit, so it then plays offline. This only works over HTTPS or on localhost, so it needs proper hosting to help on the iPad.
- `node scripts/make-icons.mjs` redraws the icon PNGs.

## Share links
- A made puzzle is a level: fixed parts, tray, goal and a reference solution. It is packed into compact JSON with short keys, base64url-encoded and put after  in the link. The part after  never reaches the server.
- Opening a link decodes and **validates** it before anything is drawn:
  - the part kinds must be known;
  - positions must be on the half-cell grid and inside the table;
  - angles must be in 15° steps;
  - at most 40 parts, and a size limit on the code;
  - the goal must point at real parts of the right kinds.
  Anything wrong is ignored and the map opens instead.
- A link holds only the puzzle. Nothing about the person who made it is in it.

## Roadmap
**Done in Milestone 2:** hamster and conveyor parts, levels 6–8, the paper-grain pass, home-screen install and offline play.

**Done in Milestone 3:** GitHub Pages hosting, rotate buttons, nicer voice choice, grown-ups' corner, logo, levels 9–30 (every part is now used), a scrolling map.

**Done in Milestone 4:** hints, the puzzle maker with share links, rooms on the map.

**Next:** see [roadmap.md](roadmap.md). Milestone 5 is guess the path, the film strip and the sticker book.
