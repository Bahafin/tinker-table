import './style.css';
import { LEVELS, MAKER_BOX, ROOM_PART, ROOMS, roomOf, roomVoice, TOY_BOX, type Room } from './levels';
import { Sim } from './sim/sim';
import { WORLD_H, WORLD_W, type Level, type Note, type PartKind, type Placement } from './sim/types';
import { drawFixedPin, drawPart, drawTable, PAPER, setPaperShadow, setSkin } from './render/draw';
import { Game, drawIcon, type TraySet } from './ui/game';
import { ALL_PARTS, TOY_PARTS } from './sim/parts';
import { sfx, speak, stopSpeaking, unlockAudio } from './ui/audio';
import { INTRO, MADE_TALK, MAKER_HOW, ROUTINE, SKILLS, TALK, TIPS, TOYS_HOW } from './parents/content';
import { decodeLevel, decodeToy, encodeLevel, encodeToy, MADE_VOICE, SHARED_VOICE } from './levels/share';
import { Share } from '@capacitor/share';
import { gameAddress, NATIVE, PLATFORM } from './platform';
import { ScreenLock } from './app-lock';
import { BOOK_KEY, looseStickers, renderBook } from './ui/book';
import { Pin } from './ui/pin';
import { askPin, newPin } from './ui/pinpad';
import { guessPlatform, lockGuideHtml, wireLockGuide } from './parents/lock';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------- progress (per device, best effort) ----------
const DONE_KEY = 'tinker.done';
function loadDone(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]')); } catch { return new Set(); }
}
function markDone(id: string) {
  const d = loadDone();
  d.add(id);
  try { localStorage.setItem(DONE_KEY, JSON.stringify([...d])); } catch { /* private mode */ }
}

// ---------- map ----------
const STICKER = `<svg class="sticker" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23" style="fill:${PAPER.mustard};stroke:#fff;stroke-width:4"/>
<circle cx="19" cy="22" r="2.5" style="fill:${PAPER.ink};stroke:none"/><circle cx="33" cy="22" r="2.5" style="fill:${PAPER.ink};stroke:none"/>
<path d="M17 30q9 9 18 0" style="stroke:${PAPER.ink};stroke-width:3.5"/></svg>`;

/** Blend two #rrggbb colours: t=0 gives a, t=1 gives b. */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((v, k) => Math.round(v + (pb[k] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Little paper-cut pictures for each room's banner (the name sits beside it). */
const ROOM_ICONS: Record<string, string> = {
  workshop: '<path d="M14 34 30 18" stroke-width="5"/><rect x="26" y="9" width="16" height="9" rx="2" transform="rotate(45 34 13.5)" class="accent"/>',
  garden: '<circle cx="38" cy="10" r="5" class="petal" stroke-width="2"/><path d="M22 42V26"/><path d="M22 36c-6 0-9-3-10-7 5 0 9 2 10 7z" class="leaf" stroke-width="2"/><g stroke-width="2"><circle cx="22" cy="12" r="5.5" class="pink"/><circle cx="15" cy="19" r="5.5" class="pink"/><circle cx="29" cy="19" r="5.5" class="pink"/><circle cx="22" cy="26" r="5.5" class="pink"/><circle cx="22" cy="19" r="4.5" class="petal"/></g>',
  kitchen: '<path d="M9 22h24v9a7 7 0 0 1-7 7H16a7 7 0 0 1-7-7z" class="accent"/><path d="M33 25h8" /><path d="M15 16c0-3 3-3 3-6M22 16c0-3 3-3 3-6" />',
  playroom: '<rect x="8" y="26" width="14" height="14" rx="2" class="accent"/><rect x="24" y="26" width="14" height="14" rx="2" class="petal"/><rect x="16" y="11" width="14" height="14" rx="2" class="leaf"/>',
  music: '<path d="M18 34V12l20-5v22"/><ellipse cx="13.5" cy="34.5" rx="5.5" ry="4.5" class="accent"/><ellipse cx="33.5" cy="29.5" rx="5.5" ry="4.5" class="accent"/><path d="M18 18l20-5"/>',
  attic: '<path d="M30 9a13 13 0 1 0 9 22A11 11 0 0 1 30 9z" class="accent"/><path d="M13 11l1.5 3 3.2.5-2.3 2.2.6 3.2-3-1.6-2.9 1.6.6-3.2-2.3-2.2 3.2-.5z" class="petal"/>',
};

/** The puzzle maker's picture: a star with a pin through it. */
const MAKER_ICON = '<path d="M24 6l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L24 29.6l-9.3 4.9 1.8-10.3L9 16.9l10.4-1.5z" class="petal"/><circle cx="24" cy="39" r="3.5" class="accent"/><path d="M24 35.5V29"/>';
const MAKER_ACCENT = '#d9a23c';
const MAKER_PAPER = '#fbf2dc';

/** The toy box's picture: an open box with a ball and a star popping out. */
const TOY_ICON = '<path d="M8 22h32l-3 18H11z" class="accent"/><path d="M8 22l-3-7 13 2M40 22l3-7-13 2"/><circle cx="20" cy="15" r="5" class="pink"/><path d="M31 6l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" class="petal" stroke-width="2"/>';

function roomBanner(room: Room): HTMLElement {
  const el = document.createElement('div');
  el.className = 'room-banner';
  el.style.setProperty('--accent', room.accent);
  el.style.setProperty('--paper', room.paper);
  el.innerHTML = `<span class="tape"></span><svg viewBox="0 0 48 48" aria-hidden="true">${ROOM_ICONS[room.id] ?? ''}</svg>`;
  el.append(nameTag(room.name, room.accent));
  el.insertAdjacentHTML('beforeend', '<span class="tape"></span>');
  return el;
}

/** Pixels per grid cell for the little pictures: sharp on Retina screens, at most 2x. */
const THUMB_PX = 22 * Math.min(2, Math.max(1, window.devicePixelRatio || 1));

function thumb(level: Level, toy = false, withSolution = false, room?: Room): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const s = THUMB_PX;
  c.width = WORLD_W * s;
  c.height = WORLD_H * s;
  const ctx = c.getContext('2d')!;
  ctx.scale(s, s);
  drawTable(ctx, WORLD_W, WORLD_H, room?.paper);
  setPaperShadow(ctx, 1.5);
  if (toy) {
    setSkin('');
    const kinds: [PartKind, number, number][] = [['seesaw', 4, 6.5], ['ball', 2.6, 5.4], ['balloon', 12, 3], ['domino', 8, 8.75], ['domino', 9, 8.75], ['fan', 13.5, 9], ['heavyball', 5.5, 2.5], ['star', 9.5, 2.5]];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [k, x, y] of kinds) drawIcon(ctx, k, x * s, y * s, k === 'seesaw' ? 4.4 * s : 1.6 * s);
    return c;
  }
  setSkin(room?.id ?? '');
  const parts: Placement[] = level.fixed.map((p) => ({ ...p, fixed: true }));
  if (withSolution) parts.push(...(level.solution ?? []));
  const sim = new Sim(parts, level.goal);
  for (const rp of sim.parts) {
    // Toy-box parts can each come from a different room.
    if (rp.placement.skin !== undefined) setSkin(rp.placement.skin || (room?.id ?? ''));
    drawPart(ctx, rp, 0);
    if (rp.placement.skin !== undefined) setSkin(room?.id ?? '');
    if (!level.id.startsWith('toybox')) drawFixedPin(ctx, rp);
  }
  setSkin('');
  return c;
}

/** The part that plays each note, for drawing a tune. */
const NOTE_PART: Record<Note, PartKind> = { c: 'xylo-c', d: 'xylo-d', e: 'xylo-e', g: 'xylo-g', a: 'xylo-a', bell: 'bell', drum: 'drum' };

/** Each room's own part, shown on its tab in the toy box tray. */
// ROOM_PART (each room's own part) lives in levels/index.ts.

/**
 * The toy box tray's sets: one per room, with every part used in that room's levels, in the
 * room's own look. Parts from different rooms can share the table. The puzzle maker adds the
 * goal parts (star, cheese) that the toy box leaves out.
 */
function traySets(withGoals: boolean): TraySet[] {
  const order = withGoals ? ALL_PARTS : TOY_PARTS;
  return ROOMS.map((room) => {
    const used = new Set<PartKind>([ROOM_PART[room.id]]);
    for (const lv of LEVELS.slice(room.first, room.first + room.count)) {
      for (const p of lv.fixed) used.add(p.part);
      for (const t of lv.tray) used.add(t.part);
    }
    return { skin: room.id, accent: room.accent, paper: room.paper, icon: ROOM_PART[room.id], parts: order.filter((k) => used.has(k)) };
  });
}

/** A room's front-page picture: its own things laid out on its own paper. */
function roomScene(room: Room): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const s = THUMB_PX;
  c.width = WORLD_W * s;
  c.height = WORLD_H * s;
  const ctx = c.getContext('2d')!;
  ctx.scale(s, s);
  drawTable(ctx, WORLD_W, WORLD_H, room.paper);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  setSkin(room.id);
  const things: [PartKind, number, number, number][] = [
    ['ramp', 6.6, 4.3, 6.4], ['ball', 5.2, 2.5, 3], ['pin', 10.4, 3.6, 3], ['star', 13.2, 2.6, 4],
    ['block', 2.8, 7.8, 3.4], ['domino', 6.4, 7.5, 4.4], ['domino', 7.8, 7.5, 4.4], ['basket', 12.4, 7.7, 5.6],
  ];
  // The playroom's own toy, the car, takes the pin's spot.
  if (room.id === 'playroom') things[2] = ['car', 10.2, 3.8, 3.2];
  if (room.id === 'garden') { things[2] = ['can', 10.2, 3.6, 3]; things[3] = ['flower', 13.2, 2.6, 3.4]; }
  if (room.id === 'attic') { things[2] = ['rope', 10.4, 3.4, 6.4]; things[1] = ['scissors', 5, 2.4, 2.4]; }
  if (room.id === 'kitchen') things[2] = ['toaster', 10.2, 3.6, 3.2];
  if (room.id === 'workshop') things[2] =['hammer', 10.3, 3.6, 5.6];
  if (room.id === 'music') {
    things[2] = ['bell', 10.4, 3.4, 2.8];
    things[4] = ['drum', 2.8, 7.8, 3.2];
    things[5] = ['xylo-c', 6.2, 6.6, 3];
    things[6] = ['xylo-g', 8.4, 7.8, 3];
  }
  for (const [k, x, y, size] of things) drawIcon(ctx, k, x * s, y * s, size * s);
  setSkin('');
  return c;
}

