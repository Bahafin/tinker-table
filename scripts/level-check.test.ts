// Quick checks for a level being made, before it joins the game. Skipped during `npm test`; run it with:
//   CHECK=src/levels/61-soap.json npx vitest run scripts/level-check
//   CHECK=src/levels/61-soap.json,src/levels/62-x.json MEASURE=1 npx vitest run scripts/level-check
// It runs the same checks as tests/levels.test.ts (doesn't solve itself, the answer works,
// every answer part is needed, parts sit on the grid without overlapping or dropping).
// MEASURE=1 also measures how exact the answer is, like scripts/level-stats: the number to
// halve and add to the hand rating for the level's `difficulty` (see docs/design.md).
import { test } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { PARTS } from '../src/sim/parts';
import { clampToWorld, overlapsAny, settle } from '../src/sim/placement';
import type { Level, Placement } from '../src/sim/types';

const env = process.env;
const say = (m: string) => process.stderr.write(m + '\n');

/** -log10 of the share of spots that still solve, summed over the answer's parts, plus a little for spare parts and kinds. */
export function exactness(level: Level): { x: number; parts: string[] } {
  const fixed: Placement[] = level.fixed.map((p) => ({ ...p, fixed: true }));
  const sol = level.solution!;
  let x = 0;
  const parts = sol.map((p, i) => {
    const others = [...fixed, ...sol.filter((_, j) => j !== i)];
    const def = PARTS[p.part];
    // A magnet is as likely to face left or down as right, so it is tried all the way round,
    // and a pillow is as useful standing on its end as lying down.
    const rots = !def.rotatable ? [0] : def.rotStep === 180 ? [0, 180] : p.part === 'magnet' ? [-135, -90, -45, 0, 45, 90, 135, 180] : p.part === 'pillow' ? [-90, -45, -30, -15, 0, 15, 30, 45, 90] : [-45, -30, -15, 0, 15, 30, 45];
    let tried = 0, wins = 0;
    for (let y = 0.5; y <= 9.5; y += 0.5) for (let xx = 0.5; xx <= 15.5; xx += 0.5) for (const rot of rots) {
      const q = clampToWorld({ part: p.part, x: xx, y, rot });
      if (q.x !== xx || q.y !== y || overlapsAny(q, others)) continue;
      if (settle(q, others).y !== q.y) continue;
      tried++;
      if (new Sim([...others, q], level.goal).runHeadless()) wins++;
    }
    x += -Math.log10(Math.max(wins, 1) / tried);
    return `${p.part} ${wins}/${tried}`;
  });
  const tray = level.tray.reduce((n, t) => n + t.count, 0);
  const kinds = new Set([...level.fixed.map((p) => p.part), ...level.tray.map((t) => t.part)]).size;
  x += 0.35 * (tray - sol.length + Math.max(0, kinds - 3));
  return { x, parts };
}

test.skipIf(!env.CHECK)('level check', () => {
  for (const path of env.CHECK!.split(',')) {
    const level = JSON.parse(readFileSync(path, 'utf8')) as Level;
    const fixed: Placement[] = level.fixed.map((p) => ({ ...p, fixed: true }));
    const sol = level.solution ?? [];
    const problems: string[] = [];
    const run = (ps: Placement[]) => new Sim(ps, level.goal).runHeadless();
    if (run(fixed)) problems.push('solves itself');
    if (!run([...fixed, ...sol])) problems.push('answer does not work');
    if (sol.length > 1) sol.forEach((p, i) => { if (run([...fixed, ...sol.filter((_, j) => j !== i)])) problems.push(`works without ${p.part} #${i}`); });
    for (const t of level.tray) if (sol.filter((p) => p.part === t.part).length > t.count) problems.push(`too many ${t.part}`);
    for (const p of sol) if (!level.tray.some((t) => t.part === p.part)) problems.push(`${p.part} is not in the tray`);
    const placed = [...fixed];
    for (const p of sol) {
      if ((p.x * 2) % 1 || (p.y * 2) % 1) problems.push(`${p.part} off the grid`);
      if (overlapsAny(p, placed)) problems.push(`${p.part} at (${p.x}, ${p.y}) overlaps`);
      const c = clampToWorld(p);
      if (c.x !== p.x || c.y !== p.y) problems.push(`${p.part} sticks out`);
      const all = [...fixed, ...sol.filter((o) => o !== p)];
      if (settle(p, all).y !== p.y) problems.push(`${p.part} would drop`);
      placed.push(p);
    }
    const s = new Sim([...fixed, ...sol], level.goal);
    s.runHeadless();
    say(`${level.id}: ${problems.length ? problems.join('; ') : 'ok'} (answer takes ${s.time.toFixed(1)}s)`);
    if (env.MEASURE && !problems.length) {
      const m = exactness(level);
      say(`  exactness ${m.x.toFixed(2)} [${m.parts.join(', ')}]`);
    }
  }
}, 3_600_000);
