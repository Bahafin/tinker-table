import { Sim, DT } from '../sim/sim';
import { PARTS, type RuntimePart } from '../sim/parts';
import { clampToWorld, hitTest, overlapsAny } from '../sim/placement';
import { WORLD_H, WORLD_W, type Level, type PartKind, type Placement } from '../sim/types';
import { drawFixedPin, drawPart, drawTable, PAPER, setPaperShadow } from '../render/draw';
import { sfx } from './audio';

export type Mode = 'build' | 'run' | 'won';

interface Drag {
  p: Placement;
  pointerId: number;
  /** Index in placements if it was already on the table, or -1 for a new part from the tray. */
  index: number;
  origin?: Placement;
  grab: { x: number; y: number };
  downAt: { x: number; y: number; t: number };
  moved: boolean;
  py: number;
}

interface Confetti { x: number; y: number; vx: number; vy: number; a: number; va: number; c: string }

const SLOW = 0.4;
const MIN_TOUCH_PX = 64;

const iconCache = new Map<PartKind, RuntimePart>();
export function partIcon(kind: PartKind): RuntimePart {
  let rp = iconCache.get(kind);
  if (!rp) {
    rp = new Sim([{ part: kind, x: 0, y: 0 }]).parts[0];
    iconCache.set(kind, rp);
  }
  return rp;
}

/** Draw a part icon centred in a box of `size` pixels. */
export function drawIcon(ctx: CanvasRenderingContext2D, kind: PartKind, cx: number, cy: number, size: number, t = 0) {
  const h = PARTS[kind].hit;
  const ext = Math.max(h.w, h.h + Math.abs(h.dy ?? 0)) * 2 + 0.2;
  const s = size / ext;
  ctx.save();
  ctx.translate(cx, cy - (h.dy ?? 0) * s);
  ctx.scale(s, s);
  setPaperShadow(ctx, Math.max(1, s * 0.03));
  drawPart(ctx, partIcon(kind), t);
  ctx.restore();
}

export class Game {
  mode: Mode = 'build';
  slow = false;
  placements: Placement[] = [];
  onChange: () => void = () => {};
  onWin: () => void = () => {};

  private fixed: Placement[];
  private sim: Sim | null = null;
  private preview: Sim | null = null;
  private drag: Drag | null = null;
  private dragSim: Sim | null = null;
  private dragKey = '';
  private acc = 0;
  private t = 0;
  private last = 0;
  private endTimer = 0;
  private confetti: Confetti[] = [];
  private wiggle: { index: number; until: number } | null = null;
  private raf = 0;
  private L = { scale: 1, ox: 0, oy: 0, trayTop: 0, trayH: 0, item: 0, itemX0: 0, cw: 0, ch: 0, dpr: 1 };

