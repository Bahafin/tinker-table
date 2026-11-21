// "Keep your child inside the game": how to lock the tablet to Bumpity with the
// device's own tools. An app can't stop the home swipe; Guided Access (iPad) and app
// pinning (Android) can, and leaving them needs the grown-up's passcode.

export type Platform = 'ipad' | 'android';

export function guessPlatform(ua = navigator.userAgent): Platform {
  return /Android/i.test(ua) ? 'android' : 'ipad';
}

// ---- small drawings, one per step (stroked, like the game's buttons) ----
const S = 'class="lock-pic" viewBox="0 0 160 100" aria-hidden="true"';
const TAB = '<rect x="18" y="14" width="124" height="78" rx="9" class="dev" /><rect x="26" y="22" width="108" height="62" rx="3" class="scr" />';
/** A settings list with one row switched on. */
const settingsRow = (label: string, extra = '') => `<svg ${S}>
  ${TAB}
  <rect x="34" y="30" width="92" height="12" rx="3" class="row" />
  <rect x="34" y="46" width="92" height="14" rx="3" class="row hl" /><text x="40" y="56">${label}</text>
  <rect x="104" y="49" width="16" height="8" rx="4" class="sw" /><circle cx="116" cy="53" r="3" class="knob" />
  <rect x="34" y="64" width="92" height="12" rx="3" class="row" />${extra}
</svg>`;
/** The tablet with its top button pressed three times. */
const tripleTop = (end = false) => `<svg ${S}>
  ${TAB}
  <rect x="112" y="9" width="20" height="5" rx="2" class="btn hl" />
  <path d="M110 6a8 8 0 0 0-3-4M134 6a8 8 0 0 1 3-4M106 9a14 14 0 0 0-5-6M138 9a14 14 0 0 1 5-6" class="tap" />
  <text x="44" y="11" class="big">3×</text>
  ${end
    ? '<g transform="translate(52 40)"><circle cx="0" cy="8" r="4" class="dot" /><circle cx="14" cy="8" r="4" class="dot" /><circle cx="28" cy="8" r="4" class="dot" /><circle cx="42" cy="8" r="4" class="dot" /><text x="4" y="32">passcode</text></g>'
    : '<text x="46" y="58">Bumpity</text>'}
</svg>`;
/** Guided Access's Start button, top right. */
const startBtn = `<svg ${S}>
  ${TAB}
  <rect x="30" y="26" width="30" height="10" rx="2" class="row" /><text x="33" y="34">Options</text>
  <rect x="100" y="26" width="30" height="10" rx="2" class="row hl" /><text x="106" y="34">Start</text>
  <rect x="38" y="44" width="84" height="34" rx="4" class="row" /><text x="56" y="64">Bumpity</text>
</svg>`;
/** Android's recent apps, with the pin item in an app's menu. */
const recents = `<svg ${S}>
  ${TAB}
  <rect x="34" y="34" width="44" height="44" rx="4" class="row" />
  <rect x="84" y="34" width="44" height="44" rx="4" class="row" />
  <circle cx="56" cy="29" r="4" class="dot" />
  <rect x="52" y="40" width="40" height="13" rx="3" class="row hl" /><text x="58" y="49">Pin</text>
</svg>`;
/** Leaving app pinning: hold, then the phone's own PIN. */
const unpin = `<svg ${S}>
  ${TAB}
  <path d="M58 80V58M51 65l7-7 7 7" class="tap" />
  <text x="40" y="44">hold</text>
  <g transform="translate(84 60)"><circle cx="0" cy="8" r="4" class="dot" /><circle cx="12" cy="8" r="4" class="dot" /><circle cx="24" cy="8" r="4" class="dot" /><circle cx="36" cy="8" r="4" class="dot" /><text x="-2" y="26">PIN</text></g>
</svg>`;

interface LockStep { pic: string; text: string }

const IPAD: LockStep[] = [
  { pic: settingsRow('Guided Access'), text: 'Open <b>Settings › Accessibility › Guided Access</b> and turn it on. Under <b>Passcode Settings</b>, set a Guided Access passcode your child doesn\'t know. You only do this once.' },
  { pic: tripleTop(), text: 'Open Bumpity, then press the <b>top button</b> three times quickly (on iPads with a Home button, press that three times).' },
  { pic: startBtn, text: 'Tap <b>Start</b> at the top right. The iPad now stays in the game: swiping home does nothing. <b>Options</b> has a time limit too, if you want one.' },
  { pic: tripleTop(true), text: 'To leave, press the top button three times again, type the passcode and tap <b>End</b>.' },
];

const ANDROID: LockStep[] = [
  { pic: settingsRow('App pinning'), text: 'Open <b>Settings › Security</b> (on some phones <b>Security › More security settings</b>) and turn on <b>App pinning</b> (also called screen pinning). Turn on <b>Ask for PIN before unpinning</b> too.' },
  { pic: recents, text: 'Open Bumpity, then open your recent apps. Tap the Bumpity icon at the top of its card and choose <b>Pin</b>.' },
  { pic: unpin, text: 'To leave, swipe up and hold (or, with buttons, touch and hold Back and Overview together), then type the tablet\'s own PIN.' },
];

const steps = (list: LockStep[]) =>
  `<ol class="lock-steps">${list.map((s, i) => `<li>${s.pic}<p><span class="n">${i + 1}</span>${s.text}</p></li>`).join('')}</ol>`;

/** The guide's body: a platform switch and both sets of steps (one shown at a time). */
export function lockGuideHtml(start: Platform): string {
  return `
    <div class="chips lock-tabs" role="tablist" aria-label="Which tablet">
      <button class="chip${start === 'ipad' ? ' on' : ''}" data-plat="ipad" role="tab">iPad</button>
      <button class="chip${start === 'android' ? ' on' : ''}" data-plat="android" role="tab">Android</button>
    </div>
    <div class="lock-plat${start === 'ipad' ? ' on' : ''}" data-plat="ipad">
      ${steps(IPAD)}
      <p class="note">Playing in Safari? Add the game to the Home Screen first (<b>Share › Add to Home Screen</b>) so it opens full screen, without the address bar.</p>
    </div>
    <div class="lock-plat${start === 'android' ? ' on' : ''}" data-plat="android">
      ${steps(ANDROID)}
      <p class="note">Menu names differ a little between makers. If you can't find it, search the Settings app for "pin".</p>
    </div>`;
}

/** Wire the iPad / Android switch inside a rendered guide. */
export function wireLockGuide(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('.lock-tabs .chip').forEach((b) => {
    b.onclick = () => {
      root.querySelectorAll('.lock-tabs .chip').forEach((c) => c.classList.toggle('on', c === b));
      root.querySelectorAll<HTMLElement>('.lock-plat').forEach((p) => p.classList.toggle('on', p.dataset.plat === b.dataset.plat));
    };
  });
}
