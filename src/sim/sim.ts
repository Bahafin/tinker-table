import { World, Vec2, Edge, Body, Circle, type Contact } from 'planck';
import { NOTE_OF, PARTS, type RuntimePart } from './parts';
import { WORLD_H, WORLD_W, type Goal, type Material, type Note, type PartKind, type Placement, type SimEvent } from './types';

export const DT = 1 / 60;
const MAX_TIME = 25;
const GOAL_HOLD = 0.3;
const FAN_REACH = 4.5;
const FAN_FORCE = 14;
/** How far away (cells) a sleeping hamster can hear a balloon pop. */
export const HEAR_POP = 5;
/** A musical part only plays for a hit faster than this (cells/s), and not twice within NOTE_GAP s. */
const NOTE_SPEED = 0.8;
const NOTE_GAP = 0.15;
export const CONVEYOR_SPEED = 2.5;
const HAMSTER_SPIN = 5;
/** A released hammer's swing speed (rad/s) and strength. */
const HAMMER_SPEED = 7;
const HAMMER_TORQUE = 150;
/** Toaster: how long something sits in the slot before it pops, and the pop's speed. */
const TOAST_WAIT = 0.4;
const TOAST_UP = 9;
const TOAST_TOSS = 1.5;
/** Watering can: how long it takes to tip, how many drops it pours, one every few steps. */
export const CAN_TIP = 0.35;
const CAN_DROPS = 18;
const CAN_EVERY = 4;
/** Drops a flower needs before it blooms. */
export const WATER_NEEDED = 6;
/** The can tips this far (radians) to pour. */
export const CAN_TILT = Math.PI / 4;
/** How close a rope has to come to a point on the scissors' blades to be cut. */
const SNIP_REACH = 0.15;
/** After this long, a ball swinging on an uncut rope no longer keeps the run going. */
const SWING_GRACE = 6;
/** Magnet: how far from its face (cells) it pulls, and how hard. */
export const MAGNET_REACH = 4;
const MAGNET_FORCE = 28;
const MAGNET_GRAB = 1.1;
/** What a magnet pulls: the little balls (a ball on a rope too). The big ball is too heavy. */
const MAGNETIC = new Set<PartKind>(['ball', 'rope']);
/** A pillow keeps this much of the speed of whatever lands on it. */
const PILLOW_KEEP = 0.15;
/** Soap: how fast something has to land on it to make it squirt away, and how fast it goes. */
const SOAP_SQUIRT_HIT = 1.5;
const SOAP_SQUIRT = 9;
/** Rocket: how long it burns, how hard it pushes (times its weight), and its parachute. */
export const ROCKET_BURN = 0.7;
const ROCKET_THRUST = 2.4;
const CHUTE_GRAVITY = 0.5;
const CHUTE_DRAG = 2;

/** drop: a water drop poured by a watering can (rp is that can). */
type Tag = { rp: RuntimePart; drop?: boolean };

/** What each part sounds like when it knocks into something. */
const MATERIAL: Partial<Record<PartKind, Material>> = {
  pin: 'metal', hammer: 'metal', scissors: 'metal', toaster: 'metal', can: 'metal', basket: 'metal', pulley: 'metal', magnet: 'metal', rocket: 'metal',
  heavyball: 'heavy',
  ramp: 'wood', shortramp: 'wood', domino: 'wood', seesaw: 'wood', block: 'wood', star: 'wood',
  ball: 'plastic', hamster: 'plastic', car: 'plastic', conveyor: 'plastic', fan: 'plastic', rope: 'plastic',
  balloon: 'soft', cheese: 'soft', flower: 'soft', pillow: 'soft', soap: 'soft',
};
const LOUDEST: Material[] = ['metal', 'heavy', 'wood', 'table', 'plastic', 'soft'];

/**
 * The sound of a knock between two things (undefined: the table's edge). Musical parts and
 * springs make their own sound instead, and water just splashes quietly.
 */
function materialOf(a: PartKind | undefined, b: PartKind | undefined, water: boolean): Material | null {
  if (water) return null;
  for (const k of [a, b]) if (k && (NOTE_OF[k] || k === 'spring' || k === 'pillow')) return null;
  const mats = [a, b].map((k) => (k ? MATERIAL[k] ?? 'plastic' : 'table'));
  return LOUDEST.find((m) => mats.includes(m)) ?? 'plastic';
}

/**
 * One run of a machine. Building it is cheap, so the build screen also creates a
 * Sim (never stepped) just to draw the current placements.
 */
