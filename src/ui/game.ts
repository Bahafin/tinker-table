import { Sim, DT, HEAR_POP } from '../sim/sim';
import { PARTS, type RuntimePart } from '../sim/parts';
import { clampToWorld, hitTest, overlapsAny, turnOf } from '../sim/placement';
import { WORLD_H, WORLD_W, type Level, type PartKind, type Placement } from '../sim/types';
import { drawFixedPin, drawPart, drawTable, PAPER, paperGrain, setPaperShadow, setSkin } from '../render/draw';
import { sfx } from './audio';
import { nextHint } from './hints';
import { GOAL_OBJECTS, GOAL_TARGETS, MADE_VOICE } from '../levels/share';

export type Mode = 'build' | 'run' | 'won' | 'make';

/** Puzzle making in the toy box: pick what travels, where it goes, then pin parts. */
export interface Making { step: 'object' | 'target' | 'pins'; object: number | null; target: number | null; pins: Set<number> }

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
/** Space between tray items, in CSS pixels. */
const TRAY_GAP = 6;
/** Rotate buttons: radius in screen px (64 px across). */
const HANDLE_R = 32;
/** How far a pointer may slide and still count as a tap. Small fingers wobble. */
const TAP_SLOP = { mouse: 8, touch: 22 };

/** A round rotate button beside the selected part. dir -1 turns left, +1 turns right, 0 flips. */
interface Handle { dir: -1 | 0 | 1; px: number; py: number }

/** Missed runs before the hint button appears. */
const MISSES_BEFORE_HINT = 2;
/** How long a hint ghost stays (seconds). */
const HINT_SECONDS = 3.2;
/** Film strip: a snapshot every this many seconds of machine time, and the size of each. */
const FILM_EVERY = 0.4;
const FILM_W = 320, FILM_H = 200;
/** Frames on the film strip shown after a win. */
export const FILM_FRAMES = 5;

type Pt = { x: number; y: number };
/** Tall, thin parts read better drawn bigger in a round tab. */
const TALL_ICONS = new Set<PartKind>(['hammer', 'rope', 'domino']);

