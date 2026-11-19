import './style.css';
import { LEVELS, ROOMS, roomOf, roomVoice, TOY_BOX, type Room } from './levels';
import { Sim } from './sim/sim';
import { WORLD_H, WORLD_W, type Level, type PartKind, type Placement } from './sim/types';
import { drawFixedPin, drawPart, drawTable, PAPER, setPaperShadow, setSkin } from './render/draw';
import { Game, drawIcon } from './ui/game';
import { sfx, speak, unlockAudio } from './ui/audio';
import { INTRO, MADE_TALK, MAKER_HOW, ROUTINE, SKILLS, TALK, TIPS } from './parents/content';
import { decodeLevel, encodeLevel, MADE_VOICE, SHARED_VOICE } from './levels/share';
import { looseStickers, renderBook } from './ui/book';

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

/** Little paper-cut pictures for each room's banner (no words). */
const ROOM_ICONS: Record<string, string> = {
  workshop: '<path d="M14 34 30 18" stroke-width="5"/><rect x="26" y="9" width="16" height="9" rx="2" transform="rotate(45 34 13.5)" class="accent"/>',
  garden: '<circle cx="38" cy="10" r="5" class="petal" stroke-width="2"/><path d="M22 42V26"/><path d="M22 36c-6 0-9-3-10-7 5 0 9 2 10 7z" class="leaf" stroke-width="2"/><g stroke-width="2"><circle cx="22" cy="12" r="5.5" class="pink"/><circle cx="15" cy="19" r="5.5" class="pink"/><circle cx="29" cy="19" r="5.5" class="pink"/><circle cx="22" cy="26" r="5.5" class="pink"/><circle cx="22" cy="19" r="4.5" class="petal"/></g>',
  kitchen: '<path d="M9 22h24v9a7 7 0 0 1-7 7H16a7 7 0 0 1-7-7z" class="accent"/><path d="M33 25h8" /><path d="M15 16c0-3 3-3 3-6M22 16c0-3 3-3 3-6" />',
  playroom: '<rect x="8" y="26" width="14" height="14" rx="2" class="accent"/><rect x="24" y="26" width="14" height="14" rx="2" class="petal"/><rect x="16" y="11" width="14" height="14" rx="2" class="leaf"/>',
  attic: '<path d="M30 9a13 13 0 1 0 9 22A11 11 0 0 1 30 9z" class="accent"/><path d="M13 11l1.5 3 3.2.5-2.3 2.2.6 3.2-3-1.6-2.9 1.6.6-3.2-2.3-2.2 3.2-.5z" class="petal"/>',
};

/** The toy box's picture: an open box with a ball and a star popping out. */
const TOY_ICON = '<path d="M8 22h32l-3 18H11z" class="accent"/><path d="M8 22l-3-7 13 2M40 22l3-7-13 2"/><circle cx="20" cy="15" r="5" class="pink"/><path d="M31 6l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" class="petal" stroke-width="2"/>';

function roomBanner(room: Room): HTMLElement {
  const el = document.createElement('div');
  el.className = 'room-banner';
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', room.name);
  el.style.setProperty('--accent', room.accent);
  el.style.setProperty('--paper', room.paper);
  el.innerHTML = `<span class="tape"></span><svg viewBox="0 0 48 48">${ROOM_ICONS[room.id] ?? ''}</svg><span class="tape"></span>`;
  return el;
}

function thumb(level: Level, toy = false, withSolution = false, room?: Room): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const s = 22;
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
  for (const rp of sim.parts) { drawPart(ctx, rp, 0); drawFixedPin(ctx, rp); }
  setSkin('');
  return c;
}

/** A room's front-page picture: its own things laid out on its own paper. */
function roomScene(room: Room): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const s = 22;
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
  for (const [k, x, y, size] of things) drawIcon(ctx, k, x * s, y * s, size * s);
  setSkin('');
  return c;
}

