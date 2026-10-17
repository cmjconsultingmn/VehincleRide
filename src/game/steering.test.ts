import { describe, expect, it } from 'vitest';
import { GLIDE_MAX, GLIDE_MIN, LANES } from '../config';
import { Steering } from './steering';

describe('lane steering', () => {
  it('starts in the middle lane', () => {
    const s = new Steering('lanes');
    expect(s.lane).toBe(1);
    expect(s.y).toBe(LANES[1]);
  });

  it('moves one lane per swipe and stops at the edges', () => {
    const s = new Steering('lanes');
    s.drag(0.07);
    expect(s.lane).toBe(2);
    s.drag(0.2);
    expect(s.lane).toBe(2);
    s.release();
    s.drag(-0.13);
    expect(s.lane).toBe(0);
    expect(s.target).toBe(LANES[0]);
  });

  it('ignores tiny wiggles and forgets them on release', () => {
    const s = new Steering('lanes');
    s.drag(0.04);
    expect(s.lane).toBe(1);
    s.release();
    s.drag(0.04);
    expect(s.lane).toBe(1);
  });

  it('slides smoothly to the new lane', () => {
    const s = new Steering('lanes');
    s.drag(0.07);
    s.update(1 / 60);
    expect(s.y).toBeGreaterThan(LANES[1]);
    expect(s.y).toBeLessThan(LANES[2]);
    for (let i = 0; i < 120; i++) s.update(1 / 60);
    expect(s.y).toBeCloseTo(LANES[2], 3);
  });
});

describe('glide steering', () => {
  it('follows the drag and stays on screen', () => {
    const s = new Steering('glide');
    const start = s.target;
    s.drag(0.1);
    expect(s.target).toBeGreaterThan(start);
    s.drag(5);
    expect(s.target).toBe(GLIDE_MAX);
    s.drag(-5);
    expect(s.target).toBe(GLIDE_MIN);
  });
});
