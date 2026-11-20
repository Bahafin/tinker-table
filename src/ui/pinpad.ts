// The grown-ups' number pad: check the PIN, set a new one, or reset a forgotten one.
// It has words and digits, because it's for grown-ups.

import { grownUpSum, Pin, PIN_LEN } from './pin';
import { sfx } from './audio';

interface Step {
  title: string;
  sub?: string;
  /** Submit by itself once this many digits are typed. Without it, an OK key submits. */
  len?: number;
  /** Most digits for an OK-key answer. */
  max?: number;
  forgot?: boolean;
  /** Shake and say this under the title (a wrong try). */
  error?: string;
  /** The pad rests this long before it takes digits again. */
  restMs?: number;
}
/** The digits typed, null when closed, 'forgot' for the forgotten-PIN link. */
type Answer = string | null | 'forgot';

let root: HTMLElement | null = null;

function build(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pinpad-wrap hidden';
  el.innerHTML = `
    <div class="pinpad" role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <button class="pin-close icon" aria-label="Close">
        <svg viewBox="0 0 48 48"><path d="M14 14l20 20M34 14 14 34" /></svg>
      </button>
      <h3 id="pin-title"></h3>
      <p class="pin-sub"></p>
      <div class="pin-show" aria-live="polite"></div>
      <div class="pin-keys">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
        <button data-k="ok" class="pin-ok" aria-label="OK">OK</button>
        <button data-k="0">0</button>
        <button data-k="del" aria-label="Delete">
          <svg viewBox="0 0 48 48"><path d="M18 12h22v24H18L7 24z" /><path d="M24 19l10 10M34 19 24 29" /></svg>
        </button>
      </div>
      <button class="pin-forgot">Forgot the PIN?</button>
    </div>`;
  document.body.append(el);
  return el;
}

function step(s: Step): Promise<Answer> {
  root ??= build();
  const el = root;
  const q = <T extends HTMLElement>(sel: string) => el.querySelector(sel) as T;
  const box = q<HTMLElement>('.pinpad');
  let typed = '';
  let resting = false;
  q('#pin-title').textContent = s.title;
  const sub = q<HTMLElement>('.pin-sub');
  sub.textContent = s.error ?? s.sub ?? '';
  sub.classList.toggle('err', !!s.error);
  q('.pin-ok').classList.toggle('hidden', !!s.len);
  q('.pin-forgot').classList.toggle('hidden', !s.forgot);
  const show = q<HTMLElement>('.pin-show');
  const paint = () => {
    show.innerHTML = s.len
      ? Array.from({ length: s.len }, (_, i) => `<i class="${i < typed.length ? 'on' : ''}"></i>`).join('')
      : `<span class="pin-num">${typed || '&nbsp;'}</span>`;
  };
  paint();
  el.classList.remove('hidden');
  if (s.error) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); }

  return new Promise((resolve) => {
    let timer = 0;
    const keys = [...el.querySelectorAll<HTMLButtonElement>('.pin-keys button')];
    const setRest = (on: boolean) => {
      resting = on;
      keys.forEach((k) => { k.disabled = on; });
    };
    setRest(false); // a rest from the step before doesn't carry over (the forgotten-PIN sum)
    if (s.restMs && s.restMs > 0) {
      setRest(true);
      const until = Date.now() + s.restMs;
      const tick = () => {
        const left = Math.ceil((until - Date.now()) / 1000);
        if (left <= 0) { setRest(false); sub.textContent = s.sub ?? ''; sub.classList.remove('err'); return; }
        sub.textContent = `Too many tries. Try again in ${left} s.`;
        sub.classList.add('err');
        timer = window.setTimeout(tick, 250);
      };
      tick();
    }
    const done = (a: Answer) => {
      clearTimeout(timer);
      el.onclick = null;
      document.removeEventListener('keydown', onKey, true);
      resolve(a);
    };
    const press = (k: string) => {
      if (resting) return;
      if (k === 'del') { typed = typed.slice(0, -1); paint(); return; }
      if (k === 'ok') { if (typed) done(typed); return; }
      if (s.len ? typed.length >= s.len : typed.length >= (s.max ?? 3)) return;
      typed += k;
      sfx.place();
      paint();
      // Show the last dot for a moment before it's checked.
      if (s.len && typed.length === s.len) { resting = true; setTimeout(() => done(typed), 180); }
    };
    el.onclick = (e) => {
      const t = (e.target as HTMLElement).closest('button');
      if (!t) return;
      if (t.classList.contains('pin-close')) return done(null);
      if (t.classList.contains('pin-forgot')) return done('forgot');
      if (t.dataset.k) press(t.dataset.k);
    };
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
      else if (e.key === 'Escape') done(null);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener('keydown', onKey, true);
  });
}

function close() { root?.classList.add('hidden'); }

/** Ask for the PIN. Resolves true once it's right (or there is none), false if closed. */
export async function askPin(pin: Pin, title = 'Grown-ups only'): Promise<boolean> {
  if (!pin.isSet) return true;
  let error: string | undefined;
  for (;;) {
    const a = await step({ title, sub: 'Type your 4-digit PIN.', len: PIN_LEN, forgot: true, error, restMs: pin.restLeft() });
    if (a === null) { close(); return false; }
    if (a === 'forgot') {
      const ok = await resetPin(pin);
      close();
      return ok;
    }
    const r = pin.check(a);
    if (r === 'ok') { close(); return true; }
    error = r === 'wrong' ? 'That isn\'t the PIN. Try again.' : undefined;
    if (r === 'resting') sfx.nope();
  }
}

/** Choose a new PIN: type it twice. Resolves true when it's set. */
export async function newPin(pin: Pin, title = 'Choose a PIN'): Promise<boolean> {
  let error: string | undefined;
  for (;;) {
    const first = await step({ title, sub: 'Four digits your child doesn\'t know.', len: PIN_LEN, error });
    if (first === null || first === 'forgot') { close(); return false; }
    const again = await step({ title: 'Type it again', sub: 'Just to be sure.', len: PIN_LEN });
    if (again === null || again === 'forgot') { close(); return false; }
    if (again === first) {
      pin.set(first);
      sfx.chime();
      close();
      return true;
    }
    error = 'Those didn\'t match. Start again.';
  }
}

/** Forgotten PIN: a sum in words, then a new PIN. */
async function resetPin(pin: Pin): Promise<boolean> {
  const sum = grownUpSum();
  let error: string | undefined;
  for (;;) {
    const a = await step({ title: 'Forgot the PIN?', sub: `To choose a new one, what is ${sum.words}?`, max: 3, error });
    if (a === null || a === 'forgot') return false;
    if (Number(a) === sum.answer) return newPin(pin, 'Choose a new PIN');
    error = `Not quite. What is ${sum.words}?`;
  }
}
