import { WeaponID, WeaponConfig } from './types';

export const WEAPON_CONFIGS: Record<WeaponID, WeaponConfig> = {
  [WeaponID.ION_BEAM]: {
    id: WeaponID.ION_BEAM,
    name: 'BEAM',
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
    name: 'FLAK',
    description: 'Fires massive fragmented kinetic clusters to clear smaller fast asteroids.',
    damage: 15, // per shard
    fireRate: 450,
    energyCost: 12,
    color: '#34D399', // Jade green
    projectileSpeed: 24,
    soundFrequency: 500,
  },
  [WeaponID.PLASMA_LASER]: {
    id: WeaponID.PLASMA_LASER,
    name: 'PLASMA',
    description: 'High velocity dual plasma bolts. Reliable and low energy consumption.',
    damage: 20,
    fireRate: 200, // min cooldown in ms
    energyCost: 3,
    color: '#D4AF37', // Gold
    projectileSpeed: 30, // speed in Z units per frame
    soundFrequency: 800,
  },
  [WeaponID.TESLA_CHAIN]: {
    id: WeaponID.TESLA_CHAIN,
    name: 'TESLA',
    description: 'Electrical arc that chains across multiple conductive debris fields.',
    damage: 25,
    fireRate: 300,
    energyCost: 5,
    color: '#60A5FA', // Blue
    projectileSpeed: 45,
    soundFrequency: 1000,
  },
  [WeaponID.PHASER]: {
    id: WeaponID.PHASER,
    name: 'PHASER',
    description: 'Phased energy bursts with high tracking capability.',
    damage: 40,
    fireRate: 150,
    energyCost: 8,
    color: '#F472B6',
    projectileSpeed: 35,
    soundFrequency: 900,
  },
  [WeaponID.PULSAR_BURST]: {
    id: WeaponID.PULSAR_BURST,
    name: 'PULSAR',
    description: 'Fires rapid bursts of concentrated neutron star material.',
    damage: 60,
    fireRate: 600,
    energyCost: 15,
    color: '#FDE047', // Yellow
    projectileSpeed: 32,
    soundFrequency: 600,
  },
  [WeaponID.PROTON_TORPEDO]: {
    id: WeaponID.PROTON_TORPEDO,
    name: 'TORPEDO',
    description: 'Slow-moving thermonuclear payload that triggers high splash damage.',
    damage: 100,
    fireRate: 800,
    energyCost: 20,
    color: '#E11D48', // Crimson Rose
    projectileSpeed: 14,
    soundFrequency: 200,
  },
  [WeaponID.GRAVITON_PULSE]: {
    id: WeaponID.GRAVITON_PULSE,
    name: 'GRAVITON',
    description: 'High pressure graviton sphere. Rips apart structural limits.',
    damage: 120,
    fireRate: 1000,
    energyCost: 25,
    color: '#4ADE80', // Green
    projectileSpeed: 20,
    soundFrequency: 300,
  },
  [WeaponID.GAUSS_CANNON]: {
    id: WeaponID.GAUSS_CANNON,
    name: 'GAUSS',
    description: 'Electromagnetic railgun firing slugs at relativistic speeds.',
    damage: 180,
    fireRate: 1500,
    energyCost: 35,
    color: '#0EA5E9',
    projectileSpeed: 80,
    soundFrequency: 150,
  },
  [WeaponID.TACHYON_LANCE]: {
    id: WeaponID.TACHYON_LANCE,
    name: 'TACHYON',
    description: 'A beam moving faster than light. Instantly incinerates targets.',
    damage: 250,
    fireRate: 2000,
    energyCost: 45,
    color: '#2DD4BF', // Teal
    projectileSpeed: 999, // instant
    soundFrequency: 450,
  },
  [WeaponID.VOID_RAY]: {
    id: WeaponID.VOID_RAY,
    name: 'VOID',
    description: 'Harnesses dark matter to disintegrate massive targets cleanly.',
    damage: 400,
    fireRate: 2500,
    energyCost: 55,
    color: '#818CF8', // Indigo
    projectileSpeed: 50,
    soundFrequency: 120,
  },
  [WeaponID.ANTIMATTER_BEAM]: {
    id: WeaponID.ANTIMATTER_BEAM,
    name: 'ANTIMATTER',
    description: 'Channels raw antimatter plasma. Vaporizes immediately.',
    damage: 800,
    fireRate: 3500,
    energyCost: 70,
    color: '#FB7185', // Rose
    projectileSpeed: 60,
    soundFrequency: 100,
  },
  [WeaponID.NUKE]: {
    id: WeaponID.NUKE,
    name: 'NUKE',
    description: 'Tactical nuclear warhead. Devastating payload.',
    damage: 1500,
    fireRate: 3000,
    energyCost: 80,
    color: '#FCD34D',
    projectileSpeed: 10,
    soundFrequency: 80,
  },
  [WeaponID.SINGULARITY_CANNON]: {
    id: WeaponID.SINGULARITY_CANNON,
    name: 'SINGULARITY',
    description: 'Miniature black hole payload. Ultimate destructive force.',
    damage: 5000,
    fireRate: 6000,
    energyCost: 100,
    color: '#000000', // Black
    projectileSpeed: 8,
    soundFrequency: 40,
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
    name: 'ALPHA CENTAURI',
    targetCount: 15,
    spawnInterval: 1400,
    asteroidSpeedMin: 0.8,
    asteroidSpeedMax: 1.5,
    asteroidMaxHealth: 20,
    starSpeedMultiplier: 1.0,
  },
  {
    number: 2,
    name: 'BETELGEUSE',
    targetCount: 22,
    spawnInterval: 1100,
    asteroidSpeedMin: 1.0,
    asteroidSpeedMax: 1.8,
    asteroidMaxHealth: 40,
    starSpeedMultiplier: 1.5,
  },
  {
    number: 3,
    name: 'ANDROMEDA',
    targetCount: 30,
    spawnInterval: 900,
    asteroidSpeedMin: 1.2,
    asteroidSpeedMax: 2.2,
    asteroidMaxHealth: 60,
    starSpeedMultiplier: 2.2,
  },
  {
    number: 4,
    name: 'SIRIUS PRIME',
    targetCount: 45,
    spawnInterval: 750,
    asteroidSpeedMin: 1.5,
    asteroidSpeedMax: 2.6,
    asteroidMaxHealth: 85,
    starSpeedMultiplier: 3.0,
  },
  {
    number: 5,
    name: 'KEPLER-186F',
    targetCount: 60,
    spawnInterval: 600,
    asteroidSpeedMin: 1.8,
    asteroidSpeedMax: 3.0,
    asteroidMaxHealth: 120,
    starSpeedMultiplier: 4.0,
  },
  {
    number: 6,
    name: 'ORION NEBULA',
    targetCount: 80,
    spawnInterval: 500,
    asteroidSpeedMin: 2.2,
    asteroidSpeedMax: 3.5,
    asteroidMaxHealth: 160,
    starSpeedMultiplier: 5.0,
  },
  {
    number: 7,
    name: 'TRAPPIST-1',
    targetCount: 100,
    spawnInterval: 400,
    asteroidSpeedMin: 2.5,
    asteroidSpeedMax: 4.0,
    asteroidMaxHealth: 210,
    starSpeedMultiplier: 6.0,
  },
];
