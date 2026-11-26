// The web taster (npm run build:taster): only the Workshop, but shared puzzles open in full.
// See docs/roadmap.md, "The web taster". scripts/build-site.mjs also checks the built bundle.
import { afterAll, describe, expect, test, vi } from 'vitest';
import { LEVELS as FULL, ROOMS as ALL_ROOMS } from '../src/levels';
import { encodeLevel } from '../src/levels/share';
import type { Level } from '../src/sim/types';

async function taster() {
  vi.stubEnv('MODE', 'taster');
  vi.resetModules();
  const [levels, share, sim, edition] = await Promise.all([
    import('../src/levels'), import('../src/levels/share'), import('../src/sim/sim'), import('../src/edition'),
  ]);
  return { ...levels, ...share, ...sim, ...edition };
}
afterAll(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('the web taster', () => {
  test('has the Workshop only', async () => {
    const t = await taster();
    expect(t.TASTER).toBe(true);
    expect(t.ROOMS.map((r) => r.id)).toEqual(['workshop']);
    expect(t.LEVELS.map((l) => l.id)).toEqual(FULL.slice(0, 10).map((l) => l.id));
  });

  test('the whole game still has all ten rooms', () => {
    expect(ALL_ROOMS).toHaveLength(10);
    expect(FULL).toHaveLength(100);
  });

  test("a shared puzzle from every room opens and plays, whatever parts it uses", async () => {
    const t = await taster();
    for (const room of ALL_ROOMS) {
      const level = FULL.slice(room.first, room.first + room.count).find((l) => l.goal?.type === 'reach' && l.solution) as Level | undefined;
      if (!level) continue; // the Music room's goals are tunes, which the maker can't make
      const back = t.decodeLevel(encodeLevel(level));
      expect(back, room.id).not.toBeNull();
      const run = new t.Sim([...back!.fixed.map((p) => ({ ...p, fixed: true })), ...back!.solution!], back!.goal).runHeadless();
      expect(run, room.id).toBe(true);
    }
  });
});
