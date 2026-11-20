export type PartKind =
  | 'ball' | 'heavyball' | 'ramp' | 'shortramp' | 'block' | 'basket' | 'star'
  | 'domino' | 'seesaw' | 'balloon' | 'pin' | 'fan' | 'spring' | 'pulley'
  | 'hamster' | 'conveyor' | 'cheese' | 'car' | 'hammer' | 'toaster' | 'can' | 'flower' | 'rope' | 'scissors'
  | 'bell' | 'drum' | 'xylo-c' | 'xylo-d' | 'xylo-e' | 'xylo-g' | 'xylo-a';

/** A sound a musical part makes: one of the five xylophone notes, the bell or the drum. */
export type Note = 'c' | 'd' | 'e' | 'g' | 'a' | 'bell' | 'drum';

/** A part placed on the table, in cell coordinates (centre), rot in degrees clockwise. */
export interface Placement {
  part: PartKind;
  id?: string;
  x: number;
  y: number;
  rot?: number;
  /** Came with the level: cannot be moved by the player. */
  fixed?: boolean;
  /** Toy box: drawn in this room's look ('' or missing: the table's own look). */
  skin?: string;
}

/** The centre of `object` is inside `target`'s goal zone. */
export interface ReachGoal {
  type: 'reach';
  object: string;
  target: string;
}

/**
 * Play a tune: the last notes played, in order, are `notes`. `object` is the thing whose
 * path is followed (for guess the path); it doesn't have to arrive anywhere.
 */
export interface TuneGoal {
  type: 'tune';
  object: string;
  notes: Note[];
}

export type Goal = ReachGoal | TuneGoal;

export interface Level {
  id: string;
  voice: string;
  goal?: Goal;
  fixed: Placement[];
  tray: { part: PartKind; count: number }[];
  solution?: Placement[];
  /** How hard the level is (higher is harder), from scripts/level-stats. Built-in levels only. */
  difficulty?: number;
}

export type SimEvent =
  | { type: 'clack'; strength: number }
  | { type: 'pop'; x: number; y: number }
  | { type: 'boing' }
  | { type: 'whoosh' }
  | { type: 'squeak' }
  | { type: 'ding' }
  | { type: 'pour' }
  | { type: 'drip' }
  | { type: 'snip' }
  | { type: 'note'; note: Note; x: number; y: number };

export const WORLD_W = 16;
export const WORLD_H = 10;
