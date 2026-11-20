import { describe, expect, test } from 'vitest';
import { decodeLevel, decodeToy, encodeLevel, encodeToy } from '../src/levels/share';
import { LEVELS } from '../src/levels';
import { Sim } from '../src/sim/sim';
import type { Level } from '../src/sim/types';

const made: Level = {
  id: 'x', voice: 'x',
  goal: { type: 'reach', object: 'goal-object', target: 'goal-target' },
  fixed: [
    { part: 'ball', id: 'goal-object', x: 1.5, y: 1 },
    { part: 'ramp', x: 2.5, y: 2.5, rot: 15 },
    { part: 'basket', id: 'goal-target', x: 12, y: 9.5 },
  ],
  tray: [{ part: 'ramp', count: 1 }],
  solution: [{ part: 'ramp', x: 7, y: 5, rot: 15 }],
};

const raw = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('share codes', () => {
  test('round trip keeps the puzzle', () => {
    const back = decodeLevel(encodeLevel(made))!;
    expect(back).not.toBeNull();
    expect(back.fixed.map((p) => [p.part, p.x, p.y, p.rot ?? 0])).toEqual(made.fixed.map((p) => [p.part, p.x, p.y, p.rot ?? 0]));
    expect(back.solution).toEqual(made.solution);
    expect(back.tray).toEqual([{ part: 'ramp', count: 1 }]);
    expect(back.fixed[0].id).toBe(back.goal!.object);
    expect(back.fixed[2].id).toBe(back.goal!.target);
  });

  test('a decoded puzzle plays the same', () => {
    const back = decodeLevel(encodeLevel(made))!;
    const run = (l: Level) => new Sim([...l.fixed.map((p) => ({ ...p, fixed: true })), ...l.solution!], l.goal).runHeadless();
    expect(run(back)).toBe(run(made));
  });

  test('every built-in level fits in a short code', () => {
    for (const l of LEVELS) {
      const code = encodeLevel(l);
      expect(code.length).toBeLessThan(2000);
      expect(decodeLevel(code)).not.toBeNull();
    }
  });

  const good = { v: 1, f: [[0, 3, 2, 0], [5, 24, 19, 0]], s: [[2, 14, 10, 1]], g: [0, 1] };
  test('the hand-made good example decodes', () => {
    expect(decodeLevel(raw(good))).not.toBeNull();
  });

  test.each([
    ['empty', ''],
    ['not base64', '!!!'],
    ['not JSON', btoa('hello')],
    ['wrong version', raw({ ...good, v: 2 })],
    ['unknown part', raw({ ...good, f: [[99, 3, 2, 0], [5, 24, 19, 0]] })],
    ['off the table', raw({ ...good, s: [[2, 80, 10, 0]] })],
    ['between grid spots', raw({ ...good, s: [[2, 14.3, 10, 0]] })],
    ['odd angle', raw({ ...good, s: [[2, 14, 10, 0.5]] })],
    ['turned ball', raw({ ...good, f: [[0, 3, 2, 3], [5, 24, 19, 0]] })],
    ['goal object not a mover', raw({ ...good, g: [1, 1] })],
    ['target not a goal', raw({ ...good, f: [[0, 3, 2, 0], [2, 24, 19, 0]] })],
    ['goal index missing', raw({ ...good, g: [0, 7] })],
    ['nothing to place', raw({ ...good, s: [] })],
    ['too many parts', raw({ ...good, s: Array(45).fill([2, 14, 10, 0]) })],
    ['too long', 'A'.repeat(5000)],
    ['strings for numbers', raw({ ...good, s: [['2', 14, 10, 0]] })],
  ])('rejects %s', (_name, code) => {
    expect(decodeLevel(code as string)).toBeNull();
  });
});

describe('kept toy-box machines', () => {
  const parts = [
    { part: 'ball' as const, x: 3, y: 3 },
    { part: 'ramp' as const, x: 5, y: 5, rot: 15 },
    { part: 'hamster' as const, x: 9, y: 9.5, rot: 180 },
    { part: 'ball' as const, x: 12, y: 2, skin: 'garden' },
  ];
  test('round trip keeps every part', () => {
    expect(decodeToy(encodeToy(parts))).toEqual(parts);
  });
  test('rejects junk', () => {
    expect(decodeToy('')).toBeNull();
    expect(decodeToy('not json!')).toBeNull();
    expect(decodeToy(btoa(JSON.stringify({ v: 1, t: [[99, 2, 2, 0]] })))).toBeNull();
    expect(decodeToy(btoa(JSON.stringify({ v: 1, t: [[0, 200, 2, 0]] })))).toBeNull();
    expect(decodeToy(btoa(JSON.stringify({ v: 1, t: [[0, 2, 2, 0, 99]] })))).toBeNull();
  });
});
