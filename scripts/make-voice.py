# Records every line the game says with Kokoro (an open-source neural voice, Apache 2.0, free
# to use in a paid app) and writes public/voice/<id>.mp3 plus src/ui/voice-clips.json.
# Runs in GitHub Actions (.github/workflows/voice.yml); see docs/app.md, "The voice".
#   python scripts/make-voice.py <lines.json> [--voice af_heart] [--speed 0.92] [--samples DIR]
# A clip's id comes from its text, the voice and the speed, so only new or changed lines are
# recorded again, and clips nobody says any more are removed.
import argparse, hashlib, json, os, re, subprocess, tempfile

import numpy as np
import soundfile as sf
from kokoro import KPipeline

ap = argparse.ArgumentParser()
ap.add_argument('lines')
ap.add_argument('--voice', default='af_heart')
ap.add_argument('--speed', type=float, default=0.92)
ap.add_argument('--samples', help='also write one line in several voices, and each hush, here to compare')
args = ap.parse_args()

OUT, MAP = 'public/voice', 'src/ui/voice-clips.json'
RATE = 24000

# Words the voice gets wrong, with how to say them. Kokoro's reader takes a word's sounds in
# IPA as [word](/sounds/). Only the recording changes; the game's text stays as it is.
SAY = []

# A line that starts with "Shh," gets a slow, soft hush of its own, a little pause, and then the
# rest of the line at the normal speed. Inside a sentence Kokoro says "shh" far too quickly.
HUSH_START = re.compile(r'^Shh+,\s*')
HUSH = 'slow'  # one of HUSHES; --samples records each, to compare
HUSHES = ['slow', 'slower', 'breath', 'breath-long']

def spoken(text):
    for pat, to in SAY:
        text = re.sub(pat, to, text)
    return text

os.makedirs(OUT, exist_ok=True)
pipes = {}

def synth(text, voice, speed):
    lang = voice[0]  # a = American English, b = British English
    pipe = pipes.setdefault(lang, KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M'))
    return np.concatenate([np.asarray(a, dtype=np.float32) for _, _, a in pipe(text, voice=voice, speed=speed)])

def envelope(n, rise, fall):
    """Fade in over `rise` seconds and out over `fall` seconds, gently (a cosine curve)."""
    env = np.ones(n, dtype=np.float32)
    a, b = min(n, int(RATE * rise)), min(n, int(RATE * fall))
    env[:a] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
    env[n - b:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b))
    return env

def breath_hush(seconds, seed=7):
    """A soft "shhh" like a parent's: noise shaped like the sound of sh (strongest near 3 kHz),
    swelling in and fading away slowly, with a slight waver so it sounds like breath."""
    n = int(RATE * seconds)
    spec = np.fft.rfft(np.random.default_rng(seed).standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / RATE)
    shape = np.exp(-0.5 * (np.log(np.maximum(f, 1) / 3000) / 0.45) ** 2)  # a wide hump at 3 kHz
    x = np.fft.irfft(spec * shape, n).astype(np.float32)
    t = np.arange(n) / RATE
    x *= 1 + 0.12 * np.sin(2 * np.pi * 3.1 * t)
    x *= envelope(n, seconds * 0.3, seconds * 0.55)
    return x / np.max(np.abs(x))

def hush(style, voice):
    if style in ('slow', 'slower'):
        sp, ipa = (0.6, '/ʃːːː/') if style == 'slow' else (0.45, '/ʃːːːːː/')
        x = synth(f'[Shh]({ipa})', voice, sp)
        x = x / np.max(np.abs(x)) * 0.55  # softer than the speech after it
        return x * envelope(len(x), 0.12, 0.35)
    return breath_hush(1.1 if style == 'breath' else 1.6) * 0.35

def say(text, voice, speed, style=None):
    m = HUSH_START.match(text)
    if not m:
        return synth(text, voice, speed)
    rest = synth(text[m.end():], voice, speed)
    gap = np.zeros(int(RATE * 0.35), dtype=np.float32)
    return np.concatenate([hush(style or HUSH, voice), gap, rest / np.max(np.abs(rest)) * 0.9])

def record(text, voice, speed, path, style=None):
    audio = say(text, voice, speed, style)
    pad = np.zeros(int(RATE * 0.08), dtype=np.float32)  # a breath of silence at both ends
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, 'x.wav')
        sf.write(wav, np.concatenate([pad, audio, pad]), RATE)
        # Mono MP3 plays everywhere (iOS, Android, every browser); loudness evened out.
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'loudnorm=I=-16:TP=-1.5',
                        '-ar', '24000', '-ac', '1', '-b:a', '48k', path], check=True)

lines = json.load(open(args.lines, encoding='utf-8'))
clips = {}
for text in lines:
    key = spoken(text) + (f'|hush={HUSH}' if HUSH_START.match(text) else '')
    cid = hashlib.sha1(f'{args.voice}|{args.speed}|{key}'.encode()).hexdigest()[:12]
    name = f'{cid}.mp3'
    path = os.path.join(OUT, name)
    if not os.path.exists(path):
        print('recording:', text)
        record(spoken(text), args.voice, args.speed, path)
    clips[text] = name
for f in os.listdir(OUT):
    if f.endswith('.mp3') and f not in clips.values():
        os.remove(os.path.join(OUT, f))
with open(MAP, 'w', encoding='utf-8', newline='\n') as fh:
    json.dump(dict(sorted(clips.items())), fh, indent=1, ensure_ascii=False)
    fh.write('\n')
print(f'{len(clips)} clips in {OUT}')

if args.samples:
    os.makedirs(args.samples, exist_ok=True)
    shh = next((t for t in lines if HUSH_START.match(t)), None)
    if shh:
        for style in HUSHES:
            record(shh, args.voice, args.speed, os.path.join(args.samples, f'hush-{style}.mp3'), style)
    print('samples in', args.samples)
