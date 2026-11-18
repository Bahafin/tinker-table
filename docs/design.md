# Tinker Table — design doc (Milestone 1)

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
4. **Tap a placed part to rotate it** 15° clockwise. Parts whose angle doesn't matter (ball, block) give a little wiggle instead.
5. **Drag a part back onto the tray to remove it.** There is no delete button and no long-press.
6. **Parts that came with the level are fixed:** they can't be moved and have a small brass pin on them. Parts the child placed can always be moved.
7. **No fail state, no timer, no score.** A missed run softly resets after the machine settles, with a gentle "hmm" sound.
8. **Success = confetti, a chime and a slow replay.** Then three big icons appear: replay, next and home.
9. **A slow-motion toggle** (snail button) is always available.
10. **One voice line per level,** and the speaker button replays it.

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
| Balloon | Ø 0.9 | dynamic, floats | Rises and pops when it touches a pin. |
| Pin | 0.6 | static spike | Pops balloons. |
| Fan | 1 × 1 | static | Starts when anything bumps it, then blows along its facing (4 cells reach). |
| Spring pad | 1.4 × 0.3 | static, very bouncy | Throws things back up. |
| Pulley bucket | 3 × 4 | bucket + counterweight on a pulley rope | A ball in the bucket lifts the weight. |

Characters (for example a sleepy hamster that runs its wheel when woken) come later.

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
- **The goal is reached** when the centre of `object` is inside `target`'s goal zone (the inside of the basket, or the star's area).
- **Every level must pass two automated checks:** its `solution` reaches the goal, and the level with nothing placed does **not**.

## Milestone 1 levels
1. **Roll:** guide a ball down to the basket using ramps.
2. **Dominoes:** a ball rolls into a row of dominoes, and the last one tips into the basket area.
3. **See-saw:** drop the heavy ball on a see-saw to launch the other ball.
4. **Balloon:** guide a balloon up to the star.
5. **Chain:** a three-step machine that combines what came before.

Plus the **toy box**: every part, unlimited, no goal.

## Look: paper craft
- **Background:** warm off-white paper with a faint dot grid.
- **Parts:** flat paper colours (tomato, mustard, teal, sky, kraft brown), each with a soft drop shadow so it looks cut out and lifted off the table.
- **Fixed parts** have a small brass pin drawn on them.
- **Later**, real paper textures and hand-drawn sprites replace the flat shapes. Each part's draw function is isolated so this swap doesn't touch the physics.

## Sound and voice
- **Sound effects** are synthesised with Web Audio: place, rotate, clack, pop, boing, whoosh, chime and hmm.
- **The voice** is a `speechSynthesis` placeholder for now. Later it will be the parent's own recorded voice.

## Roadmap after Milestone 1
- Paper-craft art pass.
- Recorded narration.
- More parts: hamster wheel, conveyor, magnet, scissors that cut a rope.
- Rooms or worlds.
- Tilt puzzles using the iPad's sensors, which needs HTTPS hosting.
- Installable home-screen app with offline play.
- Deciding whether a native App Store build is worth it.
