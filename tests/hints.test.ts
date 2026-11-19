import { describe, expect, test } from 'vitest';
import { matches, nextHint } from '../src/ui/hints';
import { LEVELS } from '../src/levels';
import type { Placement } from '../src/sim/types';

describe('hints', () => {
  const sol: Placement[] = [
    { part: 'ramp', x: 5, y: 4, rot: 15 },
    { part: 'spring', x: 9, y: 9.5, rot: 0 },
  ];

  test('shows the first missing part', () => {
    expect(nextHint(sol, [])).toEqual(sol[0]);
  });

  test('skips parts already in place, even if a little off', () => {
    expect(nextHint(sol, [{ part: 'ramp', x: 5.5, y: 4, rot: 15 }])).toEqual(sol[1]);
  });

  test('a part at the wrong angle does not count', () => {
    expect(nextHint(sol, [{ part: 'ramp', x: 5, y: 4, rot: -15 }])).toEqual(sol[0]);
  });

  test('a plank turned half a turn is the same plank', () => {
    expect(matches(sol[0], { part: 'ramp', x: 5, y: 4, rot: 195 })).toBe(true);
  });

  test('a flip part must face the same way', () => {
    const belt: Placement = { part: 'conveyor', x: 3, y: 5, rot: 180 };
    expect(matches(belt, { part: 'conveyor', x: 3, y: 5, rot: 0 })).toBe(false);
    expect(matches(belt, { part: 'conveyor', x: 3, y: 5, rot: -180 })).toBe(true);
  });

  test('one placed part only covers one solution part', () => {
    const two: Placement[] = [{ part: 'domino', x: 6, y: 5 }, { part: 'domino', x: 6.5, y: 5 }];
    expect(nextHint(two, [{ part: 'domino', x: 6, y: 5 }])).toEqual(two[1]);
  });

  test('nothing to show when solved or without a solution', () => {
    expect(nextHint(sol, sol)).toBeNull();
    expect(nextHint(undefined, [])).toBeNull();
  });

  test('every level has a solution to hint from', () => {
    for (const l of LEVELS) expect(nextHint(l.solution, [])).not.toBeNull();
  });
});
