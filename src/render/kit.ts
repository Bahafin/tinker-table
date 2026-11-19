import type { Body } from 'planck';

/** Flat paper colours. */
export const PAPER = {
  table: '#f4ecdc',
  dot: '#e2d6bf',
  tomato: '#e5583f',
  mustard: '#e9b23c',
  teal: '#2f9c95',
  sky: '#6db3e0',
  kraft: '#b98a5a',
  kraftDark: '#8f6640',
  navy: '#34406b',
  cream: '#fbf6ea',
  ink: '#3b2f2a',
  leaf: '#7cb45a',
  grey: '#9aa1a6',
  brass: '#c9a24a',
};

export type Ctx = CanvasRenderingContext2D;

export function withBody(ctx: Ctx, b: Body, fn: () => void) {
  const p = b.getPosition();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(b.getAngle());
  fn();
  ctx.restore();
}

export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

export function paper(ctx: Ctx, fill: string) {
  ctx.fillStyle = fill;
  ctx.fill();
}

export function noShadow(ctx: Ctx, fn: () => void) {
  ctx.save();
  ctx.shadowColor = 'transparent';
  fn();
  ctx.restore();
}

export function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string, w: number) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
}

export function plank(ctx: Ctx, hw: number) {
  rrect(ctx, -hw, -0.125, hw * 2, 0.25, 0.06);
  paper(ctx, PAPER.kraft);
  noShadow(ctx, () => {
    line(ctx, -hw + 0.15, 0, hw - 0.15, 0, PAPER.kraftDark, 0.03);
  });
}

export function star(ctx: Ctx, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}
