import { GLIDE_GAIN, GLIDE_MAX, GLIDE_MIN, LANES, LANE_SWIPE, type SteeringMode } from '../config';

export class Steering {
  readonly mode: SteeringMode;
  lane = 1;
  target: number;
  y: number;
  vy = 0;
  private pending = 0;

  constructor(mode: SteeringMode) {
    this.mode = mode;
    this.target = mode === 'lanes' ? LANES[this.lane] : (GLIDE_MIN + GLIDE_MAX) / 2;
    this.y = this.target;
  }

  // dy is finger movement as a fraction of screen height, positive is down.
  drag(dy: number) {
    if (this.mode === 'glide') {
      this.target = clamp(this.target + dy * GLIDE_GAIN, GLIDE_MIN, GLIDE_MAX);
      return;
    }
    this.pending += dy;
    while (Math.abs(this.pending) >= LANE_SWIPE) {
      const step = Math.sign(this.pending);
      this.pending -= step * LANE_SWIPE;
      const lane = clamp(this.lane + step, 0, LANES.length - 1);
      if (lane === this.lane) this.pending = 0;
      this.lane = lane;
    }
    this.target = LANES[this.lane];
  }

  release() {
    this.pending = 0;
  }

  update(dt: number) {
    const k = this.mode === 'lanes' ? 12 : 9;
    const prev = this.y;
    this.y += (this.target - this.y) * (1 - Math.exp(-k * dt));
    this.vy = dt > 0 ? (this.y - prev) / dt : 0;
  }
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
