import { World, Body, Box, Circle, Polygon, RevoluteJoint, PulleyJoint, RopeJoint, Vec2, type Joint } from 'planck';
import type { Note, PartKind, Placement } from './types';

const DEG = Math.PI / 180;
/** Toy car wheel speed (rad/s) and motor strength. */
export const CAR_SPIN = 12;
export const CAR_TORQUE = 0.6;
/** How far the hammer can swing from upright (a little past flat). */
const HAMMER_SWING = 100 * DEG;
/** Length of the rope part, hook to ball centre. */
export const ROPE_LEN = 2.5;

/** A part as it exists inside a physics world. */
export interface RuntimePart {
  placement: Placement;
  kind: PartKind;
  bodies: Body[];
  /** Goal zone in the part's local frame (relative to bodies[0]). */
  zone?: { x0: number; y0: number; x1: number; y1: number };
  /** on: fan blowing / hamster awake. dir: +1 right, -1 left (conveyor, hamster). */
  /** load: toaster wait, watering can pour time, or drops a flower has drunk. drops: drops poured so far. */
  /** hit: when a musical part last played (performance.now ms; only for drawing it ring). */
  /** chute: a rocket that has burnt out and floats down on its parachute. */
  state: { on?: boolean; popped?: boolean; dir?: number; load?: number; drops?: number; hit?: number; hitAt?: number; chute?: boolean };
  /** The hammer's hinge, held still until something bumps the hammer. */
  brake?: RevoluteJoint;
  /** A rope part's rope, until the scissors cut it. */
  rope?: Joint;
}

export interface PartDef {
  /** Hit box half extents in cells (unrotated), centred on the placement point. */
  hit: { w: number; h: number; dy?: number };
  rotatable: boolean;
  /** Degrees per tap. 180 means a tap flips the part to face the other way. */
  rotStep?: number;
  build(world: World, p: Placement, rp: RuntimePart): void;
}

const ang = (p: Placement) => (p.rot ?? 0) * DEG;

function staticBody(world: World, p: Placement) {
  return world.createBody({ type: 'static', position: new Vec2(p.x, p.y), angle: ang(p) });
}

function plank(len: number): PartDef {
  return {
    hit: { w: len / 2, h: 0.35 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(len / 2, 0.125), { friction: 0.3 });
      rp.bodies.push(b);
    },
  };
}

function ball(r: number, density: number): PartDef {
  return {
    hit: { w: r, h: r },
    rotatable: false,
    build(world, p, rp) {
      const b = world.createBody({ type: 'dynamic', position: new Vec2(p.x, p.y), angularDamping: 0.1 });
      b.createFixture(new Circle(r), { density, friction: 0.4, restitution: 0.3 });
      rp.bodies.push(b);
    },
  };
}

