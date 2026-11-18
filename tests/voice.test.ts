import { describe, expect, it } from 'vitest';
import { scoreVoice } from '../src/ui/audio';

const v = (name: string, lang = 'en-US', localService = true) =>
  ({ name, lang, localService, default: false, voiceURI: name }) as SpeechSynthesisVoice;

const best = (voices: SpeechSynthesisVoice[], userLang = 'en-US') =>
  [...voices].sort((a, b) => scoreVoice(b, userLang) - scoreVoice(a, userLang))[0].name;

describe('voice choice', () => {
  it('iPad: prefers a downloaded Premium voice, never a novelty one', () => {
    expect(best([v('Albert'), v('Samantha'), v('Fred'), v('Ava (Premium)'), v('Zarvox'), v('Thomas', 'fr-FR')])).toBe('Ava (Premium)');
    expect(best([v('Samantha'), v('Bad News'), v('Karen', 'en-AU'), v('Eddy (English (US))')])).toBe('Samantha');
  });

  it('Windows Edge: prefers a Natural voice over the old desktop ones', () => {
    expect(best([
      v('Microsoft David - English (United States)'),
      v('Microsoft Zira - English (United States)'),
      v('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false),
    ])).toMatch(/Natural/);
  });

  it('Chrome: prefers Google voices, and the user\'s own English', () => {
    expect(best([v('Microsoft David - English (United States)'), v('Google US English', 'en-US', false), v('Google UK English Female', 'en-GB', false)], 'en-GB'))
      .toBe('Google UK English Female');
  });

  it('never picks a non-English voice when an English one exists', () => {
    expect(best([v('Amélie (Premium)', 'fr-CA'), v('Daniel', 'en-GB')])).toBe('Daniel');
  });

  it('a voice named Florence is not mistaken for Flo', () => {
    expect(scoreVoice(v('Florence'))).toBeGreaterThan(0);
  });
});
