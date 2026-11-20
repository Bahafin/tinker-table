// The sticker book: every finished level gives a sticker (a part from that level,
// drawn in its room's look), and the child places stickers anywhere on the page.
// Nothing is scored: it's a page to decorate. Kept on this device only.
import { LEVELS, roomOf } from '../levels';
import type { Level, PartKind } from '../sim/types';
import { setSkin } from '../render/draw';
import { drawIcon } from './game';
import { sfx } from './audio';

const BOOK_KEY = 'tinker.book';

/** Which part a level's sticker shows: the most special thing in it, in this order. */
const PRIORITY: PartKind[] = [
  'car', 'hammer', 'toaster', 'can', 'scissors', 'rope', 'flower', 'bell', 'drum', 'xylo-g', 'xylo-e', 'xylo-c',
  'hamster', 'pulley', 'fan', 'balloon', 'spring', 'seesaw', 'conveyor',
  'heavyball', 'domino', 'star', 'basket', 'ball',
];

export function stickerKind(level: Level): PartKind {
  const has = new Set<PartKind>([...level.fixed.map((p) => p.part), ...level.tray.map((t) => t.part)]);
  return PRIORITY.find((k) => has.has(k)) ?? 'ball';
}

/** Where each placed sticker sits on the page: [x, y] as fractions of the page, and a tilt in degrees. */
type Spot = [number, number, number];
type Book = Record<string, Spot>;

export function loadBook(): Book {
  try {
    const v = JSON.parse(localStorage.getItem(BOOK_KEY) ?? '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const out: Book = {};
    for (const [k, s] of Object.entries(v)) {
      if (Array.isArray(s) && s.length === 3 && s.every((n) => typeof n === 'number' && Number.isFinite(n))) out[k] = s as Spot;
    }
    return out;
  } catch { return {}; }
}
function saveBook(b: Book) {
  try { localStorage.setItem(BOOK_KEY, JSON.stringify(b)); } catch { /* private mode */ }
}

/** Stickers earned but not yet stuck in the book. */
export function looseStickers(done: Set<string>) {
  const b = loadBook();
  return LEVELS.filter((l) => done.has(l.id) && !b[l.id]).length;
}

const cache = new Map<string, string>();
/** A die-cut sticker picture: the part in its room's look, with a white border round it. */
function stickerImage(index: number): string {
  const level = LEVELS[index];
  const hit = cache.get(level.id);
  if (hit) return hit;
  const S = 160, B = 7;
  const art = document.createElement('canvas');
  art.width = art.height = S;
  const a = art.getContext('2d')!;
  const kind = stickerKind(level);
  const room = roomOf(index);
  // A round backing in the room's colours, with the part on top.
  a.beginPath();
  a.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2);
  a.fillStyle = room?.paper ?? '#fffaf0';
  a.fill();
  a.lineWidth = 7;
  a.strokeStyle = room?.accent ?? '#2f9c95';
  a.stroke();
  setSkin(room?.id ?? '');
  // Thin parts fit their box by their height, so they get a bigger box.
  const thin = kind === 'hammer' || kind === 'domino' || kind === 'rope';
  drawIcon(a, kind, S / 2, S / 2, S * (kind === 'hammer' ? 0.95 : thin ? 0.7 : 0.56));
  setSkin('');
  const out = document.createElement('canvas');
  out.width = out.height = S;
  const o = out.getContext('2d')!;
  // White border: the picture stamped in a ring of offsets, then filled white.
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    o.drawImage(art, Math.cos(ang) * B, Math.sin(ang) * B);
  }
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = '#fff';
  o.fillRect(0, 0, S, S);
  o.globalCompositeOperation = 'source-over';
  o.drawImage(art, 0, 0);
  const url = out.toDataURL();
  cache.set(level.id, url);
  return url;
}

/**
 * Fill the book screen: the page with the placed stickers, and a strip of loose
 * ones underneath. Drag a sticker onto the page to stick it, drag it around to
 * move it, or drag it off the page to take it back.
 */
export function renderBook(page: HTMLElement, strip: HTMLElement, done: Set<string>) {
  const book = loadBook();
  page.querySelectorAll('.stk').forEach((e) => e.remove());
  strip.innerHTML = '';
  LEVELS.forEach((level, i) => {
    if (!done.has(level.id)) return;
    const el = document.createElement('img');
    el.className = 'stk';
    el.src = stickerImage(i);
    el.alt = '';
    el.draggable = false;
    const spot = book[level.id];
    if (spot) {
      el.style.left = `${spot[0] * 100}%`;
      el.style.top = `${spot[1] * 100}%`;
      el.style.setProperty('--tilt', `${spot[2]}deg`);
      page.append(el);
    } else {
      strip.append(el);
    }
    el.addEventListener('pointerdown', (e) => drag(e, el, level.id, page, strip, done));
  });
  strip.classList.toggle('empty', !strip.children.length);
}

function drag(e: PointerEvent, el: HTMLElement, id: string, page: HTMLElement, strip: HTMLElement, done: Set<string>) {
  e.preventDefault();
  const r = el.getBoundingClientRect();
  const size = page.getBoundingClientRect().width * 0.13;
  // While dragging, the sticker floats above everything at the finger.
  const ghost = el.cloneNode() as HTMLElement;
  ghost.className = 'stk lifted';
  ghost.style.width = ghost.style.height = `${Math.max(r.width, size)}px`;
  const place = (x: number, y: number) => { ghost.style.left = `${x}px`; ghost.style.top = `${y}px`; };
  place(e.clientX, e.clientY);
  document.body.append(ghost);
  el.style.visibility = 'hidden';
  sfx.pickup();
  const move = (ev: PointerEvent) => { if (ev.pointerId === e.pointerId) place(ev.clientX, ev.clientY); };
  const end = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId) return;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    ghost.remove();
    const p = page.getBoundingClientRect();
    const fx = (ev.clientX - p.left) / p.width, fy = (ev.clientY - p.top) / p.height;
    const book = loadBook();
    if (ev.type === 'pointerup' && fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
      // Keep it on the page, with a little tilt like a real sticker.
      const tilt = book[id]?.[2] ?? Math.round((Math.random() - 0.5) * 24);
      book[id] = [Math.min(0.95, Math.max(0.05, fx)), Math.min(0.93, Math.max(0.07, fy)), tilt];
      sfx.place();
    } else if (ev.type === 'pointerup') {
      delete book[id];
      sfx.place();
    }
    saveBook(book);
    renderBook(page, strip, done);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}
