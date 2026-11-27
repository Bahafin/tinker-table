// Every sentence the game says out loud. Each one has a recorded clip in public/voice/ (made by
// scripts/make-voice.py, see docs/app.md, "The voice"), so the voice sounds the same, and good,
// on every device. A test fails when a line here has no clip yet.
import { LEVELS, MAKER_BOX, ROOMS, roomOf, roomVoice, TOY_BOX } from '../levels';
import { MADE_VOICE, SHARED_VOICE } from '../levels/share';
import { MAKER_SAY } from './maker-say';

export const SLEEPY_VOICE = 'Bumpity is sleepy. Time for a rest. Night night!';
/** The map's stops that aren't rooms (main.ts, showMap). */
export const EXTRA_STOPS = ['Toy box', 'Puzzle maker'];

export function voiceLines(): string[] {
  const lines = [
    ...LEVELS.map((lv, i) => roomVoice(roomOf(i)?.id, lv.voice)),
    TOY_BOX.voice, MAKER_BOX.voice, MADE_VOICE, SHARED_VOICE, SLEEPY_VOICE,
    ...ROOMS.map((r) => r.name), ...EXTRA_STOPS, ...Object.values(MAKER_SAY),
  ];
  return [...new Set(lines)];
}