export const PARTS: Record<PartKind, PartDef> = {
  ball: ball(0.35, 1),
  heavyball: ball(0.45, 4),
  ramp: plank(3),
  shortramp: plank(2),
  block: {
    hit: { w: 0.5, h: 0.5 },
    rotatable: false,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(0.5, 0.5), { friction: 0.5 });
      rp.bodies.push(b);
    },
  },
  basket: {
    hit: { w: 0.8, h: 0.6 },
    rotatable: false,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Box(0.8, 0.08, new Vec2(0, 0.52)), { friction: 0.8, restitution: 0 });
      b.createFixture(new Box(0.08, 0.6, new Vec2(-0.72, 0)), { friction: 0.8, restitution: 0 });
      b.createFixture(new Box(0.08, 0.6, new Vec2(0.72, 0)), { friction: 0.8, restitution: 0 });
      rp.bodies.push(b);
      rp.zone = { x0: -0.64, y0: -0.4, x1: 0.64, y1: 0.45 };
    },
  },
  star: {
    hit: { w: 0.5, h: 0.5 },
    rotatable: false,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Circle(0.5), { isSensor: true });
      rp.bodies.push(b);
      rp.zone = { x0: -0.7, y0: -0.7, x1: 0.7, y1: 0.7 };
    },
  },
  domino: {
    hit: { w: 0.3, h: 0.75 },
    rotatable: true,
    build(world, p, rp) {
      const b = world.createBody({ type: 'dynamic', position: new Vec2(p.x, p.y), angle: ang(p) });
      b.createFixture(new Box(0.125, 0.75), { density: 1, friction: 0.5, restitution: 0.05 });
      rp.bodies.push(b);
    },
  },
  seesaw: {
    // Placement point is the hinge on top of the pivot.
    hit: { w: 2, h: 0.5, dy: 0.35 },
    rotatable: true,
    build(world, p, rp) {
      const hinge = new Vec2(p.x, p.y);
      const pivot = world.createBody({ type: 'static', position: hinge });
      pivot.createFixture(new Polygon([new Vec2(0, 0.1), new Vec2(0.45, 0.9), new Vec2(-0.45, 0.9)]), { friction: 0.5 });
      const board = world.createBody({ type: 'dynamic', position: hinge, angle: ang(p) });
      board.createFixture(new Box(2, 0.1), { density: 1, friction: 0.6 });
      // Little lips at each end so a ball can sit in the end like a catapult cup.
      board.createFixture(new Box(0.06, 0.18, new Vec2(-1.94, -0.22)), { density: 1, friction: 0.6 });
      board.createFixture(new Box(0.06, 0.18, new Vec2(1.94, -0.22)), { density: 1, friction: 0.6 });
      world.createJoint(new RevoluteJoint({ enableLimit: true, lowerAngle: -30 * DEG - ang(p), upperAngle: 30 * DEG - ang(p) }, pivot, board, hinge));
      rp.bodies.push(board, pivot);
    },
  },
  balloon: {
    hit: { w: 0.45, h: 0.6 },
    rotatable: false,
    build(world, p, rp) {
      const b = world.createBody({ type: 'dynamic', position: new Vec2(p.x, p.y), linearDamping: 1.2, angularDamping: 2, gravityScale: -0.6 });
      b.createFixture(new Circle(0.45), { density: 0.3, friction: 0.2, restitution: 0.2 });
      rp.bodies.push(b);
    },
  },
  pin: {
    hit: { w: 0.3, h: 0.35 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Polygon([new Vec2(0, -0.35), new Vec2(0.12, 0.3), new Vec2(-0.12, 0.3)]), { friction: 0.3 });
      rp.bodies.push(b);
    },
  },
  fan: {
    hit: { w: 0.5, h: 0.5 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(0.45, 0.45), { friction: 0.4 });
      rp.bodies.push(b);
      rp.state.on = false;
    },
  },
  spring: {
    hit: { w: 0.7, h: 0.3 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(0.7, 0.15), { friction: 0.3, restitution: 1.05 });
      rp.bodies.push(b);
    },
  },
  pulley: {
    // Placement point is the middle; wheels sit 2 cells up, bucket left, weight right.
    hit: { w: 1.5, h: 2 },
    rotatable: false,
    build(world, p, rp) {
      const top = world.createBody({ type: 'static', position: new Vec2(p.x, p.y - 2.2) });
      // The top bar is only drawn, not solid, so balls can drop past it into the bucket.
      // A small stopper under the right wheel keeps the weight from rising through it.
      top.createFixture(new Box(0.3, 0.15, new Vec2(1, 0.45)), {});
      const bucket = world.createBody({ type: 'dynamic', position: new Vec2(p.x - 1, p.y), fixedRotation: true, linearDamping: 0.5 });
      bucket.createFixture(new Box(0.5, 0.06, new Vec2(0, 0.4)), { density: 1, friction: 0.8 });
      bucket.createFixture(new Box(0.06, 0.4, new Vec2(-0.47, 0)), { density: 1, friction: 0.8 });
      bucket.createFixture(new Box(0.06, 0.4, new Vec2(0.47, 0)), { density: 1, friction: 0.8 });
      const weight = world.createBody({ type: 'dynamic', position: new Vec2(p.x + 1, p.y), fixedRotation: true, linearDamping: 0.5 });
      // Same mass as the empty bucket so it hangs still until something lands in it.
      weight.createFixture(new Box(0.3, 0.3), { density: bucket.getMass() / 0.36, friction: 0.5 });
      world.createJoint(new PulleyJoint({}, bucket, weight,
        new Vec2(p.x - 1, p.y - 2), new Vec2(p.x + 1, p.y - 2),
        new Vec2(p.x - 1, p.y - 0.4), new Vec2(p.x + 1, p.y - 0.3), 1));
      rp.bodies.push(bucket, weight, top);
    },
  },
  hamster: {
    // A hamster asleep in a rolling ball. Bump it and it wakes and rolls the way it faces.
    hit: { w: 0.5, h: 0.5 },
    rotatable: true,
    rotStep: 180,
    build(world, p, rp) {
      const b = world.createBody({ type: 'dynamic', position: new Vec2(p.x, p.y) });
      b.createFixture(new Circle(0.5), { density: 0.8, friction: 0.9, restitution: 0.1 });
      rp.bodies.push(b);
      rp.state.on = false;
      rp.state.dir = Math.abs(p.rot ?? 0) === 180 ? -1 : 1;
    },
  },
  conveyor: {
    // A belt that carries things along its top. A tap flips which way it runs.
    hit: { w: 1.5, h: 0.35 },
    rotatable: true,
    rotStep: 180,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Box(1.5, 0.2), { friction: 0.9 });
      rp.bodies.push(b);
      rp.state.dir = Math.abs(p.rot ?? 0) === 180 ? -1 : 1;
    },
  },
  car: {
    // A wind-up toy truck. It drives the way it faces as soon as the machine starts,
    // pushes what's in front of it, and can carry a ball on its back.
    // Wheels reach 0.37 below the centre, so on the half-cell grid it sits on a plank like a ball does.
    hit: { w: 0.6, h: 0.4 },
    rotatable: true,
    rotStep: 180,
    build(world, p, rp) {
      const dir = Math.abs(p.rot ?? 0) === 180 ? -1 : 1;
      const c = world.createBody({ type: 'dynamic', position: new Vec2(p.x, p.y) });
      c.createFixture(new Box(0.55, 0.07, new Vec2(0, 0.02)), { density: 2, friction: 0.6 });
      // The cab at the front and a tailgate at the back hold a ball on the flat bed between them.
      c.createFixture(new Box(0.15, 0.15, new Vec2(0.4 * dir, -0.2)), { density: 1, friction: 0.5 });
      c.createFixture(new Box(0.04, 0.1, new Vec2(-0.51 * dir, -0.15)), { density: 1, friction: 0.5 });
      rp.bodies.push(c);
      for (const wx of [-0.42, 0.42]) {
        const w = world.createBody({ type: 'dynamic', position: new Vec2(p.x + wx, p.y + 0.15) });
        w.createFixture(new Circle(0.22), { density: 0.7, friction: 1, restitution: 0 });
        world.createJoint(new RevoluteJoint({ enableMotor: true, motorSpeed: CAR_SPIN * dir, maxMotorTorque: CAR_TORQUE }, c, w, w.getPosition()));
        rp.bodies.push(w);
      }
      rp.state.dir = dir;
      rp.state.on = true;
    },
  },
  hammer: {
    // A hammer standing up on a hinge. It stays put until something bumps it,
    // then swings down the way it faces and whacks whatever is in the way.
    // Placement point is the hinge, on top of a little wooden base.
    hit: { w: 0.4, h: 1.15, dy: -0.85 },
    rotatable: true,
    rotStep: 180,
    build(world, p, rp) {
      const dir = Math.abs(p.rot ?? 0) === 180 ? -1 : 1;
      const hinge = new Vec2(p.x, p.y);
      const base = world.createBody({ type: 'static', position: hinge });
      base.createFixture(new Box(0.35, 0.15, new Vec2(0, 0.15)), { friction: 0.5 });
      const h = world.createBody({ type: 'dynamic', position: hinge, angularDamping: 0.2 });
      h.createFixture(new Box(0.07, 0.7, new Vec2(0, -0.75)), { density: 1, friction: 0.5 });
      h.createFixture(new Box(0.38, 0.2, new Vec2(0, -1.6)), { density: 5, friction: 0.5, restitution: 0.1 });
      // Swings at most a little past flat, the way it faces.
      const lim = dir > 0 ? { lowerAngle: 0, upperAngle: HAMMER_SWING } : { lowerAngle: -HAMMER_SWING, upperAngle: 0 };
      rp.brake = world.createJoint(new RevoluteJoint({ enableLimit: true, ...lim, enableMotor: true, motorSpeed: 0, maxMotorTorque: 1000 }, base, h, hinge)) ?? undefined;
      rp.bodies.push(h, base);
      rp.state.dir = dir;
      rp.state.on = false;
    },
  },
  toaster: {
    // A toaster with one slot on top. Something that drops into the slot sits there
    // for a moment, then ding! it pops up about four cells, tossed a little the way
    // the toaster faces.
    hit: { w: 0.85, h: 0.5 },
    rotatable: true,
    rotStep: 180,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      const opts = { friction: 0.4, restitution: 0 };
      // A wide, shallow slot, so a ball dropped anywhere over the toaster lands inside.
      b.createFixture(new Box(0.125, 0.5, new Vec2(-0.725, 0)), opts);
      b.createFixture(new Box(0.125, 0.5, new Vec2(0.725, 0)), opts);
      b.createFixture(new Box(0.6, 0.275, new Vec2(0, 0.225)), opts);
      rp.bodies.push(b);
      rp.state.dir = Math.abs(p.rot ?? 0) === 180 ? -1 : 1;
      rp.state.load = 0;
    },
  },
  can: {
    // A watering can. Bump it and it tips toward its spout and pours a stream of
    // water drops (extra bodies added to this part as they're poured).
    hit: { w: 0.85, h: 0.5 },
    rotatable: true,
    rotStep: 180,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Box(0.42, 0.45, new Vec2(-0.03 * (Math.abs(p.rot ?? 0) === 180 ? -1 : 1), 0)), { friction: 0.4 });
      rp.bodies.push(b);
      rp.state.dir = Math.abs(p.rot ?? 0) === 180 ? -1 : 1;
      rp.state.on = false;
      rp.state.load = 0;
      rp.state.drops = 0;
    },
  },
  flower: {
    // A flower in a pot. Water drops that reach it soak in; enough of them and it blooms.
    hit: { w: 0.5, h: 0.6 },
    rotatable: false,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Box(0.45, 0.6), { isSensor: true });
      rp.bodies.push(b);
      rp.state.load = 0;
    },
  },
  rope: {
    // A ball hanging on a rope from a hook. Turned, the ball starts raised to one
    // side and swings when the machine starts. Placement point is the hook.
    hit: { w: 0.45, h: 1.6, dy: 1.25 },
    rotatable: true,
    build(world, p, rp) {
      const a = ang(p);
      const hook = world.createBody({ type: 'static', position: new Vec2(p.x, p.y) });
      hook.createFixture(new Circle(0.08), { isSensor: true });
      const ball = world.createBody({ type: 'dynamic', position: new Vec2(p.x - Math.sin(a) * ROPE_LEN, p.y + Math.cos(a) * ROPE_LEN), linearDamping: 0.3, angularDamping: 0.1 });
      ball.createFixture(new Circle(0.35), { density: 1, friction: 0.4, restitution: 0.3 });
      rp.rope = world.createJoint(new RopeJoint({ bodyA: hook, bodyB: ball, localAnchorA: new Vec2(0, 0), localAnchorB: new Vec2(0, 0), maxLength: ROPE_LEN })) ?? undefined;
      rp.bodies.push(hook, ball);
      rp.state.on = false;
    },
  },
  scissors: {
    // Open scissors. Any rope that touches the blades is cut, and balloons pop on them.
    hit: { w: 0.45, h: 0.3 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(0.4, 0.12), { isSensor: true });
      rp.bodies.push(b);
    },
  },
  soap: {
    // A bar of soap, as slippery as it gets: it slides down any slope and keeps going on the
    // flat. Land something on it and it squirts away the way it points (see Sim.onContact).
    hit: { w: 0.45, h: 0.25 },
    rotatable: true,
    rotStep: 180,
    build(world, p, rp) {
      const b = world.createBody({ type: 'dynamic', position: new Vec2(p.x, p.y), angularDamping: 0.5, linearDamping: 0.8 });
      b.createFixture(new Box(0.4, 0.18), { density: 1.5, friction: 0, restitution: 0.05 });
      rp.bodies.push(b);
      rp.state.dir = Math.abs(p.rot ?? 0) === 180 ? -1 : 1;
      rp.state.on = false;
    },
  },
  magnet: {
    // A horseshoe magnet, always on. It pulls little balls in front of it and holds them (see Sim.applyMagnets).
    hit: { w: 0.5, h: 0.5 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(0.4, 0.45), { friction: 0.6, restitution: 0 });
      rp.bodies.push(b);
    },
  },
  pillow: {
    // A soft pillow: whatever lands on it stops dead, with no bounce at all (see Sim.onPreSolve).
    hit: { w: 0.85, h: 0.3 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(0.8, 0.22), { friction: 0.9, restitution: 0 });
      rp.bodies.push(b);
    },
  },
  rocket: {
    // A toy rocket on its launch stand. Bump it and it blasts off the way it points, then
    // floats down on a parachute (see Sim.applyRockets). The placement point is the middle of
    // the whole thing; the stand's foot is half a cell below it, so it stands on the grid.
    hit: { w: 0.4, h: 0.5 },
    rotatable: true,
    build(world, p, rp) {
      const stand = staticBody(world, p);
      stand.createFixture(new Box(0.36, 0.08, new Vec2(0, 0.42)), { friction: 0.5 });
      stand.createFixture(new Box(0.04, 0.1, new Vec2(-0.25, 0.24)), { friction: 0.1 });
      stand.createFixture(new Box(0.04, 0.1, new Vec2(0.25, 0.24)), { friction: 0.1 });
      const at = stand.getWorldPoint(new Vec2(0, -0.05));
      const r = world.createBody({ type: 'dynamic', position: at, angle: ang(p), fixedRotation: true });
      r.createFixture(new Box(0.18, 0.38), { density: 2, friction: 0.3, restitution: 0.1 });
      rp.bodies.push(r, stand);
      rp.state.on = false;
      rp.state.load = 0;
    },
  },
  cheese: {
    hit: { w: 0.5, h: 0.4 },
    rotatable: false,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Box(0.5, 0.35), { isSensor: true });
      rp.bodies.push(b);
      rp.zone = { x0: -0.9, y0: -0.8, x1: 0.9, y1: 0.8 };
    },
  },
  // Musical parts: each plays its note when something hits it (see Sim.onContact).
  'xylo-c': xylo(),
  'xylo-d': xylo(),
  'xylo-e': xylo(),
  'xylo-g': xylo(),
  'xylo-a': xylo(),
  bell: {
    // A bell hanging from a hook: rings when hit, and wakes a sleeping hamster nearby.
    hit: { w: 0.45, h: 0.5 },
    rotatable: false,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Polygon([new Vec2(-0.42, 0.4), new Vec2(0.42, 0.4), new Vec2(0.24, -0.3), new Vec2(-0.24, -0.3)]), { friction: 0.3, restitution: 0.4 });
      rp.bodies.push(b);
    },
  },
  drum: {
    // A drum: a bouncy skin on top, so whatever lands on it bounces up again with a boom.
    hit: { w: 0.6, h: 0.45 },
    rotatable: false,
    build(world, p, rp) {
      const b = staticBody(world, { ...p, rot: 0 });
      b.createFixture(new Box(0.6, 0.4), { friction: 0.4, restitution: 0.85 });
      rp.bodies.push(b);
    },
  },
};

