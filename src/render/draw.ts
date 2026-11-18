import type { Body } from 'planck';
import type { RuntimePart } from '../sim/parts';

/** Flat paper colours. */
export const PAPER = {
  table: '#f4ecdc',
  dot: '#e2d6bf',
  tomato: '#e5583f',
  mustard: '#e9b23c',
  teal: '#2f9c95',
  sky: '#6db3e0',
  kraft: '#b98a5a',
  kraftDark: '#8f6640',
  navy: '#34406b',
  cream: '#fbf6ea',
  ink: '#3b2f2a',
  leaf: '#7cb45a',
  grey: '#9aa1a6',
  brass: '#c9a24a',
};

type Ctx = CanvasRenderingContext2D;

function withBody(ctx: Ctx, b: Body, fn: () => void) {
  const p = b.getPosition();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(b.getAngle());
  fn();
  ctx.restore();
}

function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function paper(ctx: Ctx, fill: string) {
  ctx.fillStyle = fill;
  ctx.fill();
}

function noShadow(ctx: Ctx, fn: () => void) {
  ctx.save();
  ctx.shadowColor = 'transparent';
  fn();
  ctx.restore();
}

function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string, w: number) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function plank(ctx: Ctx, hw: number) {
  rrect(ctx, -hw, -0.125, hw * 2, 0.25, 0.06);
  paper(ctx, PAPER.kraft);
  noShadow(ctx, () => {
    line(ctx, -hw + 0.15, 0, hw - 0.15, 0, PAPER.kraftDark, 0.03);
  });
}

