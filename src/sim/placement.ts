import { PARTS } from './parts';
import { WORLD_H, WORLD_W, type PartKind, type Placement } from './types';

/** Solid half extents (cells) used to stop parts being placed inside each other. */
const SOLID: Record<PartKind, { w: number; h: number; dy?: number }> = {
  ball: { w: 0.35, h: 0.35 },
  heavyball: { w: 0.45, h: 0.45 },
  ramp: { w: 1.5, h: 0.125 },
  shortramp: { w: 1, h: 0.125 },
  block: { w: 0.5, h: 0.5 },
  basket: { w: 0.8, h: 0.6 },
  star: { w: 0.5, h: 0.5 },
  domino: { w: 0.125, h: 0.75 },
  seesaw: { w: 2, h: 0.12 },
  balloon: { w: 0.45, h: 0.45 },
  pin: { w: 0.12, h: 0.35 },
  fan: { w: 0.45, h: 0.45 },
  spring: { w: 0.7, h: 0.15 },
  pulley: { w: 1.5, h: 2.2 },
  hamster: { w: 0.5, h: 0.5 },
  conveyor: { w: 1.5, h: 0.2 },
  cheese: { w: 0.5, h: 0.35 },
  car: { w: 0.62, h: 0.37 },
  hammer: { w: 0.4, h: 1.1, dy: -0.85 },
  toaster: { w: 0.85, h: 0.5 },
  can: { w: 0.45, h: 0.45 },
  flower: { w: 0.4, h: 0.6 },
  // Only the hanging ball is solid; the rope itself doesn't stop parts being placed.
  rope: { w: 0.35, h: 0.35, dy: 2.5 },
  scissors: { w: 0.4, h: 0.25 },
  'xylo-c': { w: 0.75, h: 0.1 },
  'xylo-d': { w: 0.75, h: 0.1 },
  'xylo-e': { w: 0.75, h: 0.1 },
  'xylo-g': { w: 0.75, h: 0.1 },
  'xylo-a': { w: 0.75, h: 0.1 },
  bell: { w: 0.42, h: 0.4 },
  drum: { w: 0.6, h: 0.4 },
  soap: { w: 0.4, h: 0.18 },
  magnet: { w: 0.4, h: 0.45 },
  pillow: { w: 0.8, h: 0.22 },
  rocket: { w: 0.36, h: 0.47, dy: 0.03 },
};

const SHRINK = 0.03;
const EDGE_SLACK = 0.05;

interface Obb { cx: number; cy: number; w: number; h: number; a: number }

/**
 * How far a placed part is turned, in radians. Parts that only flip left/right
 * (rot 0 or 180) aren't turned at all: they just face the other way.
 */
export function turnOf(p: Placement): number {
  return PARTS[p.part].rotStep === 180 ? 0 : ((p.rot ?? 0) * Math.PI) / 180;
}

function obb(p: Placement, ext: { w: number; h: number; dy?: number }, pad = 0): Obb {
  const a = turnOf(p);
  const dy = ext.dy ?? 0;
  // dy is in the part's local frame.
  return { cx: p.x - Math.sin(a) * dy, cy: p.y + Math.cos(a) * dy, w: ext.w + pad, h: ext.h + pad, a };
}

function obbOverlap(A: Obb, B: Obb): boolean {
  const axes = [A.a, A.a + Math.PI / 2, B.a, B.a + Math.PI / 2];
  const dx = B.cx - A.cx, dy = B.cy - A.cy;
  for (const t of axes) {
    const ux = Math.cos(t), uy = Math.sin(t);
    const proj = (o: Obb) =>
      Math.abs(o.w * (Math.cos(o.a) * ux + Math.sin(o.a) * uy)) +
      Math.abs(o.h * (-Math.sin(o.a) * ux + Math.cos(o.a) * uy));
    if (Math.abs(dx * ux + dy * uy) > proj(A) + proj(B)) return false;
  }
  return true;
}

export function overlapsAny(p: Placement, others: Placement[]): boolean {
  const a = obb(p, SOLID[p.part], -SHRINK);
  return others.some((o) => o !== p && obbOverlap(a, obb(o, SOLID[o.part], -SHRINK)));
}

export function snap(v: number) {
  return Math.round(v * 2) / 2;
}

/**
 * Snap a part to the grid and keep all of it on the table, at the angle it is turned to.
 * At an edge the centre may sit off the grid so the part touches the edge exactly.
 */
export function clampToWorld(p: Placement): Placement {
  const o = obb(p, SOLID[p.part]);
  // A hair of slack, too small to see, so a part can rest right on an edge.
  const ex = Math.abs(Math.cos(o.a)) * o.w + Math.abs(Math.sin(o.a)) * o.h - EDGE_SLACK;
  const ey = Math.abs(Math.sin(o.a)) * o.w + Math.abs(Math.cos(o.a)) * o.h - EDGE_SLACK;
  const offX = o.cx - p.x, offY = o.cy - p.y;
  // A hanging rope is held from its top, which must be on the table too.
  const top = p.part === 'rope' ? 0.5 : -Infinity;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    ...p,
    x: clamp(snap(p.x), ex - offX, WORLD_W - ex - offX),
    y: clamp(snap(p.y), Math.max(top, ey - offY, 0.5), WORLD_H - ey - offY),
  };
}

/** Is the point (cells) on this part? Hit boxes are padded to stay finger-sized. */
export function hitTest(p: Placement, x: number, y: number, minHalf: number): boolean {
  const h = PARTS[p.part].hit;
  const o = obb(p, { w: Math.max(h.w, minHalf), h: Math.max(h.h, minHalf), dy: h.dy });
  const dx = x - o.cx, dy = y - o.cy;
  const lx = dx * Math.cos(o.a) + dy * Math.sin(o.a);
  const ly = -dx * Math.sin(o.a) + dy * Math.cos(o.a);
  return Math.abs(lx) <= o.w && Math.abs(ly) <= o.h;
}

/**
 * Dominoes stand on things: one let go in mid-air drops (a grid step at a time) until it
 * would touch something below or the floor. So a domino can't be dropped from high up
 * onto the machine, and every domino in a chain has to stand on its own spot.
 */
export function settle(p: Placement, others: Placement[]): Placement {
  if (p.part !== 'domino') return p;
  let q = p;
  for (;;) {
    const down = clampToWorld({ ...q, y: q.y + 0.5 });
    if (down.y <= q.y || overlapsAny(down, others)) return q;
    q = down;
  }
}