const BACK_ICON = '<svg viewBox="0 0 48 48"><path d="M38 24H12M22 13 11 24l11 11" /></svg>';

/** null: the front page of rooms; otherwise the room being looked at ('toybox' included). */
let mapRoom: string | null = null;

function showMap() {
  game?.destroy();
  game = null;
  // Leaving a shared puzzle: drop the link from the address bar so a reload shows the map.
  if (location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname + location.search);
  try { speechSynthesis.cancel(); } catch { /* none */ }
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
  else if (mapRoom === 'toybox') showToyRoom(box);
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

/** The front page: one big tile per room, then the toy box as a room of its own. */
function showRooms(box: HTMLElement) {
  const done = loadDone();
  for (const room of ROOMS) {
    const t = document.createElement('button');
    t.className = 'card room-tile';
    t.setAttribute('aria-label', room.name);
    t.style.setProperty('--accent', room.accent);
    t.style.setProperty('--paper', room.paper);
    t.style.background = mix(room.paper, '#ffffff', 0.45);
    t.append(roomScene(room));
    t.insertAdjacentHTML('beforeend', `<svg class="room-pic" viewBox="0 0 48 48">${ROOM_ICONS[room.id] ?? ''}</svg>`);
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
    t.onclick = () => openRoom(room.id);
    box.append(t);
  }
  const t = document.createElement('button');
  t.className = 'card room-tile toybox';
  t.setAttribute('aria-label', 'Toy box');
  t.style.setProperty('--accent', PAPER.teal);
  t.style.setProperty('--paper', '#eef7f3');
  t.style.background = '#f4faf7';
  t.append(thumb(TOY_BOX, true));
  t.insertAdjacentHTML('beforeend', `<svg class="room-pic" viewBox="0 0 48 48">${TOY_ICON}</svg>`);
  if (loadMine().length) t.insertAdjacentHTML('beforeend', MADE_BADGE);
  t.onclick = () => openRoom('toybox');
  box.append(t);
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

/** The toy box room: build anything, plus the puzzles made here on this device. */
function showToyRoom(box: HTMLElement) {
  const done = loadDone();
  const banner = document.createElement('div');
  banner.className = 'room-banner';
  banner.setAttribute('role', 'img');
  banner.setAttribute('aria-label', 'Toy box');
  banner.style.setProperty('--accent', PAPER.teal);
  banner.style.setProperty('--paper', '#eef7f3');
  banner.innerHTML = `<span class="tape"></span><svg viewBox="0 0 48 48">${TOY_ICON}</svg><span class="tape"></span>`;
  roomHeader(box, banner);
  const t = document.createElement('button');
  t.className = 'card toybox';
  t.setAttribute('aria-label', 'Toy box');
  t.append(thumb(TOY_BOX, true));
  t.onclick = () => startLevel(-1);
  box.append(t);
  // Puzzles made in the toy box on this device.
  loadMine().forEach((code, k) => {
    const lv = decodeLevel(code, MADE_VOICE);
    if (!lv) return;
    const b = document.createElement('button');
    b.className = 'card mine';
    if (code === justMade) b.classList.add('fresh');
    b.setAttribute('aria-label', `My puzzle ${k + 1}`);
    b.append(thumb(lv));
    b.insertAdjacentHTML('beforeend', MADE_BADGE);
    if (done.has(lv.id)) b.insertAdjacentHTML('beforeend', STICKER);
    b.onclick = () => startLevel(-2, lv);
    box.append(b);
  });
}

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

function talkCard(level: Level, n: string, index: number, toy = false): HTMLElement {
  const t = TALK[level.id];
  const card = document.createElement('section');
  card.className = 'talk';
  const room = index >= 0 ? roomOf(index) : undefined;
  const pic = thumb(level, toy, false, room);
  pic.className = 'talk-pic';
  const play = document.createElement('button');
  play.className = 'text-btn';
  play.textContent = 'Play this level';
  play.onclick = () => { hideGrownups(); startLevel(index); };
  card.innerHTML = `
    <h4>${esc(n)}</h4>
    <p class="idea">${esc(t.idea)}</p>
    <div class="cols">
      <div><h5>Before you press Go</h5><ul>${t.before.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>
      <div><h5>After it runs</h5><ul>${t.after.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>
    </div>
    <p class="words"><b>Words to use:</b> ${t.words.map((w) => `<span>${esc(w)}</span>`).join(' ')}</p>
    <p class="home"><b>Try at home:</b> ${esc(t.tryAtHome)}</p>`;
  const side = document.createElement('div');
  side.className = 'talk-side';
  side.append(pic, play);
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
      side.firstElementChild!.replaceWith(next);
      ans.textContent = showing ? 'Hide the answer' : 'Show the answer';
    };
    side.append(ans);
  }
  card.prepend(side);
  return card;
}

