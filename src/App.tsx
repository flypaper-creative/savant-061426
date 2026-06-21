import { useState, useEffect } from 'react';
import { WeaponID, GamePhase, PilotStats, PilotPerks, DifficultyLevel, SystemID, StarSystem, ThemeType } from './types';
import AsteroidCanvas from './components/AsteroidCanvas';
import CockpitOverlay from './components/CockpitOverlay';
import { INITIAL_SHIELD, INITIAL_ENERGY } from './constants';
import { WebsiteView } from './components/WebsiteView';

const DEFAULT_PERKS: PilotPerks = {
  maxShield: 100,
  maxEnergy: 100,
  energyRegenRate: 1.0,
  damageMultiplier: 1.0,
  doubleShotChance: 0.0,
  unlockedGauss: false,
  unlockedPhaser: false,
  unlockedNuke: false,
};

import Header from './components/Header';

export default function App() {
  // Shared reactive game parameters
  const [theme, setTheme] = useState<ThemeType>('MINIMAL_TECH');
  const [activeWeapon, setActiveWeapon] = useState<WeaponID>(WeaponID.PLASMA_LASER);
  const [shield, setShield] = useState<number>(INITIAL_SHIELD);
  const [energy, setEnergy] = useState<number>(INITIAL_ENERGY);
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [asteroidsBlasted, setAsteroidsBlasted] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  const [perks, setPerks] = useState<PilotPerks>(DEFAULT_PERKS);

  const [overdriveCharge, setOverdriveCharge] = useState<number>(0);
  const [overdriveActive, setOverdriveActive] = useState<boolean>(false);

  const [touchControlMode, setTouchControlMode] = useState<'TETHER' | 'JOYSTICK'>('TETHER');
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // New persistent gameplay architectures
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.VETERAN);
  const [activeSystemId, setActiveSystemId] = useState<SystemID>(SystemID.ALPHA_CENTAURI);
  const [systems, setSystems] = useState<StarSystem[]>([
    {
      id: SystemID.ALPHA_CENTAURI,
      name: 'ALPHA CENTAURI',
      codename: 'PROXIMA',
      description: 'Nearest star system. A dusty cluster of asteroids orbiting Alpha Centauri A.',
      hazardLevel: 'LOW SEC',
      dangerIndex: 1,
      completed: false,
      quota: 12,
      progress: 0,
      accentColor: '#a855f7',
      nebulaColors: ['#d946ef', '#a21caf', '#701a75'],
      musicBPM: 94,
    },
    {
      id: SystemID.BETELGEUSE,
      name: 'BETELGEUSE',
      codename: 'RED SUPERGIANT',
      description: 'Volatile red supergiant region. Navigation is treacherous due to thermal flares.',
      hazardLevel: 'MODERATE',
      dangerIndex: 2,
      completed: false,
      quota: 15,
      progress: 0,
      accentColor: '#f59e0b',
      nebulaColors: ['#451a03', '#78350f', '#0f172a'],
      musicBPM: 100,
    },
    {
      id: SystemID.ANDROMEDA,
      name: 'ANDROMEDA',
      codename: 'M31',
      description: 'Outer ring of the Andromeda galaxy. Dense industrial rocks and raw titanium salvage.',
      hazardLevel: 'MID SEC',
      dangerIndex: 3,
      completed: false,
      quota: 18,
      progress: 0,
      accentColor: '#06b6d4',
      nebulaColors: ['#083344', '#0c4a6e', '#00252b'],
      musicBPM: 110,
    },
    {
      id: SystemID.SIRIUS_PRIME,
      name: 'SIRIUS PRIME',
      codename: 'DOG STAR',
      description: 'Binary star system with intense radiation. Spawns radioactive cores and hostile defender drones.',
      hazardLevel: 'CRITICAL',
      dangerIndex: 4,
      completed: false,
      quota: 25,
      progress: 0,
      accentColor: '#ec4899',
      nebulaColors: ['#881337', '#4d0752', '#31043d'],
      musicBPM: 132,
    },
    {
      id: SystemID.KEPLER_186F,
      name: 'KEPLER-186F',
      codename: 'EXOPLANET',
      description: 'Hyperspatial anomaly edge. Everything revolves at terrifying speeds near this exoplanet.',
      hazardLevel: 'LETHAL',
      dangerIndex: 5,
      completed: false,
      quota: 35,
      progress: 0,
      accentColor: '#10b981',
      nebulaColors: ['#064e3b', '#065f46', '#022c22'],
      musicBPM: 145,
    },
    {
      id: SystemID.ORION_NEBULA,
      name: 'ORION NEBULA',
      codename: 'M42',
      description: 'Stellar nursery filled with volatile gasses, young stars, and hyper-dense matter.',
      hazardLevel: 'EXTREME',
      dangerIndex: 5,
      completed: false,
      quota: 40,
      progress: 0,
      accentColor: '#3b82f6',
      nebulaColors: ['#1e3a8a', '#172554', '#0f172a'],
      musicBPM: 155,
    },
    {
      id: SystemID.TRAPPIST_1,
      name: 'TRAPPIST-1',
      codename: 'DWARF SYSTEM',
      description: 'Ultra-cool dwarf star system. Freezing temperatures and diamond-dense ice asteroids.',
      hazardLevel: 'ABSOLUTE ZERO',
      dangerIndex: 5,
      completed: false,
      quota: 50,
      progress: 0,
      accentColor: '#e0e7ff',
      nebulaColors: ['#3730a3', '#312e81', '#1e1b4b'],
      musicBPM: 165,
    },
    {
      id: SystemID.GLIESE_WATERWORLD,
      name: 'GLIESE 1214 B',
      codename: 'ABYSSAL OCEANS',
      description: 'Murky sub-surface oceans. Navigation is plagued by deep water currents and hostile alien submarines.',
      hazardLevel: 'CRUSHING DEPTHS',
      dangerIndex: 5,
      completed: false,
      quota: 45,
      progress: 0,
      accentColor: '#00ffcc',
      nebulaColors: ['#001122', '#002222', '#000011'],
      musicBPM: 120,
    },
  ]);

  const [stats, setStats] = useState<PilotStats>({
    score: 0,
    asteroidsDestroyed: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    playTime: 0,
  });

  useEffect(() => {
    let timer: number;
    if (phase === 'PLAYING' && !isPaused) {
      timer = window.setInterval(() => {
        setStats(prev => ({ ...prev, playTime: prev.playTime + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, isPaused, setStats]);

  


  const themeFontClasses = {
    CYBERPUNK: 'font-sans text-cyan-400',
    ARCADE: 'font-sans text-[#F5F2ED]',
    MINIMAL_TECH: 'font-sans text-slate-200 tracking-wider',
  };

  const shieldRatio = shield / (perks.maxShield || 100);

  if (phase === 'WEBSITE') {
    return (
      <main className={`relative w-screen h-screen bg-[#020205] overflow-auto select-none ${themeFontClasses[theme]}`}>
        <WebsiteView setPhase={setPhase} />
      </main>
    );
  }

  return (
    <main className={`relative w-screen h-screen bg-[#020205] overflow-hidden flex items-center justify-center select-none ${themeFontClasses[theme]}`}>
      <Header />
      {/* Immersive CRT subtle overlay lines to boost sci-fi console aesthetic */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(2,2,5,0.7)_100%)] z-20" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0)_50%,_rgba(255,255,255,0.02)_50%)] bg-[length:100%_2px] opacity-30 z-20" />

      {/* 3D High-Frequency Space Renderer */}
      <AsteroidCanvas
        activeWeapon={activeWeapon}
        shield={shield}
        setShield={setShield}
        energy={energy}
        setEnergy={setEnergy}
        phase={phase}
        setPhase={setPhase}
        level={level}
        setLevel={setLevel}
        score={score}
        setScore={setScore}
        asteroidsBlasted={asteroidsBlasted}
        setAsteroidsBlasted={setAsteroidsBlasted}
        stats={stats}
        setStats={setStats}
        isPaused={isPaused}
                perks={perks}
        setPerks={setPerks}
        touchControlMode={touchControlMode}
        setTouchControlMode={setTouchControlMode}
        isTouchDevice={isTouchDevice}
        setIsTouchDevice={setIsTouchDevice}
        overdriveCharge={overdriveCharge}
        setOverdriveCharge={setOverdriveCharge}
        overdriveActive={overdriveActive}
        setOverdriveActive={setOverdriveActive}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        activeSystemId={activeSystemId}
        setActiveSystemId={setActiveSystemId}
        systems={systems}
        setSystems={setSystems}
      />

      {/* Cockpit tactical HUD panel widgets overlay */}
      <CockpitOverlay
        theme={theme}
        setTheme={setTheme}
        activeWeapon={activeWeapon}
        setActiveWeapon={setActiveWeapon}
        shield={shield}
        setShield={setShield}
        energy={energy}
        setEnergy={setEnergy}
        phase={phase}
        setPhase={setPhase}
        level={level}
        setLevel={setLevel}
        score={score}
        setScore={setScore}
        asteroidsBlasted={asteroidsBlasted}
        setAsteroidsBlasted={setAsteroidsBlasted}
        stats={stats}
        setStats={setStats}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
                perks={perks}
        setPerks={setPerks}
        touchControlMode={touchControlMode}
        setTouchControlMode={setTouchControlMode}
        isTouchDevice={isTouchDevice}
        setIsTouchDevice={setIsTouchDevice}
        overdriveCharge={overdriveCharge}
        setOverdriveCharge={setOverdriveCharge}
        overdriveActive={overdriveActive}
        setOverdriveActive={setOverdriveActive}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        activeSystemId={activeSystemId}
        setActiveSystemId={setActiveSystemId}
        systems={systems}
        setSystems={setSystems}
      />
    </main>
  );
}
