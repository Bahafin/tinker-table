// Starter machines for the puzzle maker: three easy Workshop levels with their answers already
// placed, so each one works. A child watches it run, then turns it into a puzzle (the star):
// the quickest way to learn what the maker does. Shown after the plus card in the maker room.
import type { Level, Placement } from '../sim/types';
import hamster from './06-hamster.json';
import roll from './01-roll.json';
import boing from './10-boing.json';

/** A level's parts as a plain machine: everything movable, no ids. */
const machine = (l: Level): Placement[] =>
  [...l.fixed, ...(l.solution ?? [])].map(({ id: _id, fixed: _f, ...p }) => p);

export const STARTERS: Placement[][] = [hamster, roll, boing].map((l) => machine(l as Level));
