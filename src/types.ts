export enum WeaponID {
  PLASMA_LASER = 'PLASMA_LASER',
  PROTON_TORPEDO = 'PROTON_TORPEDO',
  ION_BEAM = 'ION_BEAM',
  FLAK_CANNON = 'FLAK_CANNON',
}

export interface WeaponConfig {
  id: WeaponID;
  name: string;
  description: string;
  damage: number;
  fireRate: number; // shots per ms or fire interval in ms
  energyCost: number; // energy consumed per shot
  color: string;
  projectileSpeed: number;
  soundFrequency: number; // baseline synth frequency
}

export interface Asteroid {
  id: string;
  x: number; // relative to screen center (-300 to 300)
  y: number; // relative to screen center (-300 to 300)
  z: number; // distance from ship (0.1 to 1000)
  size: number; // visual scale factor in 3D space
  radius: number; // physical radius
  maxHealth: number;
  health: number;
  speed: number;
  rotationAngle: number;
  rotationSpeed: number;
  craterSeeds: number[]; // random numbers to draw unique craters
  hitFlashTime: number; // frames a hit flash lasts
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  color: string;
  size: number;
  type: WeaponID;
}

export interface ExplosionParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Star {
  x: number;
  y: number;
  z: number; // distance
  brightness: number;
}

export type GamePhase = 'INTRO' | 'PLAYING' | 'WARPING' | 'GAME_OVER' | 'VICTORY';

export interface PilotStats {
  score: number;
  asteroidsDestroyed: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
}
