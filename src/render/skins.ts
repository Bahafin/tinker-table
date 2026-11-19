import type { RuntimePart } from '../sim/parts';
import type { PartKind } from '../sim/types';
import { PAPER, line, noShadow, paper, rrect, star, withBody, type Ctx } from './kit';

/**
 * Room looks. Each room redraws some parts as things that belong there (an apple in the
 * garden, a toolbox in the workshop). Only the drawing changes: the outline, size and
 * physics stay exactly the same, so a slope always looks like a slope and a target is
 * always an open container.
 */
type DrawFn = (ctx: Ctx, rp: RuntimePart, t: number) => void;

let current = '';
/** Pick the room whose look is used from now on ('' for the plain look). */
export function setSkin(room: string) { current = room; }
export function skinFor(kind: PartKind): DrawFn | undefined { return SKINS[current]?.[kind]; }

const TAU = Math.PI * 2;
const dot = (ctx: Ctx, x: number, y: number, r: number, fill: string) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); paper(ctx, fill); };

/** Each part gets a stable colour from a list, so a row of crayons isn't all one colour. */
const shade = new WeakMap<RuntimePart, number>();
let nextShade = 0;
const pick = <T>(rp: RuntimePart, list: T[]) => {
  if (!shade.has(rp)) shade.set(rp, nextShade++);
  return list[shade.get(rp)! % list.length];
};

export function balloonIn(fill: string, shine: string): DrawFn {
  return (ctx, rp, t) => {
    if (rp.state.popped) return;
    withBody(ctx, rp.bodies[0], () => {
      noShadow(ctx, () => {
        ctx.beginPath(); ctx.moveTo(0, 0.5);
        ctx.bezierCurveTo(0.15 * Math.sin(t * 3), 0.7, -0.15, 0.85, 0.05 * Math.sin(t * 2), 1.05);
        ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 0.025; ctx.stroke();
      });
      ctx.beginPath(); ctx.ellipse(0, 0, 0.42, 0.5, 0, 0, TAU); paper(ctx, fill);
      ctx.beginPath(); ctx.moveTo(-0.07, 0.56); ctx.lineTo(0.07, 0.56); ctx.lineTo(0, 0.46); paper(ctx, fill);
      noShadow(ctx, () => { ctx.beginPath(); ctx.ellipse(-0.15, -0.2, 0.07, 0.13, 0.5, 0, TAU); paper(ctx, shine); });
    });
  };
}

/** The target container's outline (same as the basket): open top, thin walls, a floor. */
function container(ctx: Ctx) {
  ctx.beginPath();
  ctx.moveTo(-0.8, -0.6); ctx.lineTo(-0.64, -0.6); ctx.lineTo(-0.6, 0.44); ctx.lineTo(0.6, 0.44);
  ctx.lineTo(0.64, -0.6); ctx.lineTo(0.8, -0.6); ctx.lineTo(0.74, 0.6); ctx.lineTo(-0.74, 0.6); ctx.closePath();
}
function targetIn(fill: string, deco: (ctx: Ctx, t: number) => void): DrawFn {
  return (ctx, rp, t) => withBody(ctx, rp.bodies[0], () => { container(ctx); paper(ctx, fill); noShadow(ctx, () => deco(ctx, t)); });
}

/** A flat board in place of the ramp plank (half-length hw, 0.25 thick). */
function boardIn(fill: string, deco: (ctx: Ctx, hw: number) => void, hw: number): DrawFn {
  return (ctx, rp) => withBody(ctx, rp.bodies[0], () => { rrect(ctx, -hw, -0.125, hw * 2, 0.25, 0.06); paper(ctx, fill); noShadow(ctx, () => deco(ctx, hw)); });
}
function boards(fill: string, deco: (ctx: Ctx, hw: number) => void) {
  return { ramp: boardIn(fill, deco, 1.5), shortramp: boardIn(fill, deco, 1) };
}

const body = (fn: (ctx: Ctx, rp: RuntimePart, t: number) => void): DrawFn => (ctx, rp, t) => withBody(ctx, rp.bodies[0], () => fn(ctx, rp, t));

