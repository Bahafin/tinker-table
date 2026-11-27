import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { PLATFORM } from '../platform';
import type { Material, Note } from '../sim/types';
import CLIPS from './voice-clips.json';

let ac: AudioContext | null = null;
let lastClack = 0;

/** iOS only allows audio after a touch, so call this from a pointer handler. */
export function unlockAudio() {
  try {
    // Play even when an iPhone or iPad is on silent (Safari 16.4+; the iOS app also sets this
    // natively in AppDelegate.swift). Elsewhere this does nothing.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
    if (!ac) ac = new AudioContext();
    if (ac.state === 'suspended') void ac.resume();
  } catch {
    ac = null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, at = 0, toFreq?: number) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol: number, filter: BiquadFilterType, freq: number, q = 1, at = 0) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
}

/** Each material's knock. v: loudness 0..1, p: a little pitch wobble so repeats don't sound mechanical. */
const KNOCK: Record<Material, (v: number, p: number) => void> = {
  // Hollow and woody: a short low triangle note through a resonant band.
  wood: (v, p) => { tone(420 * p, 0.08, 'triangle', 0.28 * v); noise(0.05, 0.35 * v, 'bandpass', 950 * p, 4); },
  // Bright and ringing: two inharmonic partials that hang on a little.
  metal: (v, p) => { tone(1850 * p, 0.22, 'sine', 0.1 * v); tone(2790 * p, 0.14, 'sine', 0.06 * v); noise(0.02, 0.18 * v, 'highpass', 4500); },
  // A light tick.
  plastic: (v, p) => { tone(1150 * p, 0.04, 'triangle', 0.12 * v); noise(0.025, 0.22 * v, 'bandpass', 2600 * p, 2); },
  // A heavy ball: a low thud you feel.
  heavy: (v, p) => { tone(120 * p, 0.2, 'sine', 0.5 * v, 0, 55); noise(0.09, 0.35 * v, 'lowpass', 320); },
  // The paper table itself: a dull pat.
  table: (v, p) => { noise(0.07, 0.4 * v, 'lowpass', 650 * p); tone(170 * p, 0.07, 'sine', 0.15 * v, 0, 100); },
  // Balloons, cheese, flowers: barely a sound.
  soft: (v) => noise(0.05, 0.12 * v, 'lowpass', 450),
};

/** A tone sliding from one pitch to another with a vibrato, for the spring. */
function wobble(from: number, to: number, dur: number, type: OscillatorType, vol: number, rate: number, depth: number) {
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.35);
  lfo.frequency.value = rate;
  lg.gain.value = to * depth;
  lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t); lfo.start(t);
  o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
}

/** A floor tom: a beater click, a fast drop in pitch, and the skin's thump. */
function drum() {
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(190, t);
  o.frequency.exponentialRampToValueAtTime(78, t + 0.06);
  o.frequency.exponentialRampToValueAtTime(64, t + 0.4);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.75, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.5);
  noise(0.12, 0.45, 'bandpass', 220, 1.2);
  noise(0.012, 0.3, 'highpass', 3000);
}

