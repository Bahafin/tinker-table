// Level difficulty stats. Skipped during `npm test`; run it with:
//   STATS=1 npx vitest run scripts/level-stats            (all levels)
//   STATS=34-hammer,35-hammer-face npx vitest run scripts/level-stats
// For each level it measures how forgiving the answer is: every solution part is
// moved over the whole grid (at every angle) with the other parts left in place,
// and the share of placements that still solve is counted. A small share means
// the child has to find an exact spot, so the level is harder.
// Writes one JSON line per level to STATS_OUT (default level-stats.jsonl).
import { test } from 'vitest';
import { appendFileSync } from 'node:fs';
import { LEVELS } from '../src/levels';
import { Sim } from '../src/sim/sim';
import { PARTS } from '../src/sim/parts';
import { overlapsAny, clampToWorld } from '../src/sim/placement';
import type { Placement } from '../src/sim/types';

const env = process.env;

test.skipIf(!env.STATS)('level stats', () => {
  const only = env.STATS === '1' ? null : env.STATS!.split(',');
  const out = env.STATS_OUT ?? 'level-stats.jsonl';
  for (const level of LEVELS) {
    if (only && !only.includes(level.id)) continue;
    const fixed: Placement[] = level.fixed.map((p) => ({ ...p, fixed: true }));
    const sol = level.solution!;
    const parts = sol.map((p, i) => {
      const others = [...fixed, ...sol.filter((_, j) => j !== i)];
      const def = PARTS[p.part];
      const rots = !def.rotatable ? [0] : def.rotStep === 180 ? [0, 180] : [-45, -30, -15, 0, 15, 30, 45];
      let tried = 0, wins = 0;
      for (let y = 0.5; y <= 9.5; y += 0.5) for (let x = 0.5; x <= 15.5; x += 0.5) for (const rot of rots) {
        const q = clampToWorld({ part: p.part, x, y, rot });
        if (q.x !== x || q.y !== y || overlapsAny(q, others)) continue;
        tried++;
        if (new Sim([...others, q], level.goal).runHeadless()) wins++;
      }
      return { part: p.part, tried, wins };
    });
    const trayCount = level.tray.reduce((n, t) => n + (Number.isFinite(t.count) ? t.count : 0), 0);
    const kinds = new Set([...level.fixed.map((p) => p.part), ...level.tray.map((t) => t.part)]);
    appendFileSync(out, JSON.stringify({ id: level.id, sol: sol.length, tray: trayCount, kinds: kinds.size, parts }) + '\n');
  }
}, 7_200_000);
