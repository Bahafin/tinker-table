import { describe, expect, test } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { Placement } from '../src/sim/types';

/** The materials of every knock in a run, in order, without repeats. */
function knocks(parts: Placement[]) {
  const s = new Sim(parts);
  const mats: string[] = [];
  const notes: string[] = [];
  while (!s.settled) {
    s.step();
    for (const e of s.events) {
      if (e.type === 'clack' && mats[mats.length - 1] !== e.mat) mats.push(e.mat);
      if (e.type === 'note' || e.type === 'boing') notes.push(e.type);
    }
    s.events = [];
  }
  return { mats, notes };
}

describe('knock sounds', () => {
  test('a ball landing on a plank sounds wooden', () => {
    expect(knocks([{ part: 'ball', x: 5, y: 2 }, { part: 'ramp', x: 5, y: 6 }]).mats[0]).toBe('wood');
  });
  test('a heavy ball thuds, whatever it lands on', () => {
    expect(knocks([{ part: 'heavyball', x: 5, y: 2 }, { part: 'ramp', x: 5, y: 6 }]).mats[0]).toBe('heavy');
  });
  test('a ball on the bare table pats the table', () => {
    expect(knocks([{ part: 'ball', x: 5, y: 7 }]).mats[0]).toBe('table');
  });
  test('a ball on a pin rings like metal', () => {
    expect(knocks([{ part: 'ball', x: 5, y: 6 }, { part: 'pin', x: 5, y: 9.5 }]).mats[0]).toBe('metal');
  });
  test('the drum and the spring make their own sounds, not a knock', () => {
    const drum = knocks([{ part: 'ball', x: 5, y: 6 }, { part: 'drum', x: 5, y: 9.5 }]);
    expect(drum.notes[0]).toBe('note');
    const spring = knocks([{ part: 'ball', x: 5, y: 6 }, { part: 'spring', x: 5, y: 9.5 }]);
    expect(spring.notes[0]).toBe('boing');
    // Only the bare table (if the ball bounces off) may knock; never the drum or spring themselves.
    for (const m of [...drum.mats, ...spring.mats]) expect(m).toBe('table');
  });
});