export const sfx = {
  place: () => tone(220, 0.12, 'sine', 0.35, 0, 110),
  pickup: () => tone(330, 0.08, 'sine', 0.2, 0, 440),
  rotate: () => tone(880, 0.05, 'triangle', 0.15),
  nope: () => { tone(300, 0.08, 'square', 0.06); tone(250, 0.1, 'square', 0.06, 0.09); },
  /** Two things knocking together, in the sound of the loudest material of the two. */
  clack: (s: number, mat: Material = 'plastic') => {
    const now = performance.now();
    if (now - lastClack < 45) return;
    lastClack = now;
    KNOCK[mat](0.35 + s * 0.65, 0.92 + Math.random() * 0.16);
  },
  pop: () => { noise(0.15, 0.9, 'highpass', 1200); tone(600, 0.1, 'sine', 0.2, 0, 150); },
  /** A spring: a rising twang that wobbles, like a door stop. */
  boing: () => wobble(150, 480, 0.45, 'triangle', 0.28, 22, 0.12),
  whoosh: () => noise(0.7, 0.35, 'lowpass', 900),
  go: () => { tone(392, 0.12, 'triangle', 0.2); tone(523, 0.16, 'triangle', 0.2, 0.1); },
  chime: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.3, i * 0.12)),
  squeak: () => { tone(1500, 0.08, 'sine', 0.15, 0, 2100); tone(1700, 0.1, 'sine', 0.15, 0.1, 2400); },
  /** A wind-up toy car starting off: a quick ratchet of clicks. */
  vroom: () => { for (let i = 0; i < 5; i++) tone(140 + i * 25, 0.05, 'square', 0.05, i * 0.06); },
  /** The toaster popping: a spring twang and a little bell. */
  ding: () => { tone(300, 0.12, 'triangle', 0.15, 0, 700); tone(1568, 0.6, 'sine', 0.18, 0.08); },
  /** The watering can tipping: a soft rush of water. */
  pour: () => noise(1.2, 0.18, 'bandpass', 1400),
  /** A drop soaking into a flower. */
  drip: () => { const now = performance.now(); if (now - lastClack < 60) return; lastClack = now; tone(900, 0.07, 'sine', 0.12, 0, 1400); },
  /** Scissors cutting a rope. */
  snip: () => { noise(0.04, 0.5, 'highpass', 3000); noise(0.05, 0.4, 'highpass', 2500); },
  /** Soap squirting away: a wet squelch and a squeak. */
  squish: () => { noise(0.12, 0.3, 'bandpass', 900, 2); tone(700, 0.15, 'sine', 0.12, 0.03, 1500); },
  /** Something landing on a pillow: a soft flump. */
  puff: () => { noise(0.18, 0.3, 'lowpass', 380); tone(110, 0.12, 'sine', 0.12, 0, 70); },
  /** A rocket taking off: a rising roar and a whistle. */
  blast: () => { noise(0.9, 0.35, 'bandpass', 700, 0.8); tone(300, 0.7, 'triangle', 0.08, 0, 1200); },
  /** The hamster yawning: a slow slide down. */
  yawn: () => { tone(520, 0.9, 'sine', 0.14, 0, 260); tone(780, 0.6, 'sine', 0.04, 0.1, 390); },
  /** A short, slow lullaby on the xylophone's notes, for going to sleep. */
  lullaby: () => {
    const notes: [number, number][] = [[784, 0], [659, 0.6], [784, 1.2], [659, 1.8], [587, 2.4], [523, 3.3], [587, 3.9], [523, 4.5]];
    for (const [f, at] of notes) { tone(f, 1.1, 'sine', 0.16, at); tone(f * 2, 0.3, 'sine', 0.03, at); }
  },
  hmm: () => { tone(330, 0.25, 'sine', 0.18); tone(262, 0.35, 'sine', 0.18, 0.22); },
  /** A musical part: a wooden xylophone note, the bell, or the drum. */
  note: (n: Note) => {
    if (n === 'bell') { tone(1318, 1.4, 'sine', 0.22); tone(1318 * 2.76, 0.5, 'sine', 0.06); tone(1318 * 5.4, 0.25, 'sine', 0.03); return; }
    if (n === 'drum') { drum(); return; }
    const f = NOTE_HZ[n];
    tone(f, 0.7, 'sine', 0.32);
    tone(f * 4, 0.12, 'sine', 0.07);
    tone(f * 10, 0.04, 'sine', 0.03);
  },
};

/** The xylophone's five notes (C major pentatonic, so any order sounds nice). */
export const NOTE_HZ: Record<'c' | 'd' | 'e' | 'g' | 'a', number> = { c: 523.25, d: 587.33, e: 659.25, g: 783.99, a: 880 };

// ---------- voice ----------
// Devices ship several voices; the default is usually the oldest, most robotic one.
// We score what's installed and pick the most natural English voice.

/** Novelty or very old voices (Apple's joke voices, eSpeak) that should never be picked. */
const BAD_VOICES = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|junior|ralph|fred|kathy)\b|espeak/i;
/** Voices that are known to sound warm and clear. */
const NICE_NAMES = /\b(ava|zoe|samantha|serena|allison|susan|karen|moira|tessa|kate|aria|jenny|sonia|libby|emma|michelle|ana|natasha|clara|maisie|zira|hazel)\b/i;

