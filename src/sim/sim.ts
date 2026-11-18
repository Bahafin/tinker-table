import { World, Vec2, Edge, Body, type Contact } from 'planck';
import { PARTS, type RuntimePart } from './parts';
import { WORLD_H, WORLD_W, type Goal, type Placement, type SimEvent } from './types';

export const DT = 1 / 60;
const MAX_TIME = 25;
const GOAL_HOLD = 0.3;
const FAN_REACH = 4.5;
const FAN_FORCE = 14;
export const CONVEYOR_SPEED = 2.5;
const HAMSTER_SPIN = 5;

type Tag = { rp: RuntimePart };

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
  private goalHeld = 0;
  private stillFor = 0;
  private toDestroy: RuntimePart[] = [];

  private goal?: Goal;

  constructor(placements: Placement[], goal?: Goal) {
    this.goal = goal;
    this.world = new World({ gravity: new Vec2(0, 10) });
    const bounds = this.world.createBody();
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
    const ra = (a.getUserData() as Tag | null)?.rp;
    const rb = (b.getUserData() as Tag | null)?.rp;
    for (const [x, y, yb] of [[ra, rb, b], [rb, ra, a]] as const) {
      if (x?.kind === 'balloon' && y?.kind === 'pin' && !x.state.popped) {
        x.state.popped = true;
        this.toDestroy.push(x);
        this.events.push({ type: 'pop' });
      }
      if (x?.kind === 'fan' && !x.state.on && yb.isDynamic()) {
        x.state.on = true;
        this.events.push({ type: 'whoosh' });
      }
      if (x?.kind === 'spring' && yb.isDynamic()) this.events.push({ type: 'boing' });
      if (x?.kind === 'hamster' && !x.state.on && yb.isDynamic()) {
        x.state.on = true;
        this.events.push({ type: 'squeak' });
      }
    }
    const rel = a.getLinearVelocity().clone().sub(b.getLinearVelocity()).length();
    if (rel > 1.2) this.events.push({ type: 'clack', strength: Math.min(1, rel / 8) });
  }

  /** Conveyor belts move whatever touches them along the belt. */
  private onPreSolve(c: Contact) {
    const fa = c.getFixtureA(), fb = c.getFixtureB();
    const ra = (fa.getBody().getUserData() as Tag | null)?.rp;
    const rb = (fb.getBody().getUserData() as Tag | null)?.rp;
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

  byId(id: string) {
    return this.parts.find((p) => p.placement.id === id);
  }

  /** The body whose centre counts for a goal: a pulley's weight, otherwise the part itself. */
  static goalBody(rp: RuntimePart) {
    return rp.kind === 'pulley' ? rp.bodies[1] : rp.bodies[0];
  }

  goalReached(): boolean {
    if (!this.goal) return false;
    const obj = this.byId(this.goal.object);
    if (this.goal.type === 'pop') return !!obj?.state.popped;
    const target = this.goal.target ? this.byId(this.goal.target) : undefined;
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
    this.applyHamsters();
    this.world.step(DT, 8, 3);
    for (const rp of this.toDestroy) for (const b of rp.bodies) this.world.destroyBody(b);
    this.toDestroy = [];
    this.time += DT;

    if (this.goalReached()) {
      this.goalHeld += DT;
      // A pop is over in an instant (and leaves nothing moving), so it counts straight away.
      if (this.goalHeld >= GOAL_HOLD || this.goal?.type === 'pop') this.success = true;
    } else this.goalHeld = 0;

    if (this.time > 1 && !this.success) {
      // Done when everything sleeps, or nothing has really moved for a while
      // (a hamster or a fan can keep pushing something against a wall forever).
      let awake = false, fastest = 0;
      for (let b: Body | null = this.world.getBodyList(); b; b = b.getNext()) {
        if (!b.isDynamic()) continue;
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
