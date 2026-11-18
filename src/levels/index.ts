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
import { TOY_PARTS } from '../sim/parts';

export const LEVELS = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14] as Level[];

export const TOY_BOX: Level = {
  id: 'toybox',
  voice: 'The toy box! Build anything you like.',
  fixed: [],
  tray: TOY_PARTS.map((part) => ({ part, count: Infinity })),
};
