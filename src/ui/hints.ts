import { PARTS } from '../sim/parts';
import type { PartKind, Placement } from '../sim/types';

/** Parts that look and behave the same when turned half a turn. */
const HALF_TURN_SAME = new Set<PartKind>(['ramp', 'shortramp', 'spring', 'domino', 'block']);

const norm = (r = 0) => ((r % 360) + 360) % 360;

/** Would this placed part do the job of that solution part? */
export function matches(sol: Placement, p: Placement): boolean {
  if (sol.part !== p.part) return false;
  if (Math.abs(sol.x - p.x) > 0.5 || Math.abs(sol.y - p.y) > 0.5) return false;
  const def = PARTS[sol.part];
  if (!def.rotatable) return true;
  if (def.rotStep === 180) return (norm(sol.rot) === 180) === (norm(p.rot) === 180);
  const d = norm((sol.rot ?? 0) - (p.rot ?? 0));
  return d === 0 || (HALF_TURN_SAME.has(sol.part) && d === 180);
}

/**
 * The next part to show as a hint: the first part of the solution that nothing
 * the child placed matches yet. Each placed part can only match one solution part.
 * Returns null when every solution part is already in place (or there is no solution).
 */
export function nextHint(solution: Placement[] | undefined, placed: Placement[]): Placement | null {
  if (!solution) return null;
  const used = new Set<number>();
  for (const sol of solution) {
    const i = placed.findIndex((p, k) => !used.has(k) && matches(sol, p));
    if (i < 0) return sol;
    used.add(i);
  }
  return null;
}