let guBuilt = false;
function showGrownups() {
  if (!guBuilt) {
    const body = $('gu-body');
    body.innerHTML = `
      <img class="gu-logo" src="logo.svg" alt="Tinker Table" />
      <p class="lead">${esc(INTRO)}</p>
      <h3>What your child is practising</h3>
      <div class="skills">${SKILLS.map((s) => `<div class="skill"><h4>${esc(s.title)}</h4><p>${esc(s.body)}</p></div>`).join('')}</div>
      <h3>A simple routine for every level</h3>
      <ol class="routine">${ROUTINE.map((r) => `<li><b>${esc(r.step)}.</b> ${esc(r.say)}</li>`).join('')}</ol>
      <h3>Playing together</h3>
      <ul class="tips">${TIPS.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>Talk cards for each level</h3>
      <p>Pick one or two questions. You don't need to ask them all.</p>
      <div id="gu-cards"></div>
      <h3>Puzzles made on this device</h3>
      <p>${esc(MAKER_HOW)}</p>
      <div id="gu-mine"></div>
      <p class="small">Tinker Table collects no data. Progress, the sticker book and made puzzles are kept only on this device. A shared link contains only the puzzle itself.</p>`;
    const cards = $('gu-cards');
    LEVELS.forEach((lv, i) => cards.append(talkCard(lv, `Level ${i + 1}`, i)));
    cards.append(talkCard(TOY_BOX, 'The toy box', -1, true));
    guBuilt = true;
  }
  renderMine();
  $('map').classList.add('hidden');
  $('grownups').classList.remove('hidden');
  $('gu-body').scrollTop = 0;
}
/** The grown-ups' list of made puzzles, with share and delete. Rebuilt on every visit. */
function renderMine() {
  const box = $('gu-mine');
  box.innerHTML = '';
  const list = loadMine();
  if (!list.length) {
    box.innerHTML = `<p class="small">${esc(MADE_TALK.none)}</p>`;
    return;
  }
  list.forEach((code, k) => {
    const lv = decodeLevel(code, MADE_VOICE);
    if (!lv) return;
    const card = document.createElement('section');
    card.className = 'talk mine';
    const side = document.createElement('div');
    side.className = 'talk-side';
    const pic = thumb(lv);
    pic.className = 'talk-pic';
    const play = document.createElement('button');
    play.className = 'text-btn';
    play.textContent = 'Play it';
    play.onclick = () => { hideGrownups(); startLevel(-2, lv); };
    side.append(pic, play);
    const body = document.createElement('div');
    body.innerHTML = `<h4>My puzzle ${k + 1}</h4><p class="idea">${esc(MADE_TALK.idea)}</p>`;
    const row = document.createElement('div');
    row.className = 'mine-actions';
    const share = document.createElement('button');
    share.className = 'text-btn';
    share.textContent = 'Share';
    share.onclick = () => sharePuzzle(code, share);
    const del = document.createElement('button');
    del.className = 'text-btn';
    del.textContent = 'Delete';
    del.onclick = () => {
      if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.textContent = 'Tap again to delete'; return; }
      saveMine(loadMine().filter((c) => c !== code));
      renderMine();
    };
    row.append(share, del);
    body.append(row);
    card.append(side, body);
    box.append(card);
  });
}

