import { VEHICLE_IDS, VEHICLE_LENGTH, type VehicleId } from '../config';

export interface VehiclePose {
  t: number;
  // Meters driven, for spinning wheels.
  distance: number;
  // Radians, nose up is negative.
  tilt: number;
  boosting: boolean;
}

// Jude's drawings: drop public/art/car.png (and boat, plane, rocket) in and they replace the built-in art.
const art: Partial<Record<VehicleId, HTMLImageElement>> = {};

export function loadArt() {
  return Promise.all(
    VEHICLE_IDS.map(
      (id) =>
        new Promise<void>((done) => {
          const img = new Image();
          img.onload = () => {
            art[id] = img;
            done();
          };
          img.onerror = () => done();
          img.src = `art/${id}.png`;
        }),
    ),
  );
}

export function drawVehicle(ctx: CanvasRenderingContext2D, id: VehicleId, x: number, y: number, len: number, pose: VehiclePose) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(pose.tilt);
  const img = art[id];
  if (img) {
    const h = (len * img.height) / img.width;
    if (id === 'rocket') flame(ctx, -len / 2, 0, len, pose);
    ctx.drawImage(img, -len / 2, -h / 2, len, h);
  } else {
    DRAW[id](ctx, len, pose);
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function outline(ctx: CanvasRenderingContext2D, len: number) {
  ctx.strokeStyle = '#1b1b2a';
  ctx.lineWidth = Math.max(2, len * 0.025);
  ctx.lineJoin = 'round';
}

function car(ctx: CanvasRenderingContext2D, L: number, p: VehiclePose) {
  outline(ctx, L);
  const bounce = Math.sin(p.t * 17) * L * 0.012;
  const wheelR = L * 0.13;
  const wheelY = L * 0.16;

  ctx.save();
  ctx.translate(0, bounce);
  ctx.fillStyle = '#e8413c';
  roundRect(ctx, -L * 0.5, -L * 0.08, L, L * 0.22, L * 0.07);
  ctx.beginPath();
  ctx.moveTo(-L * 0.28, -L * 0.08);
  ctx.lineTo(-L * 0.18, -L * 0.3);
  ctx.lineTo(L * 0.14, -L * 0.3);
  ctx.lineTo(L * 0.28, -L * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#bfe8ff';
  ctx.beginPath();
  ctx.moveTo(-L * 0.22, -L * 0.1);
  ctx.lineTo(-L * 0.15, -L * 0.25);
  ctx.lineTo(-L * 0.03, -L * 0.25);
  ctx.lineTo(-L * 0.03, -L * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(L * 0.02, -L * 0.1);
  ctx.lineTo(L * 0.02, -L * 0.25);
  ctx.lineTo(L * 0.12, -L * 0.25);
  ctx.lineTo(L * 0.22, -L * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe66b';
  ctx.fillRect(L * 0.43, -L * 0.04, L * 0.06, L * 0.06);
  ctx.restore();

  const spin = (p.distance / ((wheelR / L) * VEHICLE_LENGTH)) % (Math.PI * 2);
  for (const wx of [-L * 0.3, L * 0.3]) {
    ctx.save();
    ctx.translate(wx, wheelY);
    ctx.rotate(spin);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8c8c8';
    ctx.beginPath();
    ctx.arc(0, 0, wheelR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-wheelR * 0.5, 0);
    ctx.lineTo(wheelR * 0.5, 0);
    ctx.moveTo(0, -wheelR * 0.5);
    ctx.lineTo(0, wheelR * 0.5);
    ctx.stroke();
    ctx.restore();
  }
}

function boat(ctx: CanvasRenderingContext2D, L: number, p: VehiclePose) {
  outline(ctx, L);
  ctx.translate(0, Math.sin(p.t * 3) * L * 0.03);
  ctx.rotate(Math.sin(p.t * 2.4) * 0.05);

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -L * 0.25, -L * 0.24, L * 0.36, L * 0.18, L * 0.03);
  ctx.fillStyle = '#7fd0ff';
  for (const wx of [-0.2, -0.08, 0.02]) {
    ctx.beginPath();
    ctx.arc(L * wx + L * 0.03, -L * 0.15, L * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#1b1b2a';
  ctx.beginPath();
  ctx.moveTo(-L * 0.05, -L * 0.24);
  ctx.lineTo(-L * 0.05, -L * 0.45);
  ctx.stroke();
  ctx.fillStyle = '#ffcc33';
  ctx.beginPath();
  ctx.moveTo(-L * 0.05, -L * 0.45);
  ctx.lineTo(L * 0.1, -L * 0.4 + Math.sin(p.t * 8) * L * 0.01);
  ctx.lineTo(-L * 0.05, -L * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2c6fd1';
  ctx.beginPath();
  ctx.moveTo(-L * 0.5, -L * 0.07);
  ctx.lineTo(L * 0.5, -L * 0.1);
  ctx.lineTo(L * 0.32, L * 0.12);
  ctx.lineTo(-L * 0.42, L * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-L * 0.45, -L * 0.02, L * 0.88, L * 0.035);
}

function plane(ctx: CanvasRenderingContext2D, L: number, p: VehiclePose) {
  outline(ctx, L);
  ctx.fillStyle = '#f7b731';
  ctx.beginPath();
  ctx.moveTo(-L * 0.45, -L * 0.05);
  ctx.lineTo(-L * 0.5, -L * 0.28);
  ctx.lineTo(-L * 0.36, -L * 0.28);
  ctx.lineTo(-L * 0.24, -L * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, L * 0.47, L * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8413c';
  ctx.fillRect(-L * 0.4, -L * 0.015, L * 0.78, L * 0.03);

  ctx.fillStyle = '#7fd0ff';
  ctx.beginPath();
  ctx.ellipse(L * 0.27, -L * 0.05, L * 0.08, L * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const wx of [-0.18, -0.06, 0.06]) {
    ctx.beginPath();
    ctx.arc(L * wx, -L * 0.04, L * 0.022, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#f7b731';
  ctx.beginPath();
  ctx.moveTo(-L * 0.08, L * 0.02);
  ctx.lineTo(L * 0.14, L * 0.02);
  ctx.lineTo(-L * 0.02, L * 0.26);
  ctx.lineTo(-L * 0.16, L * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(L * 0.47, 0, L * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(80,80,80,0.35)';
  const blade = L * (0.12 + 0.06 * Math.abs(Math.sin(p.t * 40)));
  ctx.beginPath();
  ctx.ellipse(L * 0.49, 0, L * 0.02, blade, 0, 0, Math.PI * 2);
  ctx.fill();
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, L: number, p: VehiclePose) {
  const big = p.boosting ? 1.6 : 1;
  const flick = 1 + Math.sin(p.t * 40) * 0.12 + Math.sin(p.t * 23) * 0.08;
  const len = L * 0.35 * big * flick;
  for (const [color, scale] of [
    ['#ff6a2b', 1],
    ['#ffd23f', 0.62],
    ['#fff6d5', 0.3],
  ] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + L * 0.02, y - L * 0.09 * scale);
    ctx.quadraticCurveTo(x - len * scale * 0.6, y - L * 0.05 * scale, x - len * scale, y);
    ctx.quadraticCurveTo(x - len * scale * 0.6, y + L * 0.05 * scale, x + L * 0.02, y + L * 0.09 * scale);
    ctx.closePath();
    ctx.fill();
  }
}

function rocket(ctx: CanvasRenderingContext2D, L: number, p: VehiclePose) {
  flame(ctx, -L * 0.42, 0, L, p);
  outline(ctx, L);

  ctx.fillStyle = '#e8413c';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-L * 0.2, s * L * 0.1);
    ctx.lineTo(-L * 0.45, s * L * 0.26);
    ctx.lineTo(-L * 0.42, s * L * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#eef1f7';
  ctx.beginPath();
  ctx.moveTo(-L * 0.42, -L * 0.12);
  ctx.lineTo(L * 0.22, -L * 0.12);
  ctx.quadraticCurveTo(L * 0.45, -L * 0.1, L * 0.52, 0);
  ctx.quadraticCurveTo(L * 0.45, L * 0.1, L * 0.22, L * 0.12);
  ctx.lineTo(-L * 0.42, L * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e8413c';
  ctx.beginPath();
  ctx.moveTo(L * 0.3, -L * 0.115);
  ctx.quadraticCurveTo(L * 0.45, -L * 0.1, L * 0.52, 0);
  ctx.quadraticCurveTo(L * 0.45, L * 0.1, L * 0.3, L * 0.115);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#7fd0ff';
  ctx.beginPath();
  ctx.arc(L * 0.08, 0, L * 0.065, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

const DRAW: Record<VehicleId, (ctx: CanvasRenderingContext2D, L: number, p: VehiclePose) => void> = {
  car,
  boat,
  plane,
  rocket,
};
