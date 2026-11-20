// Can a level be won with one domino fewer than its answer uses? Skipped during `npm test`; run it with:
//   DOMINO=1 npx vitest run scripts/domino-check                 (every level with 2+ dominoes in its answer)
//   DOMINO=02-dominoes npx vitest run scripts/domino-check
// For each domino in the answer, it takes that domino away, then moves each remaining
// answer part over the whole grid (dominoes standing upright, other parts at every angle)
// with the rest left in place. Any placement that still wins is printed.
import { test } from 'vitest';
import { readFileSync } from 'node:fs';
import { LEVELS } from '../src/levels';
import { Sim } from '../src/sim/sim';
import { PARTS } from '../src/sim/parts';
import { overlapsAny, clampToWorld } from '../src/sim/placement';
import type { Level, Placement } from '../src/sim/types';

const env = process.env;
const say = (m: string) => process.stderr.write(m + '\n');

/** Every way found to win with one domino fewer, as "without #i, move part #j to (x, y, rot)". */
export function fewerDominoWins(level: Level, stopAfter = Infinity): string[] {
  const fixed: Placement[] = level.fixed.map((p) => ({ ...p, fixed: true }));
  const sol = level.solution ?? [];
  const found: string[] = [];
  sol.forEach((d, i) => {
    if (d.part !== 'domino') return;
    const rest = sol.filter((_, k) => k !== i);
    if (new Sim([...fixed, ...rest], level.goal).runHeadless()) { found.push(`without #${i}: wins as it is`); return; }
    rest.forEach((p, j) => {
      if (found.length >= stopAfter) return;
      const others = [...fixed, ...rest.filter((_, k) => k !== j)];
      const def = PARTS[p.part];
      const rots = p.part === 'domino' || !def.rotatable ? [0] : def.rotStep === 180 ? [0, 180] : [-45, -30, -15, 0, 15, 30, 45];
      for (let y = 0.5; y <= 9.5; y += 0.5) for (let x = 0.5; x <= 15.5; x += 0.5) for (const rot of rots) {
        if (found.length >= stopAfter) return;
        const q = clampToWorld({ part: p.part, x, y, rot });
        if (Math.abs(q.x - x) > 0.25 || Math.abs(q.y - y) > 0.25 || overlapsAny(q, others)) continue;
        if (new Sim([...others, q], level.goal).runHeadless()) found.push(`without #${i}: ${p.part} #${j} at (${q.x}, ${q.y}, ${rot})`);
      }
    });
  });
  return found;
}

test.skipIf(!env.DOMINO)('fewer dominoes', () => {
  const levels: Level[] = env.DOMINO!.endsWith('.json')
    ? [JSON.parse(readFileSync(env.DOMINO!, 'utf8'))]
    : LEVELS.filter((l) => (env.DOMINO === '1' || env.DOMINO!.split(',').includes(l.id)) && (l.solution ?? []).filter((p) => p.part === 'domino').length >= 2);
  for (const level of levels) {
    const wins = fewerDominoWins(level, Number(env.STOP ?? Infinity));
    say(`${level.id}: ${wins.length ? wins.length + ' ways with one domino fewer' : 'every domino needed'}`);
    for (const w of wins.slice(0, 12)) say('  ' + w);
  }
}, 7_200_000);
