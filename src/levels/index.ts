import type { Level, PartKind } from '../sim/types';
import l1 from './01-roll.json';
import l2 from './02-dominoes.json';
import l3 from './03-seesaw.json';
import l4 from './04-balloon.json';
import l5 from './05-chain.json';
import l6 from './06-hamster.json';
import l7 from './07-conveyor.json';
import l8 from './08-wake-up.json';
import l9 from './09-bridge.json';
import l10 from './10-boing.json';
import l11 from './11-pop.json';
import l12 from './12-uphill.json';
import l13 from './13-wind.json';
import l14 from './14-lift.json';
import l15 from './15-bank-shot.json';
import l16 from './16-pusher.json';
import l17 from './17-safe-balloon.json';
import l18 from './18-belt-boing.json';
import l19 from './19-big-machine.json';
import l20 from './20-goes-up.json';
import l21 from './21-hold-down.json';
import l22 from './22-catapult.json';
import l23 from './23-domino-switch.json';
import l24 from './24-under-belt.json';
import l25 from './25-ski-jump.json';
import l26 from './26-pop-motor.json';
import l27 from './27-domino-stairs.json';
import l28 from './28-hopscotch.json';
import l29 from './29-catch-carry.json';
import l30 from './30-grand-finale.json';
import l31 from './31-car-push.json';
import l32 from './32-car-ride.json';
import l33 from './33-car-catapult.json';
import l34 from './34-hammer.json';
import l35 from './35-hammer-face.json';
import l36 from './36-hammer-dominoes.json';
import l37 from './37-toaster.json';
import l38 from './38-toaster-wall.json';
import l39 from './39-toaster-hamster.json';
import l40 from './40-watering-can.json';
import l41 from './41-water-path.json';
import l42 from './42-water-wake.json';
import l43 from './43-snip.json';
import l44 from './44-swing-snip.json';
import l45 from './45-car-snip.json';
import l46 from './46-belt-hammer.json';
import l47 from './47-boing-can.json';
import l48 from './48-toaster-belt.json';
import l49 from './49-car-jump.json';
import l50 from './50-snip-boing.json';
import l51 from './51-first-notes.json';
import l52 from './52-drum-jump.json';
import l53 from './53-alarm-bell.json';
import l54 from './54-zigzag-song.json';
import l55 from './55-boom-ding.json';
import l56 from './56-fling-ring.json';
import l57 from './57-xylophone-bridge.json';
import l58 from './58-hamster-song.json';
import l59 from './59-toaster-tune.json';
import l60 from './60-grand-concert.json';
import l61 from './61-soap-squirt.json';
import l62 from './62-soap-push.json';
import l63 from './63-soap-turn.json';
import l64 from './64-soap-slide.json';
import l65 from './65-soap-fan.json';
import l66 from './66-soap-hamster.json';
import l67 from './67-soap-roll.json';
import l68 from './68-soap-two.json';
import l69 from './69-soap-lift.json';
import l70 from './70-bath-blow.json';
import l71 from './71-magnet.json';
import l72 from './72-magnet-star.json';
import l73 from './73-magnet-seesaw.json';
import l74 from './74-magnet-boing.json';
import l75 from './75-magnet-wake.json';
import l76 from './76-magnet-car.json';
import l77 from './77-magnet-wall.json';
import l78 from './78-magnet-high.json';
import l79 from './79-magnet-three.json';
import l80 from './80-magnet-fling.json';
import l81 from './81-pillow.json';
import l82 from './82-pillow-boing.json';
import l83 from './83-pillow-seesaw.json';
import l84 from './84-pillow-spring.json';
import l85 from './85-pillow-belt.json';
import l86 from './86-pillow-ramp.json';
import l87 from './87-pillow-fling.json';
import l88 from './88-pillow-three.json';
import l89 from './89-pillow-belt-two.json';
import l90 from './90-pillow-bedtime.json';
import l91 from './91-rocket.json';
import l92 from './92-rocket-aim.json';
import l93 from './93-rocket-boing.json';
import l94 from './94-rocket-fan.json';
import l95 from './95-rocket-land.json';
import l96 from './96-rocket-seesaw.json';
import l97 from './97-rocket-hamster.json';
import l98 from './98-rocket-two.json';
import l99 from './99-rocket-ramp.json';
import l100 from './100-grand-launch.json';
import { ALL_PARTS, TOY_PARTS } from '../sim/parts';

