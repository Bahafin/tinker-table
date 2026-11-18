import type { Level } from '../sim/types';
import l1 from './01-roll.json';
import l2 from './02-dominoes.json';
import l3 from './03-seesaw.json';
import l4 from './04-balloon.json';
import l5 from './05-chain.json';
import { ALL_PARTS } from '../sim/parts';

export const LEVELS = [l1, l2, l3, l4, l5] as Level[];

export const TOY_BOX: Level = {
  id: 'toybox',
  voice: 'The toy box! Build anything you like.',
  fixed: [],
  tray: ALL_PARTS.map((part) => ({ part, count: Infinity })),
};
