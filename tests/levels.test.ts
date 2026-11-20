import { describe, expect, test } from 'vitest';
import { LEVELS } from '../src/levels';
import { Sim } from '../src/sim/sim';
import { clampToWorld, overlapsAny, settle } from '../src/sim/placement';
import type { Level, Placement } from '../src/sim/types';

const fixedOf = (l: Level): Placement[] => l.fixed.map((p) => ({ ...p, fixed: true }));

describe.each(LEVELS.map((l) => [l.id, l] as const))('level %s', (_id, level) => {
  test('is not solved with nothing placed', () => {
    expect(new Sim(fixedOf(level), level.goal).runHeadless()).toBe(false);
  });

  test('reference solution reaches the goal', () => {
    expect(new Sim([...fixedOf(level), ...level.solution!], level.goal).runHeadless()).toBe(true);
  });

  test('every part of the solution is needed', () => {
    const sol = level.solution!;
    if (sol.length < 2) return;
    for (let i = 0; i < sol.length; i++) {
      const without = sol.filter((_, j) => j !== i);
      expect(new Sim([...fixedOf(level), ...without], level.goal).runHeadless(), `solved without ${sol[i].part} #${i}`).toBe(false);
    }
  });

  test('solution only uses parts from the tray', () => {
    for (const t of level.tray) {
      expect(level.solution!.filter((p) => p.part === t.part).length).toBeLessThanOrEqual(t.count);
    }
    for (const p of level.solution!) expect(level.tray.some((t) => t.part === p.part)).toBe(true);
  });

  test('solution parts are placeable (on the grid, not overlapping)', () => {
    const placed: Placement[] = fixedOf(level);
    for (const p of level.solution!) {
      expect(p.x * 2 % 1).toBe(0);
      expect(p.y * 2 % 1).toBe(0);
      expect(overlapsAny(p, placed)).toBe(false);
      const c = clampToWorld(p);
      expect([c.x, c.y], p.part + ' sticks out of the table').toEqual([p.x, p.y]);
      const all = [...fixedOf(level), ...level.solution!.filter((o) => o !== p)];
      expect(settle(p, all).y, `${p.part} at (${p.x}, ${p.y}) would drop when placed`).toBe(p.y);
      placed.push(p);
    }
  });

  test('the same machine plays out the same way twice', () => {
    const run = () => {
      const s = new Sim([...fixedOf(level), ...level.solution!], level.goal);
      s.runHeadless();
      return s.time;
    };
    expect(run()).toBe(run());
  });
});

describe('rooms', () => {
  test('cover every level exactly once, in order', async () => {
    const { ROOMS } = await import('../src/levels');
    let next = 0;
    for (const r of ROOMS) { expect(r.first).toBe(next); next += r.count; }
    expect(next).toBe(LEVELS.length);
  });

  test('have at least ten levels each', async () => {
    const { ROOMS } = await import('../src/levels');
    for (const r of ROOMS) expect(r.count, r.name).toBeGreaterThanOrEqual(10);
  });

  test('never repeat a level, in the same room or another one', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    // Two levels with the same layout and tray would be the same puzzle under another name.
    const key = (l: Level) => JSON.stringify([l.fixed, l.tray]);
    expect(new Set(LEVELS.map(key)).size).toBe(LEVELS.length);
  });

  test('get harder along each room, and from room to room', async () => {
    const { ROOMS } = await import('../src/levels');
    const d = (i: number) => LEVELS[i].difficulty!;
    for (const lv of LEVELS) expect(lv.difficulty, lv.id).toBeTypeOf('number');
    ROOMS.forEach((r, k) => {
      for (let i = 1; i < r.count; i++) {
        expect(d(r.first + i), `${r.name} level ${i + 1} is harder than level ${i}`).toBeGreaterThan(d(r.first + i - 1));
      }
      if (k === 0) return;
      const prev = ROOMS[k - 1];
      for (let i = 0; i < Math.min(r.count, prev.count); i++) {
        expect(d(r.first + i), `${r.name} level ${i + 1} is harder than ${prev.name} level ${i + 1}`).toBeGreaterThan(d(prev.first + i));
      }
    });
  });

  test("speak each goal in the room's own words", async () => {
    const { roomVoice } = await import('../src/levels');
    expect(roomVoice('garden', 'Help the ball roll into the basket!')).toBe('Help the apple roll into the flower pot!');
    expect(roomVoice('kitchen', 'Drop the big ball, then a ball')).toBe('Drop the melon, then an orange');
    // "ball" inside "balloon" is left alone.
    expect(roomVoice('attic', 'the ball or the balloon')).toBe('the marble or the balloon');
    expect(roomVoice(undefined, 'the ball')).toBe('the ball');
  });
});