/**
 * Ten levels per room, easiest first. Every level has a `difficulty` score (see
 * scripts/level-stats.test.ts and docs/design.md), and the order keeps two rules,
 * checked by tests/levels.test.ts: inside a room each level is harder than the one
 * before, and each room is harder on average than the room before it.
 */
export const LEVELS = [
  // Workshop
  l6, l34, l1, l46, l10, l13, l16, l36, l3, l35,
  // Playroom
  l31, l11, l8, l5, l20, l12, l49, l17, l32, l33,
  // Bathroom
  l61, l64, l63, l66, l68, l62, l69, l65, l67, l70,
  // Attic
  l43, l4, l2, l44, l22, l14, l27, l45, l50, l18,
  // Space
  l91, l97, l93, l95, l94, l92, l96, l98, l99, l100,
  // Kitchen
  l37, l9, l7, l48, l38, l23, l21, l26, l39, l30,
  // Bedroom
  l81, l82, l83, l85, l89, l86, l87, l84, l88, l90,
  // Garden
  l40, l42, l47, l15, l41, l24, l28, l25, l29, l19,
  // Garage
  l71, l72, l76, l73, l75, l80, l78, l74, l79, l77,
  // Music room
  l51, l52, l53, l55, l56, l54, l58, l57, l59, l60,
] as Level[];

/**
 * Rooms on the map, in order of difficulty: ten levels each, at least four of them using
 * the room's own part (all ten in the four newest rooms and the Music room). Each room has its own paper tint (cards and the table) and an
 * accent colour for its banner.
 */
export interface Room { id: string; name: string; first: number; count: number; paper: string; accent: string }
/** Each room's own part: on its toy box tray tab and its sticker book tab. */
export const ROOM_PART: Record<string, PartKind> = {
  workshop: 'hammer', playroom: 'car', attic: 'scissors', kitchen: 'toaster', garden: 'can',
  bathroom: 'soap', garage: 'magnet', bedroom: 'pillow', space: 'rocket', music: 'bell',
};

export const ROOMS: Room[] = [
  { id: 'workshop', name: 'Workshop', first: 0, count: 10, paper: '#f4ecdc', accent: '#c79a5b' },
  { id: 'playroom', name: 'Playroom', first: 10, count: 10, paper: '#e6eef5', accent: '#5aa2d6' },
  { id: 'bathroom', name: 'Bathroom', first: 20, count: 10, paper: '#e3f1f4', accent: '#3aa6b9' },
  { id: 'attic', name: 'Attic', first: 30, count: 10, paper: '#ece7f1', accent: '#3d4a73' },
  { id: 'space', name: 'Space', first: 40, count: 10, paper: '#dfe8ef', accent: '#6b3fa0' },
  { id: 'kitchen', name: 'Kitchen', first: 50, count: 10, paper: '#f7e7dc', accent: '#e5583f' },
  { id: 'bedroom', name: 'Bedroom', first: 60, count: 10, paper: '#eef0fb', accent: '#6a72c9' },
  { id: 'garden', name: 'Garden', first: 70, count: 10, paper: '#edf1dc', accent: '#7cae4e' },
  { id: 'garage', name: 'Garage', first: 80, count: 10, paper: '#ebe7e1', accent: '#d9822b' },
  { id: 'music', name: 'Music room', first: 90, count: 10, paper: '#f6e9ef', accent: '#b5527f' },
];
/**
 * Each room draws some parts as its own things (see render/skins.ts), so the spoken goal
 * uses the same words. Applied in order; longer phrases come first.
 */
