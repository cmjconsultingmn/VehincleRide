import type { VehicleId } from '../config';

export interface View {
  w: number;
  h: number;
  // World meters to screen pixels.
  ppm: number;
  // Distance driven, in meters.
  distance: number;
  // Seconds since the drive started, for animation.
  t: number;
  speed: number;
  boosting: boolean;
}

export function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Calls draw for each repeating item on a parallax layer.
function layer(v: View, factor: number, spacing: number, draw: (x: number, i: number) => void) {
  const offset = v.distance * v.ppm * factor;
  const first = Math.floor(offset / spacing) - 1;
  const last = first + Math.ceil(v.w / spacing) + 2;
  for (let i = first; i <= last; i++) draw(i * spacing - offset, i);
}

function sky(ctx: CanvasRenderingContext2D, v: View, top: string, bottom: string, until = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, v.h * until);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, v.w, v.h * until);
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, Math.PI * 2);
  ctx.arc(x - r * 0.9, y + r * 0.25, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x + r * 0.3, y - r * 0.45, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function road(ctx: CanvasRenderingContext2D, v: View) {
  const { w, h } = v;
  const horizon = h * 0.31;
  sky(ctx, v, '#6ec6ff', '#d8f1ff', 0.31);

  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.1, h * 0.05, 0, Math.PI * 2);
  ctx.fill();

  layer(v, 0.05, 260, (x, i) => cloud(ctx, x, h * (0.06 + hash(i) * 0.08), h * 0.025, 0.8));

  ctx.fillStyle = '#8fa3c0';
  layer(v, 0.1, 46, (x, i) => {
    const bh = h * (0.06 + hash(i + 7) * 0.14);
    ctx.fillRect(x, horizon - bh, 42, bh);
    ctx.fillStyle = '#c9d6ea';
    for (let wy = horizon - bh + 8; wy < horizon - 10; wy += 14) {
      for (let wx = x + 7; wx < x + 36; wx += 12) if (hash(i * 31 + wy + wx) > 0.4) ctx.fillRect(wx, wy, 5, 6);
    }
    ctx.fillStyle = '#8fa3c0';
  });

  ctx.fillStyle = '#6fbf5a';
  ctx.beginPath();
  ctx.moveTo(0, horizon + 2);
  const off = v.distance * v.ppm * 0.3;
  for (let x = 0; x <= w + 20; x += 20) {
    const wx = x + off;
    ctx.lineTo(x, horizon - h * 0.035 * (1 + Math.sin(wx * 0.006) + 0.5 * Math.sin(wx * 0.017)));
  }
  ctx.lineTo(w, horizon + 2);
  ctx.fill();

  ctx.fillStyle = '#7ccc63';
  ctx.fillRect(0, horizon, w, h * 0.02);
  ctx.fillStyle = '#5a5f6b';
  ctx.fillRect(0, horizon + h * 0.02, w, h * 0.65);
  ctx.fillStyle = '#7ccc63';
  ctx.fillRect(0, h * 0.97, w, h * 0.03);

  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(0, horizon + h * 0.03, w, 4);
  ctx.fillRect(0, h * 0.95, w, 4);
  ctx.fillStyle = '#ffd84a';
  for (const ly of [0.525, 0.735]) {
    layer(v, 1, 90, (x) => ctx.fillRect(x, h * ly - 3, 48, 6));
  }
}

