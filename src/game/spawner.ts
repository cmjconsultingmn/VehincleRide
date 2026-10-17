import {
  FIRST_OBSTACLE_AT,
  GLIDE_MAX,
  GLIDE_MIN,
  LANES,
  OBSTACLE_EVERY,
  PICKUP_EVERY,
  PICKUP_ODDS,
  VIEW_AHEAD,
  type SteeringMode,
} from '../config';
import { clamp } from './steering';

export type PickupKind = 'clock' | 'boost' | 'gear';
export type ThingKind = PickupKind | 'obstacle';

export interface Thing {
  id: number;
  kind: ThingKind;
  x: number;
  y: number;
  hit: boolean;
}

export type Rng = () => number;

const SPAWN_AHEAD = VIEW_AHEAD + 5;
const KEEP_BEHIND = 20;
const NEAR_X = 25;
const GLIDE_REACH = 0.35;
const GLIDE_GAP = 0.2;

export function pickKind(r: number): PickupKind {
  if (r < PICKUP_ODDS.clock) return 'clock';
  if (r < PICKUP_ODDS.clock + PICKUP_ODDS.boost) return 'boost';
  return 'gear';
}

export class Spawner {
  things: Thing[] = [];
  private nextPickup: number;
  private nextObstacle = FIRST_OBSTACLE_AT;
  private lastPickupY: number;
  private nextId = 1;

  constructor(
    private mode: SteeringMode,
    private rng: Rng,
    startY: number,
  ) {
    this.nextPickup = 1;
    this.lastPickupY = startY;
  }

  update(elapsed: number, distance: number) {
    const x = distance + SPAWN_AHEAD;
    if (elapsed >= this.nextPickup) {
      this.nextPickup = elapsed + this.between(PICKUP_EVERY);
      const y = this.pickupY(x);
      if (y !== null) {
        this.lastPickupY = y;
        this.add(pickKind(this.rng()), x, y);
      }
    }
    if (elapsed >= this.nextObstacle) {
      this.nextObstacle = elapsed + this.between(OBSTACLE_EVERY);
      const y = this.freeY(x, () => this.anyY());
      if (y !== null) this.add('obstacle', x, y);
    }
    this.things = this.things.filter((t) => t.x > distance - KEEP_BEHIND);
  }

  private pickupY(x: number) {
    if (this.mode === 'lanes') return this.freeY(x, () => this.anyY());
    return this.freeY(x, () => {
      const lo = Math.max(GLIDE_MIN, this.lastPickupY - GLIDE_REACH);
      const hi = Math.min(GLIDE_MAX, this.lastPickupY + GLIDE_REACH);
      return clamp(lo + this.rng() * (hi - lo), GLIDE_MIN, GLIDE_MAX);
    });
  }

  private anyY() {
    if (this.mode === 'lanes') return LANES[Math.floor(this.rng() * LANES.length)];
    return GLIDE_MIN + this.rng() * (GLIDE_MAX - GLIDE_MIN);
  }

  // Picks a height that doesn't overlap anything spawned just before it.
  private freeY(x: number, pick: () => number): number | null {
    const near = this.things.filter((t) => Math.abs(t.x - x) < NEAR_X);
    for (let i = 0; i < 6; i++) {
      const y = pick();
      if (near.every((t) => Math.abs(t.y - y) >= GLIDE_GAP)) return y;
    }
    return null;
  }

  private between([lo, hi]: number[]) {
    return lo + this.rng() * (hi - lo);
  }

  private add(kind: ThingKind, x: number, y: number) {
    this.things.push({ id: this.nextId++, kind, x, y, hit: false });
  }
}
