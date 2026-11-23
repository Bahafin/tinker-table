import { describe, expect, test } from 'vitest';
import { FRESH_AFTER_MS, PlayTimer, TIMER_KEY } from '../src/ui/timer';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe('play timer', () => {
  test('has no limit until a grown-up picks one', () => {
    const t = new PlayTimer(memory(), 0);
    expect(t.tick(3600, 1)).toBe(false);
    expect(t.timeUp).toBe(false);
  });

  test('runs out once, at the chosen limit', () => {
    const t = new PlayTimer(memory(), 0);
    t.setLimit(15);
    expect(t.tick(14 * 60, 1)).toBe(false);
    expect(t.tick(60, 2)).toBe(true);
    expect(t.tick(1, 3)).toBe(false);
    expect(t.timeUp).toBe(true);
  });

  test('stays asleep after the game is closed and opened again, until a grown-up wakes it', () => {
    const s = memory();
    const t = new PlayTimer(s, 0);
    t.setLimit(20);
    t.tick(20 * 60, 1000);
    t.sleep();
    const again = new PlayTimer(s, 1000 + 2 * FRESH_AFTER_MS);
    expect(again.asleep).toBe(true);
    again.wake();
    expect(again.asleep).toBe(false);
    expect(again.played).toBe(0);
  });

  test('remembers play time across a reload, but starts fresh after a long break', () => {
    const s = memory();
    const t = new PlayTimer(s, 0);
    t.setLimit(30);
    t.tick(10 * 60, 1000);
    expect(new PlayTimer(s, 2000).played).toBe(600);
    expect(new PlayTimer(s, 2000 + FRESH_AFTER_MS + 1).played).toBe(0);
  });

  test('changing the limit starts the time again, and odd limits are ignored', () => {
    const t = new PlayTimer(memory(), 0);
    t.setLimit(15);
    t.tick(600, 1);
    t.setLimit(20);
    expect(t.played).toBe(0);
    t.setLimit(7);
    expect(t.limit).toBe(20);
  });

  test('ignores a broken saved value', () => {
    const s = memory();
    s.setItem(TIMER_KEY, '{nope');
    expect(new PlayTimer(s, 0).limit).toBe(0);
    s.setItem(TIMER_KEY, JSON.stringify({ limit: 999, played: -5, asleep: 'yes' }));
    const t = new PlayTimer(s, 0);
    expect([t.limit, t.played, t.asleep]).toEqual([0, 0, false]);
  });
});
