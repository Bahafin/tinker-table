// Writes every line the game says to the file in $VOICE_LINES, for scripts/make-voice.py.
// `npm run voice:lines` (skipped in the normal test run).
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { voiceLines } from '../src/ui/voice-lines';

const out = process.env.VOICE_LINES;
test.skipIf(!out)('write the voice lines', () => {
  writeFileSync(out!, JSON.stringify(voiceLines(), null, 1) + '\n');
});
