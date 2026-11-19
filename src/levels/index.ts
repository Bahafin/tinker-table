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
import { TOY_PARTS } from '../sim/parts';

export const LEVELS = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15, l16, l17, l18, l19, l20, l21, l22, l23, l24, l25, l26, l27, l28, l29, l30] as Level[];

export const TOY_BOX: Level = {
  id: 'toybox',
  voice: 'The toy box! Build anything you like.',
  fixed: [],
  tray: TOY_PARTS.map((part) => ({ part, count: Infinity })),
};