/** A tall thin piece in the domino's outline (0.25 × 1.5). */
const tall = (ctx: Ctx, fill: string) => { rrect(ctx, -0.125, -0.75, 0.25, 1.5, 0.05); paper(ctx, fill); };

// ---------- Workshop: wood, screws, a toolbox, a gear ----------
const workshop: Partial<Record<PartKind, DrawFn>> = {
  ball: body((ctx) => {
    dot(ctx, 0, 0, 0.35, '#9aa3ab');
    noShadow(ctx, () => { dot(ctx, 0, 0, 0.24, '#b7bec4'); line(ctx, -0.16, 0.1, 0.1, -0.16, '#e6eaed', 0.05); });
  }),
  ...boards('#d2a36b', (ctx, hw) => {
    for (const y of [-0.04, 0.05]) {
      ctx.beginPath(); ctx.moveTo(-hw + 0.3, y);
      ctx.bezierCurveTo(-hw / 3, y - 0.04, hw / 3, y + 0.04, hw - 0.3, y);
      ctx.strokeStyle = '#a97a45'; ctx.lineWidth = 0.025; ctx.stroke();
    }
    for (const x of [-hw + 0.14, hw - 0.14]) dot(ctx, x, 0, 0.045, PAPER.grey);
  }),
  block: body((ctx) => {
    rrect(ctx, -0.5, -0.5, 1, 1, 0.06); paper(ctx, '#d2a36b');
    noShadow(ctx, () => {
      ctx.strokeStyle = '#a97a45'; ctx.lineWidth = 0.06;
      rrect(ctx, -0.42, -0.42, 0.84, 0.84, 0.04); ctx.stroke();
      line(ctx, -0.38, 0.38, 0.38, -0.38, '#a97a45', 0.06);
      for (const [x, y] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) dot(ctx, x, y, 0.04, PAPER.grey);
    });
  }),
  basket: targetIn('#d9483a', (ctx) => {
    rrect(ctx, -0.74, 0.44, 1.48, 0.16, 0.03); paper(ctx, '#b63a2f');
    for (const x of [-0.72, 0.72]) { rrect(ctx, x - 0.06, -0.3, 0.12, 0.16, 0.03); paper(ctx, PAPER.grey); }
    for (const x of [-0.35, 0.35]) dot(ctx, x, 0.52, 0.035, PAPER.grey);
  }),
  // A screw, point up, so it still pops balloons.
  pin: body((ctx) => {
    ctx.beginPath(); ctx.moveTo(0, -0.35); ctx.lineTo(0.08, -0.15); ctx.lineTo(0.08, 0.22); ctx.lineTo(-0.08, 0.22); ctx.lineTo(-0.08, -0.15); ctx.closePath();
    paper(ctx, PAPER.grey);
    noShadow(ctx, () => { for (let y = -0.14; y < 0.2; y += 0.09) line(ctx, -0.08, y + 0.03, 0.08, y, '#6f767b', 0.025); });
    ctx.beginPath(); ctx.ellipse(0, 0.28, 0.17, 0.08, 0, 0, TAU); paper(ctx, '#b7bec4');
    noShadow(ctx, () => line(ctx, -0.09, 0.28, 0.09, 0.28, '#6f767b', 0.03));
  }),
  domino: body((ctx) => {
    tall(ctx, '#e3bb85');
    noShadow(ctx, () => {
      line(ctx, -0.03, -0.65, 0.02, 0.65, '#bf9358', 0.02);
      for (const y of [-0.62, 0.62]) dot(ctx, 0, y, 0.035, PAPER.grey);
    });
  }),
  // The target star becomes a turning gear.
  star: body((ctx, _rp, t) => {
    ctx.rotate(t * 0.6);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * TAU, a1 = ((i + 1) / 16) * TAU;
      const r = i % 2 ? 0.42 : 0.55;
      ctx.arc(0, 0, r, a0, a1);
    }
    ctx.closePath(); paper(ctx, PAPER.mustard);
    noShadow(ctx, () => { dot(ctx, 0, 0, 0.24, '#f6d27a'); dot(ctx, 0, 0, 0.1, '#c9932a'); });
  }),
};

