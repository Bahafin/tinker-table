import { describe, expect, it } from 'vitest';
import { grownUpSum, MAX_TRIES, Pin, PIN_KEY, REST_MS, scramble, type PinStore } from '../src/ui/pin';

function memStore(): PinStore & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
  };
}

describe('grown-ups PIN', () => {
  it('starts with no PIN, which lets everything through', () => {
    const pin = new Pin(memStore());
    expect(pin.isSet).toBe(false);
    expect(pin.check('0000')).toBe('ok');
  });

  it('accepts the right PIN and refuses a wrong one', () => {
    const pin = new Pin(memStore());
    pin.set('2468');
    expect(pin.isSet).toBe(true);
    expect(pin.check('1111')).toBe('wrong');
    expect(pin.check('2468')).toBe('ok');
  });

  it('never keeps the digits themselves', () => {
    const store = memStore();
    new Pin(store).set('2468');
    expect(store.data[PIN_KEY]).not.toContain('2468');
  });

  it('only takes 4 digits', () => {
    const pin = new Pin(memStore());
    expect(() => pin.set('123')).toThrow();
    expect(() => pin.set('12a4')).toThrow();
  });

  it('rests after too many wrong tries, even for the right PIN, then opens again', () => {
    let t = 1000;
    const pin = new Pin(memStore(), () => t);
    pin.set('2468');
    for (let i = 1; i < MAX_TRIES; i++) expect(pin.check('0000')).toBe('wrong');
    expect(pin.check('0000')).toBe('resting');
    expect(pin.check('2468')).toBe('resting');
    expect(pin.restLeft()).toBe(REST_MS);
    t += REST_MS;
    expect(pin.check('2468')).toBe('ok');
  });

  it('a right PIN resets the count of wrong tries', () => {
    const pin = new Pin(memStore());
    pin.set('2468');
    for (let i = 1; i < MAX_TRIES; i++) pin.check('0000');
    pin.check('2468');
    expect(pin.check('0000')).toBe('wrong');
  });

  it('can be turned off', () => {
    const pin = new Pin(memStore());
    pin.set('2468');
    pin.clear();
    expect(pin.isSet).toBe(false);
  });

  it('treats a broken saved value as no PIN', () => {
    const store = memStore();
    store.data[PIN_KEY] = '{oops';
    expect(new Pin(store).isSet).toBe(false);
  });

  it('salts the scramble', () => {
    expect(scramble('1234', 'a')).not.toBe(scramble('1234', 'b'));
    expect(scramble('1234', 'a')).toBe(scramble('1234', 'a'));
  });

  it('asks the forgotten-PIN sum in words, too hard for a young child', () => {
    for (let i = 0; i < 50; i++) {
      const s = grownUpSum();
      expect(s.words).toMatch(/^[a-z]+ times [a-z]+$/);
      expect(s.answer).toBeGreaterThanOrEqual(36);
    }
    expect(grownUpSum(() => 0.2)).toEqual({ words: 'seven times seven', answer: 49 });
  });
});
