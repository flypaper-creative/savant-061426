export enum WeaponID {
  PLASMA_LASER = 'PLASMA_LASER',
  PROTON_TORPEDO = 'PROTON_TORPEDO',
  ION_BEAM = 'ION_BEAM',
  FLAK_CANNON = 'FLAK_CANNON',
  GAUSS_CANNON = 'GAUSS_CANNON',
  PHASER = 'PHASER',
  NUKE = 'NUKE'
}

export enum AsteroidType {
  NORMAL = 'NORMAL',
  RADIOACTIVE = 'RADIOACTIVE',
  GOLDEN = 'GOLDEN',
  ICE = 'ICE',
  DRONE = 'DRONE',
  ENEMY_SHIP = 'ENEMY_SHIP',
  DEBRIS = 'DEBRIS',
  NOVA = 'NOVA',               // Triggers a massive smart-bomb clearing nearby rocks
  TIME_WARP = 'TIME_WARP',     // Slows down all rocks for a few seconds (bullet time)
  ALIEN_SUBMARINE = 'ALIEN_SUBMARINE', // Alien submarines in water world
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
  rotSpeedX?: number;
  rotSpeedY?: number;
  rotSpeedZ?: number;
  shapeScaleX?: number;
  shapeScaleY?: number;
  shapeScaleZ?: number;
  craterSeeds: number[]; // random numbers to draw unique craters
  hitFlashTime: number; // frames a hit flash lasts
  type: AsteroidType;
  droneFireCooldown?: number; // specialized for enemy fighter drones
  flightPattern?: string;
  flightOffset?: number;
}

export interface Pickup3D {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  type: 'SHIELD' | 'ENERGY' | 'SCRAP' | 'WEAPON_GAUSS' | 'WEAPON_PHASER' | 'WEAPON_NUKE';
  size: number;
  brightness: number;
  harvestProgress: number; // 0 to 1 as crosshair is held over it
}

export interface PilotPerks {
  maxShield: number;
  maxEnergy: number;
  energyRegenRate: number;
  damageMultiplier: number;
  doubleShotChance: number;
  unlockedGauss: boolean;
  unlockedPhaser: boolean;
  unlockedNuke: boolean;
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
  isEnemy?: boolean; // Enemy counter-offensive lasers
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
  isShockwave?: boolean;
  isChunk?: boolean;
}

export interface Star {
  x: number;
  y: number;
  z: number; // distance
  brightness: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isShockwave?: boolean;
  isChunk?: boolean;
}

export type ThemeType = 'CYBERPUNK' | 'ARCADE' | 'MINIMAL_TECH';
export type GamePhase = 'INTRO' | 'PLAYING' | 'WARPING' | 'PERK_SELECTION' | 'GAME_OVER' | 'VICTORY';

export enum DifficultyLevel {
  RECRUIT = 'RECRUIT',
  VETERAN = 'VETERAN',
  ELITE = 'ELITE',
}

export enum SystemID {
  ALPHA_CENTAURI = 'ALPHA_CENTAURI',
  BETELGEUSE = 'BETELGEUSE',
  ANDROMEDA = 'ANDROMEDA',
  SIRIUS_PRIME = 'SIRIUS_PRIME',
  KEPLER_186F = 'KEPLER_186F',
  ORION_NEBULA = 'ORION_NEBULA',
  TRAPPIST_1 = 'TRAPPIST_1',
  GLIESE_WATERWORLD = 'GLIESE_WATERWORLD',
}

export interface StarSystem {
  id: SystemID;
  name: string;
  codename: string;
  description: string;
  hazardLevel: string;
  dangerIndex: number; // 1 to 5 scale
  completed: boolean;
  quota: number; // asteroids destroyed to complete the sector
  progress: number; // current cleared count in this sector
  accentColor: string;
  nebulaColors: string[]; // hex strings for 3D nebulae
  musicBPM: number;
}

export interface WarpGate {
  id: string;
  targetSystemId: SystemID;
  x: number;
  y: number;
  z: number; // distance 0.1 to 1500
  radius: number;
  color: string;
  pulseTime: number;
}

export interface PilotStats {
  score: number;
  asteroidsDestroyed: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
}


export interface Shockwave {
  x: number;
  y: number;
  z: number;
  radius: number;
  maxRadius: number;
  color: string;
}
