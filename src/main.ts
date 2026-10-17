import './style.css';
import { play, setEngineSpeed, startEngine, stopEngine, unlockAudio } from './audio';
import { VEHICLE_LENGTH, VEHICLE_SCREEN_X, VIEW_AHEAD, type VehicleId } from './config';
import { Drive, type DriveEvent } from './game/drive';
import { buy, loadSave, recordDistance, writeSave, type UpgradeId } from './game/save';
import { Effects } from './render/effects';
import { drawThing } from './render/things';
import { drawVehicle, loadArt } from './render/vehicles';
import { WORLDS, speedLines, type View } from './render/worlds';
import { hidePause, showGarage, showHome, showHud, showPause, showResults, type Hud } from './ui/screens';

type Mode = 'home' | 'garage' | 'drive' | 'paused' | 'results';

const canvas = document.getElementById('world') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const ui = document.getElementById('ui')!;
const effects = new Effects();
const save = loadSave(localStorage);

let mode: Mode = 'home';
let drive: Drive | null = null;
let hud: Hud | null = null;
let backdrop: VehicleId = 'car';
let attract = 0;
let clock = 0;
let w = 0;
let h = 0;
let dpr = 1;

function persist() {
  writeSave(localStorage, save);
}

function goHome() {
  play('tap');
  stopEngine();
  drive = null;
  hud = null;
  mode = 'home';
  effects.clear();
  showHome(ui, save, startDrive, goGarage);
}

function goGarage() {
  play('tap');
  mode = 'garage';
  renderGarage();
}

function renderGarage() {
  showGarage(ui, save, buyUpgrade, goHome);
}

function buyUpgrade(id: UpgradeId) {
  if (!buy(save, id)) return;
  persist();
  play('buy');
  renderGarage();
}

function startDrive(id: VehicleId) {
  play('tap');
  backdrop = id;
  drive = new Drive(id, save);
  effects.clear();
  mode = 'drive';
  hud = showHud(ui, pause);
  startEngine(id);
}

function pause() {
  if (mode !== 'drive') return;
  mode = 'paused';
  releaseFinger();
  stopEngine();
  showPause(ui, resume, goHome);
}

function resume() {
  if (!drive) return;
  play('tap');
  hidePause(ui);
  mode = 'drive';
  startEngine(drive.vehicle);
}

function finish(d: Drive) {
  const newBest = recordDistance(save, d.vehicle, d.distance);
  persist();
  stopEngine();
  play(newBest ? 'best' : 'finish');
  mode = 'results';
  hud = null;
  showResults(
    ui,
    { distance: d.distance, best: save.best[d.vehicle], newBest, gears: d.gears },
    () => startDrive(d.vehicle),
    goHome,
  );
}

function vehicleScreen(d: Drive) {
  return { x: w * VEHICLE_SCREEN_X, y: d.steering.y * h };
}

function handle(d: Drive, e: DriveEvent) {
  const at = vehicleScreen(d);
  const popY = at.y - h * 0.08;
  switch (e.type) {
    case 'clock':
      play('clock');
      effects.popup('+5 sec', at.x, popY, '#7fd0ff');
      break;
    case 'boost':
      play('boost');
      effects.popup('Boost!', at.x, popY, '#ff8a1f');
      break;
    case 'gear':
      save.gears += 1;
      persist();
      play('gear');
      effects.popup('+1', at.x, popY, '#ffc531');
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        effects.emit(at.x + 30, at.y, Math.cos(a) * 160, Math.sin(a) * 160, 4, '#ffc531', 0.4);
      }
      break;
    case 'bump':
      play('bump');
      effects.shake = 8;
      effects.popup('Bonk!', at.x, popY, '#ffffff');
      break;
    case 'timeup':
      break;
    case 'done':
      finish(d);
      break;
  }
}

