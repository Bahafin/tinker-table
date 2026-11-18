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
      rrect(ctx, -0.45, -0.45, 0.9, 0.9, 0.12); paper(ctx, PAPER.sky);
      noShadow(ctx, () => {
        ctx.save();
        ctx.translate(0.1, 0);
        ctx.scale(0.45, 1); // blades seen from the side so the facing is obvious
        ctx.rotate(rp.state.on ? t * 20 : 0);
        for (let i = 0; i < 3; i++) {
          ctx.rotate((Math.PI * 2) / 3);
          ctx.beginPath(); ctx.ellipse(0, -0.2, 0.09, 0.2, 0, 0, Math.PI * 2); paper(ctx, PAPER.cream);
        }
        ctx.restore();
        // "wind" lines show which way it blows
        const k = rp.state.on ? (t * 3) % 1 : 0.3;
        for (const y of [-0.25, 0, 0.25]) line(ctx, 0.6 + k * 0.5, y, 0.85 + k * 0.5, y, rp.state.on ? PAPER.sky : '#bcd9ec', 0.05);
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
