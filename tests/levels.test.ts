import { describe, expect, test } from 'vitest';
import { LEVELS } from '../src/levels';
import { Sim } from '../src/sim/sim';
import { overlapsAny } from '../src/sim/placement';
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

  test("speak each goal in the room's own words", async () => {
    const { roomVoice } = await import('../src/levels');
    expect(roomVoice('garden', 'Help the ball roll into the basket!')).toBe('Help the apple roll into the flower pot!');
    expect(roomVoice('kitchen', 'Drop the big ball, then a ball')).toBe('Drop the melon, then an orange');
    // "ball" inside "balloon" is left alone.
    expect(roomVoice('attic', 'the ball or the balloon')).toBe('the marble or the balloon');
    expect(roomVoice(undefined, 'the ball')).toBe('the ball');
  });
});
