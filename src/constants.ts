import { WeaponID, WeaponConfig } from './types';

export const WEAPON_CONFIGS: Record<WeaponID, WeaponConfig> = {
  [WeaponID.PLASMA_LASER]: {
    id: WeaponID.PLASMA_LASER,
    name: 'Plasma Laser',
    description: 'High velocity dual plasma bolts. Reliable and low energy consumption.',
    damage: 20,
    fireRate: 200, // min cooldown in ms
    energyCost: 3,
    color: '#D4AF37', // Gold
    projectileSpeed: 30, // speed in Z units per frame
    soundFrequency: 800,
  },
  [WeaponID.PROTON_TORPEDO]: {
    id: WeaponID.PROTON_TORPEDO,
    name: 'Proton Torpedo',
    description: 'Slow-moving thermonuclear payload that triggers high splash damage.',
    damage: 100,
    fireRate: 800,
    energyCost: 20,
    color: '#E11D48', // Crimson Rose
    projectileSpeed: 14,
    soundFrequency: 200,
  },
  [WeaponID.ION_BEAM]: {
    id: WeaponID.ION_BEAM,
    name: 'Ion Beam',
    description: 'Continuous ionized beam. Instant hit but drains ship reserves extremely quickly.',
    damage: 4, // damage per frame (very fast)
    fireRate: 40,
    energyCost: 2.2, // per beam frame
    color: '#A78BFA', // Amethyst violet
    projectileSpeed: 999, // instant
    soundFrequency: 1200,
  },
  [WeaponID.FLAK_CANNON]: {
    id: WeaponID.FLAK_CANNON,
    name: 'Disruptor Flak',
    description: 'Fires massive fragmented kinetic clusters to clear smaller fast asteroids.',
    damage: 15, // per shard
    fireRate: 450,
    energyCost: 12,
    color: '#34D399', // Jade green
    projectileSpeed: 24,
    soundFrequency: 500,
  },
};

export const INITIAL_SHIELD = 100;
export const INITIAL_ENERGY = 100;

export interface LevelConfig {
  number: number;
  name: string;
  targetCount: number; // raw asteroids to blast to unlock next level
  spawnInterval: number; // ms between spans
  asteroidSpeedMin: number;
  asteroidSpeedMax: number;
  asteroidMaxHealth: number;
  starSpeedMultiplier: number;
}

export const LEVELS: LevelConfig[] = [
  {
    number: 1,
    name: 'Orion belt Margin',
    targetCount: 15,
    spawnInterval: 1400,
    asteroidSpeedMin: 1.8,
    asteroidSpeedMax: 4.0,
    asteroidMaxHealth: 20,
    starSpeedMultiplier: 1.0,
  },
  {
    number: 2,
    name: 'Helios Chasm Cluster',
    targetCount: 22,
    spawnInterval: 1100,
    asteroidSpeedMin: 2.4,
    asteroidSpeedMax: 5.5,
    asteroidMaxHealth: 40,
    starSpeedMultiplier: 1.5,
  },
  {
    number: 3,
    name: 'Nebula-9 Core Dust',
    targetCount: 30,
    spawnInterval: 900,
    asteroidSpeedMin: 3.0,
    asteroidSpeedMax: 7.2,
    asteroidMaxHealth: 60,
    starSpeedMultiplier: 2.2,
  },
  {
    number: 4,
    name: 'Omega Void Event Horizon',
    targetCount: 45,
    spawnInterval: 750,
    asteroidSpeedMin: 3.8,
    asteroidSpeedMax: 9.0,
    asteroidMaxHealth: 85,
    starSpeedMultiplier: 3.0,
  },
  {
    number: 5,
    name: 'Hyperspace Overload Void',
    targetCount: 60,
    spawnInterval: 600,
    asteroidSpeedMin: 4.5,
    asteroidSpeedMax: 11.5,
    asteroidMaxHealth: 120,
    starSpeedMultiplier: 4.0,
  },
];
