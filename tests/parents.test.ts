import { describe, expect, it } from 'vitest';
import { LEVELS, TOY_BOX } from '../src/levels';
import { TALK } from '../src/parents/content';

describe('grown-ups talk cards', () => {
  for (const lv of [...LEVELS, TOY_BOX]) {
    it(`${lv.id} has a complete talk card`, () => {
      const t = TALK[lv.id];
      expect(t, `add a TALK entry for ${lv.id} in src/parents/content.ts`).toBeDefined();
      expect(t.idea.length).toBeGreaterThan(20);
      expect(t.before.length).toBeGreaterThan(0);
      expect(t.after.length).toBeGreaterThan(0);
      expect(t.words.length).toBeGreaterThan(0);
      expect(t.tryAtHome.length).toBeGreaterThan(20);
    });
  }
});