// ---------- Garden: apples, a branch, a flower pot, a flower ----------
const garden: Partial<Record<PartKind, DrawFn>> = {
  ball: body((ctx) => {
    dot(ctx, 0, 0.02, 0.34, '#d8402f');
    noShadow(ctx, () => {
      line(ctx, 0, -0.26, 0.03, -0.42, '#7a5230', 0.05);
      ctx.beginPath(); ctx.ellipse(0.13, -0.36, 0.11, 0.05, -0.5, 0, TAU); paper(ctx, PAPER.leaf);
      ctx.beginPath(); ctx.ellipse(-0.13, -0.08, 0.05, 0.1, 0.4, 0, TAU); paper(ctx, '#ef8a75');
    });
  }),
  heavyball: body((ctx) => {
    for (const [x, rx] of [[-0.2, 0.26], [0.2, 0.26], [0, 0.3]] as const) { ctx.beginPath(); ctx.ellipse(x, 0.03, rx, 0.42, 0, 0, TAU); paper(ctx, '#e8892e'); }
    noShadow(ctx, () => {
      for (const x of [-0.13, 0.13]) line(ctx, x, -0.3, x, 0.36, '#c96d1c', 0.03);
      line(ctx, 0, -0.38, 0.05, -0.52, '#6b8f3a', 0.08);
    });
  }),
  ...boards('#9a6a3e', (ctx, hw) => {
    for (let x = -hw + 0.35; x < hw - 0.2; x += 0.45) line(ctx, x, -0.08, x + 0.2, -0.06, '#76502c', 0.03);
    for (const x of [-hw + 0.06, hw - 0.06]) { ctx.beginPath(); ctx.ellipse(x, 0, 0.06, 0.11, 0, 0, TAU); paper(ctx, '#d4ad7c'); }
    ctx.beginPath(); ctx.ellipse(hw * 0.3, -0.2, 0.1, 0.05, -0.6, 0, TAU); paper(ctx, PAPER.leaf);
  }),
  block: body((ctx) => {
    rrect(ctx, -0.5, -0.5, 1, 1, 0.12); paper(ctx, '#e8c45c');
    noShadow(ctx, () => {
      for (const x of [-0.22, 0.22]) line(ctx, x, -0.5, x, 0.5, '#a9772f', 0.05);
      for (let k = 0; k < 9; k++) {
        const x = -0.4 + (k % 3) * 0.33 + (k * 0.07 % 0.1), y = -0.36 + Math.floor(k / 3) * 0.33;
        line(ctx, x, y, x + 0.12, y + 0.04, '#c9a23e', 0.025);
      }
    });
  }),
  basket: targetIn('#c8643c', (ctx) => {
    for (const x of [-0.84, 0.6]) { rrect(ctx, x, -0.64, 0.24, 0.14, 0.04); paper(ctx, '#d97a50'); }
    line(ctx, -0.7, 0.52, 0.7, 0.52, '#a54f2c', 0.03);
  }),
  // A little cactus: still sharp at the top.
  pin: body((ctx) => {
    ctx.beginPath(); ctx.moveTo(0, -0.35); ctx.quadraticCurveTo(0.14, -0.2, 0.12, 0.14); ctx.lineTo(-0.12, 0.14); ctx.quadraticCurveTo(-0.14, -0.2, 0, -0.35);
    paper(ctx, '#5f9e48');
    noShadow(ctx, () => { for (const y of [-0.1, 0.05]) { line(ctx, 0.1, y, 0.17, y - 0.03, '#f3efe2', 0.02); line(ctx, -0.1, y, -0.17, y - 0.03, '#f3efe2', 0.02); } });
    ctx.beginPath(); ctx.moveTo(-0.16, 0.14); ctx.lineTo(0.16, 0.14); ctx.lineTo(0.12, 0.42); ctx.lineTo(-0.12, 0.42); ctx.closePath(); paper(ctx, '#c8643c');
  }),
  // Fence pickets.
  domino: body((ctx) => {
    ctx.beginPath(); ctx.moveTo(-0.125, 0.75); ctx.lineTo(-0.125, -0.6); ctx.lineTo(0, -0.75); ctx.lineTo(0.125, -0.6); ctx.lineTo(0.125, 0.75); ctx.closePath();
    paper(ctx, '#f6f1e3');
    noShadow(ctx, () => { ctx.strokeStyle = '#b9a98a'; ctx.lineWidth = 0.03; ctx.stroke(); for (const y of [-0.35, 0.4]) dot(ctx, 0, y, 0.03, PAPER.grey); });
  }),
  // The target star becomes a nodding flower.
  star: body((ctx, _rp, t) => {
    ctx.rotate(Math.sin(t * 2) * 0.1);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; dot(ctx, Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.2, '#f29bb0'); }
    noShadow(ctx, () => { dot(ctx, 0, 0, 0.19, PAPER.mustard); dot(ctx, -0.05, -0.05, 0.06, '#f6d27a'); });
  }),
  balloon: balloonIn('#f2c94c', '#f8e39a'),
};

