// Puzzles made in the toy box, packed into a short code for links (…/#p=<code>)
// and for saving on the device. A code from a link is untrusted, so decoding
// checks every value and returns null for anything odd.
import { clampToWorld } from '../sim/placement';
import { PARTS } from '../sim/parts';
import type { Level, PartKind, Placement } from '../sim/types';

/** Stable part codes. Only ever append to this list: old links depend on the order. */
const KINDS: PartKind[] = [
  'ball', 'heavyball', 'ramp', 'shortramp', 'block', 'basket', 'star', 'domino', 'seesaw',
  'balloon', 'pin', 'fan', 'spring', 'pulley', 'hamster', 'conveyor', 'cheese',
  'car',
];
export const GOAL_OBJECTS = new Set<PartKind>(['ball', 'heavyball', 'balloon', 'hamster', 'pulley', 'car']);
export const GOAL_TARGETS = new Set<PartKind>(['basket', 'star', 'cheese']);

const MAX_PARTS = 40;
const MAX_CODE = 4000;
const VERSION = 1;

/** [kind, x*2, y*2, rot/15] */
type Packed = [number, number, number, number];
interface Wire { v: number; f: Packed[]; s: Packed[]; g: [number, number] }

export const MADE_VOICE = 'Can you solve this puzzle?';
export const SHARED_VOICE = "Here's a puzzle someone made for you! Can you solve it?";

const pack = (p: Placement): Packed => [KINDS.indexOf(p.part), Math.round(p.x * 2), Math.round(p.y * 2), Math.round((p.rot ?? 0) / 15)];

function toBase64Url(s: string) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(s: string) {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b + '='.repeat((4 - (b.length % 4)) % 4));
}

/**
 * Pack a made puzzle. The goal object and target must be fixed parts with ids;
 * the solution is what goes in the tray.
 */
export function encodeLevel(level: Level): string {
  const g = level.goal!;
  const fixed = level.fixed;
  const wire: Wire = {
    v: VERSION,
    f: fixed.map(pack),
    s: (level.solution ?? []).map(pack),
    g: [fixed.findIndex((p) => p.id === g.object), fixed.findIndex((p) => p.id === g.target)],
  };
  return toBase64Url(JSON.stringify(wire));
}

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);

function unpack(a: unknown): Placement | null {
  if (!Array.isArray(a) || a.length !== 4 || !a.every(isInt)) return null;
  const [k, x2, y2, r] = a as number[];
  const part = KINDS[k];
  if (!part) return null;
  const def = PARTS[part];
  const rot = r * 15;
  if (rot < -180 || rot > 180) return null;
  if (!def.rotatable && rot !== 0) return null;
  if (def.rotStep === 180 && Math.abs(rot) !== 180 && rot !== 0) return null;
  const p: Placement = { part, x: x2 / 2, y: y2 / 2 };
  if (rot) p.rot = rot;
  // Must already be a spot the game itself would allow.
  const c = clampToWorld(p);
  if (c.x !== p.x || c.y !== p.y) return null;
  return p;
}

/** Unpack a code into a playable level, or null if anything is wrong with it. */
export function decodeLevel(code: string, voice = SHARED_VOICE): Level | null {
  try {
    if (typeof code !== 'string' || code.length === 0 || code.length > MAX_CODE) return null;
    if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;
    const w = JSON.parse(fromBase64Url(code)) as Wire;
    if (!w || typeof w !== 'object' || w.v !== VERSION) return null;
    if (!Array.isArray(w.f) || !Array.isArray(w.s) || !Array.isArray(w.g) || w.g.length !== 2) return null;
    if (w.f.length + w.s.length > MAX_PARTS || w.s.length === 0) return null;
    const fixed = w.f.map(unpack);
    const solution = w.s.map(unpack);
    if (fixed.some((p) => !p) || solution.some((p) => !p)) return null;
    const [oi, ti] = w.g;
    if (!isInt(oi) || !isInt(ti) || oi === ti) return null;
    const obj = fixed[oi], target = fixed[ti];
    if (!obj || !target || !GOAL_OBJECTS.has(obj.part) || !GOAL_TARGETS.has(target.part)) return null;
    obj.id = 'goal-object';
    target.id = 'goal-target';
    const tray: Level['tray'] = [];
    for (const p of solution as Placement[]) {
      const t = tray.find((x) => x.part === p.part);
      if (t) t.count++;
      else tray.push({ part: p.part, count: 1 });
    }
    return {
      id: 'made-' + code.slice(-10),
      voice,
      goal: { type: 'reach', object: 'goal-object', target: 'goal-target' },
      fixed: fixed as Placement[],
      tray,
      solution: solution as Placement[],
    };
  } catch {
    return null;
  }
}
