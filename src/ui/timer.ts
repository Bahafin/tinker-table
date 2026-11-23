// The play timer. A grown-up picks a limit (15, 20 or 30 minutes, or none). Play time counts
// only while the game is on screen and the grown-ups' corner is closed. When it runs out the
// game goes to sleep, and only a grown-up (the PIN, or the press-and-hold without one) wakes it.
// No countdown is ever shown to the child. Kept on this device, like everything else.

export const TIMER_KEY = 'tinker.timer';
/** Limits a grown-up can choose, in minutes (0: no limit). */
export const LIMITS = [0, 15, 20, 30] as const;
/** After this long away from the game, the next visit starts a fresh play time. */
export const FRESH_AFTER_MS = 60 * 60 * 1000;

interface Saved { limit: number; played: number; asleep: boolean; seen: number }

export class PlayTimer {
  /** Minutes allowed (0: no limit). */
  limit = 0;
  /** Seconds played since the last wake-up or fresh start. */
  played = 0;
  asleep = false;
  /** When the game was last on screen (ms since 1970). */
  seen = 0;

  constructor(private store: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage(), now = Date.now()) {
    try {
      const v = JSON.parse(this.store?.getItem(TIMER_KEY) ?? 'null') as Partial<Saved> | null;
      if (v && typeof v === 'object') {
        if ((LIMITS as readonly number[]).includes(Number(v.limit))) this.limit = Number(v.limit);
        if (Number.isFinite(v.played) && v.played! >= 0) this.played = v.played!;
        this.asleep = v.asleep === true;
        if (Number.isFinite(v.seen)) this.seen = v.seen!;
      }
    } catch { /* a broken value: start fresh */ }
    this.welcomeBack(now);
  }

  /** Coming back after a long break starts a fresh play time (but a sleeping game stays asleep). */
  welcomeBack(now = Date.now()) {
    if (!this.asleep && this.seen && now - this.seen > FRESH_AFTER_MS) this.played = 0;
    this.seen = now;
    this.save();
  }

  /** Count `seconds` of play. Returns true when the time has just run out. */
  tick(seconds: number, now = Date.now()): boolean {
    this.seen = now;
    if (!this.limit || this.asleep) { this.save(); return false; }
    const before = this.played;
    this.played += seconds;
    this.save();
    return before < this.limit * 60 && this.played >= this.limit * 60;
  }

  get timeUp() { return !!this.limit && this.played >= this.limit * 60; }

  sleep() { this.asleep = true; this.save(); }

  /** A grown-up woke the game: a fresh play time starts. */
  wake() { this.asleep = false; this.played = 0; this.save(); }

  setLimit(minutes: number) {
    if (!(LIMITS as readonly number[]).includes(minutes)) return;
    this.limit = minutes;
    this.played = 0;
    this.save();
  }

  private save() {
    try { this.store?.setItem(TIMER_KEY, JSON.stringify({ limit: this.limit, played: Math.round(this.played), asleep: this.asleep, seen: this.seen } satisfies Saved)); } catch { /* private mode */ }
  }
}

function safeStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
