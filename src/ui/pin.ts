// The grown-ups' PIN: the rules, with no screen. The number pad lives in pinpad.ts.
//
// This keeps a young child out of the grown-ups' corner and settings. It isn't real
// security (anyone with the device and a browser's developer tools can clear it), so the
// PIN is kept only as a salted, scrambled code, never as the digits themselves.

export const PIN_KEY = 'tinker.pin';
export const PIN_LEN = 4;
/** Wrong tries in a row before the pad rests. */
export const MAX_TRIES = 3;
export const REST_MS = 30_000;

export interface PinState {
  salt: string;
  hash: string;
  /** Wrong tries in a row. */
  fails: number;
  /** Time (ms) until which the pad rests after too many wrong tries. */
  restUntil: number;
}

/** Where the PIN is kept: localStorage in the game, a plain object in tests. */
export interface PinStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const browserStore = (): PinStore | null => {
  try { return localStorage; } catch { return null; }
};

/** A small, fast scramble (FNV-1a, stretched). Enough to not keep the digits in the clear. */
export function scramble(pin: string, salt: string): string {
  let h = 0x811c9dc5;
  const s = `${salt}:${pin}`;
  for (let round = 0; round < 2000; round++) {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h = (h ^ round) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const isPin = (pin: string) => new RegExp(`^\\d{${PIN_LEN}}$`).test(pin);

export class Pin {
  constructor(private store: PinStore | null = browserStore(), private now: () => number = Date.now) {}

  private read(): PinState | null {
    try {
      const v = JSON.parse(this.store?.getItem(PIN_KEY) ?? 'null');
      if (v && typeof v.salt === 'string' && typeof v.hash === 'string') {
        return { salt: v.salt, hash: v.hash, fails: Number(v.fails) || 0, restUntil: Number(v.restUntil) || 0 };
      }
    } catch { /* broken: treat as no PIN */ }
    return null;
  }
  private write(s: PinState) {
    try { this.store?.setItem(PIN_KEY, JSON.stringify(s)); } catch { /* private mode */ }
  }

  get isSet() { return !!this.read(); }

  set(pin: string) {
    if (!isPin(pin)) throw new Error('A PIN is 4 digits');
    const salt = Math.random().toString(36).slice(2, 10);
    this.write({ salt, hash: scramble(pin, salt), fails: 0, restUntil: 0 });
  }

  clear() {
    try { this.store?.removeItem(PIN_KEY); } catch { /* private mode */ }
  }

  /** Milliseconds left of the rest after too many wrong tries (0: the pad is open). */
  restLeft(): number {
    const s = this.read();
    return s ? Math.max(0, s.restUntil - this.now()) : 0;
  }

  /** Check a typed PIN. No PIN set counts as ok. */
  check(pin: string): 'ok' | 'wrong' | 'resting' {
    const s = this.read();
    if (!s) return 'ok';
    if (this.restLeft() > 0) return 'resting';
    if (scramble(pin, s.salt) === s.hash) {
      this.write({ ...s, fails: 0, restUntil: 0 });
      return 'ok';
    }
    const fails = s.fails + 1;
    if (fails >= MAX_TRIES) {
      this.write({ ...s, fails: 0, restUntil: this.now() + REST_MS });
      return 'resting';
    }
    this.write({ ...s, fails });
    return 'wrong';
  }
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/** A sum in words that a grown-up does at once and a 5 to 8 year old can't yet: "seven times eight". */
export function grownUpSum(rand: () => number = Math.random): { words: string; answer: number } {
  const a = 6 + Math.floor(rand() * 7); // 6..12
  const b = 6 + Math.floor(rand() * 7);
  return { words: `${WORDS[a]} times ${WORDS[b]}`, answer: a * b };
}