  constructor(private canvas: HTMLCanvasElement, readonly level: Level) {
    this.fixed = level.fixed.map((p) => ({ ...p, fixed: true }));
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.cancel);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown', this.down);
    this.canvas.removeEventListener('pointermove', this.move);
    this.canvas.removeEventListener('pointerup', this.up);
    this.canvas.removeEventListener('pointercancel', this.cancel);
  }

  // ---------- run control ----------

  go() {
    if (this.mode !== 'build') return;
    this.drag = null;
    this.sim = new Sim([...this.fixed, ...this.placements], this.level.goal);
    this.acc = 0;
    this.endTimer = 0;
    this.mode = 'run';
    sfx.go();
    this.onChange();
  }

  /** Back to building, parts stay where they were placed. */
  reset() {
    this.sim = null;
    this.mode = 'build';
    this.confetti = [];
    this.onChange();
  }

  /** Watch the winning machine again, slowly. */
  replay() {
    this.mode = 'build';
    const wasSlow = this.slow;
    this.slow = true;
    this.go();
    this.replaySlowRestore = wasSlow;
  }
  private replaySlowRestore: boolean | null = null;

  private remaining(kind: PartKind) {
    const t = this.level.tray.find((x) => x.part === kind);
    if (!t) return 0;
    return t.count - this.placements.filter((p) => p.part === kind).length;
  }

  // ---------- layout ----------

  private layout() {
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = c.clientWidth, ch = c.clientHeight;
    if (c.width !== Math.round(cw * dpr) || c.height !== Math.round(ch * dpr)) {
      c.width = Math.round(cw * dpr);
      c.height = Math.round(ch * dpr);
    }
    const n = this.level.tray.length;
    const trayH = Math.max(96, Math.min(130, ch * 0.17));
    const scale = Math.min((cw - 16) / WORLD_W, (ch - trayH - 12) / WORLD_H);
    const ox = (cw - WORLD_W * scale) / 2;
    const oy = 6;
    const item = Math.max(MIN_TOUCH_PX, Math.min(trayH - 14, (cw - 24) / n - 6));
    const itemX0 = (cw - n * (item + 6) + 6) / 2;
    this.L = { scale, ox, oy, trayTop: ch - trayH, trayH, item, itemX0, cw, ch, dpr };
  }

  private toWorld(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    return { px, py, x: (px - this.L.ox) / this.L.scale, y: (py - this.L.oy) / this.L.scale };
  }

  private trayIndexAt(px: number, py: number) {
    const L = this.L;
    if (py < L.trayTop) return -1;
    const i = Math.floor((px - L.itemX0) / (L.item + 6));
    return i >= 0 && i < this.level.tray.length ? i : -1;
  }

  // ---------- input ----------

  private down = (e: PointerEvent) => {
    if (this.mode !== 'build' || this.drag) return;
    this.layout();
    const w = this.toWorld(e);
    const lift = e.pointerType === 'touch' ? 0.8 : 0;
    const ti = this.trayIndexAt(w.px, w.py);
    if (ti >= 0) {
      const kind = this.level.tray[ti].part;
      if (this.remaining(kind) <= 0) { sfx.nope(); return; }
      this.startDrag(e, { part: kind, x: w.x, y: w.y - lift }, -1, { x: 0, y: -lift }, w);
      this.drag!.moved = true;
      sfx.pickup();
      return;
    }
    const minHalf = MIN_TOUCH_PX / 2 / this.L.scale;
    for (let i = this.placements.length - 1; i >= 0; i--) {
      const p = this.placements[i];
      if (hitTest(p, w.x, w.y, minHalf)) {
        this.startDrag(e, { ...p }, i, { x: p.x - w.x, y: p.y - w.y }, w);
        return;
      }
    }
  };

  private startDrag(e: PointerEvent, p: Placement, index: number, grab: { x: number; y: number }, w: { px: number; py: number }) {
    this.canvas.setPointerCapture(e.pointerId);
    this.drag = {
      p, index, grab, pointerId: e.pointerId, moved: false, py: w.py,
      origin: index >= 0 ? { ...this.placements[index] } : undefined,
      downAt: { x: w.px, y: w.py, t: performance.now() },
    };
  }

  private move = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    const w = this.toWorld(e);
    d.py = w.py;
    if (!d.moved && Math.hypot(w.px - d.downAt.x, w.py - d.downAt.y) > 10) {
      d.moved = true;
      sfx.pickup();
    }
    if (d.moved) {
      d.p.x = w.x + d.grab.x;
      d.p.y = w.y + d.grab.y;
    }
  };

  private up = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.drag = null;
    const w = this.toWorld(e);

    if (!d.moved) {
      // A tap rotates.
      const p = this.placements[d.index];
      if (!PARTS[p.part].rotatable) { this.doWiggle(d.index); return; }
      const rotated = { ...p, rot: ((((p.rot ?? 0) + 15 + 180) % 360) + 360) % 360 - 180 };
      if (overlapsAny(rotated, this.others(d.index))) { sfx.nope(); this.doWiggle(d.index); return; }
      this.placements[d.index] = rotated;
      sfx.rotate();
      this.changed();
      return;
    }

    // Dropped on the tray: put it away.
    if (w.py > this.L.trayTop) {
      if (d.index >= 0) this.placements.splice(d.index, 1);
      sfx.place();
      this.changed();
      return;
    }

    const snapped = clampToWorld(d.p);
    if (overlapsAny(snapped, this.others(d.index))) {
      sfx.nope();
      if (d.index >= 0) this.placements[d.index] = d.origin!; // slide back home
      this.changed();
      return;
    }
    if (d.index >= 0) this.placements[d.index] = snapped;
    else this.placements.push(snapped);
    sfx.place();
    this.changed();
  };

  private cancel = (e: PointerEvent) => {
    if (this.drag && e.pointerId === this.drag.pointerId) {
      this.drag = null;
      this.changed();
    }
  };

  private others(skipIndex: number) {
    return [...this.fixed, ...this.placements.filter((_, i) => i !== skipIndex)];
  }

  private doWiggle(index: number) {
    this.wiggle = { index, until: this.t + 0.35 };
  }

  private changed() {
    this.preview = null;
    this.onChange();
  }

  // ---------- frame ----------

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
    this.last = now;
    this.t += dt;
    this.layout();
    this.update(dt);
    this.render();
  };

  private update(dt: number) {
    const s = this.sim;
    if (s && this.mode === 'run') {
      this.acc += dt * (this.slow ? SLOW : 1);
      let n = 0;
      while (this.acc >= DT && n++ < 6) {
        s.step();
        this.acc -= DT;
      }
      for (const ev of s.events) {
        if (ev.type === 'clack') sfx.clack(ev.strength);
        else sfx[ev.type]();
      }
      s.events = [];
      if (s.success) this.win();
      else if (s.settled) {
        this.endTimer += dt;
        if (this.endTimer > 0.9) {
          sfx.hmm();
          this.restoreSlow();
          this.reset();
        }
      }
    }
    for (const c of this.confetti) {
      c.vy += 6 * dt; c.vx *= 0.99;
      c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt;
    }
    this.confetti = this.confetti.filter((c) => c.y < WORLD_H + 1);
  }

  private restoreSlow() {
    if (this.replaySlowRestore !== null) {
      this.slow = this.replaySlowRestore;
      this.replaySlowRestore = null;
    }
  }

  private win() {
    this.mode = 'won';
    this.restoreSlow();
    sfx.chime();
    const target = this.sim!.byId(this.level.goal!.target)!.bodies[0].getPosition();
    const colors = [PAPER.tomato, PAPER.mustard, PAPER.teal, PAPER.sky, PAPER.leaf];
    for (let i = 0; i < 70; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = 4 + Math.random() * 6;
      this.confetti.push({ x: target.x, y: target.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: Math.random() * 6, va: (Math.random() - 0.5) * 12, c: colors[i % colors.length] });
    }
    this.onChange();
    this.onWin();
  }

  private render() {
    const ctx = this.canvas.getContext('2d')!;
    const L = this.L;
    ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    ctx.clearRect(0, 0, L.cw, L.ch);

    // Table
    ctx.save();
    ctx.translate(L.ox, L.oy);
    ctx.scale(L.scale, L.scale);
    ctx.save();
    ctx.shadowColor = 'rgba(80,55,30,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    ctx.beginPath(); ctx.roundRect(0, 0, WORLD_W, WORLD_H, 0.25); ctx.fillStyle = PAPER.table; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, WORLD_W, WORLD_H, 0.25); ctx.clip();
    drawTable(ctx, WORLD_W, WORLD_H);
    ctx.restore();

    setPaperShadow(ctx, Math.max(1.5, L.scale * 0.04));
    const world = this.sim ?? this.getPreview();
    const nFixed = this.fixed.length;
    world.parts.forEach((rp, i) => {
      const kidIndex = i - nFixed;
      if (kidIndex >= 0 && this.mode === 'build' && this.drag && this.drag.index === kidIndex && this.drag.moved) return;
      const wig = kidIndex >= 0 && this.wiggle && this.wiggle.index === kidIndex && this.t < this.wiggle.until && !this.sim;
      if (wig) {
        const p = rp.placement;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(Math.sin(this.t * 50) * 0.08); ctx.translate(-p.x, -p.y);
      }
      drawPart(ctx, rp, this.t);
      if (wig) ctx.restore();
      if (rp.placement.fixed && this.mode === 'build') drawFixedPin(ctx, rp);
    });

    // The part being dragged, at its snapped spot.
    if (this.drag?.moved) {
      const d = this.drag;
      const overTray = d.py > L.trayTop;
      const snapped = clampToWorld(d.p);
      const bad = overlapsAny(snapped, this.others(d.index));
      const show = overTray ? d.p : snapped;
      const key = `${show.part}|${show.x}|${show.y}|${show.rot ?? 0}`;
      if (key !== this.dragKey) { this.dragSim = new Sim([show]); this.dragKey = key; }
      ctx.save();
      ctx.globalAlpha = bad || overTray ? 0.5 : 0.92;
      setPaperShadow(ctx, Math.max(3, L.scale * 0.1));
      drawPart(ctx, this.dragSim!.parts[0], this.t);
      ctx.restore();
    }

    ctx.shadowColor = 'transparent';
    for (const c of this.confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a); ctx.fillStyle = c.c; ctx.fillRect(-0.1, -0.06, 0.2, 0.12); ctx.restore();
    }
    ctx.restore();

    this.renderTray(ctx);
  }

  private getPreview() {
    if (!this.preview) this.preview = new Sim([...this.fixed, ...this.placements], this.level.goal);
    return this.preview;
  }

  private renderTray(ctx: CanvasRenderingContext2D) {
    const L = this.L;
    const y0 = L.trayTop + (L.trayH - L.item) / 2;
    ctx.save();
    ctx.globalAlpha = this.mode === 'build' ? 1 : 0.45;
    this.level.tray.forEach((t, i) => {
      const x = L.itemX0 + i * (L.item + 6);
      const left = this.remaining(t.part);
      ctx.save();
      ctx.shadowColor = 'rgba(80,55,30,0.2)'; ctx.shadowOffsetY = 3; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.roundRect(x, y0, L.item, L.item, 14); ctx.fillStyle = '#fffaf0'; ctx.fill();
      ctx.restore();
      ctx.save();
      if (left <= 0) ctx.globalAlpha *= 0.3;
      drawIcon(ctx, t.part, x + L.item / 2, y0 + L.item / 2 - (Number.isFinite(t.count) ? 6 : 0), L.item * 0.72, this.t);
      ctx.restore();
      // Dots show how many are left (no numbers needed).
      if (Number.isFinite(left) && left > 0) {
        const r = 4.5, gap = 13;
        const sx = x + L.item / 2 - ((left - 1) * gap) / 2;
        for (let k = 0; k < left; k++) {
          ctx.beginPath(); ctx.arc(sx + k * gap, y0 + L.item - 10, r, 0, Math.PI * 2); ctx.fillStyle = PAPER.teal; ctx.fill();
        }
      }
    });
    ctx.restore();
  }
}
