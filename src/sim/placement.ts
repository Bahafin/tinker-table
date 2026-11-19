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
};

const SHRINK = 0.03;

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

/** Keep the snapped centre on the table. */
export function clampToWorld(p: Placement): Placement {
  const s = SOLID[p.part];
  const r = Math.max(s.w, s.h);
  const m = Math.min(r, 1);
  return { ...p, x: Math.min(WORLD_W - m, Math.max(m, snap(p.x))), y: Math.min(WORLD_H - Math.min(s.h, 0.5), Math.max(0.5, snap(p.y))) };
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
