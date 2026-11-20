import { describe, expect, test } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { Placement } from '../src/sim/types';

const ball: Placement = { part: 'ball', id: 'ball1', x: 2.3, y: 1 };
/** Three bars going down to the right like stairs, so a dropped ball bounces from one to the next. */
const stairs: Placement[] = [
  { part: 'xylo-c', x: 2.5, y: 3, rot: 15 },
  { part: 'xylo-e', x: 4.5, y: 4.5, rot: 15 },
  { part: 'xylo-g', x: 6.5, y: 6, rot: 15 },
];

describe('musical parts', () => {
  test('a ball bouncing down the bars plays them in order', () => {
    const s = new Sim([ball, ...stairs]);
    s.runHeadless();
    expect(s.played.slice(0, 3)).toEqual(['c', 'e', 'g']);
  });

  test('a tune goal is met by playing its notes in order', () => {
    const s = new Sim([ball, ...stairs], { type: 'tune', object: 'ball1', notes: ['c', 'e', 'g'] });
    expect(s.runHeadless()).toBe(true);
  });

  test('a tune goal is not met by other notes', () => {
    const s = new Sim([ball, ...stairs], { type: 'tune', object: 'ball1', notes: ['g', 'e', 'c'] });
    expect(s.runHeadless()).toBe(false);
  });

  test('a ball resting on a bar does not keep ringing', () => {
    const s = new Sim([{ part: 'ball', x: 5, y: 4.4 }, { part: 'xylo-a', x: 5, y: 5 }]);
    s.runHeadless();
    expect(s.played.length).toBeLessThanOrEqual(1);
  });

  test('the bell wakes a hamster close by, but not one far away', () => {
    const near = new Sim([{ part: 'ball', x: 4, y: 5 }, { part: 'bell', x: 4, y: 7 }, { part: 'hamster', x: 7, y: 9.5 }]);
    for (let i = 0; i < 120; i++) near.step();
    expect(near.parts.find((p) => p.kind === 'hamster')!.state.on).toBe(true);
    const far = new Sim([{ part: 'ball', x: 4, y: 5 }, { part: 'bell', x: 4, y: 7 }, { part: 'hamster', x: 12, y: 9.5 }]);
    for (let i = 0; i < 120; i++) far.step();
    expect(far.parts.find((p) => p.kind === 'hamster')!.state.on).toBeFalsy();
  });

  test('the drum bounces a ball back up', () => {
    const s = new Sim([{ part: 'ball', x: 5, y: 2 }, { part: 'drum', x: 5, y: 9.5 }]);
    let low = 0, highAfter = 99;
    for (let i = 0; i < 240; i++) {
      s.step();
      const y = s.parts[0].bodies[0].getPosition().y;
      if (y > low) low = y;
      if (low > 8 && y < highAfter) highAfter = y;
    }
    expect(s.played).toContain('drum');
    expect(highAfter).toBeLessThan(5);
  });
});
