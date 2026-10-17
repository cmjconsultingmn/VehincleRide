import { describe, expect, it } from 'vitest';
import { GLIDE_MAX, GLIDE_MIN, LANES } from '../config';
import { Spawner, pickKind, type Thing } from './spawner';

function run(mode: 'lanes' | 'glide', seconds: number) {
  const spawner = new Spawner(mode, Math.random, 0.5);
  const seen = new Map<number, Thing>();
  for (let t = 0; t < seconds; t += 1 / 30) {
    spawner.update(t, t * 20);
    for (const thing of spawner.things) seen.set(thing.id, thing);
  }
  return [...seen.values()];
}

describe('pickKind', () => {
  it('maps odds to 1 clock, 1 boost, 3 gears in 5', () => {
    expect(pickKind(0.1)).toBe('clock');
    expect(pickKind(0.3)).toBe('boost');
    expect(pickKind(0.5)).toBe('gear');
    expect(pickKind(0.99)).toBe('gear');
  });
});

describe('Spawner', () => {
  it('drops a pickup about every 3 to 4 seconds', () => {
    const pickups = run('lanes', 120).filter((t) => t.kind !== 'obstacle');
    expect(pickups.length).toBeGreaterThanOrEqual(26);
    expect(pickups.length).toBeLessThanOrEqual(40);
  });

  it('puts lane things exactly in lanes', () => {
    for (const t of run('lanes', 60)) expect(LANES).toContain(t.y);
  });

  it('keeps glide pickups within one swipe of the last one', () => {
    const pickups = run('glide', 120).filter((t) => t.kind !== 'obstacle');
    for (const t of pickups) {
      expect(t.y).toBeGreaterThanOrEqual(GLIDE_MIN);
      expect(t.y).toBeLessThanOrEqual(GLIDE_MAX);
    }
    for (let i = 1; i < pickups.length; i++) {
      expect(Math.abs(pickups[i].y - pickups[i - 1].y)).toBeLessThanOrEqual(0.35 + 1e-9);
    }
  });

  it('never stacks an obstacle on a nearby pickup', () => {
    const things = run('lanes', 120);
    const obstacles = things.filter((t) => t.kind === 'obstacle');
    expect(obstacles.length).toBeGreaterThan(0);
    for (const o of obstacles) {
      for (const p of things) {
        if (p === o || Math.abs(p.x - o.x) >= 25) continue;
        expect(p.y).not.toBe(o.y);
      }
    }
  });
});
