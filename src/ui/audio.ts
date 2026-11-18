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
  hmm: () => { tone(330, 0.25, 'sine', 0.18); tone(262, 0.35, 'sine', 0.18, 0.22); },
};

export function speak(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.15;
    s.speak(u);
  } catch {
    /* no voice available */
  }
}
