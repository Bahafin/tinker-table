export type PartKind =
  | 'ball' | 'heavyball' | 'ramp' | 'shortramp' | 'block' | 'basket' | 'star'
  | 'domino' | 'seesaw' | 'balloon' | 'pin' | 'fan' | 'spring' | 'pulley'
  | 'hamster' | 'conveyor' | 'cheese' | 'car' | 'hammer' | 'toaster' | 'can' | 'flower' | 'rope' | 'scissors';

/** A part placed on the table, in cell coordinates (centre), rot in degrees clockwise. */
export interface Placement {
  part: PartKind;
  id?: string;
  x: number;
  y: number;
  rot?: number;
  /** Came with the level: cannot be moved by the player. */
  fixed?: boolean;
}

/** The centre of `object` is inside `target`'s goal zone. */
export interface Goal {
  type: 'reach';
  object: string;
  target: string;
}

export interface Level {
  id: string;
  voice: string;
  goal?: Goal;
  fixed: Placement[];
  tray: { part: PartKind; count: number }[];
  solution?: Placement[];
}

export type SimEvent =
  | { type: 'clack'; strength: number }
  | { type: 'pop' }
  | { type: 'boing' }
  | { type: 'whoosh' }
  | { type: 'squeak' }
  | { type: 'ding' }
  | { type: 'pour' }
  | { type: 'drip' }
  | { type: 'snip' };

export const WORLD_W = 16;
export const WORLD_H = 10;