// ---------- Kitchen: oranges, a melon, a cutting board, a pot, a fork, cereal boxes, a cookie ----------
const kitchen: Partial<Record<PartKind, DrawFn>> = {
  ball: body((ctx) => {
    dot(ctx, 0, 0, 0.35, '#f08a24');
    noShadow(ctx, () => {
      for (const [x, y] of [[-0.15, 0.1], [0.12, 0.16], [0.05, -0.12], [-0.1, -0.18], [0.2, -0.02]]) dot(ctx, x, y, 0.022, '#d06f12');
      ctx.beginPath(); ctx.ellipse(0.08, -0.36, 0.1, 0.045, -0.4, 0, TAU); paper(ctx, PAPER.leaf);
    });
  }),
  heavyball: body((ctx) => {
    dot(ctx, 0, 0, 0.45, '#5f9e48');
    noShadow(ctx, () => {
      for (const x of [-0.28, -0.1, 0.1, 0.28]) {
        ctx.beginPath(); ctx.ellipse(x * 0.9, 0, 0.05, 0.43 - Math.abs(x) * 0.4, 0, 0, TAU); paper(ctx, '#3f7a30');
      }
    });
  }),
  ...boards('#e3c08e', (ctx, hw) => {
    dot(ctx, hw - 0.2, 0, 0.07, '#b88f5a');
    line(ctx, -hw + 0.15, 0.07, hw - 0.4, 0.07, '#cfa874', 0.02);
  }),
  // A slice of toast.
  block: body((ctx) => {
    ctx.beginPath(); ctx.moveTo(-0.5, 0.5); ctx.lineTo(-0.5, -0.2); ctx.bezierCurveTo(-0.62, -0.62, -0.1, -0.56, 0, -0.42);
    ctx.bezierCurveTo(0.1, -0.56, 0.62, -0.62, 0.5, -0.2); ctx.lineTo(0.5, 0.5); ctx.closePath(); paper(ctx, '#b9773a');
    noShadow(ctx, () => {
      ctx.beginPath(); ctx.moveTo(-0.4, 0.4); ctx.lineTo(-0.4, -0.18); ctx.bezierCurveTo(-0.48, -0.48, -0.08, -0.44, 0, -0.32);
      ctx.bezierCurveTo(0.08, -0.44, 0.48, -0.48, 0.4, -0.18); ctx.lineTo(0.4, 0.4); ctx.closePath(); paper(ctx, '#f0cf8f');
      rrect(ctx, -0.18, -0.02, 0.36, 0.22, 0.05); paper(ctx, '#f8e27a');
    });
  }),
  // A cooking pot with side handles.
  basket: targetIn('#9aa3ab', (ctx) => {
    for (const s of [-1, 1]) { rrect(ctx, s > 0 ? 0.78 : -0.96, -0.42, 0.18, 0.1, 0.04); paper(ctx, PAPER.ink); }
    line(ctx, -0.72, 0.5, 0.72, 0.5, '#7b848b', 0.04);
    for (const x of [-0.72, 0.72]) line(ctx, x, -0.56, x, 0.3, '#c3c9ce', 0.03);
  }),
  // A fork, tines up.
  pin: body((ctx) => {
    for (const x of [-0.08, 0, 0.08]) { ctx.beginPath(); ctx.moveTo(x - 0.025, -0.05); ctx.lineTo(x, -0.35); ctx.lineTo(x + 0.025, -0.05); paper(ctx, PAPER.grey); }
    rrect(ctx, -0.11, -0.08, 0.22, 0.1, 0.04); paper(ctx, PAPER.grey);
    rrect(ctx, -0.05, 0, 0.1, 0.42, 0.04); paper(ctx, PAPER.tomato);
  }),
  // Tall, thin cereal boxes.
  domino: body((ctx, rp) => {
    tall(ctx, pick(rp, ['#e9b23c', '#5aa2d6', '#e5583f', '#7cb45a']));
    noShadow(ctx, () => {
      rrect(ctx, -0.08, -0.5, 0.16, 0.5, 0.03); paper(ctx, '#fff6dc');
      dot(ctx, 0, -0.3, 0.05, PAPER.mustard); dot(ctx, 0, -0.15, 0.04, '#b9773a');
    });
  }),
  // A star cookie with sprinkles.
  star: body((ctx, _rp, t) => {
    ctx.rotate(Math.sin(t * 2) * 0.08);
    star(ctx, 0.55); paper(ctx, '#c98a4a');
    noShadow(ctx, () => {
      star(ctx, 0.38); paper(ctx, '#f29bb0');
      for (const [x, y, c] of [[-0.1, -0.08, PAPER.cream], [0.1, 0.05, PAPER.sky], [-0.02, 0.14, PAPER.mustard], [0.06, -0.15, PAPER.leaf]] as const) line(ctx, x, y, x + 0.06, y + 0.02, c, 0.04);
    });
  }),
  balloon: balloonIn('#f29bb0', '#f9cbd5'),
};