/** Share a made puzzle as a link: the share sheet if there is one, else copy it. */
async function sharePuzzle(code: string, btn: HTMLButtonElement) {
  const url = `${location.origin}${location.pathname}#p=${code}`;
  const label = btn.textContent;
  const flash = (t: string) => { btn.textContent = t; setTimeout(() => { btn.textContent = label; }, 2200); };
  try {
    if (navigator.share) { await navigator.share({ title: 'A Tinker Table puzzle', url }); return; }
    await navigator.clipboard.writeText(url);
    flash('Link copied!');
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return; // the share sheet was closed
    // Copying isn't allowed here: show the link to copy by hand.
    window.prompt('Copy this link:', url);
  }
}

// ---------- sticker book ----------
function showBook() {
  $('map').classList.add('hidden');
  $('book').classList.remove('hidden');
  renderBook($('book-page'), $('book-strip'), loadDone());
  sfx.place();
}
function hideBook() {
  $('book').classList.add('hidden');
  showMap();
}

function hideGrownups() {
  $('grownups').classList.add('hidden');
  $('map').classList.remove('hidden');
}

/** Press and hold for HOLD_MS to open; a short tap just wiggles. */
function wireHold(btn: HTMLElement, onDone: () => void) {
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
  btn.addEventListener('pointerdown', (e) => {
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
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDone(); } });
}

// ---------- play ----------
let game: Game | null = null;
let current = 0;
let wonTimer = 0;

function drawGoalPic(level: Level) {
  const c = $<HTMLCanvasElement>('goal-pic');
  const dpr = 2;
  c.width = c.clientWidth * dpr || 400;
  c.height = c.clientHeight * dpr || 128;
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = c.width / dpr, h = c.height / dpr;
  ctx.clearRect(0, 0, w, h);
  if (!level.goal) {
    (['ball', 'domino', 'balloon'] as PartKind[]).forEach((k, i) => drawIcon(ctx, k, w * (0.2 + i * 0.3), h / 2, h * 0.75));
    return;
  }
  const kindOf = (id: string) => level.fixed.find((p) => p.id === id)!.part;
  // A ball on a rope is shown as just the ball: the rope makes the picture too tall to read.
  const obj = kindOf(level.goal.object) === 'rope' ? 'ball' : kindOf(level.goal.object);
  // The pulley is drawn hanging above its placement point, so centre it by hand.
  if (obj === 'pulley') drawIcon(ctx, obj, w * 0.18, h * 0.82, h * 1.25);
  else drawIcon(ctx, obj, w * 0.18, h / 2, h * 0.8);
  ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(w * 0.36, h / 2); ctx.lineTo(w * 0.6, h / 2);
  ctx.moveTo(w * 0.53, h / 2 - 9); ctx.lineTo(w * 0.61, h / 2); ctx.lineTo(w * 0.53, h / 2 + 9); ctx.stroke();
  drawIcon(ctx, kindOf(level.goal.target), w * 0.8, h / 2, h * 0.9);
}

