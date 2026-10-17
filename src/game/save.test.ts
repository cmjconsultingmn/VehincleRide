import { describe, expect, it } from 'vitest';
import { buy, canBuy, freshSave, loadSave, nextCost, recordDistance, speedBonus, startSeconds, writeSave } from './save';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe('save', () => {
  it('survives a round trip', () => {
    const store = memoryStore();
    const save = freshSave();
    save.gears = 42;
    save.timer = 2;
    save.best.rocket = 1234;
    writeSave(store, save);
    expect(loadSave(store)).toEqual(save);
  });

  it('starts fresh when nothing or garbage is stored', () => {
    expect(loadSave(memoryStore())).toEqual(freshSave());
    const store = memoryStore();
    store.setItem('vehicle-ride-save-v1', '{not json');
    expect(loadSave(store)).toEqual(freshSave());
  });
});

describe('upgrades', () => {
  it('costs 10, 20, 30, 40, 50 and then maxes out', () => {
    const save = freshSave();
    save.gears = 150;
    for (const cost of [10, 20, 30, 40, 50]) {
      expect(nextCost(save.timer)).toBe(cost);
      expect(buy(save, 'timer')).toBe(true);
    }
    expect(save.gears).toBe(0);
    expect(nextCost(save.timer)).toBeNull();
    save.gears = 100;
    expect(canBuy(save, 'timer')).toBe(false);
    expect(buy(save, 'timer')).toBe(false);
  });

  it('refuses when short on gears', () => {
    const save = freshSave();
    save.gears = 9;
    expect(canBuy(save, 'speed')).toBe(false);
    expect(buy(save, 'speed')).toBe(false);
    expect(save.gears).toBe(9);
  });

  it('tops out at 2:50 and 50% faster', () => {
    expect(startSeconds(0)).toBe(120);
    expect(startSeconds(5)).toBe(170);
    expect(speedBonus(5)).toBeCloseTo(1.5);
  });

  it('keeps the best distance per vehicle', () => {
    const save = freshSave();
    expect(recordDistance(save, 'car', 500)).toBe(true);
    expect(recordDistance(save, 'car', 400)).toBe(false);
    expect(save.best.car).toBe(500);
    expect(save.best.boat).toBe(0);
  });
});