function ocean(ctx: CanvasRenderingContext2D, v: View) {
  const { w, h } = v;
  const sea = h * 0.3;
  sky(ctx, v, '#7fd3ff', '#fef6e0', 0.3);

  layer(v, 0.04, 300, (x, i) => cloud(ctx, x, h * (0.06 + hash(i) * 0.08), h * 0.028, 0.85));

  layer(v, 0.15, 420, (x, i) => {
    if (hash(i + 3) < 0.45) return;
    const r = 60 + hash(i) * 70;
    ctx.fillStyle = '#f3dc9b';
    ctx.beginPath();
    ctx.ellipse(x, sea, r, r * 0.32, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#4fae5a';
    ctx.beginPath();
    ctx.ellipse(x, sea, r * 0.75, r * 0.26, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.1, sea - r * 0.2);
    ctx.quadraticCurveTo(x + r * 0.2, sea - r * 0.55, x + r * 0.05, sea - r * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#2f8f45';
    for (let a = 0; a < 5; a++) {
      ctx.beginPath();
      ctx.ellipse(x + r * 0.05, sea - r * 0.8, r * 0.28, 7, -0.9 + a * 0.45 + Math.PI * (a > 2 ? 1 : 0), 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const g = ctx.createLinearGradient(0, sea, 0, h);
  g.addColorStop(0, '#2aa7d6');
  g.addColorStop(1, '#0d5f9e');
  ctx.fillStyle = g;
  ctx.fillRect(0, sea, w, h - sea);

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 7; row++) {
    const y = sea + (h - sea) * (0.08 + row * 0.14);
    const factor = 0.4 + row * 0.12;
    layer(v, factor, 140, (x, i) => {
      const bob = Math.sin(v.t * 2 + i + row) * 3;
      ctx.beginPath();
      ctx.arc(x + hash(i + row * 13) * 60, y + bob, 18, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    });
  }
}

function skyWorld(ctx: CanvasRenderingContext2D, v: View) {
  const { w, h } = v;
  sky(ctx, v, '#3d8fe0', '#bfe6ff');

  ctx.fillStyle = 'rgba(120,190,110,0.6)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  const off = v.distance * v.ppm * 0.08;
  for (let x = 0; x <= w + 30; x += 30) {
    const wx = x + off;
    ctx.lineTo(x, h * 0.95 - h * 0.03 * (1 + Math.sin(wx * 0.004) + Math.sin(wx * 0.013)));
  }
  ctx.lineTo(w, h);
  ctx.fill();

  layer(v, 0.12, 220, (x, i) => cloud(ctx, x, h * (0.1 + hash(i) * 0.75), h * (0.03 + hash(i + 1) * 0.02), 0.55));
  layer(v, 0.45, 380, (x, i) => cloud(ctx, x, h * (0.08 + hash(i + 9) * 0.8), h * (0.05 + hash(i + 2) * 0.03), 0.9));
}

function space(ctx: CanvasRenderingContext2D, v: View) {
  const { h } = v;
  sky(ctx, v, '#05051a', '#1c1240');

  layer(v, 0.03, 700, (x, i) => {
    if (hash(i + 5) < 0.3) return;
    const r = h * (0.05 + hash(i) * 0.08);
    const y = h * (0.15 + hash(i + 1) * 0.7);
    const hue = Math.floor(hash(i + 2) * 360);
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, `hsl(${hue},70%,72%)`);
    g.addColorStop(1, `hsl(${hue},60%,32%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (hash(i + 4) > 0.5) {
      ctx.strokeStyle = `hsla(${(hue + 40) % 360},70%,80%,0.7)`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.7, r * 0.35, -0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  const streak = Math.min(1, v.speed / 60) * (v.boosting ? 2 : 1);
  for (const [factor, spacing, size] of [
    [0.06, 18, 1.2],
    [0.2, 34, 1.8],
    [0.6, 70, 2.6],
  ]) {
    ctx.fillStyle = '#ffffff';
    layer(v, factor, spacing, (x, i) => {
      const y = hash(i * 3.1 + factor) * h;
      const len = size + streak * factor * 60;
      ctx.globalAlpha = 0.4 + hash(i + 11) * 0.6;
      ctx.fillRect(x + hash(i) * spacing, y, len, size);
    });
  }
  ctx.globalAlpha = 1;
}

export const WORLDS: Record<VehicleId, (ctx: CanvasRenderingContext2D, v: View) => void> = {
  car: road,
  boat: ocean,
  plane: skyWorld,
  rocket: space,
};

export function speedLines(ctx: CanvasRenderingContext2D, v: View) {
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  layer(v, 1.6, 55, (x, i) => {
    const y = hash(i * 7.3) * v.h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 60 + hash(i) * 80, y);
    ctx.stroke();
  });
}