const WORDS: Record<string, [RegExp, string][]> = {
  workshop: [[/\bbasket\b/g, 'toolbox'], [/\bstar\b/g, 'gear'], [/\bpins\b/g, 'screws'], [/\bpin\b/g, 'screw']],
  garden: [
    [/\b(big|heavy) ball\b/g, 'pumpkin'], [/\ba ball\b/g, 'an apple'], [/\bballs\b/g, 'apples'], [/\bball\b/g, 'apple'],
    [/\bbasket\b/g, 'flower pot'], [/\bstar\b/g, 'butterfly'], [/\bdominoes\b/g, 'fence posts'],
    [/\bpins\b/g, 'cactuses'], [/\bpin\b/g, 'cactus'], [/\bMake a ramp\b/g, 'Lay a branch'], [/\ba ramp\b/g, 'a branch'], [/\bramps\b/g, 'branches'], [/\bramp\b/g, 'branch'],
  ],
  kitchen: [
    [/\b(big|heavy) ball\b/g, 'melon'], [/\ba ball\b/g, 'a bagel'], [/\bballs\b/g, 'bagels'], [/\bball\b/g, 'bagel'],
    [/\bbasket\b/g, 'pot'], [/\bstar\b/g, 'cookie'], [/\bdominoes\b/g, 'cereal boxes'],
    [/\bpins\b/g, 'forks'], [/\bpin\b/g, 'fork'], [/\bramps\b/g, 'cutting boards'], [/\bramp\b/g, 'cutting board'],
  ],
  playroom: [
    [/\b(big|heavy) ball\b/g, 'bowling ball'], [/\bbasket\b/g, 'toy chest'], [/\bdominoes\b/g, 'crayons'],
    [/\bpins\b/g, 'drawing pins'], [/\bpin\b/g, 'drawing pin'], [/\bramps\b/g, 'tracks'], [/\bramp\b/g, 'track'],
  ],
  bathroom: [
    [/\b(big|heavy) ball\b/g, 'sponge'], [/\ba ball\b/g, 'a duck'], [/\bballs\b/g, 'ducks'], [/\bball\b/g, 'duck'],
    [/\bbasket\b/g, 'bathtub'], [/\bstar\b/g, 'starfish'], [/\bdominoes\b/g, 'bottles'],
    [/\bballoons\b/g, 'bubbles'], [/\bballoon\b/g, 'bubble'],
  ],
  garage: [
    [/\b(big|heavy) ball\b/g, 'tyre'], [/\bbasket\b/g, 'bucket'], [/\bdominoes\b/g, 'oil cans'],
    [/\bpins\b/g, 'nails'], [/\bpin\b/g, 'nail'],
  ],
  bedroom: [[/\b(big|heavy) ball\b/g, 'teddy'], [/\bbasket\b/g, 'laundry basket']],
  space: [
    [/\b(big|heavy) ball\b/g, 'planet'], [/\ba ball\b/g, 'a moon rock'], [/\bballs\b/g, 'moon rocks'], [/\bball\b/g, 'moon rock'],
    [/\bdominoes\b/g, 'robots'],
  ],
  attic: [
    [/\b(big|heavy) ball\b/g, 'globe'], [/\bballs\b/g, 'marbles'], [/\bball\b/g, 'marble'],
    [/\bbasket\b/g, 'trunk'], [/\bstar\b/g, 'moon'], [/\bdominoes\b/g, 'books'], [/\bDominoes\b/g, 'Books'],
    [/\bpins\b/g, 'needles'], [/\bpin\b/g, 'needle'], [/\bramps\b/g, 'floorboards'], [/\bramp\b/g, 'floorboard'],
  ],
};
/** A level's spoken goal in its room's words ("ball" becomes "apple" in the garden). */
export function roomVoice(roomId: string | undefined, voice: string) {
  for (const [re, to] of WORDS[roomId ?? ''] ?? []) voice = voice.replace(re, to);
  return voice;
}

export const roomOf =(levelIndex: number) => ROOMS.find((r) => levelIndex >= r.first && levelIndex < r.first + r.count);

export const TOY_BOX: Level = {
  id: 'toybox',
  voice: 'The toy box! Build anything you like.',
  fixed: [],
  tray: TOY_PARTS.map((part) => ({ part, count: Infinity })),
};

/** The puzzle maker: every part, goals included. Build a machine, then make it a puzzle. */
export const MAKER_BOX: Level = {
  id: 'maker',
  voice: 'Build a machine, then turn it into a puzzle!',
  fixed: [],
  tray: ALL_PARTS.map((part) => ({ part, count: Infinity })),
};