/** One room's parts for the toy box tray, drawn in that room's look. */
export interface TraySet { skin: string; accent: string; paper: string; icon: PartKind; parts: PartKind[] }
type TrayItem = { part: PartKind; count: number; skin?: string };
type TrayHit = { item: number } | { tab: number } | { page: -1 | 1 } | null;
type Box = { x: number; y: number; w: number; h: number };
interface TrayLayout {
  scale: number; ox: number; oy: number; trayTop: number; trayH: number; item: number; cw: number; ch: number; dpr: number;
  /** Parts showing in the tray (i: index into the tray's items) and where. */
  items: { i: number; x: number; y: number }[];
  tabs: { x: number; y: number }[];
  tab: number;
  prev: Box | null;
  next: Box | null;
}

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
  /** Rings spreading out from a pop, as far as a sleeping hamster can hear. */
  private bangs: { x: number; y: number; t: number }[] = [];
  private wiggle: { index: number; until: number } | null = null;
  /** The placed part currently showing rotate buttons, if any. */
  private selected: number | null = null;
  private selectedAt = 0;
  private turnFlash: { dir: number; until: number } | null = null;
  private raf = 0;
  /** Runs that ended without reaching the goal, for the hint button. */
  misses = 0;
  /** Table paper colour (each room on the map has its own tint). */
  paper: string = PAPER.table;
  /** Room look for the parts ('' for the plain look). */
  skin = '';
  /** Set while making a puzzle in the toy box. */
  making: Making | null = null;
  private hint: { rp: RuntimePart; from: number } | null = null;
  /** Guess the path: the line the child drew before pressing Go (world units). */
  guess: Pt[] = [];
  /** The pencil is out: the next stroke on the table draws a guess. */
  pencil = false;
  private drawing: number | null = null;
  /** Where the goal object really went on the last run. */
  private trail: Pt[] = [];
  /** Keep showing the last run's path next to the guess, until something changes. */
  private showTrail = false;
  /** Snapshots of the current run, for the film strip after a win. */
  private film: HTMLCanvasElement[] = [];
  private lastShot = -1;
  private wonAt = 0;
  private L: TrayLayout = { scale: 1, ox: 0, oy: 0, trayTop: 0, trayH: 0, item: 0, cw: 0, ch: 0, dpr: 1, items: [], tabs: [], tab: 0, prev: null, next: null };
  /** Toy box: the room sets of parts the tray's tabs choose between, and which one is showing. */
  sets: TraySet[] | null = null;
  private setIndex = 0;
  private page = 0;

  /** start: parts already on the table (a machine saved in the toy box). */
  constructor(private canvas: HTMLCanvasElement, readonly level: Level, start: Placement[] = []) {
    this.fixed = level.fixed.map((p) => ({ ...p, fixed: true }));
    this.placements = start.map((p) => ({ ...p }));
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

  /** Run the machine. Every run the child starts counts towards a hint, however it ends. */
  go(counted = true) {
    if (this.mode !== 'build') return;
    if (counted) this.misses++;
    this.drag = null;
    this.selected = null;
    this.sim = new Sim([...this.fixed, ...this.placements], this.level.goal);
    this.acc = 0;
    this.endTimer = 0;
    this.mode = 'run';
    this.pencil = false;
    this.trail = [];
    this.showTrail = this.guess.length > 1;
    this.film = [];
    this.lastShot = -1;
    sfx.go();
    if (this.sim.parts.some((p) => p.kind === 'car')) setTimeout(sfx.vroom, 150);
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
    this.go(false);
    this.replaySlowRestore = wasSlow;
  }
  private replaySlowRestore: boolean | null = null;

  /** True once the child has missed a few times and there is a solution to hint from. */
  get hintReady() {
    return this.mode === 'build' && this.misses >= MISSES_BEFORE_HINT && !!this.level.solution;
  }

  /** In the puzzle maker, the machine can become a puzzle once there's something on the table. */
  get canMake() {
    return this.level.id === 'maker' && this.mode === 'build' && this.placements.length >= 2;
  }

  /** A machine built in the toy box can be kept. */
  get canSave() {
    return this.level.id === 'toybox' && this.mode === 'build' && this.placements.length >= 1;
  }

  startMaking() {
    if (!this.canMake) return;
    this.selected = null;
    this.mode = 'make';
    this.making = { step: 'object', object: null, target: null, pins: new Set() };
    sfx.place();
    this.onChange();
  }

  stopMaking() {
    if (this.mode !== 'make') return;
    this.mode = 'build';
    this.making = null;
    this.onChange();
  }

  /** In make mode a tap picks the goal, then pins or unpins parts. */
  private makeTap(e: PointerEvent) {
    const m = this.making!;
    this.layout();
    const w = this.toWorld(e);
    const minHalf = MIN_TOUCH_PX / 2 / this.L.scale;
    let i = -1;
    for (let k = this.placements.length - 1; k >= 0; k--) if (hitTest(this.placements[k], w.x, w.y, minHalf)) { i = k; break; }
    if (i < 0) return;
    const kind = this.placements[i].part;
    const ok = () => { sfx.place(); this.onChange(); };
    if (m.step === 'object') {
      if (!GOAL_OBJECTS.has(kind)) { sfx.nope(); this.doWiggle(i); return; }
      m.object = i; m.pins.add(i); m.step = 'target'; return ok();
    }
    if (m.step === 'target') {
      if (!GOAL_TARGETS.has(kind) || i === m.object) { sfx.nope(); this.doWiggle(i); return; }
      m.target = i; m.pins.add(i); m.step = 'pins'; return ok();
    }
    if (i === m.object || i === m.target) { sfx.nope(); this.doWiggle(i); return; }
    if (m.pins.has(i)) m.pins.delete(i); else m.pins.add(i);
    ok();
  }

  /** Is this placed part one you can tap in the current making step? */
  private makeable(i: number) {
    const m = this.making;
    if (!m) return false;
    const kind = this.placements[i].part;
    if (m.step === 'object') return GOAL_OBJECTS.has(kind);
    if (m.step === 'target') return GOAL_TARGETS.has(kind) && i !== m.object;
    return i !== m.object && i !== m.target;
  }

  /** The puzzle as made so far, or null if the goal isn't picked yet or nothing is left for the tray. */
  madeLevel(): Level | null {
    const m = this.making;
    if (!m || m.step !== 'pins' || m.object === null || m.target === null) return null;
    const fixed: Placement[] = [];
    const solution: Placement[] = [];
    this.placements.forEach((p, i) => {
      const { fixed: _f, id: _id, ...clean } = p;
      if (i === m.object) fixed.push({ ...clean, id: 'goal-object' });
      else if (i === m.target) fixed.push({ ...clean, id: 'goal-target' });
      else if (m.pins.has(i)) fixed.push(clean);
      else solution.push(clean);
    });
    if (!solution.length) return null;
    const tray: Level['tray'] = [];
    for (const p of solution) {
      const t = tray.find((x) => x.part === p.part);
      if (t) t.count++; else tray.push({ part: p.part, count: 1 });
    }
    return { id: 'made', voice: MADE_VOICE, goal: { type: 'reach', object: 'goal-object', target: 'goal-target' }, fixed, tray, solution };
  }

  /**
   * Check the puzzle: it must work with the tray parts placed, and must not work
   * with only the pinned parts. Returns the level if it's a good puzzle.
   */
  checkPuzzle(): Level | null {
    const level = this.madeLevel();
    const fail = () => {
      sfx.hmm();
      const m = this.making;
      const at = m?.object ?? m?.target ?? 0;
      this.doWiggle(at);
      return null;
    };
    if (!level) return fail();
    const fixed = level.fixed.map((p) => ({ ...p, fixed: true }));
    const works = new Sim([...fixed, ...level.solution!], level.goal).runHeadless();
    const solvesItself = new Sim(fixed, level.goal).runHeadless();
    if (!works || solvesItself) return fail();
    sfx.chime();
    return level;
  }

  /** Show a faint ghost of the next missing part. Returns false if nothing is missing. */
  showHint(): boolean {
    const p = nextHint(this.level.solution, this.placements);
    if (!p) return false;
    this.selected = null;
    this.hint = { rp: new Sim([p]).parts[0], from: this.t };
    return true;
  }

  /** Guess the path is for levels with a goal: there's something to follow. */
  get canGuess() {
    return this.mode === 'build' && !!this.level.goal;
  }

  /** Take out (or put away) the pencil. Taking it out rubs out the old guess; putting it away keeps it. */
  togglePencil() {
    if (!this.canGuess) return;
    this.pencil = !this.pencil;
    if (this.pencil) { this.guess = []; this.showTrail = false; this.selected = null; }
    sfx.pickup();
    this.onChange();
  }

  /** The film strip of the last winning run: a few snapshots in order, the last one at the goal. */
  filmStrip(n = FILM_FRAMES): HTMLCanvasElement[] {
    const f = this.film;
    if (f.length <= n) return [...f];
    return Array.from({ length: n }, (_, i) => f[Math.round((i * (f.length - 1)) / (n - 1))]);
  }

  private snap() {
    const L = this.L;
    const c = document.createElement('canvas');
    c.width = FILM_W; c.height = FILM_H;
    c.getContext('2d')!.drawImage(this.canvas, L.ox * L.dpr, L.oy * L.dpr, WORLD_W * L.scale * L.dpr, WORLD_H * L.scale * L.dpr, 0, 0, FILM_W, FILM_H);
    this.film.push(c);
    // Long runs: keep every other frame, so memory stays small.
    if (this.film.length > 80) this.film = this.film.filter((_, i) => i % 2 === 0 || i === this.film.length - 1);
  }

  /** What the tray shows now: the level's parts, or the chosen room's set in the toy box. */
  private trayItems(): TrayItem[] {
    if (!this.sets) return this.level.tray;
    const s = this.sets[this.setIndex];
    return s.parts.map((part) => ({ part, count: Infinity, skin: s.skin }));
  }

  private remaining(kind: PartKind) {
    if (this.sets) return Infinity;
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
    const rowH = Math.max(96, Math.min(130, ch * 0.17));
    const gap = TRAY_GAP;
    if (this.sets) { this.layoutSets(cw, ch, dpr, rowH); return; }
    const n = Math.max(1, this.level.tray.length);
    // The tray is one row of parts; when they don't fit it wraps onto more rows
    // rather than running off the screen.
    const fit = (cols: number) => Math.min(rowH - 14, (cw - 24) / cols - gap);
    let rows = 1;
    let cols = n;
    let item = fit(cols);
    const maxRows = Math.max(2, Math.floor((ch * 0.45 - 14) / (MIN_TOUCH_PX + gap)));
    while (item < MIN_TOUCH_PX && rows < maxRows) {
      rows++;
      cols = Math.ceil(n / rows);
      item = fit(cols);
    }
    // Only a very short screen with every row used squeezes parts below the usual size.
    item = Math.max(40, item);
    const trayH = rows === 1 ? rowH : rows * (item + gap) - gap + 14;
    const scale = Math.min((cw - 16) / WORLD_W, (ch - trayH - 12) / WORLD_H);
    const ox = (cw - WORLD_W * scale) / 2;
    const oy = 6;
    const itemX0 = (cw - cols * (item + gap) + gap) / 2;
    const itemY0 = ch - trayH + (trayH - (rows * (item + gap) - gap)) / 2;
    const items = this.level.tray.map((_, i) => ({ i, x: itemX0 + (i % cols) * (item + gap), y: itemY0 + Math.floor(i / cols) * (item + gap) }));
    this.L = { scale, ox, oy, trayTop: ch - trayH, trayH, item, cw, ch, dpr, items, tabs: [], tab: 0, prev: null, next: null };
  }

  /**
   * Toy box tray: room tabs pick a set of parts (each room's parts in its own look), and
   * arrows page through a set that is longer than the row. Wide screens keep it all on one
   * row so the table stays big; narrow ones put the tabs on a row of their own.
   */
  private layoutSets(cw: number, ch: number, dpr: number, rowH: number) {
    const gap = TRAY_GAP;
    const sets = this.sets!;
    const narrow = cw < 700;
    const pad = 12;
    const n = this.trayItems().length;
    const item = narrow ? 76 : Math.min(rowH - 14, 88);
    const tab = narrow ? Math.max(44, Math.min(68, (cw - 2 * pad) / sets.length - gap)) : Math.min(item, 68);
    const arrowW = Math.max(48, Math.round(item * 0.6));
    // Wide: tabs then one row of parts. Narrow: tabs on their own row, then as many rows of
    // parts as fit in the lower part of the screen.
    const areaX0 = narrow ? pad : pad + sets.length * (tab + gap) + 14;
    const areaW = cw - pad - areaX0;
    const colsFor = (w: number) => Math.max(1, Math.floor((w + gap) / (item + gap)));
    const maxRows = narrow ? Math.max(1, Math.floor((ch * 0.55 - tab - 3 * gap - 14) / (item + gap))) : 1;
    let cols = colsFor(areaW);
    let rows = Math.min(maxRows, Math.ceil(n / cols));
    const fitsAll = cols * rows >= n;
    if (!fitsAll) { cols = colsFor(areaW - 2 * (arrowW + gap)); rows = maxRows; }
    const perPage = cols * rows;
    const pages = Math.max(1, Math.ceil(n / perPage));
    this.page = Math.min(this.page, pages - 1);
    const blockH = rows * (item + gap) - gap;
    const trayH = narrow ? tab + blockH + 3 * gap + 14 : rowH;
    const rowY = ch - 7 - blockH;
    const tabY = narrow ? ch - trayH + 7 : rowY + (item - tab) / 2;
    const tabX0 = narrow ? (cw - sets.length * (tab + gap) + gap) / 2 : pad;
    const tabs = sets.map((_, k) => ({ x: tabX0 + k * (tab + gap), y: tabY }));
    const inner = fitsAll ? areaW : areaW - 2 * (arrowW + gap);
    const used = Math.min(cols, n) * (item + gap) - gap;
    const x0 = areaX0 + (fitsAll ? 0 : arrowW + gap) + (narrow ? (inner - used) / 2 : 0);
    const from = this.page * perPage;
    const shown = Math.min(perPage, n - from);
    const list = Array.from({ length: shown }, (_, k) => ({ i: from + k, x: x0 + (k % cols) * (item + gap), y: rowY + Math.floor(k / cols) * (item + gap) }));
    const prev = !fitsAll && this.page > 0 ? { x: areaX0, y: rowY, w: arrowW, h: blockH } : null;
    const next = !fitsAll && this.page < pages - 1 ? { x: areaX0 + areaW - arrowW, y: rowY, w: arrowW, h: blockH } : null;
    const scale = Math.min((cw - 16) / WORLD_W, (ch - trayH - 12) / WORLD_H);
    this.L = { scale, ox: (cw - WORLD_W * scale) / 2, oy: 6, trayTop: ch - trayH, trayH, item, cw, ch, dpr, items: list, tabs, tab, prev, next };
  }

  private toWorld(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    return { px, py, x: (px - this.L.ox) / this.L.scale, y: (py - this.L.oy) / this.L.scale };
  }

  /** What is under a finger in the tray: a part, a room tab, or a page arrow. */
  private trayHit(px: number, py: number): TrayHit {
    const L = this.L;
    if (py < L.trayTop) return null;
    const inBox = (x: number, y: number, w: number, h: number) => px >= x - TRAY_GAP / 2 && px < x + w + TRAY_GAP / 2 && py >= y - TRAY_GAP / 2 && py < y + h + TRAY_GAP / 2;
    for (const it of L.items) if (inBox(it.x, it.y, L.item, L.item)) return { item: it.i };
    for (let k = 0; k < L.tabs.length; k++) if (inBox(L.tabs[k].x, L.tabs[k].y, L.tab, L.tab)) return { tab: k };
    if (L.prev && inBox(L.prev.x, L.prev.y, L.prev.w, L.prev.h)) return { page: -1 };
    if (L.next && inBox(L.next.x, L.next.y, L.next.w, L.next.h)) return { page: 1 };
    return null;
  }

  // ---------- input ----------

  private down = (e: PointerEvent) => {
    if (this.mode === 'make') { this.makeTap(e); return; }
    if (this.mode !== 'build' || this.drag || this.drawing !== null) return;
    this.layout();
    const w = this.toWorld(e);
    if (this.pencil) {
      if (w.py > this.L.trayTop) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.drawing = e.pointerId;
      this.guess = [{ x: w.x, y: w.y }];
      this.showTrail = false;
      return;
    }
    const lift = e.pointerType === 'touch' ? 0.8 : 0;
    const hit = this.trayHit(w.px, w.py);
    if (hit && 'tab' in hit) {
      if (hit.tab !== this.setIndex) { this.setIndex = hit.tab; this.page = 0; sfx.place(); }
      return;
    }
    if (hit && 'page' in hit) { this.page += hit.page; sfx.place(); return; }
    if (hit) {
      const it = this.trayItems()[hit.item];
      const kind = it.part;
      if (this.remaining(kind) <= 0) { sfx.nope(); return; }
      const p: Placement = { part: kind, x: w.x, y: w.y - lift };
      if (it.skin) p.skin = it.skin;
      this.startDrag(e, p, -1, { x: 0, y: -lift }, w);
      this.drag!.moved = true;
      sfx.pickup();
      return;
    }
    // Rotate buttons sit on top of everything, so they are checked first.
    const h = this.handleAt(w.px, w.py);
    if (h) { this.turn(this.selected!, h.dir); return; }
    const minHalf = MIN_TOUCH_PX / 2 / this.L.scale;
    for (let i = this.placements.length - 1; i >= 0; i--) {
      const p = this.placements[i];
      if (hitTest(p, w.x, w.y, minHalf)) {
        this.startDrag(e, { ...p }, i, { x: p.x - w.x, y: p.y - w.y }, w);
        return;
      }
    }
    // Tapped the empty table: put the buttons away.
    this.selected = null;
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
    if (this.drawing === e.pointerId) {
      const w = this.toWorld(e);
      const last = this.guess[this.guess.length - 1];
      const x = Math.max(0, Math.min(WORLD_W, w.x)), y = Math.max(0, Math.min(WORLD_H, w.y));
      if (Math.hypot(x - last.x, y - last.y) > 0.12 && this.guess.length < 400) this.guess.push({ x, y });
      return;
    }
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    const w = this.toWorld(e);
    d.py = w.py;
    const slop = e.pointerType === 'mouse' ? TAP_SLOP.mouse : TAP_SLOP.touch;
    if (!d.moved && Math.hypot(w.px - d.downAt.x, w.py - d.downAt.y) > slop) {
      d.moved = true;
      sfx.pickup();
    }
    if (d.moved) {
      d.p.x = w.x + d.grab.x;
      d.p.y = w.y + d.grab.y;
    }
  };

  private up = (e: PointerEvent) => {
    if (this.drawing === e.pointerId) {
      this.drawing = null;
      // A dot isn't a guess: keep the pencil out for another try.
      const w = this.toWorld(e);
      const last = this.guess[this.guess.length - 1];
      if (Math.hypot(w.x - last.x, w.y - last.y) > 0.05) this.guess.push({ x: Math.max(0, Math.min(WORLD_W, w.x)), y: Math.max(0, Math.min(WORLD_H, w.y)) });
      let len = 0;
      for (let i = 1; i < this.guess.length; i++) len += Math.hypot(this.guess[i].x - this.guess[i - 1].x, this.guess[i].y - this.guess[i - 1].y);
      if (len < 0.8) { this.guess = []; return; }
      // The pencil stays out until its button is tapped again; a new line replaces this one.
      sfx.place();
      this.onChange();
      return;
    }
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.drag = null;
    const w = this.toWorld(e);

    if (!d.moved) {
      // A tap selects the part and shows its rotate buttons. It never turns it,
      // so a stray tap can't undo a careful angle.
      this.select(d.index);
      if (!PARTS[this.placements[d.index].part].rotatable) this.doWiggle(d.index);
      return;
    }

    // Dropped on the tray: put it away.
    if (w.py > this.L.trayTop) {
      if (d.index >= 0) this.placements.splice(d.index, 1);
      this.selected = null;
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
    // A freshly placed part shows its rotate buttons straight away, so they get discovered.
    this.select(d.index >= 0 ? d.index : this.placements.length - 1);
    sfx.place();
    this.changed();
  };

  private select(index: number) {
    const p = this.placements[index];
    if (!p || !PARTS[p.part].rotatable) { this.selected = null; return; }
    if (this.selected !== index) this.selectedAt = this.t;
    this.selected = index;
  }

  /** Turn a placed part one step left (-1) or right (+1), or flip it (0). */
  private turn(index: number, dir: -1 | 0 | 1) {
    const p = this.placements[index];
    const step = PARTS[p.part].rotStep ?? 15;
    const by = dir === 0 ? step : step * dir;
    // Turning can swing an end past the edge, so the part is nudged back onto the table.
    const rotated = clampToWorld({ ...p, rot: ((((p.rot ?? 0) + by + 180) % 360) + 360) % 360 - 180 });
    if (overlapsAny(rotated, this.others(index))) { sfx.nope(); this.doWiggle(index); return; }
    this.placements[index] = rotated;
    this.turnFlash = { dir, until: this.t + 0.2 };
    sfx.rotate();
    this.changed();
  }

  /** Where the selected part's rotate buttons are, in screen px. */
  private handles(): Handle[] {
    if (this.mode !== 'build' || this.selected === null || this.drag?.moved) return [];
    const p = this.placements[this.selected];
    if (!p) return [];
    const L = this.L;
    const def = PARTS[p.part];
    const a = turnOf(p);
    const hw = def.hit.w, hh = def.hit.h, dy = def.hit.dy ?? 0;
    // Screen-space half size of the turned hit box.
    const ex = (Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh) * L.scale;
    const ey = (Math.abs(Math.sin(a)) * hw + Math.abs(Math.cos(a)) * hh) * L.scale;
    const cx = L.ox + (p.x - Math.sin(a) * dy) * L.scale;
    const cy = L.oy + (p.y + Math.cos(a) * dy) * L.scale;
    const r = HANDLE_R, gap = 8;
    const flip = def.rotStep === 180;
    const out: Handle[] = [];
    // Above the part if there's room, else below it, else either side of it.
    let y = cy - ey - r - gap;
    if (y - r < 0) y = cy + ey + r + gap;
    if (y + r > L.trayTop) {
      if (flip) out.push({ dir: 0, px: cx + ex + r + gap, py: cy });
      else out.push({ dir: -1, px: cx - ex - r - gap, py: cy }, { dir: 1, px: cx + ex + r + gap, py: cy });
    } else if (flip) {
      out.push({ dir: 0, px: cx, py: y });
    } else {
      out.push({ dir: -1, px: cx - r - gap / 2, py: y }, { dir: 1, px: cx + r + gap / 2, py: y });
    }
    for (const h of out) h.px = Math.min(L.cw - r - 2, Math.max(r + 2, h.px));
    return out;
  }

  private handleAt(px: number, py: number): Handle | null {
    for (const h of this.handles()) if (Math.hypot(px - h.px, py - h.py) <= HANDLE_R + 6) return h;
    return null;
  }

  private cancel = (e: PointerEvent) => {
    if (this.drawing === e.pointerId) { this.drawing = null; this.guess = []; }
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
    this.showTrail = false;
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
      const o = this.level.goal && s.byId(this.level.goal.object);
      if (o) {
        const b = Sim.goalBody(o).getPosition();
        const last = this.trail[this.trail.length - 1];
        if (!last || Math.hypot(b.x - last.x, b.y - last.y) > 0.1) this.trail.push({ x: b.x, y: b.y });
      }
      for (const ev of s.events) {
        if (ev.type === 'pop') this.bangs.push({ x: ev.x, y: ev.y, t: this.t });
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
    this.wonAt = this.t;
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
    setSkin(this.skin);
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
    ctx.beginPath(); ctx.roundRect(0, 0, WORLD_W, WORLD_H, 0.25); ctx.fillStyle = this.paper; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, WORLD_W, WORLD_H, 0.25); ctx.clip();
    drawTable(ctx, WORLD_W, WORLD_H, this.paper);
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
      if (rp.placement.skin !== undefined) setSkin(rp.placement.skin || this.skin);
      drawPart(ctx, rp, this.t);
      if (rp.placement.skin !== undefined) setSkin(this.skin);
      if (wig) ctx.restore();
      if (rp.placement.fixed && this.mode === 'build') drawFixedPin(ctx, rp);
      if (this.making && kidIndex >= 0 && this.making.pins.has(kidIndex)) drawFixedPin(ctx, rp);
    });
    if (this.making) this.renderMaking(ctx);

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
      setSkin(show.skin || this.skin);
      drawPart(ctx, this.dragSim!.parts[0], this.t);
      setSkin(this.skin);
      ctx.restore();
    }

    this.renderGuess(ctx);
    this.renderHint(ctx);
    ctx.shadowColor = 'transparent';
    this.drawGrain(ctx);
    this.renderBangs(ctx);
    for (const c of this.confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a); ctx.fillStyle = c.c; ctx.fillRect(-0.1, -0.06, 0.2, 0.12); ctx.restore();
    }
    ctx.restore();

    this.renderTray(ctx);
    this.renderHandles(ctx);

    // Film strip: a snapshot every so often while the machine runs, and one more
    // just after the win, with the confetti flying.
    if (this.sim && this.mode === 'run' && (this.lastShot < 0 || this.sim.time - this.lastShot >= FILM_EVERY)) {
      this.lastShot = this.sim.time;
      this.snap();
    }
    if (this.mode === 'won' && this.lastShot >= 0 && this.t - this.wonAt > 0.45) {
      this.lastShot = -1;
      this.snap();
    }
  }

  /** The guessed path (a crayon line) and, once the machine has run, the real one (teal dots). */
  private renderGuess(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const g = this.guess;
    if (g.length > 1) {
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = PAPER.tomato;
      ctx.lineWidth = 0.14;
      ctx.beginPath();
      ctx.moveTo(g[0].x, g[0].y);
      for (const p of g) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      // An arrow head where the guess ends, once it's drawn.
      if (this.drawing === null) {
        const a = g[g.length - 1], b = g[Math.max(0, g.length - 4)];
        const ang = Math.atan2(a.y - b.y, a.x - b.x);
        ctx.fillStyle = PAPER.tomato;
        ctx.beginPath();
        for (const k of [0, 2.4, -2.4]) ctx.lineTo(a.x + Math.cos(ang + k) * 0.3, a.y + Math.sin(ang + k) * 0.3);
        ctx.fill();
      }
    }
    if (this.showTrail && this.trail.length > 1) {
      // Dots every 0.3 cells along the real path.
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = PAPER.teal;
      let next = 0, walked = 0;
      for (let i = 1; i < this.trail.length; i++) {
        const a = this.trail[i - 1], b = this.trail[i];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        while (next <= walked + len) {
          const f = (next - walked) / len;
          ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 0.075, 0, Math.PI * 2); ctx.fill();
          next += 0.3;
        }
        walked += len;
      }
    }
    ctx.restore();
  }

  /** Rings in make mode: solid teal on the goal parts, a pulsing dashed ring on parts you can tap now. */
  private renderMaking(ctx: CanvasRenderingContext2D) {
    const m = this.making!;
    ctx.save();
    ctx.shadowColor = 'transparent';
    this.placements.forEach((p, i) => {
      const goal = i === m.object || i === m.target;
      const tap = this.makeable(i) && m.step !== 'pins';
      if (!goal && !tap) return;
      const def = PARTS[p.part];
      const r = Math.max(def.hit.w, def.hit.h) + 0.3 + (tap ? 0.06 * Math.sin(this.t * 6) : 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y + (def.hit.dy ?? 0), r, 0, Math.PI * 2);
      ctx.lineWidth = goal ? 0.09 : 0.07;
      ctx.strokeStyle = goal ? PAPER.teal : PAPER.mustard;
      ctx.setLineDash(goal ? [] : [0.2, 0.14]);
      ctx.lineDashOffset = -this.t * 0.6;
      ctx.stroke();
    });
    ctx.restore();
  }

  /** The hint ghost: fades in, glows a little, fades out. Drawn in world units. */
  private renderHint(ctx: CanvasRenderingContext2D) {
    const h = this.hint;
    if (!h) return;
    const age = this.t - h.from;
    if (age > HINT_SECONDS || this.mode !== 'build') { this.hint = null; return; }
    const env = Math.min(1, age / 0.4, (HINT_SECONDS - age) / 0.6);
    const p = h.rp.placement;
    const def = PARTS[p.part];
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = env * (0.5 + 0.12 * Math.sin(age * 6));
    drawPart(ctx, h.rp, this.t);
    ctx.globalAlpha = env;
    ctx.translate(p.x, p.y);
    ctx.rotate(turnOf(p));
    ctx.setLineDash([0.18, 0.14]);
    ctx.lineDashOffset = -this.t * 0.5;
    ctx.strokeStyle = PAPER.teal;
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.roundRect(-def.hit.w - 0.12, -def.hit.h + (def.hit.dy ?? 0) - 0.12, def.hit.w * 2 + 0.24, def.hit.h * 2 + 0.24, 0.15);
    ctx.stroke();
    ctx.restore();
  }

  private renderHandles(ctx: CanvasRenderingContext2D) {
    const hs = this.handles();
    if (!hs.length) return;
    const L = this.L;
    const p = this.placements[this.selected!];
    const def = PARTS[p.part];

    // A dashed ring round the selected part, so it's clear which one the buttons turn.
    ctx.save();
    ctx.translate(L.ox + p.x * L.scale, L.oy + p.y * L.scale);
    ctx.rotate(turnOf(p));
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -this.t * 20;
    ctx.strokeStyle = 'rgba(60,45,30,0.45)';
    ctx.lineWidth = 2.5;
    const pad = 6;
    ctx.beginPath();
    ctx.roundRect(-def.hit.w * L.scale - pad, (-def.hit.h + (def.hit.dy ?? 0)) * L.scale - pad,
      def.hit.w * 2 * L.scale + pad * 2, def.hit.h * 2 * L.scale + pad * 2, 10);
    ctx.stroke();
    ctx.restore();

    // The buttons pop in, then bob a little so the eye finds them.
    const age = this.t - this.selectedAt;
    const pop = Math.min(1, age / 0.18);
    const bob = age < 1.2 ? Math.sin(age * 10) * 3 * (1 - age / 1.2) : 0;
    for (const h of hs) {
      const r = HANDLE_R * (0.6 + 0.4 * pop);
      const s = r / HANDLE_R;
      const pressed = this.turnFlash && this.turnFlash.dir === h.dir && this.t < this.turnFlash.until;
      ctx.save();
      ctx.translate(h.px, h.py + bob);
      if (pressed) ctx.scale(0.88, 0.88);
      ctx.shadowColor = 'rgba(80,55,30,0.3)'; ctx.shadowOffsetY = 3; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fffaf0'; ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 3; ctx.strokeStyle = PAPER.mustard; ctx.stroke();
      ctx.strokeStyle = PAPER.ink; ctx.fillStyle = PAPER.ink;
      ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (h.dir === 0) {
        // Flip: a double-headed arrow.
        ctx.beginPath(); ctx.moveTo(-12 * s, 0); ctx.lineTo(12 * s, 0); ctx.stroke();
        for (const k of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(k * 19 * s, 0); ctx.lineTo(k * 9 * s, -8 * s); ctx.lineTo(k * 9 * s, 8 * s); ctx.closePath(); ctx.fill();
        }
      } else {
        // A curved arrow, drawn clockwise then mirrored for the left button.
        ctx.scale(h.dir, 1);
        const R = 13 * s, oy = 2 * s;
        const a0 = -Math.PI * 0.95, a1 = Math.PI * 0.3;
        ctx.beginPath(); ctx.arc(0, oy, R, a0, a1); ctx.stroke();
        const ex = Math.cos(a1) * R, ey = oy + Math.sin(a1) * R;
        const tx = -Math.sin(a1), ty = Math.cos(a1); // direction of travel
        const nx = Math.cos(a1), ny = Math.sin(a1);  // across the arrow
        const len = 10 * s, wid = 7.5 * s;
        ctx.beginPath();
        ctx.moveTo(ex + tx * len * 0.75, ey + ty * len * 0.75);
        ctx.lineTo(ex - tx * len * 0.25 + nx * wid, ey - ty * len * 0.25 + ny * wid);
        ctx.lineTo(ex - tx * len * 0.25 - nx * wid, ey - ty * len * 0.25 - ny * wid);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  private grainPattern: CanvasPattern | null = null;

  /** Multiply a paper-fibre texture over the table, in screen pixels so it stays crisp. */
  private drawGrain(ctx: CanvasRenderingContext2D) {
    this.grainPattern ??= ctx.createPattern(paperGrain(), 'repeat');
    if (!this.grainPattern) return;
    const L = this.L;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.roundRect(L.ox * L.dpr, L.oy * L.dpr, WORLD_W * L.scale * L.dpr, WORLD_H * L.scale * L.dpr, 0.25 * L.scale * L.dpr);
    ctx.fillStyle = this.grainPattern;
    ctx.fill();
    ctx.restore();
  }

  private getPreview() {
    if (!this.preview) this.preview = new Sim([...this.fixed, ...this.placements], this.level.goal);
    return this.preview;
  }

  private renderBangs(ctx: CanvasRenderingContext2D) {
    const LIFE = 0.7;
    this.bangs = this.bangs.filter((b) => this.t - b.t < LIFE);
    for (const b of this.bangs) {
      const k = (this.t - b.t) / LIFE;
      ctx.save();
      ctx.globalAlpha = 0.55 * (1 - k);
      ctx.strokeStyle = PAPER.mustard;
      ctx.lineWidth = 0.12;
      ctx.setLineDash([0.3, 0.2]);
      for (const f of [1, 0.6]) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, HEAR_POP * f * Math.sqrt(k), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private renderTray(ctx: CanvasRenderingContext2D) {
    const L = this.L;
    ctx.save();
    ctx.globalAlpha = this.mode === 'build' ? 1 : 0.45;
    this.renderTabs(ctx);
    const items = this.trayItems();
    L.items.forEach(({ i, x, y: y0 }) => {
      const t = items[i];
      if (!t) return;
      setSkin(t.skin ?? this.skin);
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
    setSkin(this.skin);
    ctx.restore();
  }

  /** Room tabs (a round badge in the room's colours with its own part) and the page arrows. */
  private renderTabs(ctx: CanvasRenderingContext2D) {
    const L = this.L;
    if (!this.sets) return;
    this.sets.forEach((s, k) => {
      const { x, y } = L.tabs[k];
      const on = k === this.setIndex;
      ctx.save();
      ctx.translate(0, on ? -4 : 0);
      ctx.shadowColor = 'rgba(80,55,30,0.25)'; ctx.shadowOffsetY = on ? 4 : 2; ctx.shadowBlur = on ? 6 : 3;
      ctx.beginPath(); ctx.roundRect(x, y, L.tab, L.tab, L.tab / 2); ctx.fillStyle = s.paper; ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = on ? 5 : 3; ctx.strokeStyle = s.accent; ctx.stroke();
      setSkin(s.skin);
      drawIcon(ctx, s.icon, x + L.tab / 2, y + L.tab / 2, L.tab * (s.icon === 'hammer' ? 1.45 : TALL_ICONS.has(s.icon) ? 1.05 : 0.8), this.t);
      ctx.restore();
    });
    setSkin(this.skin);
    for (const [a, dir] of [[L.prev, -1], [L.next, 1]] as const) {
      if (!a) continue;
      ctx.save();
      ctx.shadowColor = 'rgba(80,55,30,0.2)'; ctx.shadowOffsetY = 3; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.roundRect(a.x, a.y, a.w, a.h, 14); ctx.fillStyle = '#fffaf0'; ctx.fill();
      ctx.shadowColor = 'transparent';
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2, s = Math.min(a.w, a.h) * 0.22;
      ctx.beginPath(); ctx.moveTo(cx - dir * s * 0.5, cy - s); ctx.lineTo(cx + dir * s * 0.6, cy); ctx.lineTo(cx - dir * s * 0.5, cy + s);
      ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = PAPER.ink; ctx.stroke();
      ctx.restore();
    }
  }
}