export class Sim {
  world: World;
  parts: RuntimePart[] = [];
  time = 0;
  success = false;
  settled = false;
  events: SimEvent[] = [];
  /** Notes played so far this run, in order, a note repeated straight away counted once (for tune goals). */
  played: Note[] = [];
  private tuneDone = false;
  private goalHeld = 0;
  private stillFor = 0;
  private toDestroy: RuntimePart[] = [];
  private releaseQueue: RuntimePart[] = [];
  private dropsToRemove: Body[] = [];
  private bounds: Body;
  /** How long each water drop has been (nearly) still: still drops soak away. */
  private dropStill = new Map<Body, number>();
  private stepCount = 0;

  private goal?: Goal;

  constructor(placements: Placement[], goal?: Goal) {
    this.goal = goal;
    this.world = new World({ gravity: new Vec2(0, 10) });
    const bounds = this.world.createBody();
    this.bounds = bounds;
    const corners = [new Vec2(0, 0), new Vec2(WORLD_W, 0), new Vec2(WORLD_W, WORLD_H), new Vec2(0, WORLD_H)];
    for (let i = 0; i < 4; i++) bounds.createFixture(new Edge(corners[i], corners[(i + 1) % 4]), { friction: 0.6 });

    for (const p of placements) {
      const rp: RuntimePart = { placement: p, kind: p.part, bodies: [], state: {} };
      PARTS[p.part].build(this.world, p, rp);
      for (const b of rp.bodies) b.setUserData({ rp } satisfies Tag);
      this.parts.push(rp);
    }
    this.world.on('begin-contact', (c) => this.onContact(c));
    this.world.on('pre-solve', (c) => this.onPreSolve(c));
  }

  private onContact(c: Contact) {
    const a = c.getFixtureA().getBody();
    const b = c.getFixtureB().getBody();
    const ta = a.getUserData() as Tag | null, tb = b.getUserData() as Tag | null;
    const ra = ta?.rp, rb = tb?.rp;
    for (const [x, y, yb, xt, yt] of [[ra, rb, b, ta, tb], [rb, ra, a, tb, ta]] as const) {
      // Water that reaches the floor or the table's edge soaks away.
      if (xt?.drop && yb === this.bounds) {
        const d = yb === b ? a : b;
        if (!this.dropsToRemove.includes(d)) this.dropsToRemove.push(d);
        continue;
      }
      // A water drop reaching a flower soaks in.
      if (xt?.drop && y?.kind === 'flower') {
        if (!this.dropsToRemove.includes(yb === b ? a : b)) {
          this.dropsToRemove.push(yb === b ? a : b);
          y.state.load! += 1;
          this.events.push({ type: 'drip' });
        }
        continue;
      }
      // A bump (not its own water) tips the watering can.
      if (x?.kind === 'can' && !xt?.drop && !x.state.on && yb.isDynamic() && yt?.rp !== x) {
        x.state.on = true;
        this.events.push({ type: 'pour' });
      }
      if (x?.kind === 'balloon' && (y?.kind === 'pin' || y?.kind === 'scissors') && !x.state.popped) {
        x.state.popped = true;
        this.toDestroy.push(x);
        // The bang wakes a sleeping hamster, but only one close enough to hear it.
        const at = x.bodies[0].getPosition();
        this.events.push({ type: 'pop', x: at.x, y: at.y });
        for (const h of this.parts) {
          if (h.kind === 'hamster' && !h.state.on && Vec2.distance(h.bodies[0].getPosition(), at) <= HEAR_POP) {
            h.state.on = true;
            h.bodies[0].setAwake(true);
            this.events.push({ type: 'squeak' });
          }
        }
      }
      if (x?.kind === 'fan' && !x.state.on && yb.isDynamic()) {
        x.state.on = true;
        this.events.push({ type: 'whoosh' });
      }
      if (x?.kind === 'spring' && yb.isDynamic()) this.events.push({ type: 'boing' });
      // A pillow takes the speed out of whatever lands on it.
      if (x?.kind === 'pillow' && yb.isDynamic() && !yt?.drop) {
        const v = yb.getLinearVelocity();
        if (v.length() > 1.5) this.events.push({ type: 'puff' });
        yb.setLinearVelocity(v.clone().mul(PILLOW_KEEP));
        yb.setAngularVelocity(yb.getAngularVelocity() * PILLOW_KEEP);
      }
      // Land on the soap and it squirts out from under, the way it points.
      if (x?.kind === 'soap' && !x.state.on && yb.isDynamic() && !yt?.drop) {
        const sb = x.bodies[0];
        if (yb.getPosition().y < sb.getPosition().y - 0.2 && yb.getLinearVelocity().y > SOAP_SQUIRT_HIT) {
          x.state.on = true;
          sb.setLinearVelocity(new Vec2(SOAP_SQUIRT * x.state.dir!, -1.5));
          this.events.push({ type: 'squish' });
        }
      }
      // A bump lights the rocket (not its own stand, which it rests on).
      if (x?.kind === 'rocket' && !x.state.on && yb.isDynamic() && yt?.rp !== x && !yt?.drop) {
        x.state.on = true;
        this.events.push({ type: 'blast' });
      }
      // A bump lets the hammer go: the brake comes off and it tips over the way it faces.
      if (x?.kind === 'hammer' && !x.state.on && yb.isDynamic() && yb !== x.bodies[0]) this.releaseQueue.push(x);
      if (x?.kind === 'hamster' && !x.state.on && yb.isDynamic()) {
        x.state.on = true;
        this.events.push({ type: 'squeak' });
      }
      // A musical part plays its note when something (not water) hits it properly:
      // a ball just resting or rolling slowly along it doesn't keep ringing.
      const note = x && NOTE_OF[x.kind];
      if (note && yb.isDynamic() && !yt?.drop && yb.getLinearVelocity().length() > NOTE_SPEED
        && this.time - (x.state.hitAt ?? -1) > NOTE_GAP) {
        x.state.hitAt = this.time;
        x.state.hit = globalThis.performance?.now() ?? 0;
        const at = x.bodies[0].getPosition();
        // A ball bouncing twice on one bar is still one note of the tune.
        if (this.played[this.played.length - 1] !== note) this.played.push(note);
        this.events.push({ type: 'note', note, x: at.x, y: at.y });
        // The bell is loud enough to wake a hamster close by, like a pop.
        if (note === 'bell') {
          for (const h of this.parts) {
            if (h.kind === 'hamster' && !h.state.on && Vec2.distance(h.bodies[0].getPosition(), at) <= HEAR_POP) {
              h.state.on = true;
              h.bodies[0].setAwake(true);
              this.events.push({ type: 'squeak' });
            }
          }
        }
        const g = this.goal;
        if (g?.type === 'tune' && this.played.length >= g.notes.length && g.notes.every((n, i) => n === this.played[this.played.length - g.notes.length + i])) this.tuneDone = true;
      }
    }
    const rel = a.getLinearVelocity().clone().sub(b.getLinearVelocity()).length();
    if (rel > 1.2) {
      const mat = materialOf(ra?.kind, rb?.kind, !!(ta?.drop || tb?.drop));
      if (mat) this.events.push({ type: 'clack', strength: Math.min(1, rel / 8), mat });
    }
  }

