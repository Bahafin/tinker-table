// What the puzzle maker says at each step, so a child who can't read yet knows what to tap
// next (and why a puzzle didn't work). Each line has a recorded clip, like every other line.
export const MAKER_SAY = {
  /** After the star button: pick the goal object. */
  object: 'Tap the thing that travels.',
  /** Then the goal target. */
  target: 'Now tap where it should go.',
  /** Then pins, and the tick. */
  pins: 'Tap the parts that stay put, to pin them. Then tap the tick!',
  /** The tick, with every part pinned: nothing would be left for the tray. */
  noTray: 'Leave some parts without a pin. They go in the tray, for the solver!',
  /** The tick, but the machine doesn't reach the goal. */
  broken: "The machine doesn't work yet. Make it work first!",
  /** The tick, but it reaches the goal without the tray parts. */
  tooEasy: 'It works even without the tray parts! Take the pin off a part it needs.',
  /** A starter machine, opened from the puzzle maker room. */
  starter: "Here's a machine that works! Press go to watch it. Then tap the star, to make it a puzzle.",
};