const BACK_ICON = '<svg viewBox="0 0 48 48"><path d="M38 24H12M22 13 11 24l11 11" /></svg>';

/** null: the front page of rooms; otherwise the room being looked at ('toybox' included). */
let mapRoom: string | null = null;
/** Which stop on the front page's row of rooms was last in the middle (-1: not yet). */
let shownRoom = -1;

function showMap() {
  game?.destroy();
  game = null;
  // Leaving a shared puzzle: drop the link from the address bar so a reload shows the map.
  if (location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname + location.search);
  stopSpeaking();
  $('play').classList.add('hidden');
  $('map').classList.remove('hidden');
  const box = $('levels');
  box.innerHTML = '';
  box.className = mapRoom ? 'in-room' : 'rooms';
  box.style.width = '';
  $('map').classList.toggle('in-room', !!mapRoom);
  // A little dot on the book when there are stickers waiting to be stuck in.
  $('btn-book').querySelector('.new')!.classList.toggle('hidden', !looseStickers(loadDone()));
  if (!mapRoom) showRooms(box);
  else if (mapRoom === 'toybox' || mapRoom === 'maker') showToyRoom(box, mapRoom);
  else showRoom(box, ROOMS.find((r) => r.id === mapRoom)!);
  $('map').scrollTop = 0;
  if (justMade) {
    box.querySelector('.fresh')?.scrollIntoView({ block: 'center' });
    justMade = '';
  }
}

function openRoom(id: string | null) {
  mapRoom = id;
  showMap();
}

/** A room's name as a word to look at: tapping it reads it aloud. */
function nameTag(name: string, accent: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'room-name';
  b.textContent = name;
  b.style.setProperty('--accent', accent);
  b.onclick = (e) => { e.stopPropagation(); unlockAudio(); speak(name); };
  return b;
}

const ARROW = (d: string) => `<svg viewBox="0 0 48 48"><path d="${d}" /></svg>`;

/**
 * The front page: the rooms in a row, easiest on the left, then the toy box at the end.
 * One room sits in the middle and the next peeks in from the side; swipe or tap the arrows to move.
 */