  /** Conveyor belts move whatever touches them along the belt; pillows never bounce. */
  private onPreSolve(c: Contact) {
    const fa = c.getFixtureA(), fb = c.getFixtureB();
    const ra = (fa.getBody().getUserData() as Tag | null)?.rp;
    const rb = (fb.getBody().getUserData() as Tag | null)?.rp;
    if (ra?.kind === 'pillow' || rb?.kind === 'pillow') c.setRestitution(0);
    if (ra?.kind === 'conveyor') c.setTangentSpeed(-CONVEYOR_SPEED * ra.state.dir!);
    else if (rb?.kind === 'conveyor') c.setTangentSpeed(CONVEYOR_SPEED * rb.state.dir!);
  }

  /** An awake hamster runs inside its ball, rolling it at a steady pace. */
  private applyHamsters() {
    for (const h of this.parts) {
      if (h.kind !== 'hamster' || !h.state.on) continue;
      const b = h.bodies[0];
      const target = HAMSTER_SPIN * h.state.dir!;
      b.applyTorque((target - b.getAngularVelocity()) * b.getInertia() * 8, true);
    }
  }

  /** Magnets pull balls and the car that are in front of them, harder the closer they are. */
  private applyMagnets() {
    for (const m of this.parts) {
      if (m.kind !== 'magnet') continue;
      const mb = m.bodies[0];
      const face = mb.getWorldPoint(new Vec2(0.45, 0));
      for (const rp of this.parts) {
        if (!MAGNETIC.has(rp.kind) || rp.state.popped) continue;
        const b = rp.kind === 'rope' ? rp.bodies[1] : rp.bodies[0];
        // It pulls what is in front of it (and a little to the sides), harder the closer it is.
        if (mb.getLocalPoint(b.getPosition()).x < -0.2) continue;
        const d = face.clone().sub(b.getPosition());
        const len = d.length();
        if (len < 0.05 || len > MAGNET_REACH) continue;
        // Strong enough to beat gravity anywhere in reach, so a pulled ball comes straight at it.
        const k = MAGNET_FORCE * (1 - 0.4 * len / MAGNET_REACH);
        b.applyForceToCenter(d.mul(k * b.getMass() / len), true);
        // Close up it grabs: whatever comes within a cell of its face is held there.
        if (len < MAGNET_GRAB) b.setLinearVelocity(b.getLinearVelocity().mul(0.8));
      }
    }
  }