function star(ctx: Ctx, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

const DRAW: Record<string, (ctx: Ctx, rp: RuntimePart, t: number) => void> = {
  ball(ctx, rp) {
    withBody(ctx, rp.bodies[0], () => {
      ctx.beginPath(); ctx.arc(0, 0, 0.35, 0, Math.PI * 2); paper(ctx, PAPER.tomato);
      noShadow(ctx, () => {
        ctx.beginPath(); ctx.arc(0, 0, 0.22, -0.6, 1.2); ctx.strokeStyle = PAPER.cream; ctx.lineWidth = 0.06; ctx.stroke();
      });
    });
  },
  heavyball(ctx, rp) {
    withBody(ctx, rp.bodies[0], () => {
      ctx.beginPath(); ctx.arc(0, 0, 0.45, 0, Math.PI * 2); paper(ctx, PAPER.navy);
      noShadow(ctx, () => {
        ctx.beginPath(); ctx.arc(-0.14, -0.14, 0.1, 0, Math.PI * 2); paper(ctx, '#5b6aa0');
        ctx.beginPath(); ctx.arc(0.12, 0.1, 0.05, 0, Math.PI * 2); paper(ctx, '#5b6aa0');
      });
    });
  },
  ramp(ctx, rp) { withBody(ctx, rp.bodies[0], () => plank(ctx, 1.5)); },
  shortramp(ctx, rp) { withBody(ctx, rp.bodies[0], () => plank(ctx, 1)); },
  block(ctx, rp) {
    withBody(ctx, rp.bodies[0], () => {
      rrect(ctx, -0.5, -0.5, 1, 1, 0.08); paper(ctx, PAPER.mustard);
      noShadow(ctx, () => {
        rrect(ctx, -0.32, -0.32, 0.64, 0.64, 0.05); ctx.strokeStyle = '#c9932a'; ctx.lineWidth = 0.04; ctx.stroke();
      });
    });
  },
  basket(ctx, rp) {
    withBody(ctx, rp.bodies[0], () => {
      ctx.beginPath();
      ctx.moveTo(-0.8, -0.6); ctx.lineTo(-0.64, -0.6); ctx.lineTo(-0.6, 0.44); ctx.lineTo(0.6, 0.44);
      ctx.lineTo(0.64, -0.6); ctx.lineTo(0.8, -0.6); ctx.lineTo(0.74, 0.6); ctx.lineTo(-0.74, 0.6); ctx.closePath();
      paper(ctx, PAPER.kraft);
      noShadow(ctx, () => {
        for (let y = -0.35; y < 0.6; y += 0.25) line(ctx, -0.74, y, -0.64, y, PAPER.kraftDark, 0.03);
        for (let y = -0.35; y < 0.6; y += 0.25) line(ctx, 0.64, y, 0.74, y, PAPER.kraftDark, 0.03);
        for (let x = -0.5; x <= 0.5; x += 0.25) line(ctx, x, 0.47, x, 0.57, PAPER.kraftDark, 0.03);
      });
    });
  },
  star(ctx, rp, t) {
    withBody(ctx, rp.bodies[0], () => {
      ctx.rotate(Math.sin(t * 2) * 0.08);
      ctx.scale(1 + Math.sin(t * 3) * 0.04, 1 + Math.sin(t * 3) * 0.04);
      star(ctx, 0.55); paper(ctx, PAPER.mustard);
      noShadow(ctx, () => { star(ctx, 0.3); paper(ctx, '#f6d27a'); });
    });
  },
  domino(ctx, rp) {
    withBody(ctx, rp.bodies[0], () => {
      rrect(ctx, -0.125, -0.75, 0.25, 1.5, 0.05); paper(ctx, PAPER.cream);
      noShadow(ctx, () => {
        ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 0.03; ctx.stroke();
        line(ctx, -0.08, 0, 0.08, 0, PAPER.ink, 0.025);
        for (const y of [-0.4, 0.4]) { ctx.beginPath(); ctx.arc(0, y, 0.045, 0, Math.PI * 2); paper(ctx, PAPER.ink); }
      });
    });
  },
  seesaw(ctx, rp) {
    withBody(ctx, rp.bodies[1], () => {
      ctx.beginPath(); ctx.moveTo(0, 0.05); ctx.lineTo(0.45, 0.9); ctx.lineTo(-0.45, 0.9); ctx.closePath(); paper(ctx, PAPER.teal);
    });
    withBody(ctx, rp.bodies[0], () => {
      rrect(ctx, -2, -0.1, 4, 0.2, 0.05); paper(ctx, PAPER.kraft);
      rrect(ctx, -2, -0.4, 0.12, 0.4, 0.04); paper(ctx, PAPER.kraftDark);
      rrect(ctx, 1.88, -0.4, 0.12, 0.4, 0.04); paper(ctx, PAPER.kraftDark);
      noShadow(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, 0.07, 0, Math.PI * 2); paper(ctx, PAPER.brass); });
    });
  },
  balloon(ctx, rp, t) {
    if (rp.state.popped) return;
    withBody(ctx, rp.bodies[0], () => {
      noShadow(ctx, () => {
        ctx.beginPath(); ctx.moveTo(0, 0.5);
        ctx.bezierCurveTo(0.15 * Math.sin(t * 3), 0.7, -0.15, 0.85, 0.05 * Math.sin(t * 2), 1.05);
        ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 0.025; ctx.stroke();
      });
      ctx.beginPath(); ctx.ellipse(0, 0, 0.42, 0.5, 0, 0, Math.PI * 2); paper(ctx, PAPER.tomato);
      ctx.beginPath(); ctx.moveTo(-0.07, 0.56); ctx.lineTo(0.07, 0.56); ctx.lineTo(0, 0.46); paper(ctx, PAPER.tomato);
      noShadow(ctx, () => { ctx.beginPath(); ctx.ellipse(-0.15, -0.2, 0.07, 0.13, 0.5, 0, Math.PI * 2); paper(ctx, '#f39a87'); });
    });
  },
  pin(ctx, rp) {
    withBody(ctx, rp.bodies[0], () => {
      ctx.beginPath(); ctx.moveTo(0, -0.35); ctx.lineTo(0.12, 0.3); ctx.lineTo(-0.12, 0.3); ctx.closePath(); paper(ctx, PAPER.grey);
      ctx.beginPath(); ctx.arc(0, 0.3, 0.14, 0, Math.PI * 2); paper(ctx, PAPER.tomato);
    });
  },
  fan(ctx, rp, t) {
    withBody(ctx, rp.bodies[0], () => {
      // Box fan seen from the front, with a little arrow nose showing which way it blows.
      ctx.beginPath(); ctx.moveTo(0.45, -0.18); ctx.lineTo(0.62, 0); ctx.lineTo(0.45, 0.18); ctx.closePath(); paper(ctx, PAPER.sky);
      rrect(ctx, -0.45, -0.45, 0.9, 0.9, 0.14); paper(ctx, PAPER.sky);
      noShadow(ctx, () => {
        ctx.beginPath(); ctx.arc(0, 0, 0.34, 0, Math.PI * 2); paper(ctx, PAPER.cream);
        ctx.save();
        ctx.rotate(rp.state.on ? t * 18 : 0.3);
        for (let i = 0; i < 3; i++) {
          ctx.rotate((Math.PI * 2) / 3);
          ctx.beginPath(); ctx.ellipse(0, -0.16, 0.08, 0.16, 0.35, 0, Math.PI * 2); paper(ctx, PAPER.sky);
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(0, 0, 0.06, 0, Math.PI * 2); paper(ctx, PAPER.ink);
        // Wind lines: faint when off, moving when on.
        const k = rp.state.on ? (t * 3) % 1 : 0;
        for (const y of [-0.28, 0, 0.28]) line(ctx, 0.75 + k * 0.6, y, 1.0 + k * 0.6, y, rp.state.on ? PAPER.sky : '#cfe3f0', 0.05);
      });
    });
  },
  spring(ctx, rp) {
    withBody(ctx, rp.bodies[0], () => {
      noShadow(ctx, () => {
        ctx.beginPath(); ctx.moveTo(-0.5, 0.15);
        for (let i = 0; i <= 8; i++) ctx.lineTo(-0.5 + i * 0.125, i % 2 ? 0.0 : 0.15);
        ctx.strokeStyle = PAPER.grey; ctx.lineWidth = 0.05; ctx.stroke();
      });
      rrect(ctx, -0.7, -0.15, 1.4, 0.13, 0.05); paper(ctx, PAPER.leaf);
      rrect(ctx, -0.7, 0.08, 1.4, 0.08, 0.03); paper(ctx, PAPER.kraftDark);
    });
  },
  pulley(ctx, rp) {
    const [bucket, weight, top] = rp.bodies;
    const tp = top.getPosition();
    const wa = { x: tp.x - 1, y: tp.y + 0.2 }, wb = { x: tp.x + 1, y: tp.y + 0.2 };
    const bp = bucket.getPosition(), wp = weight.getPosition();
    noShadow(ctx, () => {
      line(ctx, wa.x, wa.y, bp.x, bp.y - 0.4, PAPER.ink, 0.03);
      line(ctx, wb.x, wb.y, wp.x, wp.y - 0.3, PAPER.ink, 0.03);
      line(ctx, wa.x, wa.y - 0.2, wb.x, wb.y - 0.2, PAPER.ink, 0.03);
    });
    withBody(ctx, top, () => { rrect(ctx, -1.5, -0.1, 3, 0.2, 0.05); paper(ctx, PAPER.kraftDark); });
    for (const w of [wa, wb]) { ctx.beginPath(); ctx.arc(w.x, w.y, 0.2, 0, Math.PI * 2); paper(ctx, PAPER.grey); }
    withBody(ctx, bucket, () => {
      ctx.beginPath(); ctx.moveTo(-0.53, -0.4); ctx.lineTo(-0.41, -0.4); ctx.lineTo(-0.41, 0.34); ctx.lineTo(0.41, 0.34);
      ctx.lineTo(0.41, -0.4); ctx.lineTo(0.53, -0.4); ctx.lineTo(0.5, 0.46); ctx.lineTo(-0.5, 0.46); ctx.closePath();
      paper(ctx, PAPER.teal);
    });
    withBody(ctx, weight, () => { rrect(ctx, -0.3, -0.3, 0.6, 0.6, 0.08); paper(ctx, PAPER.navy); });
  },
  hamster(ctx, rp, t) {
    const b = rp.bodies[0];
    const awake = !!rp.state.on;
    // The ball rolls...
    withBody(ctx, b, () => {
      ctx.beginPath(); ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(214, 236, 246, 0.85)'; ctx.fill();
      noShadow(ctx, () => {
        ctx.lineWidth = 0.04; ctx.strokeStyle = PAPER.sky; ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 4);
          line(ctx, -0.46, 0, -0.38, 0, PAPER.sky, 0.04);
          line(ctx, 0.38, 0, 0.46, 0, PAPER.sky, 0.04);
        }
      });
    });
    // ...but the hamster inside stays upright and faces its way.
    const p = b.getPosition();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(rp.state.dir ?? 1, 1);
    noShadow(ctx, () => {
      const bob = awake ? Math.abs(Math.sin(t * 14)) * 0.04 : 0;
      ctx.translate(0, 0.08 - bob);
      if (awake) {
        for (const [lx, ph] of [[-0.12, 0], [0.12, Math.PI]] as const)
          line(ctx, lx, 0.15, lx + Math.sin(t * 14 + ph) * 0.08, 0.28, '#c47d3a', 0.06);
      }
      ctx.beginPath(); ctx.ellipse(0, 0, 0.28, 0.2, 0, 0, Math.PI * 2); paper(ctx, '#e39a52');
      ctx.beginPath(); ctx.ellipse(0.04, 0.06, 0.16, 0.1, 0, 0, Math.PI * 2); paper(ctx, PAPER.cream);
      ctx.beginPath(); ctx.ellipse(0.2, -0.1, 0.15, 0.13, 0, 0, Math.PI * 2); paper(ctx, '#e39a52');
      ctx.beginPath(); ctx.arc(0.13, -0.24, 0.06, 0, Math.PI * 2); paper(ctx, '#f2b8a2');
      ctx.beginPath(); ctx.arc(0.34, -0.09, 0.03, 0, Math.PI * 2); paper(ctx, PAPER.tomato);
      if (awake) { ctx.beginPath(); ctx.arc(0.24, -0.13, 0.03, 0, Math.PI * 2); paper(ctx, PAPER.ink); }
      else line(ctx, 0.2, -0.12, 0.28, -0.12, PAPER.ink, 0.025);
    });
    ctx.restore();
    if (!awake) {
      // Sleepy "z" squiggles drifting up.
      noShadow(ctx, () => {
        for (let i = 0; i < 2; i++) {
          const k = (t * 0.5 + i * 0.5) % 1;
          const s = 0.08 + k * 0.06;
          const zx = p.x + 0.4 + k * 0.3, zy = p.y - 0.55 - k * 0.6;
          ctx.globalAlpha = 1 - k;
          ctx.beginPath(); ctx.moveTo(zx - s, zy - s); ctx.lineTo(zx + s, zy - s); ctx.lineTo(zx - s, zy + s); ctx.lineTo(zx + s, zy + s);
          ctx.strokeStyle = PAPER.navy; ctx.lineWidth = 0.035; ctx.lineJoin = 'round'; ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
    }
  },
  conveyor(ctx, rp, t) {
    withBody(ctx, rp.bodies[0], () => {
      rrect(ctx, -1.5, -0.2, 3, 0.4, 0.2); paper(ctx, PAPER.ink);
      noShadow(ctx, () => {
        for (const x of [-1.3, -0.65, 0, 0.65, 1.3]) {
          ctx.beginPath(); ctx.arc(x, 0.02, 0.11, 0, Math.PI * 2); paper(ctx, PAPER.grey);
        }
        // Arrows along the belt show (and animate) which way it runs.
        const dir = rp.state.dir ?? 1;
        ctx.save();
        ctx.beginPath(); ctx.rect(-1.4, -0.2, 2.8, 0.14); ctx.clip();
        const off = ((t * 1.2) % 0.5) * dir;
        for (let x = -2; x <= 2; x += 0.5) {
          const cx = x + off;
          line(ctx, cx - 0.06 * dir, -0.19, cx + 0.05 * dir, -0.13, PAPER.mustard, 0.04);
          line(ctx, cx + 0.05 * dir, -0.13, cx - 0.06 * dir, -0.07, PAPER.mustard, 0.04);
        }
        ctx.restore();
      });
    });
  },
  cheese(ctx, rp, t) {
    withBody(ctx, rp.bodies[0], () => {
      ctx.rotate(Math.sin(t * 2) * 0.04);
      ctx.beginPath(); ctx.moveTo(-0.5, 0.32); ctx.lineTo(0.5, 0.32); ctx.lineTo(0.5, -0.1); ctx.lineTo(-0.5, -0.3); ctx.closePath();
      paper(ctx, '#f4c94a');
      noShadow(ctx, () => {
        ctx.beginPath(); ctx.moveTo(-0.5, -0.3); ctx.lineTo(0.5, -0.1); ctx.lineTo(0.5, 0); ctx.lineTo(-0.5, -0.2); ctx.closePath();
        paper(ctx, '#f8dc84');
        for (const [hx, hy, hr] of [[-0.2, 0.1, 0.08], [0.2, 0.15, 0.06], [0.05, -0.02, 0.05]]) {
          ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); paper(ctx, '#d9a92c');
        }
      });
    });
  },
};