export function scoreVoice(v: SpeechSynthesisVoice, userLang = 'en-US'): number {
  if (!/^en[-_]/i.test(v.lang) && v.lang.toLowerCase() !== 'en') return -1000;
  if (BAD_VOICES.test(v.name)) return -500;
  let s = 0;
  if (/natural|neural/i.test(v.name)) s += 100;       // Microsoft Edge online voices
  if (/premium/i.test(v.name)) s += 90;               // Apple, downloaded in Settings
  if (/enhanced/i.test(v.name)) s += 70;              // Apple, downloaded in Settings
  if (/^google/i.test(v.name)) s += 40;               // Chrome's online voices
  if (NICE_NAMES.test(v.name)) s += 15;
  if (v.lang.replace('_', '-').toLowerCase() === userLang.toLowerCase()) s += 8;
  else if (v.lang.slice(0, 5).toLowerCase() === 'en-gb' || v.lang.slice(0, 5).toLowerCase() === 'en-us') s += 4;
  if (v.localService) s += 2;                          // keeps working offline
  return s;
}

let chosen: SpeechSynthesisVoice | null = null;
function pickVoice(): SpeechSynthesisVoice | null {
  try {
    const all = window.speechSynthesis?.getVoices() ?? [];
    let best: SpeechSynthesisVoice | null = null, bestScore = -1;
    for (const v of all) {
      const sc = scoreVoice(v, navigator.language || 'en-US');
      if (sc > bestScore) { best = v; bestScore = sc; }
    }
    chosen = best;
  } catch { chosen = null; }
  return chosen;
}
try {
  // Voices arrive asynchronously in most browsers.
  window.speechSynthesis?.addEventListener?.('voiceschanged', pickVoice);
  pickVoice();
} catch { /* no speech */ }

// Every line the game says has a recorded clip (src/ui/voice-lines.ts, made by
// scripts/make-voice.py), played through the same audio as the sounds. The device's own speech
// is only the fallback, for a line without a clip or audio that isn't unlocked yet.
const clipFiles = CLIPS as Record<string, string>;
const clipCache = new Map<string, Promise<AudioBuffer | null>>();
let saying: AudioBufferSourceNode | null = null;
let sayId = 0;

function loadClip(file: string): Promise<AudioBuffer | null> {
  let p = clipCache.get(file);
  if (!p) {
    const ctx = ac!;
    p = fetch(`voice/${file}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`status ${r.status}`))))
      .then((b) => ctx.decodeAudioData(b))
      .catch(() => { clipCache.delete(file); return null; });
    clipCache.set(file, p);
  }
  return p;
}

/** Whether a line has a recorded clip. */
export const hasClip = (text: string) => text in clipFiles;

/** Stop the voice mid-sentence (leaving a level, say). */
export function stopSpeaking() {
  sayId++;
  try { saying?.stop(); } catch { /* already stopped */ }
  saying = null;
  if (PLATFORM === 'android') { TextToSpeech.stop().catch(() => {}); return; }
  try { window.speechSynthesis?.cancel(); } catch { /* none */ }
}

export function speak(text: string) {
  stopSpeaking();
  const file = clipFiles[text];
  if (file && ac) {
    const id = sayId;
    const ctx = ac;
    void loadClip(file).then((buf) => {
      if (id !== sayId) return; // something else was said, or the level was left
      if (!buf) { deviceSpeak(text); return; }
      if (ctx.state === 'suspended') void ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.onended = () => { if (saying === src) saying = null; };
      saying = src;
      src.start();
    });
    return;
  }
  deviceSpeak(text);
}

/** The device's own speech: the fallback when there's no clip. */
function deviceSpeak(text: string) {
  // Android's in-app browser has no voices of its own, so the app uses the phone's speech engine.
  if (PLATFORM === 'android') {
    TextToSpeech.stop()
      .then(() => TextToSpeech.speak({ text, lang: 'en-US', rate: 0.95, pitch: 1.05, category: 'ambient' }))
      .catch(() => { /* no speech engine */ });
    return;
  }
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = chosen ?? pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    // Modern voices sound odd when pitch-shifted; only liven up the plain ones a bit.
    const modern = !!v && /natural|neural|premium|enhanced|google/i.test(v.name);
    u.rate = modern ? 0.95 : 0.9;
    u.pitch = modern ? 1 : 1.1;
    s.speak(u);
  } catch {
    /* no voice available */
  }
}

/** For checking on a device: which voice was picked, and the best few on offer. */
if (typeof window !== 'undefined') (window as unknown as { tinkerVoices: () => unknown }).tinkerVoices = () => {
  const all = window.speechSynthesis?.getVoices() ?? [];
  return {
    chosen: chosen?.name,
    top: all.map((v) => [scoreVoice(v, navigator.language), v.name, v.lang] as const)
      .sort((a, b) => b[0] - a[0]).slice(0, 8),
  };
};