  /** A lit rocket pushes itself along the way it points, then opens its parachute. */
  private applyRockets() {
    for (const r of this.parts) {
      if (r.kind !== 'rocket' || !r.state.on || r.state.chute) continue;
      const b = r.bodies[0];
      r.state.load! += DT;
      if (r.state.load! >= ROCKET_BURN) {
        r.state.chute = true;
        b.setGravityScale(CHUTE_GRAVITY);
        b.setLinearDamping(CHUTE_DRAG);
        continue;
      }
      b.applyForceToCenter(b.getWorldVector(new Vec2(0, -1)).mul(ROCKET_THRUST * 10 * b.getMass()), true);
    }
  }

  /** A rope touching the scissors' blades is cut. */
  private applyScissors() {
    for (const r of this.parts) {
      if (r.kind !== 'rope' || r.state.on) continue;
      const a = r.bodies[0].getPosition(), b = r.bodies[1].getPosition();
      const abx = b.x - a.x, aby = b.y - a.y;
      const near = (c: Vec2) => {
        const k = Math.max(0, Math.min(1, ((c.x - a.x) * abx + (c.y - a.y) * aby) / (abx * abx + aby * aby)));
        const dx = a.x + abx * k - c.x, dy = a.y + aby * k - c.y;
        return dx * dx + dy * dy < SNIP_REACH * SNIP_REACH;
      };
      // Any part of the scissors touching the rope cuts it: check points along the blades.
      const cut = this.parts.some((s) => s.kind === 'scissors' &&
        [-0.35, -0.1, 0.15, 0.4].some((u) => near(s.bodies[0].getWorldPoint(new Vec2(u, 0)))));
      if (cut) {
        this.world.destroyJoint(r.rope!);
        r.state.on = true;
        this.events.push({ type: 'snip' });
      }
    }
  }

  /** Where a tipped can's spout is (world coordinates), for pouring and drawing. */
  static spoutOf(can: RuntimePart, tilt: number) {
    const dir = can.state.dir!;
    const p = can.bodies[0].getPosition();
    // Tip about the bottom-front corner; the spout tip starts up and out in front.
    const px = 0.4, py = 0.45, dx = 0.5, dy = -0.9;
    const x = px + dx * Math.cos(tilt) - dy * Math.sin(tilt);
    const y = py + dx * Math.sin(tilt) + dy * Math.cos(tilt);
    return new Vec2(p.x + x * dir, p.y + y);
  }

  /** A tipped watering can pours a stream of drops from its spout. */
  private applyCans() {
    for (const can of this.parts) {
      if (can.kind !== 'can' || !can.state.on) continue;
      for (const d of can.bodies.slice(1)) {
        const still = d.getLinearVelocity().length() < 0.6 ? (this.dropStill.get(d) ?? 0) + DT : 0;
        this.dropStill.set(d, still);
        if (still > 0.5 && !this.dropsToRemove.includes(d)) this.dropsToRemove.push(d);
      }
      can.state.load! += DT;
      if (can.state.load! < CAN_TIP || can.state.drops! >= CAN_DROPS || this.stepCount % CAN_EVERY) continue;
      const at = Sim.spoutOf(can, CAN_TILT);
      const d = this.world.createBody({ type: 'dynamic', position: at, bullet: true });
      d.createFixture(new Circle(0.1), { density: 0.5, friction: 0.05, restitution: 0.05 });
      d.setLinearVelocity(new Vec2(1.6 * can.state.dir!, 1));
      d.setUserData({ rp: can, drop: true } satisfies Tag);
      can.bodies.push(d);
      can.state.drops! += 1;
    }
  }

  /** Something resting in a toaster's slot pops out after a moment. */
  private applyToasters() {
    for (const t of this.parts) {
      if (t.kind !== 'toaster') continue;
      const tb = t.bodies[0];
      let inSlot: Body | null = null;
      for (let b: Body | null = this.world.getBodyList(); b; b = b.getNext()) {
        if (!b.isDynamic()) continue;
        const lp = tb.getLocalPoint(b.getPosition());
        if (Math.abs(lp.x) < 0.6 && lp.y > -0.9 && lp.y < 0) { inSlot = b; break; }
      }
      if (!inSlot) { t.state.load = 0; t.state.on = false; continue; }
      t.state.on = true;
      t.state.load! += DT;
      if (t.state.load! >= TOAST_WAIT) {
        inSlot.setLinearVelocity(new Vec2(TOAST_TOSS * t.state.dir!, -TOAST_UP));
        inSlot.setAngularVelocity(0);
        inSlot.setAwake(true);
        t.state.load = 0;
        this.events.push({ type: 'ding' });
      }
    }
  }