// ---------- Playroom: a beach ball, a bowling ball, toy track, blocks, a toy chest, crayons ----------
const playroom: Partial<Record<PartKind, DrawFn>> = {
  ball: body((ctx) => {
    const cols = ['#e5583f', '#fbf6ea', '#6db3e0', '#fbf6ea', '#e9b23c', '#fbf6ea'];
    cols.forEach((c, i) => {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 0.35, (i / 6) * TAU, ((i + 1) / 6) * TAU); ctx.closePath(); paper(ctx, c);
    });
    noShadow(ctx, () => dot(ctx, 0, 0, 0.07, PAPER.cream));
  }),
  heavyball: body((ctx) => {
    dot(ctx, 0, 0, 0.45, '#5b4a8b');
    noShadow(ctx, () => { for (const [x, y] of [[-0.1, -0.2], [0.08, -0.22], [-0.02, -0.05]]) dot(ctx, x, y, 0.06, '#2f2550'); });
  }),
  // Wooden toy train track.
  ...boards('#e4c393', (ctx, hw) => {
    for (const y of [-0.05, 0.05]) line(ctx, -hw + 0.08, y, hw - 0.08, y, '#b58c58', 0.035);
    for (const x of [-hw + 0.04, hw - 0.04]) { rrect(ctx, x - 0.04, -0.125, 0.08, 0.25, 0.02); paper(ctx, PAPER.tomato); }
  }),
  // A toy block with a heart on it.
  block: body((ctx, rp) => {
    const [fill, edge] = pick(rp, [['#e5583f', '#b9402c'], ['#5aa2d6', '#3f80b0'], ['#7cb45a', '#5a8f3c'], ['#e9b23c', '#c9932a']]);
    rrect(ctx, -0.5, -0.5, 1, 1, 0.1); paper(ctx, fill);
    noShadow(ctx, () => {
      rrect(ctx, -0.36, -0.36, 0.72, 0.72, 0.08); paper(ctx, PAPER.cream);
      ctx.beginPath(); ctx.moveTo(0, 0.2); ctx.bezierCurveTo(-0.32, -0.02, -0.18, -0.3, 0, -0.12); ctx.bezierCurveTo(0.18, -0.3, 0.32, -0.02, 0, 0.2); paper(ctx, edge);
    });
  }),
  // A toy chest.
  basket: targetIn('#5aa2d6', (ctx) => {
    rrect(ctx, -0.74, 0.44, 1.48, 0.16, 0.03); paper(ctx, PAPER.mustard);
    for (const x of [-0.72, 0.72]) { rrect(ctx, x - 0.08, -0.6, 0.16, 0.12, 0.03); paper(ctx, PAPER.mustard); }
    for (const x of [-0.4, 0, 0.4]) { ctx.save(); ctx.translate(x, 0.52); star(ctx, 0.06); paper(ctx, PAPER.tomato); ctx.restore(); }
  }),
  // A drawing pin.
  pin: body((ctx) => {
    ctx.beginPath(); ctx.moveTo(0, -0.35); ctx.lineTo(0.035, 0.05); ctx.lineTo(-0.035, 0.05); ctx.closePath(); paper(ctx, PAPER.grey);
    rrect(ctx, -0.07, 0.04, 0.14, 0.16, 0.04); paper(ctx, PAPER.teal);
    ctx.beginPath(); ctx.ellipse(0, 0.26, 0.17, 0.07, 0, 0, TAU); paper(ctx, PAPER.teal);
  }),
  // Crayons.
  domino: body((ctx, rp) => {
    const [fill, dark] = pick(rp, [['#e5583f', '#b9402c'], ['#5aa2d6', '#3f80b0'], ['#7cb45a', '#5a8f3c'], ['#e9b23c', '#c9932a'], ['#9a7bc9', '#6f55a0']]);
    ctx.beginPath(); ctx.moveTo(-0.125, 0.75); ctx.lineTo(-0.125, -0.5); ctx.lineTo(-0.04, -0.72); ctx.lineTo(0.04, -0.72); ctx.lineTo(0.125, -0.5); ctx.lineTo(0.125, 0.75); ctx.closePath();
    paper(ctx, fill);
    noShadow(ctx, () => {
      rrect(ctx, -0.125, -0.3, 0.25, 0.7, 0.02); paper(ctx, dark);
      rrect(ctx, -0.09, -0.22, 0.18, 0.54, 0.02); paper(ctx, '#fbf6ea');
      line(ctx, -0.04, -0.05, 0.04, 0.12, dark, 0.04);
    });
  }),
  balloon: balloonIn('#5aa2d6', '#a9d3f0'),
};

