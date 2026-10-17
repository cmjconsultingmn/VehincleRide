import { describe, expect, it } from 'vitest';
import { BASE_SPEED } from '../config';
import { Drive, type DriveEvent } from './drive';
import type { ThingKind } from './spawner';

const DT = 1 / 60;

function drive(upgrades = { timer: 0, speed: 0 }) {
  return new Drive('car', upgrades, () => 0.5);
}

function place(d: Drive, kind: ThingKind) {
  d.spawner.things.push({ id: 999, kind, x: d.distance + 1, y: d.steering.y, hit: false });
}

function step(d: Drive, seconds: number) {
  const events: DriveEvent[] = [];
  for (let t = 0; t < seconds; t += DT) events.push(...d.update(DT));
  return events;
}

describe('Drive', () => {
  it('starts with 2:00 on the clock at the vehicle speed', () => {
    const d = drive();
    expect(d.timeLeft).toBe(120);
    expect(d.topSpeed).toBe(BASE_SPEED);
    expect(new Drive('rocket', { timer: 0, speed: 0 }).topSpeed).toBeCloseTo(BASE_SPEED * 1.7);
  });

  it('applies garage upgrades', () => {
    const d = drive({ timer: 5, speed: 5 });
    expect(d.timeLeft).toBe(170);
    expect(d.topSpeed).toBeCloseTo(BASE_SPEED * 1.5);
  });

  it('runs out of time, coasts, then finishes', () => {
    const d = drive();
    d.timeLeft = 0.5;
    const events = step(d, 1).map((e) => e.type);
    expect(events).toContain('timeup');
    expect(d.phase).toBe('coasting');
    const before = d.distance;
    step(d, 3);
    expect(d.phase).toBe('done');
    expect(d.distance).toBeGreaterThan(before);
    expect(d.speed).toBe(0);
  });

  it('adds 5 seconds for a clock', () => {
    const d = drive();
    place(d, 'clock');
    const events = d.update(DT);
    expect(events[0].type).toBe('clock');
    expect(d.timeLeft).toBeCloseTo(125 - DT);
  });

  it('boosts to 1.5x for 3 seconds', () => {
    const d = drive();
    place(d, 'boost');
    d.update(DT);
    expect(d.targetSpeed).toBeCloseTo(BASE_SPEED * 1.5);
    step(d, 2.9);
    expect(d.targetSpeed).toBeCloseTo(BASE_SPEED * 1.5);
    step(d, 0.2);
    expect(d.targetSpeed).toBe(BASE_SPEED);
  });

  it('counts gears', () => {
    const d = drive();
    place(d, 'gear');
    d.update(DT);
    expect(d.gears).toBe(1);
  });

  it('slows down for one second after a bump, once, and never ends the drive', () => {
    const d = drive();
    place(d, 'obstacle');
    const events = step(d, 0.1).map((e) => e.type);
    expect(events.filter((e) => e === 'bump')).toHaveLength(1);
    expect(d.speed).toBeCloseTo(BASE_SPEED * 0.5, 0);
    step(d, 2);
    expect(d.speed).toBeCloseTo(BASE_SPEED, 0);
    expect(d.phase).toBe('driving');
  });

  it('ignores pickups while coasting', () => {
    const d = drive();
    d.timeLeft = DT / 2;
    d.update(DT);
    expect(d.phase).toBe('coasting');
    place(d, 'clock');
    d.update(DT);
    expect(d.timeLeft).toBe(0);
  });
});
