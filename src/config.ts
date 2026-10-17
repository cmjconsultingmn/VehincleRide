export type VehicleId = 'car' | 'boat' | 'plane' | 'rocket';
export type SteeringMode = 'lanes' | 'glide';

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  world: string;
  steering: SteeringMode;
  speed: number;
}

export const VEHICLES: VehicleSpec[] = [
  { id: 'car', name: 'Car', world: 'The Road', steering: 'lanes', speed: 1.0 },
  { id: 'boat', name: 'Boat', world: 'The Ocean', steering: 'lanes', speed: 0.8 },
  { id: 'plane', name: 'Plane', world: 'The Sky', steering: 'glide', speed: 1.3 },
  { id: 'rocket', name: 'Rocket', world: 'Space', steering: 'glide', speed: 1.7 },
];

export const VEHICLE_IDS = VEHICLES.map((v) => v.id);

export function vehicleSpec(id: VehicleId): VehicleSpec {
  return VEHICLES.find((v) => v.id === id)!;
}

// Meters per second at 100% speed.
export const BASE_SPEED = 20;
// How many meters of world are visible ahead of the vehicle.
export const VIEW_AHEAD = 60;
// Vehicle sits this far across the screen.
export const VEHICLE_SCREEN_X = 0.25;
// Vehicle length in world meters.
export const VEHICLE_LENGTH = 8;

export const DRIVE_SECONDS = 120;
export const COAST_SECONDS = 2.5;

// Lane centers and glide limits, as fractions of screen height.
export const LANES = [0.42, 0.63, 0.84];
export const GLIDE_MIN = 0.14;
export const GLIDE_MAX = 0.88;
// A drag this long (fraction of screen height) moves one lane.
export const LANE_SWIPE = 0.06;
// Glide steering moves the vehicle this much per unit of finger drag.
export const GLIDE_GAIN = 1.3;

export const CLOCK_SECONDS = 5;
export const BOOST_SECONDS = 3;
export const BOOST_MULTIPLIER = 1.5;
export const BUMP_SECONDS = 1;
export const BUMP_MULTIPLIER = 0.5;

export const PICKUP_ODDS = { clock: 0.2, boost: 0.2, gear: 0.6 };
export const PICKUP_EVERY = [3, 4];
export const OBSTACLE_EVERY = [4, 6];
export const FIRST_OBSTACLE_AT = 6;

// Hit box around the vehicle: meters along the road, fraction of height up and down.
export const HIT_X = 4;
export const HIT_Y = 0.09;

export const UPGRADE_COSTS = [10, 20, 30, 40, 50];
export const TIMER_UPGRADE_SECONDS = 10;
export const SPEED_UPGRADE_STEP = 0.1;
