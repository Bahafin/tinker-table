let ac: AudioContext | null = null;
let lastClack = 0;

/** iOS only allows audio after a touch, so call this from a pointer handler. */
export function unlockAudio() {
  try {
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

function noise(dur: number, vol: number, filter: BiquadFilterType, freq: number) {
  if (!ac) return;
  const t = ac.currentTime;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
}

export const sfx = {
  place: () => tone(220, 0.12, 'sine', 0.35, 0, 110),
  pickup: () => tone(330, 0.08, 'sine', 0.2, 0, 440),
  rotate: () => tone(880, 0.05, 'triangle', 0.15),
  nope: () => { tone(300, 0.08, 'square', 0.06); tone(250, 0.1, 'square', 0.06, 0.09); },
  clack: (s: number) => {
    const now = performance.now();
    if (now - lastClack < 45) return;
    lastClack = now;
    noise(0.05, 0.15 + s * 0.4, 'bandpass', 1800);
  },
  pop: () => { noise(0.15, 0.9, 'highpass', 1200); tone(600, 0.1, 'sine', 0.2, 0, 150); },
  boing: () => tone(180, 0.35, 'sine', 0.3, 0, 520),
  whoosh: () => noise(0.7, 0.35, 'lowpass', 900),
  go: () => { tone(392, 0.12, 'triangle', 0.2); tone(523, 0.16, 'triangle', 0.2, 0.1); },
  chime: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.3, i * 0.12)),
  squeak: () => { tone(1500, 0.08, 'sine', 0.15, 0, 2100); tone(1700, 0.1, 'sine', 0.15, 0.1, 2400); },
  /** A wind-up toy car starting off: a quick ratchet of clicks. */
  vroom: () => { for (let i = 0; i < 5; i++) tone(140 + i * 25, 0.05, 'square', 0.05, i * 0.06); },
  hmm: () => { tone(330, 0.25, 'sine', 0.18); tone(262, 0.35, 'sine', 0.18, 0.22); },
};

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

export function speak(text: string) {
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
