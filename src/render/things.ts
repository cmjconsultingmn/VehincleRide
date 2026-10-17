import type { VehicleId } from '../config';
import type { ThingKind } from '../game/spawner';

export function drawThing(ctx: CanvasRenderingContext2D, kind: ThingKind, world: VehicleId, x: number, y: number, r: number, t: number, hit: boolean) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'obstacle') {
    if (hit) {
      ctx.globalAlpha = 0.5;
      ctx.rotate(0.6);
    }
    OBSTACLES[world](ctx, r, t);
  } else {
    const pulse = 1 + Math.sin(t * 5) * 0.06;
    ctx.scale(pulse, pulse);
    PICKUPS[kind](ctx, r, t);
  }
  ctx.restore();
}

function ring(ctx: CanvasRenderingContext2D, r: number, fill: string) {
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.strokeStyle = '#1b1b2a';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function clock(ctx: CanvasRenderingContext2D, r: number, t: number) {
  ring(ctx, r, '#ffffff');
  ctx.strokeStyle = '#1b1b2a';
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -r * 0.6);
  ctx.stroke();
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(t * 2) * r * 0.75, Math.sin(t * 2) * r * 0.75);
  ctx.stroke();
  ctx.fillStyle = '#2c6fd1';
  ctx.font = `bold ${r * 0.55}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('+5', 0, r * 0.75);
}

function boost(ctx: CanvasRenderingContext2D, r: number) {
  ring(ctx, r, '#ff8a1f');
  ctx.fillStyle = '#fff36b';
  ctx.strokeStyle = '#1b1b2a';
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.moveTo(r * 0.15, -r * 0.7);
  ctx.lineTo(-r * 0.4, r * 0.1);
  ctx.lineTo(-r * 0.02, r * 0.1);
  ctx.lineTo(-r * 0.15, r * 0.7);
  ctx.lineTo(r * 0.4, -r * 0.1);
  ctx.lineTo(r * 0.02, -r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function gearPath(ctx: CanvasRenderingContext2D, r: number, spin: number) {
  const teeth = 8;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = spin + (i / (teeth * 2)) * Math.PI * 2;
    const a1 = spin + ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.78;
    ctx.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
    ctx.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
  }
  ctx.closePath();
}

function gear(ctx: CanvasRenderingContext2D, r: number, t: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.fill();
  gearPath(ctx, r, t * 1.5);
  ctx.fillStyle = '#ffc531';
  ctx.strokeStyle = '#8a5a00';
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a5a00';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

const PICKUPS: Record<Exclude<ThingKind, 'obstacle'>, (ctx: CanvasRenderingContext2D, r: number, t: number) => void> = {
  clock,
  boost,
  gear,
};

function cone(ctx: CanvasRenderingContext2D, r: number) {
  ctx.strokeStyle = '#1b1b2a';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r);
  ctx.lineTo(r * 0.15, -r);
  ctx.lineTo(r * 0.6, r * 0.7);
  ctx.lineTo(-r * 0.6, r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-r * 0.34, -r * 0.1, r * 0.68, r * 0.25);
  ctx.fillStyle = '#ff7a1a';
  ctx.fillRect(-r * 0.85, r * 0.7, r * 1.7, r * 0.22);
  ctx.strokeRect(-r * 0.85, r * 0.7, r * 1.7, r * 0.22);
}

function buoy(ctx: CanvasRenderingContext2D, r: number, t: number) {
  ctx.translate(0, Math.sin(t * 3) * r * 0.12);
  ctx.strokeStyle = '#1b1b2a';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#e8413c';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.5);
  ctx.lineTo(-r * 0.25, -r * 0.9);
  ctx.lineTo(r * 0.25, -r * 0.9);
  ctx.lineTo(r * 0.5, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-r * 0.38, -r * 0.35, r * 0.76, r * 0.3);
  ctx.fillStyle = '#ffe66b';
  ctx.beginPath();
  ctx.arc(0, -r * 1.05, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e86c0';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.55, r * 0.9, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function bird(ctx: CanvasRenderingContext2D, r: number, t: number) {
  const flap = Math.sin(t * 10) * r * 0.5;
  ctx.fillStyle = '#3b3b4f';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.5, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.45, -r * 0.12, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb02e';
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, -r * 0.16);
  ctx.lineTo(-r * 0.85, -r * 0.08);
  ctx.lineTo(-r * 0.62, -r * 0.02);
  ctx.fill();
  ctx.strokeStyle = '#3b3b4f';
  ctx.lineWidth = r * 0.18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.1);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.6 - flap, r * 0.7, -r * 0.4 - flap);
  ctx.stroke();
}

function asteroid(ctx: CanvasRenderingContext2D, r: number, t: number) {
  ctx.rotate(t * 0.8);
  ctx.fillStyle = '#8d8478';
  ctx.strokeStyle = '#3d3830';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rr = r * (0.78 + 0.22 * Math.sin(i * 2.7));
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6b6359';
  for (const [cx, cy, cr] of [
    [-0.3, -0.2, 0.18],
    [0.25, 0.2, 0.22],
    [0.2, -0.35, 0.1],
  ]) {
    ctx.beginPath();
    ctx.arc(r * cx, r * cy, r * cr, 0, Math.PI * 2);
    ctx.fill();
  }
}

const OBSTACLES: Record<VehicleId, (ctx: CanvasRenderingContext2D, r: number, t: number) => void> = {
  car: cone,
  boat: buoy,
  plane: bird,
  rocket: asteroid,
};
