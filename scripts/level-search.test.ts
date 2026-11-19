// Level search tool. Skipped during `npm test`; run it with:
//   TUNE=src/levels/10-boing.json npm run search
// Options (environment variables):
//   FIX='[{"part":"ramp","x":5,"y":4,"rot":15}]'  parts to place first (e.g. one half of a two-part answer)
//   ONLY=spring          search only this tray part
//   ROTS=-30,0,30        angles to try (default -45..45 in 15° steps; flip parts try 0 and 180)
//   BOX=x0,y0,x1,y1      limit the search area (cells)
//   NOSEARCH=1           just run the empty level and the reference solution
//   TRACE=1              print where every moving part is, twice a second, for the solution (or FIX)
// It reports whether the level solves itself, whether the solution works, and
// how many single placements of each tray part solve it.
import { test } from 'vitest';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/sim';
import { PARTS } from '../src/sim/parts';
import { overlapsAny, clampToWorld } from '../src/sim/placement';
import type { Level, Placement } from '../src/sim/types';

const env = process.env;
const say = (m: string) => process.stderr.write(m + '\n');

test.skipIf(!env.TUNE)('level search', () => {
  const level = JSON.parse(readFileSync(env.TUNE!, 'utf8')) as Level;
  const extra = JSON.parse(env.FIX ?? '[]') as Placement[];
  const fixed: Placement[] = [...level.fixed.map((p) => ({ ...p, fixed: true })), ...extra];

  const run = (label: string, ps: Placement[]) => {
    const s = new Sim(ps, level.goal);
    const ok = s.runHeadless();
    const o = s.byId(level.goal!.object)!;
    const b = Sim.goalBody(o).getPosition();
    say(`${label}: ${ok ? 'SOLVED' : 'no'} after ${s.time.toFixed(1)}s, goal object at (${b.x.toFixed(2)}, ${b.y.toFixed(2)})`);
  };
  run('empty', fixed);
  if (level.solution && !env.FIX) run('solution', [...fixed, ...level.solution]);

  if (env.TRACE) {
    const s = new Sim(env.FIX ? fixed : [...fixed, ...(level.solution ?? [])], level.goal);
    for (let i = 0; i < 60 * 25 && !s.success && !s.settled; i++) {
      s.step();
      if (i % 30 === 0) {
        say(`t=${s.time.toFixed(1)} ` + s.parts.filter((p) => p.bodies[0].isDynamic())
          .map((p) => `${p.placement.id ?? p.kind}(${p.bodies[0].getPosition().x.toFixed(1)},${p.bodies[0].getPosition().y.toFixed(1)}${p.state.on ? '*' : ''}${p.state.popped ? ' popped' : ''})`).join(' '));
      }
    }
    say(`success=${s.success}`);
    return;
  }
  if (env.NOSEARCH) return;

  const [x0, y0, x1, y1] = (env.BOX ?? '0.5,0.5,15.5,9.5').split(',').map(Number);
  for (const t of level.tray) {
    if (env.ONLY && t.part !== env.ONLY) continue;
    const def = PARTS[t.part];
    const rots = !def.rotatable ? [0] : def.rotStep === 180 ? [0, 180]
      : (env.ROTS ?? '-45,-30,-15,0,15,30,45').split(',').map(Number);
    const wins: string[] = [];
    let tried = 0;
    for (let y = y0; y <= y1; y += 0.5) for (let x = x0; x <= x1; x += 0.5) for (const rot of rots) {
      const p = clampToWorld({ part: t.part, x, y, rot });
      if (p.x !== x || p.y !== y || overlapsAny(p, fixed)) continue;
      tried++;
      if (new Sim([...fixed, p], level.goal).runHeadless()) wins.push(`(${x},${y},${rot})`);
    }
    say(`${t.part}: ${wins.length}/${tried} single placements solve`);
    if (wins.length) say('  ' + wins.slice(0, 80).join(' '));
  }
}, 900_000);
