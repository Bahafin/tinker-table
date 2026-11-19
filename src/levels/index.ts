import type { Level } from '../sim/types';
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
import { TOY_PARTS } from '../sim/parts';

/**
 * Ten levels per room, easiest first. Every level has a `difficulty` score (see
 * scripts/level-stats.test.ts and docs/design.md), and the order keeps two rules,
 * checked by tests/levels.test.ts: inside a room each level is harder than the one
 * before, and each room's Nth level is harder than the previous room's Nth level.
 */
export const LEVELS = [
  // Workshop
  l6, l34, l11, l1, l46, l10, l13, l16, l36, l35,
  // Playroom
  l31, l8, l5, l20, l3, l12, l49, l17, l32, l33,
  // Attic
  l43, l4, l2, l44, l22, l14, l15, l45, l50, l18,
  // Kitchen
  l37, l9, l7, l48, l38, l23, l21, l26, l39, l19,
  // Garden
  l40, l42, l47, l41, l24, l27, l28, l25, l29, l30,
] as Level[];

/**
 * Rooms on the map, in order of difficulty: ten levels each, four of them using the
 * room's own part. Each room has its own paper tint (cards and the table) and an
 * accent colour for its banner.
 */
export interface Room { id: string; name: string; first: number; count: number; paper: string; accent: string }
export const ROOMS: Room[] = [
  { id: 'workshop', name: 'Workshop', first: 0, count: 10, paper: '#f4ecdc', accent: '#c79a5b' },
  { id: 'playroom', name: 'Playroom', first: 10, count: 10, paper: '#e6eef5', accent: '#5aa2d6' },
  { id: 'attic', name: 'Attic', first: 20, count: 10, paper: '#ece7f1', accent: '#3d4a73' },
  { id: 'kitchen', name: 'Kitchen', first: 30, count: 10, paper: '#f7e7dc', accent: '#e5583f' },
  { id: 'garden', name: 'Garden', first: 40, count: 10, paper: '#edf1dc', accent: '#7cae4e' },
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
    [/\b(big|heavy) ball\b/g, 'melon'], [/\ba ball\b/g, 'an orange'], [/\bballs\b/g, 'oranges'], [/\bball\b/g, 'orange'],
    [/\bbasket\b/g, 'pot'], [/\bstar\b/g, 'cookie'], [/\bdominoes\b/g, 'cereal boxes'],
    [/\bpins\b/g, 'forks'], [/\bpin\b/g, 'fork'], [/\bramps\b/g, 'cutting boards'], [/\bramp\b/g, 'cutting board'],
  ],
  playroom: [
    [/\b(big|heavy) ball\b/g, 'bowling ball'], [/\bbasket\b/g, 'toy chest'], [/\bdominoes\b/g, 'crayons'],
    [/\bpins\b/g, 'drawing pins'], [/\bpin\b/g, 'drawing pin'], [/\bramps\b/g, 'tracks'], [/\bramp\b/g, 'track'],
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
