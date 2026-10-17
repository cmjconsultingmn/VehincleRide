import { VEHICLES, type VehicleId } from '../config';
import type { Drive } from '../game/drive';
import { canBuy, maxLevel, nextCost, type SaveData, type UpgradeId } from '../game/save';
import { gearPath } from '../render/things';
import { drawVehicle } from '../render/vehicles';

export function formatDistance(m: number) {
  return `${Math.floor(m).toLocaleString()} m`;
}

export function formatTime(s: number) {
  const whole = Math.ceil(s);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

const GEAR = '<canvas class="gear-icon" width="80" height="80"></canvas>';

function paintGears(root: HTMLElement) {
  root.querySelectorAll<HTMLCanvasElement>('.gear-icon').forEach((c) => {
    const ctx = c.getContext('2d')!;
    ctx.translate(40, 40);
    gearPath(ctx, 34, 0.2);
    ctx.fillStyle = '#ffc531';
    ctx.strokeStyle = '#8a5a00';
    ctx.lineWidth = 5;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a5a00';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
  });
}

function mount(root: HTMLElement, html: string) {
  root.innerHTML = html;
  paintGears(root);
}

function on(root: HTMLElement, selector: string, handler: () => void) {
  root.querySelector<HTMLElement>(selector)!.addEventListener('click', handler);
}

export function showHome(root: HTMLElement, save: SaveData, pick: (id: VehicleId) => void, garage: () => void) {
  mount(
    root,
    `<div class="screen">
      <div class="topbar">
        <button class="garage">🔧 Garage</button>
        <h1>Vehicle Ride</h1>
        <span class="gears">${GEAR}${save.gears}</span>
      </div>
      <div class="cards">
        ${VEHICLES.map(
          (v) => `<div class="card ${v.id}" data-id="${v.id}">
            <canvas width="320" height="240"></canvas>
            <div class="name">${v.name}</div>
            <div class="world">${v.world}</div>
            <div class="best">${save.best[v.id] > 0 ? `Best ${formatDistance(save.best[v.id])}` : '&nbsp;'}</div>
          </div>`,
        ).join('')}
      </div>
    </div>`,
  );
  root.querySelectorAll<HTMLElement>('.card').forEach((card) => {
    const id = card.dataset.id as VehicleId;
    const ctx = card.querySelector('canvas')!.getContext('2d')!;
    drawVehicle(ctx, id, 180, 125, 210, { t: 0, distance: 0, tilt: 0, boosting: false });
    card.addEventListener('click', () => pick(id));
  });
  on(root, '.garage', garage);
}

const UPGRADES: { id: UpgradeId; name: string; each: string }[] = [
  { id: 'timer', name: '⏱ Timer length', each: '+10 seconds each level' },
  { id: 'speed', name: '⚡ Top speed', each: '+10% speed each level' },
];

export function showGarage(root: HTMLElement, save: SaveData, buy: (id: UpgradeId) => void, back: () => void) {
  mount(
    root,
    `<div class="screen dim">
      <div class="topbar">
        <button class="back">← Home</button>
        <span class="gears">${GEAR}${save.gears}</span>
      </div>
      <div class="panel">
        <h2>Garage</h2>
        ${UPGRADES.map((u) => {
          const level = save[u.id];
          const cost = nextCost(level);
          const pips = Array.from({ length: maxLevel() }, (_, i) => `<span class="pip ${i < level ? 'on' : ''}"></span>`).join('');
          const label = cost === null ? 'MAX' : `Buy ${GEAR}${cost}`;
          return `<div class="upgrade">
            <div>${u.name}<small>${u.each}</small></div>
            <div class="pips">${pips}</div>
            <button class="buy go" data-id="${u.id}" ${canBuy(save, u.id) ? '' : 'disabled'}>${label}</button>
          </div>`;
        }).join('')}
      </div>
    </div>`,
  );
  root.querySelectorAll<HTMLButtonElement>('.buy').forEach((b) => b.addEventListener('click', () => buy(b.dataset.id as UpgradeId)));
  on(root, '.back', back);
}

export interface ResultsInfo {
  distance: number;
  best: number;
  newBest: boolean;
  gears: number;
}

export function showResults(root: HTMLElement, r: ResultsInfo, again: () => void, home: () => void) {
  mount(
    root,
    `<div class="screen dim">
      <div class="panel">
        <h2>Time's up!</h2>
        ${r.newBest ? '<div class="newbest">New best!</div>' : ''}
        <div class="stat"><span>This drive</span><b>${formatDistance(r.distance)}</b></div>
        <div class="stat"><span>Best</span><b>${formatDistance(r.best)}</b></div>
        <div class="stat"><span>Gears earned</span><b>${GEAR} ${r.gears}</b></div>
        <div class="buttons">
          <button class="home">Home</button>
          <button class="again go">Drive Again</button>
        </div>
      </div>
    </div>`,
  );
  on(root, '.again', again);
  on(root, '.home', home);
}

export function showPause(root: HTMLElement, resume: () => void, home: () => void) {
  const layer = document.createElement('div');
  layer.className = 'screen dim pause-layer';
  layer.innerHTML = `<div class="panel">
      <h2>Paused</h2>
      <div class="buttons">
        <button class="home">Home</button>
        <button class="resume go">Keep Driving</button>
      </div>
    </div>`;
  root.appendChild(layer);
  on(layer, '.resume', resume);
  on(layer, '.home', home);
}

export function hidePause(root: HTMLElement) {
  root.querySelector('.pause-layer')?.remove();
}

export interface Hud {
  update(drive: Drive, gears: number): void;
}

export function showHud(root: HTMLElement, pause: () => void): Hud {
  mount(
    root,
    `<div class="hud">
      <div class="row">
        <div class="pill distance"></div>
        <div>
          <div class="pill timer"></div>
          <div class="pill boost-badge" hidden>BOOST!</div>
        </div>
        <span class="gears">${GEAR}<span class="gear-count"></span></span>
      </div>
      <button class="pause" aria-label="Pause">❚❚</button>
    </div>`,
  );
  on(root, '.pause', pause);
  const distance = root.querySelector<HTMLElement>('.distance')!;
  const timer = root.querySelector<HTMLElement>('.timer')!;
  const boost = root.querySelector<HTMLElement>('.boost-badge')!;
  const gearCount = root.querySelector<HTMLElement>('.gear-count')!;
  const set = (el: HTMLElement, text: string) => {
    if (el.textContent !== text) el.textContent = text;
  };
  return {
    update(drive, gears) {
      set(distance, formatDistance(drive.distance));
      set(timer, formatTime(drive.timeLeft));
      timer.classList.toggle('low', drive.timeLeft <= 10 && drive.phase === 'driving');
      boost.hidden = drive.boostLeft <= 0;
      set(gearCount, String(gears));
    },
  };
}
