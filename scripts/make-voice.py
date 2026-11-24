# Records every line the game says with Kokoro (an open-source neural voice, Apache 2.0, free
# to use in a paid app) and writes public/voice/<id>.mp3 plus src/ui/voice-clips.json.
# Runs in GitHub Actions (.github/workflows/voice.yml); see docs/app.md, "The voice".
#   python scripts/make-voice.py <lines.json> [--voice af_heart] [--speed 0.92] [--samples DIR]
# A clip's id comes from its text, the voice and the speed, so only new or changed lines are
# recorded again, and clips nobody says any more are removed.
import argparse, hashlib, json, os, subprocess, tempfile

import numpy as np
import soundfile as sf
from kokoro import KPipeline

ap = argparse.ArgumentParser()
ap.add_argument('lines')
ap.add_argument('--voice', default='af_heart')
ap.add_argument('--speed', type=float, default=0.92)
ap.add_argument('--samples', help='also write one line in several voices here, to compare')
args = ap.parse_args()

OUT, MAP = 'public/voice', 'src/ui/voice-clips.json'
RATE = 24000
os.makedirs(OUT, exist_ok=True)
pipes = {}

def record(text, voice, speed, path):
    lang = voice[0]  # a = American English, b = British English
    pipe = pipes.setdefault(lang, KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M'))
    audio = np.concatenate([np.asarray(a) for _, _, a in pipe(text, voice=voice, speed=speed)])
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
    cid = hashlib.sha1(f'{args.voice}|{args.speed}|{text}'.encode()).hexdigest()[:12]
    name = f'{cid}.mp3'
    path = os.path.join(OUT, name)
    if not os.path.exists(path):
        print('recording:', text)
        record(text, args.voice, args.speed, path)
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
    line = lines[0]
    for v in ['af_heart', 'af_bella', 'af_nicole', 'af_sarah', 'bf_emma', 'bf_isabella', 'am_michael', 'bm_george']:
        record(line, v, args.speed, os.path.join(args.samples, f'{v}.mp3'))
    print('samples in', args.samples)
