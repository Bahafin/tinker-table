import { describe, expect, test } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { Placement } from '../src/sim/types';

/** Run for a number of steps and return the sim. */
function run(parts: Placement[], steps: number) {
  const s = new Sim(parts);
  for (let i = 0; i < steps && !s.settled; i++) s.step();
  return s;
}
const at = (s: Sim, i: number, body = 0) => s.parts[i].bodies[body].getPosition();

describe('soap (bathroom)', () => {
  test('squirts away the way it points when something lands on it', () => {
    const right = run([{ part: 'soap', x: 3, y: 9.5 }, { part: 'ball', x: 3, y: 6 }], 240);
    expect(right.parts[0].state.on).toBe(true);
    expect(at(right, 0).x).toBeGreaterThan(9);
    const left = run([{ part: 'soap', x: 12, y: 9.5, rot: 180 }, { part: 'ball', x: 12, y: 6 }], 240);
    expect(at(left, 0).x).toBeLessThan(6);
  });

  test('a big ball sitting on it does not hold it back', () => {
    const s = run([{ part: 'soap', x: 3, y: 9.5 }, { part: 'heavyball', x: 3, y: 6 }], 240);
    expect(at(s, 0).x).toBeGreaterThan(9);
  });

  test('comes to rest after a while', () => {
    const s = new Sim([{ part: 'soap', x: 3, y: 9.5 }, { part: 'ball', x: 3, y: 6 }]);
    s.runHeadless();
    expect(s.time).toBeLessThan(12);
  });
});

describe('magnet (garage)', () => {
  test('pulls a little ball off its shelf and holds it', () => {
    const s = run([{ part: 'ball', x: 4, y: 3.5 }, { part: 'block', x: 4, y: 4.5 }, { part: 'magnet', x: 7, y: 3.5, rot: 180 }], 300);
    const b = at(s, 0);
    expect(b.x).toBeGreaterThan(6);
    expect(b.y).toBeLessThan(4.2);
  });

  test('does not pull the big ball, or anything behind it', () => {
    const big = run([{ part: 'heavyball', x: 4, y: 3.45 }, { part: 'block', x: 4, y: 4.5 }, { part: 'magnet', x: 7, y: 3.5, rot: 180 }], 120);
    expect(at(big, 0).x).toBeCloseTo(4, 1);
    const behind = run([{ part: 'ball', x: 4, y: 3.5 }, { part: 'block', x: 4, y: 4.5 }, { part: 'magnet', x: 7, y: 3.5 }], 120);
    expect(at(behind, 0).x).toBeCloseTo(4, 1);
  });

  test('cannot reach a ball far away', () => {
    const s = run([{ part: 'ball', x: 1, y: 3.5 }, { part: 'block', x: 1, y: 4.5 }, { part: 'magnet', x: 7, y: 3.5, rot: 180 }], 120);
    expect(at(s, 0).x).toBeCloseTo(1, 1);
  });
});

describe('pillow (bedroom)', () => {
  test('stops a falling ball dead, where a spring would bounce it', () => {
    const pillow = run([{ part: 'ball', x: 5, y: 2 }, { part: 'pillow', x: 5, y: 8 }], 240);
    expect(at(pillow, 0).y).toBeGreaterThan(7.3);
    const spring = new Sim([{ part: 'ball', x: 5, y: 2 }, { part: 'spring', x: 5, y: 8 }]);
    let highAfterHit = 99, hit = false;
    for (let i = 0; i < 240; i++) {
      spring.step();
      const y = at(spring, 0).y;
      if (y > 7.2) hit = true;
      if (hit) highAfterHit = Math.min(highAfterHit, y);
    }
    expect(highAfterHit).toBeLessThan(5);
  });
});

describe('rocket (space)', () => {
  test('stays on its stand until something bumps it', () => {
    const s = run([{ part: 'rocket', x: 5, y: 9.5 }], 120);
    expect(s.parts[0].state.on).toBe(false);
    expect(at(s, 0).y).toBeGreaterThan(9);
  });

  test('blasts off when bumped, then floats down on its parachute', () => {
    const s = new Sim([{ part: 'rocket', x: 5, y: 9.5 }, { part: 'ball', x: 4.4, y: 7 }]);
    let top = 99;
    for (let i = 0; i < 600 && !s.settled; i++) { s.step(); top = Math.min(top, at(s, 0).y); }
    expect(s.parts[0].state.on).toBe(true);
    expect(s.parts[0].state.chute).toBe(true);
    expect(top).toBeLessThan(5);
    expect(at(s, 0).y).toBeGreaterThan(8);
  });

  test('flies the way it points', () => {
    const s = run([{ part: 'rocket', x: 3, y: 9, rot: 30 }, { part: 'ball', x: 2.4, y: 7 }], 150);
    expect(at(s, 0).x).toBeGreaterThan(6);
  });
});
