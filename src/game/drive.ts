import {
  BASE_SPEED,
  BOOST_MULTIPLIER,
  BOOST_SECONDS,
  BUMP_MULTIPLIER,
  BUMP_SECONDS,
  CLOCK_SECONDS,
  COAST_SECONDS,
  HIT_X,
  HIT_Y,
  vehicleSpec,
  type VehicleId,
} from '../config';
import { speedBonus, startSeconds } from './save';
import { Spawner, type Rng, type Thing } from './spawner';
import { Steering } from './steering';

export type DrivePhase = 'driving' | 'coasting' | 'done';

export type DriveEvent =
  | { type: 'clock' | 'boost' | 'gear' | 'bump'; thing: Thing }
  | { type: 'timeup' }
  | { type: 'done' };

export interface Upgrades {
  timer: number;
  speed: number;
}

export class Drive {
  readonly vehicle: VehicleId;
  readonly steering: Steering;
  readonly spawner: Spawner;
  readonly topSpeed: number;
  phase: DrivePhase = 'driving';
  timeLeft: number;
  elapsed = 0;
  distance = 0;
  speed: number;
  boostLeft = 0;
  bumpLeft = 0;
  gears = 0;
  private coastTime = 0;

  constructor(vehicle: VehicleId, upgrades: Upgrades, rng: Rng = Math.random) {
    const spec = vehicleSpec(vehicle);
    this.vehicle = vehicle;
    this.steering = new Steering(spec.steering);
    this.spawner = new Spawner(spec.steering, rng, this.steering.y);
    this.topSpeed = BASE_SPEED * spec.speed * speedBonus(upgrades.speed);
    this.timeLeft = startSeconds(upgrades.timer);
    this.speed = this.topSpeed;
  }

  get things() {
    return this.spawner.things;
  }

  get targetSpeed() {
    let s = this.topSpeed;
    if (this.boostLeft > 0) s *= BOOST_MULTIPLIER;
    if (this.bumpLeft > 0) s *= BUMP_MULTIPLIER;
    return s;
  }

  update(dt: number): DriveEvent[] {
    const events: DriveEvent[] = [];
    if (this.phase === 'done') return events;

    this.steering.update(dt);
    this.boostLeft = Math.max(0, this.boostLeft - dt);
    this.bumpLeft = Math.max(0, this.bumpLeft - dt);

    if (this.phase === 'driving') {
      this.elapsed += dt;
      this.timeLeft -= dt;
      this.speed += (this.targetSpeed - this.speed) * (1 - Math.exp(-6 * dt));
      this.distance += this.speed * dt;
      this.spawner.update(this.elapsed, this.distance);
      this.collide(events);
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.phase = 'coasting';
        events.push({ type: 'timeup' });
      }
    } else {
      this.coastTime += dt;
      this.speed *= Math.exp(-2.2 * dt);
      this.distance += this.speed * dt;
      if (this.coastTime >= COAST_SECONDS) {
        this.speed = 0;
        this.phase = 'done';
        events.push({ type: 'done' });
      }
    }
    return events;
  }

  private collide(events: DriveEvent[]) {
    const y = this.steering.y;
    for (const t of this.spawner.things) {
      if (t.hit || Math.abs(t.x - this.distance) > HIT_X || Math.abs(t.y - y) > HIT_Y) continue;
      t.hit = true;
      switch (t.kind) {
        case 'clock':
          this.timeLeft += CLOCK_SECONDS;
          events.push({ type: 'clock', thing: t });
          break;
        case 'boost':
          this.boostLeft = BOOST_SECONDS;
          events.push({ type: 'boost', thing: t });
          break;
        case 'gear':
          this.gears += 1;
          events.push({ type: 'gear', thing: t });
          break;
        case 'obstacle':
          this.bumpLeft = BUMP_SECONDS;
          this.speed = Math.min(this.speed, this.targetSpeed);
          events.push({ type: 'bump', thing: t });
          break;
      }
    }
  }
}
