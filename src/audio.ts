import type { VehicleId } from './config';

export type Sound = 'gear' | 'clock' | 'boost' | 'bump' | 'tap' | 'buy' | 'finish' | 'best';

// Engine hum per vehicle: wave shape, base pitch, and how much it rises with speed.
const ENGINES: Record<VehicleId, { type: OscillatorType | 'noise'; base: number; rise: number; volume: number }> = {
  car: { type: 'sawtooth', base: 55, rise: 1.4, volume: 0.05 },
  boat: { type: 'triangle', base: 45, rise: 1.0, volume: 0.08 },
  plane: { type: 'square', base: 70, rise: 1.2, volume: 0.03 },
  rocket: { type: 'noise', base: 400, rise: 18, volume: 0.12 },
};

let ctx: AudioContext | null = null;
let master: GainNode;
let engine: { stop: () => void; set: (speed: number) => void } | null = null;

// iPad Safari only allows audio after a tap, so this runs on the first touch.
export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(type: OscillatorType, from: number, to: number, start: number, length: number, volume: number) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

function noiseBuffer(c: AudioContext) {
  const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function play(sound: Sound) {
  switch (sound) {
    case 'gear':
      tone('sine', 988, 1319, 0, 0.12, 0.3);
      tone('sine', 1319, 1760, 0.07, 0.15, 0.25);
      break;
    case 'clock':
      tone('square', 1200, 1200, 0, 0.05, 0.12);
      tone('square', 900, 900, 0.12, 0.05, 0.12);
      tone('sine', 1568, 2093, 0.24, 0.3, 0.25);
      break;
    case 'boost':
      tone('sawtooth', 180, 900, 0, 0.45, 0.15);
      tone('sine', 360, 1400, 0.05, 0.45, 0.15);
      break;
    case 'bump':
      tone('sine', 160, 50, 0, 0.25, 0.5);
      tone('triangle', 90, 40, 0, 0.2, 0.3);
      break;
    case 'tap':
      tone('sine', 660, 880, 0, 0.08, 0.2);
      break;
    case 'buy':
      [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, i * 0.08, 0.18, 0.25));
      break;
    case 'finish':
      [784, 659, 523].forEach((f, i) => tone('triangle', f, f, i * 0.14, 0.25, 0.25));
      break;
    case 'best':
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, f, i * 0.1, 0.25, 0.25));
      break;
  }
}

export function startEngine(vehicle: VehicleId) {
  stopEngine();
  if (!ctx) return;
  const c = ctx;
  const spec = ENGINES[vehicle];
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(spec.volume, c.currentTime + 0.5);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = spec.type === 'noise' ? spec.base : 600;
  filter.connect(gain).connect(master);

  let source: AudioScheduledSourceNode;
  let pitch: AudioParam;
  if (spec.type === 'noise') {
    const n = c.createBufferSource();
    n.buffer = noiseBuffer(c);
    n.loop = true;
    source = n;
    pitch = filter.frequency;
  } else {
    const osc = c.createOscillator();
    osc.type = spec.type;
    osc.frequency.value = spec.base;
    source = osc;
    pitch = osc.frequency;
  }
  source.connect(filter);
  source.start();

  engine = {
    set(speed) {
      pitch.setTargetAtTime(spec.base + speed * spec.rise, c.currentTime, 0.1);
    },
    stop() {
      gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.15);
      source.stop(c.currentTime + 0.6);
    },
  };
}

export function setEngineSpeed(speed: number) {
  engine?.set(speed);
}

export function stopEngine() {
  engine?.stop();
  engine = null;
}
