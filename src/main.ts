import './style.css';
import { LEVELS, TOY_BOX } from './levels';
import { Sim } from './sim/sim';
import { WORLD_H, WORLD_W, type Level, type PartKind } from './sim/types';
import { drawFixedPin, drawPart, drawTable, PAPER, setPaperShadow } from './render/draw';
import { Game, drawIcon } from './ui/game';
import { speak, unlockAudio } from './ui/audio';

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

function thumb(level: Level, toy = false): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const s = 22;
  c.width = WORLD_W * s;
  c.height = WORLD_H * s;
  const ctx = c.getContext('2d')!;
  ctx.scale(s, s);
  drawTable(ctx, WORLD_W, WORLD_H);
  setPaperShadow(ctx, 1.5);
  if (toy) {
    const kinds: [PartKind, number, number][] = [['seesaw', 4, 6.5], ['ball', 2.6, 5.4], ['balloon', 12, 3], ['domino', 8, 8.75], ['domino', 9, 8.75], ['fan', 13.5, 9], ['heavyball', 5.5, 2.5], ['star', 9.5, 2.5]];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [k, x, y] of kinds) drawIcon(ctx, k, x * s, y * s, k === 'seesaw' ? 4.4 * s : 1.6 * s);
    return c;
  }
  const sim = new Sim(level.fixed.map((p) => ({ ...p, fixed: true })), level.goal);
  for (const rp of sim.parts) { drawPart(ctx, rp, 0); drawFixedPin(ctx, rp); }
  return c;
}

function showMap() {
  game?.destroy();
  game = null;
  try { speechSynthesis.cancel(); } catch { /* none */ }
  $('play').classList.add('hidden');
  $('map').classList.remove('hidden');
  const done = loadDone();
  const box = $('levels');
  box.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button');
    b.className = 'card';
    b.setAttribute('aria-label', `Level ${i + 1}`);
    b.append(thumb(lv));
    if (done.has(lv.id)) b.insertAdjacentHTML('beforeend', STICKER);
    b.onclick = () => startLevel(i);
    box.append(b);
  });
  const t = document.createElement('button');
  t.className = 'card toybox';
  t.setAttribute('aria-label', 'Toy box');
  t.append(thumb(TOY_BOX, true));
  t.onclick = () => startLevel(-1);
  box.append(t);
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
  drawIcon(ctx, kindOf(level.goal.object), w * 0.18, h / 2, h * 0.8);
  ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(w * 0.36, h / 2); ctx.lineTo(w * 0.6, h / 2);
  ctx.moveTo(w * 0.53, h / 2 - 9); ctx.lineTo(w * 0.61, h / 2); ctx.lineTo(w * 0.53, h / 2 + 9); ctx.stroke();
  drawIcon(ctx, kindOf(level.goal.target), w * 0.8, h / 2, h * 0.9);
}

function syncButtons() {
  if (!game) return;
  const run = game.mode !== 'build';
  $('btn-go').classList.toggle('hidden', run);
  $('btn-stop').classList.toggle('hidden', !run || game.mode === 'won');
  $('btn-slow').setAttribute('aria-pressed', String(game.slow));
  if (game.mode !== 'won') {
    $('won').classList.add('hidden');
    clearTimeout(wonTimer);
  }
}

function startLevel(i: number) {
  current = i;
  const level = i < 0 ? TOY_BOX : LEVELS[i];
  game?.destroy();
  $('map').classList.add('hidden');
  $('play').classList.remove('hidden');
  $('won').classList.add('hidden');
  const slow = game?.slow ?? false;
  game = new Game($<HTMLCanvasElement>('stage'), level);
  game.slow = slow;
  game.onChange = syncButtons;
  game.onWin = () => {
    markDone(level.id);
    $('btn-next').classList.toggle('hidden', current < 0);
    wonTimer = window.setTimeout(() => $('won').classList.remove('hidden'), 1300);
  };
  syncButtons();
  drawGoalPic(level);
  speak(level.voice);
}

// ---------- wiring ----------
document.addEventListener('pointerdown', unlockAudio, { capture: true });
$('btn-home').onclick = showMap;
$('btn-home2').onclick = showMap;
$('btn-goal').onclick = () => game && speak(game.level.voice);
$('btn-go').onclick = () => game?.go();
$('btn-stop').onclick = () => game?.reset();
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
(window as unknown as { tinker: () => Game | null }).tinker = () => game;