// ---------- Attic: marbles, a globe, old floorboards, boxes, a trunk, a needle, books, the moon ----------
const attic: Partial<Record<PartKind, DrawFn>> = {
  ball: body((ctx) => {
    dot(ctx, 0, 0, 0.35, 'rgba(109, 179, 224, 0.92)');
    noShadow(ctx, () => {
      ctx.beginPath(); ctx.moveTo(-0.25, 0.1); ctx.bezierCurveTo(-0.1, -0.25, 0.1, 0.25, 0.25, -0.1);
      ctx.strokeStyle = '#e5583f'; ctx.lineWidth = 0.07; ctx.lineCap = 'round'; ctx.stroke();
      dot(ctx, -0.12, -0.14, 0.06, 'rgba(255,255,255,0.8)');
    });
  }),
  heavyball: body((ctx) => {
    dot(ctx, 0, 0, 0.45, '#5aa2d6');
    noShadow(ctx, () => {
      ctx.beginPath(); ctx.ellipse(-0.12, -0.12, 0.16, 0.2, 0.4, 0, TAU); paper(ctx, PAPER.leaf);
      ctx.beginPath(); ctx.ellipse(0.18, 0.16, 0.13, 0.1, -0.3, 0, TAU); paper(ctx, PAPER.leaf);
      line(ctx, -0.44, 0, 0.44, 0, 'rgba(255,255,255,0.45)', 0.025);
    });
  }),
  ...boards('#8e7a66', (ctx, hw) => {
    line(ctx, -hw + 0.2, -0.04, hw - 0.2, -0.04, '#6e5c4b', 0.025);
    ctx.beginPath(); ctx.ellipse(-hw * 0.35, 0.03, 0.09, 0.05, 0, 0, TAU); ctx.strokeStyle = '#6e5c4b'; ctx.lineWidth = 0.025; ctx.stroke();
    for (const x of [-hw + 0.12, hw - 0.12]) dot(ctx, x, 0, 0.04, '#5a5f63');
  }),
  // A taped cardboard box.
  block: body((ctx) => {
    rrect(ctx, -0.5, -0.5, 1, 1, 0.05); paper(ctx, PAPER.kraft);
    noShadow(ctx, () => {
      line(ctx, -0.5, -0.2, 0.5, -0.2, PAPER.kraftDark, 0.03);
      rrect(ctx, -0.1, -0.5, 0.2, 0.42, 0.01); paper(ctx, '#e9d7a8');
    });
  }),
  // An old trunk with brass bands.
  basket: targetIn('#7a5236', (ctx) => {
    for (const x of [-0.72, 0.72]) for (const y of [-0.45, 0.1]) { rrect(ctx, x - 0.1, y, 0.2, 0.08, 0.02); paper(ctx, PAPER.brass); }
    rrect(ctx, -0.74, 0.44, 1.48, 0.16, 0.03); paper(ctx, '#5e3e28');
    for (const x of [-0.5, 0.5]) { rrect(ctx, x - 0.05, 0.44, 0.1, 0.16, 0.02); paper(ctx, PAPER.brass); }
  }),
  // A sewing needle with a bit of thread.
  pin: body((ctx) => {
    ctx.beginPath(); ctx.moveTo(0, -0.35); ctx.lineTo(0.04, 0.3); ctx.lineTo(-0.04, 0.3); ctx.closePath(); paper(ctx, PAPER.grey);
    noShadow(ctx, () => {
      ctx.beginPath(); ctx.ellipse(0, 0.24, 0.015, 0.04, 0, 0, TAU); paper(ctx, PAPER.cream);
      ctx.beginPath(); ctx.moveTo(0, 0.24); ctx.bezierCurveTo(0.25, 0.2, 0.2, 0.45, -0.05, 0.4); ctx.bezierCurveTo(-0.2, 0.38, -0.2, 0.25, -0.12, 0.2);
      ctx.strokeStyle = PAPER.tomato; ctx.lineWidth = 0.03; ctx.stroke();
    });
  }),
  // Old books standing on end.
  domino: body((ctx, rp) => {
    tall(ctx, pick(rp, ['#8b3a3a', '#34406b', '#2f6f5e', '#7a5236']));
    noShadow(ctx, () => {
      for (const y of [-0.55, -0.45, 0.45, 0.55]) line(ctx, -0.1, y, 0.1, y, PAPER.brass, 0.025);
      rrect(ctx, -0.06, -0.2, 0.12, 0.3, 0.02); paper(ctx, 'rgba(255,240,200,0.5)');
    });
  }),
  // The target star becomes a crescent moon.
  star: body((ctx, _rp, t) => {
    ctx.rotate(Math.sin(t * 1.5) * 0.08);
    ctx.beginPath(); ctx.arc(0, 0, 0.5, 0.5, TAU - 0.5); ctx.arc(0.3, 0, 0.38, TAU - 1.3, 1.3, true); ctx.closePath();
    paper(ctx, PAPER.mustard);
    noShadow(ctx, () => { dot(ctx, -0.28, -0.1, 0.05, '#c9932a'); dot(ctx, -0.18, 0.2, 0.04, '#c9932a'); });
  }),
  balloon: balloonIn('#9a7bc9', '#cdbbe6'),
};

const SKINS: Record<string, Partial<Record<PartKind, DrawFn>>> = { workshop, garden, kitchen, playroom, attic };