/** A xylophone bar: a short plank that rings its note. Balls bounce a little off it. */
function xylo(): PartDef {
  return {
    hit: { w: 0.75, h: 0.3 },
    rotatable: true,
    build(world, p, rp) {
      const b = staticBody(world, p);
      b.createFixture(new Box(0.75, 0.1), { friction: 0.3, restitution: 0.35 });
      rp.bodies.push(b);
    },
  };
}

/** The note each musical part plays. */
export const NOTE_OF: Partial<Record<PartKind, Note>> = {
  'xylo-c': 'c', 'xylo-d': 'd', 'xylo-e': 'e', 'xylo-g': 'g', 'xylo-a': 'a', bell: 'bell', drum: 'drum',
};

export const ALL_PARTS: PartKind[] = [
  'ball', 'heavyball', 'ramp', 'shortramp', 'block', 'domino', 'seesaw',
  'balloon', 'pin', 'fan', 'spring', 'conveyor', 'hamster', 'car', 'hammer', 'toaster', 'can', 'rope', 'scissors', 'pulley', 'basket', 'star', 'cheese', 'flower',
  'xylo-c', 'xylo-d', 'xylo-e', 'xylo-g', 'xylo-a', 'bell', 'drum',
  'soap', 'magnet', 'pillow', 'rocket',
];

/** Parts offered in the toy box (goal-only parts like the star and cheese are left out). */
export const TOY_PARTS: PartKind[] = ALL_PARTS.filter((k) => k !== 'star' && k !== 'cheese');