  byId(id: string) {
    return this.parts.find((p) => p.placement.id === id);
  }

  /** The body whose centre counts for a goal: a pulley's weight, otherwise the part itself. */
  static goalBody(rp: RuntimePart) {
    return rp.kind === 'pulley' || rp.kind === 'rope' ? rp.bodies[1] : rp.bodies[0];
  }

  goalReached(): boolean {
    if (!this.goal) return false;
    if (this.goal.type === 'tune') return this.tuneDone;
    const obj = this.byId(this.goal.object);
    const target = this.byId(this.goal.target);
    // A flower is reached by watering it, not by getting there.
    if (target?.kind === 'flower') return target.state.load! >= WATER_NEEDED;
    if (!obj || !target?.zone || obj.state.popped) return false;
    const local = target.bodies[0].getLocalPoint(Sim.goalBody(obj).getPosition());
    const z = target.zone;
    return local.x > z.x0 && local.x < z.x1 && local.y > z.y0 && local.y < z.y1;
  }

  private applyFans() {
    for (const fan of this.parts) {
      if (fan.kind !== 'fan' || !fan.state.on) continue;
      const fb = fan.bodies[0];
      const dir = fb.getWorldVector(new Vec2(1, 0));
      for (let b: Body | null = this.world.getBodyList(); b; b = b.getNext()) {
        if (!b.isDynamic()) continue;
        const lp = fb.getLocalPoint(b.getPosition());
        if (lp.x < 0.4 || lp.x > FAN_REACH || Math.abs(lp.y) > 0.8) continue;
        const k = FAN_FORCE * (1 - lp.x / (FAN_REACH + 0.5));
        b.applyForceToCenter(dir.clone().mul(k * b.getMass()), true);
      }
    }
  }

  step() {
    if (this.success || this.settled) return;
    this.applyFans();
    this.applyToasters();
    this.applyCans();
    this.applyScissors();
    this.applyMagnets();
    this.applyRockets();
    this.stepCount++;
    this.applyHamsters();
    this.world.step(DT, 8, 3);
    for (const rp of this.toDestroy) for (const b of rp.bodies) this.world.destroyBody(b);
    for (const h of this.releaseQueue) {
      if (h.state.on) continue;
      h.state.on = true;
      // It's spring-loaded: once let go, it snaps down hard.
      h.brake!.setMotorSpeed(h.state.dir! * HAMMER_SPEED);
      h.brake!.setMaxMotorTorque(HAMMER_TORQUE);
      h.bodies[0].setAwake(true);
      this.events.push({ type: 'clack', strength: 0.6, mat: 'metal' });
    }
    this.releaseQueue = [];
    for (const d of this.dropsToRemove) {
      const can = (d.getUserData() as Tag).rp;
      can.bodies = can.bodies.filter((x) => x !== d);
      this.dropStill.delete(d);
      this.world.destroyBody(d);
    }
    this.dropsToRemove = [];
    this.toDestroy = [];
    this.time += DT;

    if (this.goalReached()) {
      this.goalHeld += DT;
      if (this.goalHeld >= GOAL_HOLD) this.success = true;
    } else this.goalHeld = 0;

    if (this.time > 1 && !this.success) {
      // Done when everything sleeps, or nothing has really moved for a while
      // (a hamster or a fan can keep pushing something against a wall forever).
      let awake = false, fastest = 0;
      // A ball still swinging on its rope after a while doesn't count: it would swing for ages.
      const swinging = this.time > SWING_GRACE ? new Set(this.parts.filter((p) => p.kind === 'rope' && !p.state.on).map((p) => p.bodies[1])) : null;
      for (let b: Body | null = this.world.getBodyList(); b; b = b.getNext()) {
        if (!b.isDynamic() || swinging?.has(b)) continue;
        if (b.isAwake()) awake = true;
        fastest = Math.max(fastest, b.getLinearVelocity().length());
      }
      this.stillFor = fastest < 0.05 ? this.stillFor + DT : 0;
      if (!awake || this.stillFor > 1.5 || this.time > MAX_TIME) this.settled = true;
    }
  }

  /** Run with no rendering until the machine finishes. Used by tests. */
  runHeadless(): boolean {
    while (!this.success && !this.settled) this.step();
    return this.success;
  }
}