export function drawPart(ctx: Ctx, rp: RuntimePart, t: number) {
  DRAW[rp.kind](ctx, rp, t);
}

/** Small brass pin shown on parts that came with the level and can't be moved. */
export function drawFixedPin(ctx: Ctx, rp: RuntimePart) {
  if (rp.state.popped || !rp.bodies.length) return;
  const p = rp.bodies[0].getPosition();
  noShadow(ctx, () => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 0.08, 0, Math.PI * 2); paper(ctx, PAPER.brass);
    ctx.beginPath(); ctx.arc(p.x - 0.02, p.y - 0.02, 0.03, 0, Math.PI * 2); paper(ctx, '#f3e1a4');
  });
}

export function setPaperShadow(ctx: Ctx, px: number) {
  ctx.shadowColor = 'rgba(80, 55, 30, 0.28)';
  ctx.shadowOffsetX = px;
  ctx.shadowOffsetY = px;
  ctx.shadowBlur = px;
}

export function drawTable(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = PAPER.table;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = PAPER.dot;
  for (let x = 0.5; x < w; x += 0.5) for (let y = 0.5; y < h; y += 0.5) ctx.fillRect(x - 0.025, y - 0.025, 0.05, 0.05);
}

let grain: HTMLCanvasElement | null = null;
/** A small tile of paper fibres, multiplied over the table to make it feel like paper. */
export function paperGrain(): HTMLCanvasElement {
  if (grain) return grain;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d')!;
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 236 + Math.random() * 19;
    img.data[i] = v;
    img.data[i + 1] = v - 2;
    img.data[i + 2] = v - 6;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.18;
  g.strokeStyle = '#a08060';
  g.lineWidth = 0.6;
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 160, y = Math.random() * 160, a = Math.random() * Math.PI, l = 3 + Math.random() * 9;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 1, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  grain = c;
  return c;
}
