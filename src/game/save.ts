import {
  DRIVE_SECONDS,
  SPEED_UPGRADE_STEP,
  TIMER_UPGRADE_SECONDS,
  UPGRADE_COSTS,
  VEHICLE_IDS,
  type VehicleId,
} from '../config';

export type UpgradeId = 'timer' | 'speed';

export interface SaveData {
  gears: number;
  timer: number;
  speed: number;
  best: Record<VehicleId, number>;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

const KEY = 'vehicle-ride-save-v1';

export function freshSave(): SaveData {
  return {
    gears: 0,
    timer: 0,
    speed: 0,
    best: Object.fromEntries(VEHICLE_IDS.map((id) => [id, 0])) as Record<VehicleId, number>,
  };
}

export function loadSave(store: Store): SaveData {
  const save = freshSave();
  const raw = store.getItem(KEY);
  if (!raw) return save;
  try {
    const data = JSON.parse(raw) as Partial<SaveData>;
    return { ...save, ...data, best: { ...save.best, ...data.best } };
  } catch {
    return save;
  }
}

export function writeSave(store: Store, save: SaveData) {
  store.setItem(KEY, JSON.stringify(save));
}

export function maxLevel() {
  return UPGRADE_COSTS.length;
}

export function nextCost(level: number): number | null {
  return level < UPGRADE_COSTS.length ? UPGRADE_COSTS[level] : null;
}

export function canBuy(save: SaveData, id: UpgradeId) {
  const cost = nextCost(save[id]);
  return cost !== null && save.gears >= cost;
}

export function buy(save: SaveData, id: UpgradeId): boolean {
  const cost = nextCost(save[id]);
  if (cost === null || save.gears < cost) return false;
  save.gears -= cost;
  save[id] += 1;
  return true;
}

export function startSeconds(timerLevel: number) {
  return DRIVE_SECONDS + TIMER_UPGRADE_SECONDS * timerLevel;
}

export function speedBonus(speedLevel: number) {
  return 1 + SPEED_UPGRADE_STEP * speedLevel;
}

// Returns true when this drive beat the vehicle's best distance.
export function recordDistance(save: SaveData, id: VehicleId, distance: number) {
  if (distance <= save.best[id]) return false;
  save.best[id] = distance;
  return true;
}