// Trail behind each vehicle: dust, splash, contrail, or rocket sparks.
function trail(d: Drive, dt: number, ppm: number) {
  const L = VEHICLE_LENGTH * ppm;
  const { x, y } = vehicleScreen(d);
  const pace = d.speed / d.topSpeed;
  const scroll = d.speed * ppm;
  if (Math.random() > dt * 40 * pace) return;
  const r = Math.random();
  switch (d.vehicle) {
    case 'car':
      effects.emit(x - L * 0.38, y + L * 0.24, -scroll * 0.4 - 40, -20 - r * 30, 5 + r * 4, '#b9a586', 0.6);
      break;
    case 'boat':
      effects.emit(x - L * 0.45, y + L * 0.06, -scroll * 0.5, -40 - r * 80, 3 + r * 4, '#ffffff', 0.5);
      break;
    case 'plane':
      effects.emit(x - L * 0.5, y - L * 0.02, -scroll, (r - 0.5) * 10, 3, '#ffffff', 1);
      break;
    case 'rocket':
      effects.emit(x - L * 0.8, y + (r - 0.5) * L * 0.12, -scroll * 0.8, (r - 0.5) * 80, 3 + r * 3, r > 0.5 ? '#ffd23f' : '#ff6a2b', 0.4);
      break;
  }
}

function tilt(d: Drive) {
  const lean = { car: 0.12, boat: 0.12, plane: 0.6, rocket: 0.3 }[d.vehicle];
  return Math.max(-0.4, Math.min(0.4, d.steering.vy * lean));
}

function render(dt: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ppm = (w * (1 - VEHICLE_SCREEN_X)) / VIEW_AHEAD;
  const world = drive?.vehicle ?? backdrop;
  const view: View = {
    w,
    h,
    ppm,
    distance: drive ? drive.distance : attract,
    t: clock,
    speed: drive ? drive.speed : 8,
    boosting: !!drive && drive.boostLeft > 0,
  };

  if (effects.shake > 0) ctx.translate((Math.random() - 0.5) * effects.shake, (Math.random() - 0.5) * effects.shake);
  WORLDS[world](ctx, view);
  if (!drive) return;

  const { x, y } = vehicleScreen(drive);
  const r = Math.max(22, h * 0.035);
  for (const t of drive.things) {
    if (t.hit && t.kind !== 'obstacle') continue;
    drawThing(ctx, t.kind, world, x + (t.x - drive.distance) * ppm, t.y * h, r, clock, t.hit);
  }
  if (mode === 'drive') trail(drive, dt, ppm);
  effects.drawParticles(ctx);
  drawVehicle(ctx, world, x, y, VEHICLE_LENGTH * ppm, {
    t: clock,
    distance: drive.distance,
    tilt: tilt(drive),
    boosting: view.boosting,
  });
  if (view.boosting) speedLines(ctx, view);
  effects.drawPopups(ctx, Math.max(28, h * 0.05));
}

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (mode !== 'paused') {
    clock += dt;
    effects.update(dt);
  }
  if (mode === 'drive' && drive) {
    const d = drive;
    for (const e of d.update(dt)) handle(d, e);
    setEngineSpeed(d.speed);
    hud?.update(d, save.gears);
  } else if (mode === 'home' || mode === 'garage') {
    attract += dt * 8;
  }
  render(dt);
  requestAnimationFrame(frame);
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  if (h > w) pause();
}

let finger: number | null = null;
let lastY = 0;

function releaseFinger() {
  finger = null;
  drive?.steering.release();
}

canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'drive' || finger !== null) return;
  finger = e.pointerId;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== finger || !drive || mode !== 'drive') return;
  drive.steering.drag((e.clientY - lastY) / h);
  lastY = e.clientY;
});
for (const type of ['pointerup', 'pointercancel'] as const) {
  canvas.addEventListener(type, (e) => {
    if (e.pointerId === finger) releaseFinger();
  });
}

window.addEventListener('pointerdown', unlockAudio, true);
window.addEventListener('touchend', unlockAudio, true);
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
window.addEventListener('resize', resize);

resize();
requestAnimationFrame(frame);
void loadArt().then(() => {
  if (mode === 'home') showHome(ui, save, startDrive, goGarage);
});
showHome(ui, save, startDrive, goGarage);
