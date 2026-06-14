import { useState } from 'react';
import { WeaponID, GamePhase, PilotStats } from './types';
import AsteroidCanvas from './components/AsteroidCanvas';
import CockpitOverlay from './components/CockpitOverlay';
import { INITIAL_SHIELD, INITIAL_ENERGY } from './constants';

export default function App() {
  // Shared reactive game parameters
  const [activeWeapon, setActiveWeapon] = useState<WeaponID>(WeaponID.PLASMA_LASER);
  const [shield, setShield] = useState<number>(INITIAL_SHIELD);
  const [energy, setEnergy] = useState<number>(INITIAL_ENERGY);
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [asteroidsBlasted, setAsteroidsBlasted] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<number>(0);

  const [stats, setStats] = useState<PilotStats>({
    score: 0,
    asteroidsDestroyed: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
  });

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none font-sans text-[#F5F2ED]">
      {/* Immersive CRT subtle overlay lines to boost sci-fi console aesthetic */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_70%,_rgba(0,0,0,0.4)_100%)] z-20" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_50%,_rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px] z-20" />

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
        screenShake={screenShake}
        setScreenShake={setScreenShake}
      />

      {/* Cockpit tactical HUD panel widgets overlay */}
      <CockpitOverlay
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
        screenShake={screenShake}
        setScreenShake={setScreenShake}
      />
    </main>
  );
}