function showRooms(box: HTMLElement) {
  const done = loadDone();
  const path = document.createElement('div');
  path.className = 'path';
  const stops: { el: HTMLElement; name: string }[] = [];
  let here = -1;

  const addStop = (id: string, name: string, accent: string, paper: string, bg: string, pic: HTMLCanvasElement, icon: string) => {
    const stop = document.createElement('div');
    stop.className = 'stop';
    const t = document.createElement('button');
    t.className = 'card room-tile' + (id === 'toybox' ? ' toybox' : '');
    t.setAttribute('aria-label', name);
    t.style.setProperty('--accent', accent);
    t.style.setProperty('--paper', paper);
    t.style.background = bg;
    t.append(pic);
    t.insertAdjacentHTML('beforeend', `<svg class="room-pic" viewBox="0 0 48 48">${icon}</svg>`);
    const k = stops.length;
    // A peeking room comes to the middle first; the one in the middle opens.
    t.onclick = () => (k === here ? openRoom(id) : centre(k, true));
    const tag = nameTag(name, accent);
    tag.addEventListener('click', () => { if (k !== here) { quietUntilSettled = true; centre(k, true); } });
    stop.append(t, tag);
    path.append(stop);
    stops.push({ el: stop, name });
    return t;
  };

  for (const room of ROOMS) {
    const t = addStop(room.id, room.name, room.accent, room.paper, mix(room.paper, '#ffffff', 0.45), roomScene(room), ROOM_ICONS[room.id] ?? '');
    // One dot per level, filled in when it's done: progress without numbers.
    const dots = document.createElement('span');
    dots.className = 'dots';
    for (let i = room.first; i < room.first + room.count; i++) {
      const d = document.createElement('i');
      if (done.has(LEVELS[i].id)) d.className = 'on';
      dots.append(d);
    }
    t.append(dots);
    if (LEVELS.slice(room.first, room.first + room.count).every((l) => done.has(l.id))) t.insertAdjacentHTML('beforeend', STICKER);
  }
  const toy = addStop('toybox', 'Toy box', PAPER.teal, '#eef7f3', '#f4faf7', thumb(TOY_BOX, true), TOY_ICON);
  if (loadToys().length) toy.insertAdjacentHTML('beforeend', SAVED_BADGE);
  const maker = addStop('maker', 'Puzzle maker', MAKER_ACCENT, MAKER_PAPER, '#fdf8ec', makerScene(), MAKER_ICON);
  if (loadMine().length) maker.insertAdjacentHTML('beforeend', MADE_BADGE);

  const prev = document.createElement('button');
  prev.className = 'icon path-arrow prev';
  prev.setAttribute('aria-label', 'Previous room');
  prev.innerHTML = ARROW('M30 11 17 24l13 13');
  const next = document.createElement('button');
  next.className = 'icon path-arrow next';
  next.setAttribute('aria-label', 'Next room');
  next.innerHTML = ARROW('M18 11l13 13-13 13');
  prev.onclick = () => centre(Math.max(0, here - 1), true);
  next.onclick = () => centre(Math.min(stops.length - 1, here + 1), true);
  box.append(prev, path, next);

  function centre(k: number, smooth: boolean) {
    const s = stops[k].el;
    path.scrollTo({ left: s.offsetLeft + s.offsetWidth / 2 - path.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
  }
  // Which room is in the middle; say its name once the row comes to rest after the child moved it.
  let quiet = true;
  let quietUntilSettled = false;
  let settle = 0;
  const mark = () => {
    const mid = path.scrollLeft + path.clientWidth / 2;
    let best = 0;
    stops.forEach((s, k) => {
      const d = Math.abs(s.el.offsetLeft + s.el.offsetWidth / 2 - mid);
      if (d < Math.abs(stops[best].el.offsetLeft + stops[best].el.offsetWidth / 2 - mid)) best = k;
    });
    if (best !== here) {
      here = best;
      stops.forEach((s, k) => s.el.classList.toggle('here', k === here));
      prev.classList.toggle('gone', here === 0);
      next.classList.toggle('gone', here === stops.length - 1);
      shownRoom = here;
      if (!quiet && !quietUntilSettled) {
        clearTimeout(settle);
        settle = window.setTimeout(() => { if (here === best) speak(stops[here].name); }, 350);
      }
    }
  };
  path.addEventListener('scroll', () => {
    mark();
    clearTimeout(settleQuiet);
    settleQuiet = window.setTimeout(() => { quiet = false; quietUntilSettled = false; }, 200);
  }, { passive: true });
  let settleQuiet = 0;

  // Open on the room the child was just in, or else the first room with levels still to do.
  let start = shownRoom;
  if (start < 0 || start >= stops.length) {
    start = ROOMS.findIndex((r) => LEVELS.slice(r.first, r.first + r.count).some((l) => !done.has(l.id)));
    if (start < 0) start = ROOMS.length - 1;
  }
  // Now, and again once the page has laid out (fonts and sizes can still shift on first load).
  const place = () => { centre(start, false); mark(); };
  place();
  requestAnimationFrame(place);
  settleQuiet = window.setTimeout(() => { quiet = false; }, 300);
}

/** A row along the top of a room: back to the rooms, and the room's picture. */
function roomHeader(box: HTMLElement, banner: HTMLElement) {
  const back = document.createElement('button');
  back.className = 'icon back';
  back.setAttribute('aria-label', 'Back to the rooms');
  back.innerHTML = BACK_ICON;
  back.onclick = () => openRoom(null);
  banner.prepend(back);
  box.append(banner);
}

function showRoom(box: HTMLElement, room: Room) {
  const done = loadDone();
  roomHeader(box, roomBanner(room));
  // Five cards to a row (see style.css); shrink them when the rows would not fit on the screen.
  const rows = Math.ceil(room.count / 5);
  if (rows > 2 && innerWidth > 700) box.style.width = `min(1180px, 100%, calc((100dvh - 170px) / ${rows} * 8))`;
  for (let i = room.first; i < room.first + room.count; i++) {
    const lv = LEVELS[i];
    const b = document.createElement('button');
    b.className = 'card';
    b.setAttribute('aria-label', `Level ${i + 1}`);
    b.style.background = mix(room.paper, '#ffffff', 0.45);
    b.append(thumb(lv, false, false, room));
    if (done.has(lv.id)) b.insertAdjacentHTML('beforeend', STICKER);
    b.onclick = () => startLevel(i);
    box.append(b);
  }
}

/** The puzzle maker's front-page picture: a ball, a pinned star and a basket, waiting for a machine. */
function makerScene(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const s = THUMB_PX;
  c.width = WORLD_W * s;
  c.height = WORLD_H * s;
  const ctx = c.getContext('2d')!;
  ctx.scale(s, s);
  drawTable(ctx, WORLD_W, WORLD_H, MAKER_PAPER);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  setSkin('');
  const things: [PartKind, number, number, number][] = [['ball', 3, 3, 2.2], ['star', 8, 4.6, 4.2], ['basket', 12.6, 7.6, 5], ['pin', 8, 7.4, 2.4], ['hamster', 3.2, 7.8, 2.4], ['cheese', 6, 8.4, 2]];
  for (const [k, x, y, size] of things) drawIcon(ctx, k, x * s, y * s, size * s);
  // A dotted path from the ball to the basket: the machine still to be built.
  ctx.setLineDash([0.25 * s, 0.25 * s]);
  ctx.lineWidth = 0.14 * s;
  ctx.strokeStyle = MAKER_ACCENT;
  ctx.beginPath(); ctx.moveTo(4.4 * s, 3.4 * s); ctx.quadraticCurveTo(9 * s, 1 * s, 12.4 * s, 6 * s); ctx.stroke();
  return c;
}

/**
 * The toy box and the puzzle maker rooms. Each starts with a dashed "new" card with a big plus,
 * then what was kept on this device: machines in the toy box, puzzles in the maker.
 */
function showToyRoom(box: HTMLElement, which: 'toybox' | 'maker') {
  const done = loadDone();
  const toy = which === 'toybox';
  const accent = toy ? PAPER.teal : MAKER_ACCENT;
  const paper = toy ? '#eef7f3' : MAKER_PAPER;
  const name = toy ? 'Toy box' : 'Puzzle maker';
  const banner = document.createElement('div');
  banner.className = 'room-banner';
  banner.style.setProperty('--accent', accent);
  banner.style.setProperty('--paper', paper);
  banner.innerHTML = `<span class="tape"></span><svg viewBox="0 0 48 48" aria-hidden="true">${toy ? TOY_ICON : MAKER_ICON}</svg>`;
  banner.append(nameTag(name, accent));
  banner.insertAdjacentHTML('beforeend', '<span class="tape"></span>');
  roomHeader(box, banner);
  const t = document.createElement('button');
  t.className = 'card new-card';
  t.style.setProperty('--accent', accent);
  t.setAttribute('aria-label', toy ? 'Build something new' : 'Make a new puzzle');
  t.append(toy ? thumb(TOY_BOX, true) : makerScene());
  t.insertAdjacentHTML('beforeend', PLUS_BADGE);
  t.onclick = () => (toy ? startToy() : startLevel(-3));
  box.append(t);
  if (toy) {
    // Machines kept in the toy box: they open with their parts on the table, ready to play with.
    loadToys().forEach((code, k) => {
      const parts = decodeToy(code);
      if (!parts) return;
      const b = document.createElement('button');
      b.className = 'card saved';
      if (code === justMade) b.classList.add('fresh');
      b.setAttribute('aria-label', `My machine ${k + 1}`);
      b.append(thumb({ ...TOY_BOX, fixed: parts }));
      b.insertAdjacentHTML('beforeend', SAVED_BADGE);
      b.onclick = () => startToy(code, parts);
      box.append(b);
    });
    return;
  }
  // Puzzles made here on this device.
  loadMine().forEach((code, k) => {
    const lv = decodeLevel(code, MADE_VOICE);
    if (!lv) return;
    const b = document.createElement('button');
    b.className = 'card saved mine';
    if (code === justMade) b.classList.add('fresh');
    b.setAttribute('aria-label', `My puzzle ${k + 1}`);
    b.append(thumb(lv));
    b.insertAdjacentHTML('beforeend', MADE_BADGE);
    if (done.has(lv.id)) b.insertAdjacentHTML('beforeend', STICKER);
    b.onclick = () => startLevel(-2, lv);
    box.append(b);
  });
}

/** A big plus on the card that starts something new. */
const PLUS_BADGE = `<svg class="plus-badge" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" style="fill:var(--accent);stroke:#fff;stroke-width:4"/><path d="M24 13v22M13 24h22" style="stroke:#fff;stroke-width:5"/></svg>`;

// ---------- machines kept in the toy box (on this device) ----------
const TOYS_KEY = 'tinker.toys';
const MAX_TOYS = 20;
function loadToys(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(TOYS_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}
function saveToys(list: string[]) {
  try { localStorage.setItem(TOYS_KEY, JSON.stringify(list.slice(-MAX_TOYS))); } catch { /* private mode */ }
}
/** The saved machine now on the table, so saving again updates it instead of adding a copy. */
let toyCode: string | null = null;
/** A heart badge marks a kept machine. */
const SAVED_BADGE = `<svg class="made-badge" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" style="fill:${PAPER.tomato};stroke:#fff;stroke-width:4"/>
<path d="M24 35s-11-6.5-11-14a6 6 0 0 1 11-3.3A6 6 0 0 1 35 21c0 7.5-11 14-11 14z" style="fill:#fff;stroke:none"/></svg>`;

// ---------- made puzzles (kept on this device) ----------
const MINE_KEY = 'tinker.mine';
const MAX_MINE = 20;
let justMade = '';
function loadMine(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(MINE_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}
function saveMine(list: string[]) {
  try { localStorage.setItem(MINE_KEY, JSON.stringify(list.slice(-MAX_MINE))); } catch { /* private mode */ }
}
/** A pin-and-star badge marks puzzles that were made, not built in. */
const MADE_BADGE = `<svg class="made-badge" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" style="fill:${PAPER.teal};stroke:#fff;stroke-width:4"/>
<path d="M24 11l3.8 7.7 8.5 1.2-6.1 6 1.4 8.4L24 30.3l-7.6 4 1.4-8.4-6.1-6 8.5-1.2z" style="fill:#fff;stroke:none"/></svg>`;

// ---------- grown-ups' corner ----------
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// The PIN guards the corner; until one is set, the press-and-hold does.
const pin = new Pin();
type GuSec = 'safety' | 'play' | 'talk' | 'made' | 'settings';
const GU_SECS: GuSec[] = ['safety', 'play', 'talk', 'made', 'settings'];
const GU_KEY = 'tinker.gu';
let guSec: GuSec = (() => {
  try { const v = localStorage.getItem(GU_KEY) as GuSec; return GU_SECS.includes(v) ? v : 'safety'; } catch { return 'safety'; }
})();
let talkRoom = ROOMS[0].id;
let madeTab: 'puzzles' | 'machines' = 'puzzles';
const TIPS_SHOWN = 4;

/** A talk card: one line (picture, number, idea) that opens to the questions, words and answer. */
function talkCard(level: Level, n: string, index: number, toy = false): HTMLElement {
  const t = TALK[level.id];
  const card = document.createElement('section');
  card.className = 'talk';
  const room = index >= 0 ? roomOf(index) : undefined;
  const head = document.createElement('button');
  head.className = 'talk-head';
  head.setAttribute('aria-expanded', 'false');
  const pic = thumb(level, toy, false, room);
  pic.className = 'talk-pic';
  head.append(pic);
  head.insertAdjacentHTML('beforeend', `<span class="talk-title"><b>${esc(n)}</b><span class="idea">${esc(t.idea)}</span></span>
    <svg class="chev" viewBox="0 0 48 48"><path d="M14 19l10 10 10-10" /></svg>`);
  head.onclick = () => {
    const open = card.classList.toggle('open');
    head.setAttribute('aria-expanded', String(open));
  };
  const body = document.createElement('div');
  body.className = 'talk-body';
  body.innerHTML = `
    <div class="cols">
      <div><h5>Before you press Go</h5><ul>${t.before.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>
      <div><h5>After it runs</h5><ul>${t.after.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>
    </div>
    <p class="words"><b>Words to use:</b> ${t.words.map((w) => `<span>${esc(w)}</span>`).join(' ')}</p>
    <p class="home"><b>Try at home:</b> ${esc(t.tryAtHome)}</p>`;
  const acts = document.createElement('div');
  acts.className = 'acts';
  const play = document.createElement('button');
  play.className = 'text-btn';
  play.textContent = toy ? 'Open the toy box' : 'Play this level';
  play.onclick = () => { hideGrownups(); if (toy) startToy(); else startLevel(index); };
  acts.append(play);
  if (level.solution) {
    // For coaching: swap the picture between the puzzle and its answer.
    const ans = document.createElement('button');
    ans.className = 'text-btn';
    ans.textContent = 'Show the answer';
    let showing = false;
    ans.onclick = () => {
      showing = !showing;
      const next = thumb(level, toy, showing, room);
      next.className = 'talk-pic';
      head.firstElementChild!.replaceWith(next);
      ans.textContent = showing ? 'Hide the answer' : 'Show the answer';
    };
    acts.append(ans);
  }
  body.append(acts);
  card.append(head, body);
  return card;
}

const chip = (label: string, on: boolean, data: string) =>
  `<button class="chip${on ? ' on' : ''}" role="tab" aria-selected="${on}" ${data}>${esc(label)}</button>`;

let guBuilt = false;
function buildGrownups() {
  const body = $('gu-body');
  const talkRooms = [...ROOMS.map((r) => ({ id: r.id, name: r.name })), { id: 'toybox', name: 'Toy box' }];
  body.innerHTML = `
    <section class="gu-sec" data-sec="safety">
      <h3>Safety</h3>
      <div id="gu-pin" class="gu-card"></div>
      <div class="gu-card" id="gu-lock">
        <h4>Keep your child inside the game</h4>
        <p>No app can stop a child swiping out to the home screen. The tablet itself can: lock it to Bumpity before you hand it over, and only your passcode unlocks it.</p>
        ${PLATFORM === 'android' ? `
        <div class="acts"><button class="text-btn" id="gu-lock-now">Lock Bumpity on the screen now</button></div>
        <p class="note">Android asks you to confirm first. To make leaving need the tablet's PIN, turn on <b>Ask for PIN before unpinning</b> once (step 1 below).</p>` : ''}
        ${lockGuideHtml(PLATFORM === 'android' ? 'android' : guessPlatform())}
      </div>
    </section>
    <section class="gu-sec" data-sec="play">
      <img class="gu-logo" src="logo.svg" alt="Bumpity" />
      <p class="lead">${esc(INTRO)}</p>
      <h3>A simple routine for every level</h3>
      <ol class="routine">${ROUTINE.map((r) => `<li><b>${esc(r.step)}.</b> ${esc(r.say)}</li>`).join('')}</ol>
      <h3>What your child is practising</h3>
      <div class="skills">${SKILLS.map((s) => `<div class="skill"><h4>${esc(s.title)}</h4><p>${esc(s.body)}</p></div>`).join('')}</div>
      <h3>Playing together</h3>
      <ul class="tips">${TIPS.map((x, i) => `<li${i >= TIPS_SHOWN ? ' class="more"' : ''}>${esc(x)}</li>`).join('')}</ul>
      <button class="text-btn" id="gu-tips-more">Show all ${TIPS.length} tips</button>
    </section>
    <section class="gu-sec" data-sec="talk">
      <div class="chips" id="gu-rooms" role="tablist" aria-label="Rooms">${talkRooms.map((r) => chip(r.name, r.id === talkRoom, `data-room="${r.id}"`)).join('')}</div>
      <p class="note">Pick one or two questions; you don't need to ask them all. Tap a card to open it.</p>
      <div id="gu-cards"></div>
      <div class="acts print-acts">
        <button class="text-btn" id="gu-print-room">Print this room</button>
        <button class="text-btn" id="gu-print-all">Print all the talk cards</button>
      </div>
    </section>
    <section class="gu-sec" data-sec="made">
      <div class="chips" id="gu-made-tabs" role="tablist" aria-label="Made on this device"></div>
      <p class="note" id="gu-made-how"></p>
      <div id="gu-made" class="made-list"></div>
    </section>
    <section class="gu-sec" data-sec="settings">
      <h3>Start again</h3>
      <div class="gu-card">
        <p>Clears which levels are done and the sticker book, so the rooms start fresh. Made puzzles and kept machines stay.</p>
        <div class="acts"><button class="text-btn danger" id="gu-reset">Clear progress and stickers</button></div>
      </div>
      <h3>Privacy</h3>
      <div class="gu-card">
        <p>Bumpity collects no data: no accounts, ads, tracking or links out. Progress, the sticker book, the PIN and made puzzles are kept only on this device. A shared link contains only the puzzle itself.</p>
        <p><a href="privacy.html">Read the privacy policy</a></p>
      </div>
    </section>`;

  // Talk cards: one container per room, only the chosen one on screen (all of them print).
  const cards = $('gu-cards');
  for (const r of ROOMS) {
    const box = document.createElement('div');
    box.className = 'room-cards';
    box.dataset.room = r.id;
    box.innerHTML = `<h3 class="room-h">${esc(r.name)}</h3>`;
    for (let k = 0; k < r.count; k++) box.append(talkCard(LEVELS[r.first + k], String(k + 1), r.first + k));
    cards.append(box);
  }
  const toys = document.createElement('div');
  toys.className = 'room-cards';
  toys.dataset.room = 'toybox';
  toys.innerHTML = '<h3 class="room-h">Toy box</h3>';
  toys.append(talkCard(TOY_BOX, 'Toy box', -1, true));
  cards.append(toys);
  showTalkRoom(talkRoom);
  $('gu-rooms').onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-room]');
    if (b) showTalkRoom(b.dataset.room!);
  };
  $('gu-print-room').onclick = () => printTalk('room');
  $('gu-print-all').onclick = () => printTalk('all');

  $('gu-tips-more').onclick = () => {
    const open = body.querySelector('.tips')!.classList.toggle('all');
    $('gu-tips-more').textContent = open ? 'Show fewer tips' : `Show all ${TIPS.length} tips`;
  };
  wireLockGuide($('gu-lock'));
  const lockNow = document.getElementById('gu-lock-now');
  if (lockNow) lockNow.onclick = () => { hideGrownups(); ScreenLock.start().catch(() => { /* pinning not available */ }); };
  $('gu-made-tabs').onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-made]');
    if (b) { madeTab = b.dataset.made as typeof madeTab; renderMade(); }
  };
  const reset = $<HTMLButtonElement>('gu-reset');
  reset.onclick = async () => {
    if (reset.dataset.sure !== '1') { reset.dataset.sure = '1'; reset.textContent = 'Tap again to clear'; return; }
    delete reset.dataset.sure;
    reset.textContent = 'Clear progress and stickers';
    if (!(await askPin(pin, 'Clear progress?'))) return;
    try { localStorage.removeItem(DONE_KEY); localStorage.removeItem(BOOK_KEY); } catch { /* private mode */ }
    reset.textContent = 'Cleared';
    setTimeout(() => { reset.textContent = 'Clear progress and stickers'; }, 2200);
  };
  document.querySelector('.gu-nav')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-sec]');
    if (b) showSec(b.dataset.sec as GuSec);
  });
  guBuilt = true;
}

function showSec(sec: GuSec) {
  guSec = sec;
  try { localStorage.setItem(GU_KEY, sec); } catch { /* private mode */ }
  document.querySelectorAll<HTMLElement>('.gu-nav [data-sec]').forEach((b) => {
    b.classList.toggle('on', b.dataset.sec === sec);
    b.setAttribute('aria-selected', String(b.dataset.sec === sec));
    // On a phone the menu is a sideways row: keep the chosen one in view.
    if (b.dataset.sec === sec) b.parentElement!.scrollLeft = Math.max(0, b.offsetLeft - 12);
  });
  document.querySelectorAll<HTMLElement>('.gu-sec').forEach((s) => s.classList.toggle('on', s.dataset.sec === sec));
  $('gu-body').scrollTop = 0;
}

function showTalkRoom(id: string) {
  talkRoom = id;
  document.querySelectorAll<HTMLElement>('#gu-rooms [data-room]').forEach((b) => {
    b.classList.toggle('on', b.dataset.room === id);
    b.setAttribute('aria-selected', String(b.dataset.room === id));
  });
  document.querySelectorAll<HTMLElement>('.room-cards').forEach((c) => c.classList.toggle('on', c.dataset.room === id));
}

/** Print the talk cards: this room's, or all of them. The print styles read data-print. */
function printTalk(scope: 'room' | 'all') {
  document.body.dataset.print = scope;
  window.addEventListener('afterprint', () => { delete document.body.dataset.print; }, { once: true });
  window.print();
}

/** Open the corner: through the PIN if there is one. */
async function openGrownups(sec?: GuSec) {
  if (!(await askPin(pin))) return;
  showGrownups(sec);
}
function showGrownups(sec?: GuSec) {
  if (!guBuilt) buildGrownups();
  renderSafety();
  renderMade();
  $('map').classList.add('hidden');
  $('grownups').classList.remove('hidden');
  showSec(sec ?? guSec);
}

/** The PIN card in Safety: set it, change it or turn it off. */
function renderSafety() {
  const box = $('gu-pin');
  box.innerHTML = pin.isSet
    ? `<h4>Grown-ups' PIN <span class="tag on">On</span></h4>
       <p>The PIN is asked before this corner opens, and again before clearing progress or changing the PIN.</p>
       <div class="acts"><button class="text-btn" id="pin-change">Change the PIN</button><button class="text-btn" id="pin-off">Turn the PIN off</button></div>`
    : `<h4>Grown-ups' PIN <span class="tag">Off</span></h4>
       <p>Right now this corner opens with a press-and-hold on the grown-ups' button, which a child can learn. A 4-digit PIN they don't know keeps them out of here.</p>
       <div class="acts"><button class="text-btn primary" id="pin-set">Set a PIN</button></div>`;
  box.insertAdjacentHTML('beforeend', '<p class="small">The PIN keeps a young child out of the grown-ups\' corner. It isn\'t a lock against grown-ups: it is kept only on this device, and clearing the browser\'s data removes it.</p>');
  const done = () => { renderSafety(); syncGuButton(); };
  const on = (id: string, fn: () => Promise<unknown>) => { const b = document.getElementById(id); if (b) b.onclick = () => fn().then(done); };
  on('pin-set', () => newPin(pin));
  on('pin-change', async () => { if (await askPin(pin, 'Type the PIN you have now')) await newPin(pin, 'Choose a new PIN'); });
  on('pin-off', async () => { if (await askPin(pin, 'Turn the PIN off?')) pin.clear(); });
}

/** The grown-ups' button says "press & hold" only while there's no PIN. */
function syncGuButton() {
  const b = $('btn-grownups');
  b.querySelector('.how')!.classList.toggle('hidden', pin.isSet);
  b.setAttribute('aria-label', pin.isSet ? 'For grown-ups' : 'For grown-ups: press and hold');
}

/** One row in Made here: a picture, a name and its buttons. */
function madeRow(pic: HTMLCanvasElement, title: string, buttons: HTMLButtonElement[]): HTMLElement {
  const row = document.createElement('section');
  row.className = 'made-row';
  pic.className = 'made-pic';
  const name = document.createElement('h4');
  name.textContent = title;
  const acts = document.createElement('div');
  acts.className = 'acts';
  acts.append(...buttons);
  row.append(pic, name, acts);
  return row;
}
function textBtn(label: string, fn: (b: HTMLButtonElement) => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'text-btn';
  b.textContent = label;
  b.onclick = () => fn(b);
  return b;
}
/** A delete button that asks with a second tap. */
function deleteBtn(onSure: () => void): HTMLButtonElement {
  return textBtn('Delete', (b) => {
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Tap again to delete'; b.classList.add('danger'); return; }
    onSure();
  });
}

/** Made here: puzzles made in the maker and machines kept in the toy box. Rebuilt on every visit. */
function renderMade() {
  const mine = loadMine().map((code) => ({ code, lv: decodeLevel(code, MADE_VOICE) })).filter((x) => x.lv);
  const toys = loadToys().map((code) => ({ code, parts: decodeToy(code) })).filter((x) => x.parts);
  $('gu-made-tabs').innerHTML =
    chip(`Puzzles (${mine.length})`, madeTab === 'puzzles', 'data-made="puzzles"') +
    chip(`Machines (${toys.length})`, madeTab === 'machines', 'data-made="machines"');
  $('gu-made-how').textContent = madeTab === 'puzzles' ? `${MAKER_HOW} ${MADE_TALK.idea}` : TOYS_HOW;
  const box = $('gu-made');
  box.innerHTML = '';
  if (madeTab === 'puzzles') {
    if (!mine.length) box.innerHTML = `<p class="small">${esc(MADE_TALK.none)}</p>`;
    mine.forEach(({ code, lv }, k) => box.append(madeRow(thumb(lv!), `Puzzle ${k + 1}`, [
      textBtn('Play', () => { hideGrownups(); startLevel(-2, lv!); }),
      textBtn('Share', (b) => { void sharePuzzle(code, b); }),
      deleteBtn(() => { saveMine(loadMine().filter((c) => c !== code)); renderMade(); }),
    ])));
  } else {
    if (!toys.length) box.innerHTML = '<p class="small">Nothing kept yet. In the toy box, the heart button keeps the machine on the table.</p>';
    toys.forEach(({ code, parts }, k) => box.append(madeRow(thumb({ ...TOY_BOX, fixed: parts! }), `Machine ${k + 1}`, [
      textBtn('Open', () => { hideGrownups(); startToy(code, parts!); }),
      deleteBtn(() => { saveToys(loadToys().filter((c) => c !== code)); renderMade(); }),
    ])));
  }
}

// ---------- before you hand it over (first launch, for grown-ups) ----------
const WELCOME_KEY = 'tinker.welcomed';
function showWelcome() {
  try { if (localStorage.getItem(WELCOME_KEY)) return; } catch { return; }
  const wrap = document.createElement('div');
  wrap.className = 'welcome-wrap';
  wrap.innerHTML = `
    <div class="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <h3 id="welcome-title">Before you hand it over</h3>
      <p>Bumpity is made to play beside you. If your child will sometimes play on their own, two things help:</p>
      <ol>
        <li><b>A grown-ups' PIN</b> keeps them out of the settings and the grown-ups' corner.
          <div class="acts"><button class="text-btn primary" data-w="pin">Set a PIN</button></div></li>
        <li><b>Lock the tablet to the game</b> with its own Guided Access (iPad) or app pinning (Android), so they can't wander into other apps.
          <div class="acts"><button class="text-btn" data-w="lock">Show me how</button></div></li>
      </ol>
      <p class="small">You can do both later in the grown-ups' corner: the grown-ups' button on the front page.</p>
      <div class="acts end"><button class="text-btn" data-w="close">Done</button></div>
    </div>`;
  document.body.append(wrap);
  const close = () => {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* private mode */ }
    wrap.remove();
  };
  wrap.onclick = async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-w]');
    if (!b) return;
    if (b.dataset.w === 'close') close();
    else if (b.dataset.w === 'lock') { close(); showGrownups('safety'); $('gu-lock').scrollIntoView(); }
    else if (b.dataset.w === 'pin' && !pin.isSet) {
      if (await newPin(pin)) { b.textContent = 'PIN set'; b.disabled = true; syncGuButton(); }
    }
  };
}

/** Share a made puzzle as a link: the share sheet if there is one, else copy it. */
async function sharePuzzle(code: string, btn: HTMLButtonElement) {
  // Always the public web address, so it plays in any browser (and in the app, once links open it).
  const url = `${gameAddress()}#p=${code}`;
  const label = btn.textContent;
  const flash = (t: string) => { btn.textContent = t; setTimeout(() => { btn.textContent = label; }, 2200); };
  try {
    if (NATIVE) { await Share.share({ title: 'A Bumpity puzzle', url, dialogTitle: 'Share this puzzle' }); return; }
    if (navigator.share) { await navigator.share({ title: 'A Bumpity puzzle', url }); return; }
    await navigator.clipboard.writeText(url);
    flash('Link copied!');
  } catch (e) {
    if ((e as Error)?.name === 'AbortError' || NATIVE) return; // the share sheet was closed
    // Copying isn't allowed here: show the link to copy by hand.
    window.prompt('Copy this link:', url);
  }
}

// ---------- sticker book ----------
function showBook() {
  $('map').classList.add('hidden');
  $('book').classList.remove('hidden');
  renderBook($('book-page'), $('book-strip'), loadDone(), true);
  sfx.place();
}
function hideBook() {
  $('book').classList.add('hidden');
  showMap();
}

function hideGrownups() {
  $('grownups').classList.add('hidden');
  showMap(); // redrawn: progress may have been cleared
}

/** Press and hold for HOLD_MS to open; a short tap just wiggles. When `instant` says so (a PIN is set), a tap opens. */
function wireHold(btn: HTMLElement, onDone: () => void, instant: () => boolean = () => false) {
  const HOLD_MS = 1500;
  let start = 0, raf = 0, timer = 0;
  const clear = () => {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    start = 0;
    btn.style.setProperty('--p', '0');
  };
  const stop = () => {
    if (start && performance.now() - start < HOLD_MS) {
      btn.classList.remove('nudge'); void btn.offsetWidth; btn.classList.add('nudge');
    }
    clear();
  };
  // The ring only shows progress; the timer decides, so it works even when frames are throttled.
  const tick = () => {
    btn.style.setProperty('--p', String(Math.min(1, (performance.now() - start) / HOLD_MS)));
    raf = requestAnimationFrame(tick);
  };
  btn.addEventListener('click', () => { if (instant()) onDone(); });
  btn.addEventListener('pointerdown', (e) => {
    if (instant()) return;
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch { /* fine without it */ }
    clear();
    start = performance.now();
    raf = requestAnimationFrame(tick);
    timer = window.setTimeout(() => { clear(); onDone(); }, HOLD_MS);
  });
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  // Keyboard users: Enter/Space opens it straight away.
  btn.addEventListener('keydown', (e) => { if (!instant() && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onDone(); } });
}

// ---------- play ----------
let game: Game | null = null;
let current = 0;
let wonTimer = 0;

/**
 * The goal picture's canvas, ready to draw on. It reads left to right in the top bar, and
 * top to bottom when the buttons are in a strip down the side (a phone turned sideways):
 * `at(t)` is the point a fraction t along it, and `s` its short side.
 */
function goalCanvas() {
  const c = $<HTMLCanvasElement>('goal-pic');
  const dpr = 2;
  c.width = c.clientWidth * dpr || 400;
  c.height = c.clientHeight * dpr || 128;
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = c.width / dpr, h = c.height / dpr;
  ctx.clearRect(0, 0, w, h);
  const vert = h > w;
  const s = vert ? w : h, long = vert ? h : w;
  const at = (t: number) => (vert ? { x: w / 2, y: h * t } : { x: w * t, y: h / 2 });
  /** The arrow from the object to the target. */
  const arrow = () => {
    const a = at(0.36), b = at(0.6), tip = at(0.61), back = at(0.53);
    const k = 9; // half the arrowhead's width
    ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    if (vert) { ctx.moveTo(back.x - k, back.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(back.x + k, back.y); }
    else { ctx.moveTo(back.x, back.y - k); ctx.lineTo(tip.x, tip.y); ctx.lineTo(back.x, back.y + k); }
    ctx.stroke();
  };
  /** A goal part at fraction t. The pulley is drawn hanging above its point, so it is centred by hand. */
  const part = (kind: PartKind, t: number, size: number) => {
    const p = at(t);
    if (kind === 'pulley') drawIcon(ctx, kind, p.x, p.y + s * 0.32, s * (vert ? 1 : 1.25));
    else drawIcon(ctx, kind, p.x, p.y, s * size);
  };
  return { ctx, w, h, s, long, vert, at, arrow, part };
}

function drawGoalPic(level: Level) {
  if (level.id === 'maker' && game) { drawMakeGoal(game); return; }
  const g = goalCanvas();
  if (!level.goal) {
    (['ball', 'domino', 'balloon'] as PartKind[]).forEach((k, i) => {
      const p = g.at(0.2 + i * 0.3);
      drawIcon(g.ctx, k, p.x, p.y, Math.min(g.s * 0.75, g.long * 0.28));
    });
    return;
  }
  if (level.goal.type === 'tune') {
    // A tune: its notes in order, as the parts that play them.
    const n = level.goal.notes.length;
    level.goal.notes.forEach((note, i) => {
      const p = g.at((i + 0.5) / n);
      drawIcon(g.ctx, NOTE_PART[note], p.x, p.y, Math.min(g.s * 0.95, (g.long / n) * 0.95));
    });
    return;
  }
  const kindOf = (id: string) => level.fixed.find((p) => p.id === id)!.part;
  // A ball on a rope is shown as just the ball: the rope makes the picture too tall to read.
  const obj = kindOf(level.goal.object) === 'rope' ? 'ball' : kindOf(level.goal.object);
  g.part(obj, 0.18, 0.8);
  g.arrow();
  g.part(kindOf(level.goal.target), 0.8, 0.9);
}

/** While making a puzzle, the goal picture fills in as the goal is picked: ? → ?, then ball → ?, then ball → basket. */
/** The maker's goal picture: "? → ?" while building, filling in as the goal is picked. */
function drawMakeGoal(g: Game) {
  const pic = goalCanvas();
  const { ctx } = pic;
  const m = g.making ?? { step: 'build', object: null, target: null };
  const slot = (t: number, kind: PartKind | null, active: boolean) => {
    if (kind) { pic.part(kind, t, 0.8); return; }
    const p = pic.at(t);
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = active ? PAPER.mustard : 'rgba(60,45,30,0.3)';
    ctx.beginPath(); ctx.arc(p.x, p.y, pic.s * 0.32, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };
  slot(0.18, m.object !== null ? g.placements[m.object].part : null, m.step === 'object');
  pic.arrow();
  slot(0.8, m.target !== null ? g.placements[m.target].part : null, m.step === 'target');
}

function syncButtons() {
  if (!game) return;
  // In the side strip there's no room for the toy box's decorative goal picture.
  $('play').classList.toggle('no-goal', !game.level.goal && game.level.id !== 'maker');
  const making = game.mode === 'make';
  const run = game.mode === 'run' || game.mode === 'won';
  $('btn-go').classList.toggle('hidden', run || making);
  $('btn-stop').classList.toggle('hidden', game.mode !== 'run');
  $('btn-slow').classList.toggle('hidden', making);
  $('btn-guess').classList.toggle('hidden', !game.level.goal || making || run);
  $('btn-guess').setAttribute('aria-pressed', String(game.pencil));
  $('btn-slow').setAttribute('aria-pressed', String(game.slow));
  const hint = $('btn-hint');
  hint.classList.toggle('hidden', !game.hintReady);
  hint.classList.toggle('ready', game.hintReady);
  $('btn-save').classList.toggle('hidden', game.level.id !== 'toybox' || run);
  $('btn-save').toggleAttribute('disabled', !game.canSave);
  // The puzzle maker shows its star button all along: faded until there's a machine to make into a puzzle.
  const maker = game.level.id === 'maker';
  $('btn-make').classList.toggle('hidden', !maker || run);
  $('btn-make').toggleAttribute('disabled', !game.canMake && !making);
  $('btn-make').classList.toggle('ready', game.canMake && !making);
  $('btn-make').setAttribute('aria-pressed', String(making));
  const free = game.level.id === 'toybox' || maker;
  $('btn-clear').classList.toggle('hidden', !free || run || making);
  $('btn-clear').toggleAttribute('disabled', !game.placements.length);
  if (!game.placements.length) $('btn-clear').classList.remove('sure');
  $('btn-make-done').classList.toggle('hidden', !(making && game.making!.step === 'pins'));
  if (making || maker) drawMakeGoal(game);
  else if (madeGoalShown) drawGoalPic(game.level);
  madeGoalShown = making;
  if (game.mode !== 'won') {
    $('won').classList.add('hidden');
    clearTimeout(wonTimer);
  }
}

/** The film strip after a win: the run's snapshots as little photos that pop in one by one. */
function showFilm() {
  const box = $('film');
  box.innerHTML = '';
  const frames = game?.filmStrip() ?? [];
  if (frames.length < 2) return;
  frames.forEach((f, k) => {
    const b = document.createElement('button');
    b.className = 'frame';
    b.setAttribute('aria-label', `Picture ${k + 1}: look closer`);
    b.style.animationDelay = `${0.15 + k * 0.18}s`;
    b.style.setProperty('--tilt', `${[-3, 2, -1.5, 2.5, -2][k % 5]}deg`);
    b.append(f);
    b.onclick = () => showPhoto(f, k);
    box.append(b);
  });
}

/**
 * A photo from the film strip, big in the middle of the screen, for pointing at and telling
 * the story. Tapping anywhere puts it back. (Watching the run again is the replay button.)
 */
function showPhoto(src: HTMLCanvasElement, k: number) {
  document.querySelector('.photo-big')?.remove();
  const cover = document.createElement('div');
  cover.className = 'photo-big';
  cover.setAttribute('role', 'button');
  cover.setAttribute('aria-label', 'Close the picture');
  const print = document.createElement('div');
  print.className = 'print';
  print.style.setProperty('--tilt', `${[-2, 1.5, -1, 2, -1.5][k % 5]}deg`);
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d')!.drawImage(src, 0, 0);
  print.append(c);
  cover.append(print);
  cover.onclick = () => { cover.classList.add('out'); sfx.place(); setTimeout(() => cover.remove(), 180); };
  $('play').append(cover);
  sfx.pickup();
}

let madeGoalShown = false;
/** The current level's spoken goal, in its room's words. */
let voice = '';

/** Open the toy box, empty or with a kept machine's parts on the table. */
function startToy(code: string | null = null, parts: Placement[] = []) {
  startLevel(-1, undefined, parts);
  toyCode = code;
}

/** i: a level number, -1 for the toy box, -3 for the puzzle maker, or -2 with a made or shared puzzle. */
function startLevel(i: number, custom?: Level, start: Placement[] = []) {
  current = custom ? -2 : i;
  const level = custom ?? (i === -1 ? TOY_BOX : i === -3 ? MAKER_BOX : LEVELS[i]);
  toyCode = null;
  game?.destroy();
  $('map').classList.add('hidden');
  $('play').classList.remove('hidden');
  $('won').classList.add('hidden');
  const slow = game?.slow ?? false;
  game = new Game($<HTMLCanvasElement>('stage'), level, start);
  if (i === -1 || i === -3) game.sets = traySets(i === -3);
  if (i === -3) game.paper = MAKER_PAPER;
  const room = custom || i < 0 ? undefined : roomOf(i);
  if (room) { game.paper = room.paper; game.skin = room.id; }
  // Home goes back to the room this level is in (made and shared puzzles live in the puzzle maker).
  mapRoom = room?.id ?? (i === -1 ? 'toybox' : 'maker');
  voice = roomVoice(room?.id, level.voice);
  setSkin(room?.id ?? '');
  game.slow = slow;
  game.onChange = syncButtons;
  game.onWin = () => {
    markDone(level.id);
    $('btn-next').classList.toggle('hidden', current < 0);
    wonTimer = window.setTimeout(() => { showFilm(); $('won').classList.remove('hidden'); }, 1300);
  };
  syncButtons();
  drawGoalPic(level);
  speak(voice);
}

// ---------- wiring ----------
document.addEventListener('pointerdown', unlockAudio, { capture: true });
wireHold($('btn-grownups'), () => { void openGrownups(); }, () => pin.isSet);
syncGuButton();
$('btn-gu-close').onclick = hideGrownups;
$('btn-book').onclick = showBook;
$('btn-book-close').onclick = hideBook;
$('btn-home').onclick = showMap;
$('btn-home2').onclick = showMap;
$('btn-goal').onclick = () => game && speak(voice);
$('btn-go').onclick = () => game?.go();
$('btn-stop').onclick = () => game?.reset();
$('btn-hint').onclick = () => { if (game?.showHint()) sfx.place(); };
$('btn-make').onclick = () => {
  if (!game) return;
  if (game.mode === 'make') game.stopMaking(); else game.startMaking();
};
$('btn-make-done').onclick = () => {
  const lv = game?.checkPuzzle();
  if (!lv) return;
  const code = encodeLevel(lv);
  saveMine([...loadMine().filter((c) => c !== code), code]);
  justMade = code;
  setTimeout(showMap, 900);
};
$('btn-save').onclick = () => {
  if (!game?.canSave) return;
  const code = encodeToy(game.placements);
  const list = loadToys();
  const k = toyCode ? list.indexOf(toyCode) : -1;
  if (k >= 0) list[k] = code; else list.push(code);
  saveToys(list.filter((c, j) => c !== code || j === list.indexOf(code)));
  toyCode = code;
  justMade = code;
  sfx.chime();
  const b = $('btn-save');
  b.classList.remove('kept');
  void b.offsetWidth;
  b.classList.add('kept');
};
// Clearing the table takes two taps: the first one asks (the bin turns red and wiggles).
let clearTimer = 0;
$('btn-clear').onclick = () => {
  const b = $('btn-clear');
  if (!game) return;
  if (!b.classList.contains('sure')) {
    b.classList.add('sure');
    sfx.nope();
    clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => b.classList.remove('sure'), 2500);
    return;
  }
  clearTimeout(clearTimer);
  b.classList.remove('sure');
  game.clearAll();
};
$('btn-guess').onclick = () => game?.togglePencil();
$('btn-slow').onclick = () => { if (game) { game.slow = !game.slow; syncButtons(); } };
$('btn-replay').onclick = () => { $('won').classList.add('hidden'); game?.replay(); };
$('btn-next').onclick = () => startLevel(current + 1 < LEVELS.length ? current + 1 : -1);
// Offline play once installed. Service workers only run on https or localhost,
// and only in the built app (the dev server reloads too often for caching).
// The apps carry their files with them, so they don't need one.
if (import.meta.env.PROD && !NATIVE && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* fine: plays online */ });
}
// Turning the device can move the buttons between the top bar and the side strip,
// which changes the goal picture's shape: draw it again for the new shape.
let goalShape = '';
window.addEventListener('resize', () => {
  if (!game) return;
  const c = $<HTMLCanvasElement>('goal-pic');
  const shape = `${c.clientWidth}x${c.clientHeight}`;
  if (shape !== goalShape) { goalShape = shape; drawGoalPic(game.level); }
});
// iOS: stop pinch zoom gestures from scaling the page.
document.addEventListener('gesturestart', (e) => e.preventDefault());

// A shared puzzle link (…/#p=<code>) opens straight into the puzzle. Bad codes are ignored.
function openSharedFromHash(hash = location.hash) {
  const m = /^#p=([A-Za-z0-9_-]{1,4000})$/.exec(hash);
  if (!m) return;
  const lv = decodeLevel(m[1], SHARED_VOICE);
  if (!lv) return;
  if (location.hash !== hash) history.replaceState(null, '', hash); // so a reload keeps the puzzle
  startLevel(-2, lv);
}
// Read the link before showMap(), which clears a #p= from the address bar.
const startHash = location.hash;
showMap();
openSharedFromHash(startHash);
if (!startHash.startsWith('#p=')) showWelcome();
window.addEventListener('hashchange', () => openSharedFromHash());
(window as unknown as { tinker: () => Game | null }).tinker = () => game;