/** While making a puzzle, the goal picture fills in as the goal is picked: ? → ?, then ball → ?, then ball → basket. */
function drawMakeGoal(g: Game) {
  const c = $<HTMLCanvasElement>('goal-pic');
  const dpr = 2;
  c.width = c.clientWidth * dpr || 400;
  c.height = c.clientHeight * dpr || 128;
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = c.width / dpr, h = c.height / dpr;
  ctx.clearRect(0, 0, w, h);
  const m = g.making!;
  const slot = (x: number, kind: PartKind | null, active: boolean) => {
    if (kind) {
      if (kind === 'pulley') drawIcon(ctx, kind, x, h * 0.82, h * 1.25);
      else drawIcon(ctx, kind, x, h / 2, h * 0.8);
      return;
    }
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = active ? PAPER.mustard : 'rgba(60,45,30,0.3)';
    ctx.beginPath(); ctx.arc(x, h / 2, h * 0.32, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };
  slot(w * 0.18, m.object !== null ? g.placements[m.object].part : null, m.step === 'object');
  ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(w * 0.36, h / 2); ctx.lineTo(w * 0.6, h / 2);
  ctx.moveTo(w * 0.53, h / 2 - 9); ctx.lineTo(w * 0.61, h / 2); ctx.lineTo(w * 0.53, h / 2 + 9); ctx.stroke();
  slot(w * 0.8, m.target !== null ? g.placements[m.target].part : null, m.step === 'target');
}

function syncButtons() {
  if (!game) return;
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
  $('btn-make').classList.toggle('hidden', !(game.canMake || making));
  $('btn-make').setAttribute('aria-pressed', String(making));
  $('btn-make-done').classList.toggle('hidden', !(making && game.making!.step === 'pins'));
  if (making) drawMakeGoal(game);
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
    b.setAttribute('aria-label', `Picture ${k + 1}: watch again`);
    b.style.animationDelay = `${0.15 + k * 0.18}s`;
    b.style.setProperty('--tilt', `${[-3, 2, -1.5, 2.5, -2][k % 5]}deg`);
    b.append(f);
    b.onclick = () => { $('won').classList.add('hidden'); game?.replay(); };
    box.append(b);
  });
}

let madeGoalShown = false;
/** The current level's spoken goal, in its room's words. */
let voice = '';

/** i: a level number, -1 for the toy box, or -2 with a made or shared puzzle. */
function startLevel(i: number, custom?: Level) {
  current = custom ? -2 : i;
  const level = custom ?? (i < 0 ? TOY_BOX : LEVELS[i]);
  game?.destroy();
  $('map').classList.add('hidden');
  $('play').classList.remove('hidden');
  $('won').classList.add('hidden');
  const slow = game?.slow ?? false;
  game = new Game($<HTMLCanvasElement>('stage'), level);
  const room = custom || i < 0 ? undefined : roomOf(i);
  if (room) { game.paper = room.paper; game.skin = room.id; }
  // Home goes back to the room this level is in (made and shared puzzles live in the toy box).
  mapRoom = room?.id ?? 'toybox';
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
wireHold($('btn-grownups'), showGrownups);
$('btn-gu-close').onclick = hideGrownups;
$('btn-book').onclick = showBook;
$('btn-book-close').onclick = hideBook;
$('btn-gu-print').onclick = () => window.print();
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
$('btn-guess').onclick = () => game?.togglePencil();
$('btn-slow').onclick = () => { if (game) { game.slow = !game.slow; syncButtons(); } };
$('btn-replay').onclick = () => { $('won').classList.add('hidden'); game?.replay(); };
$('btn-next').onclick = () => startLevel(current + 1 < LEVELS.length ? current + 1 : -1);
// Offline play once installed. Service workers only run on https or localhost,
// and only in the built app (the dev server reloads too often for caching).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* fine: plays online */ });
}
// iOS: stop pinch zoom gestures from scaling the page.
document.addEventListener('gesturestart', (e) => e.preventDefault());

showMap();
// A shared puzzle link (…/#p=<code>) opens straight into the puzzle. Bad codes are ignored.
function openSharedFromHash() {
  const m = /^#p=([A-Za-z0-9_-]{1,4000})$/.exec(location.hash);
  if (!m) return;
  const lv = decodeLevel(m[1], SHARED_VOICE);
  if (lv) startLevel(-2, lv);
}
openSharedFromHash();
window.addEventListener('hashchange', openSharedFromHash);
(window as unknown as { tinker: () => Game | null }).tinker = () => game;
