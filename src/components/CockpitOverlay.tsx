import React, { useEffect, useState, useRef } from 'react';
import { WeaponID, GamePhase, PilotStats } from '../types';
import { WEAPON_CONFIGS, LEVELS } from '../constants';
import { Shield, Zap, Target, Crosshair, Award, Volume2, HelpCircle, Activity, Globe, Compass, Play, RotateCcw } from 'lucide-react';
import { playSound } from '../utils/audio';

interface CockpitOverlayProps {
  activeWeapon: WeaponID;
  setActiveWeapon: (w: WeaponID) => void;
  shield: number;
  setShield: (s: number) => void;
  energy: number;
  setEnergy: (e: number) => void;
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  level: number;
  setLevel: (l: number) => void;
  score: number;
  setScore: (s: number) => void;
  asteroidsBlasted: number;
  setAsteroidsBlasted: (c: number) => void;
  stats: PilotStats;
  setStats: React.Dispatch<React.SetStateAction<PilotStats>>;
  isPaused: boolean;
  setIsPaused: (p: boolean) => void;
  screenShake: number;
  setScreenShake: React.Dispatch<React.SetStateAction<number>>;
}

export default function CockpitOverlay({
  activeWeapon,
  setActiveWeapon,
  shield,
  setShield,
  energy,
  setEnergy,
  phase,
  setPhase,
  level,
  setLevel,
  score,
  setScore,
  asteroidsBlasted,
  setAsteroidsBlasted,
  stats,
  setStats,
  isPaused,
  setIsPaused,
  screenShake,
  setScreenShake,
}: CockpitOverlayProps) {
  // Local cursor tracker for cockpit glass relative coordinates
  const [cursor, setCursor] = useState({ x: 400, y: 300 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const [audioPrompt, setAudioPrompt] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Track mouse coordinates on overlay plane for custom crosshair rendering
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Switch weapons on keyboard keys '1', '2', '3', '4'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'PLAYING') return;

      if (e.key === '1') setActiveWeapon(WeaponID.PLASMA_LASER);
      if (e.key === '2') setActiveWeapon(WeaponID.PROTON_TORPEDO);
      if (e.key === '3') setActiveWeapon(WeaponID.ION_BEAM);
      if (e.key === '4') setActiveWeapon(WeaponID.FLAK_CANNON);
      
      // Pause switch with ESC or 'p' / 'P'
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isPaused, setActiveWeapon, setIsPaused]);

  // Audio trigger alarm sound when shields fall below critical threshold
  useEffect(() => {
    if (phase === 'PLAYING' && shield < 30 && shield > 0) {
      const alarmTimer = setInterval(() => {
        playSound.alarm();
      }, 1000);
      return () => clearInterval(alarmTimer);
    }
  }, [phase, shield]);

  const startSimulation = () => {
    // Start Audio engines and trigger normal play state
    playSound.startEngine();
    playSound.upgrade();
    setShield(100);
    setEnergy(100);
    setScore(0);
    setAsteroidsBlasted(0);
    setLevel(1);
    setStats({
      score: 0,
      asteroidsDestroyed: 0,
      accuracy: 0,
      shotsFired: 0,
      shotsHit: 0,
    });
    setPhase('PLAYING');
    setIsPaused(false);
  };

  const calculatedAccuracy = stats.shotsFired > 0 
    ? Math.min(100, Math.floor((stats.shotsHit / stats.shotsFired) * 100)) 
    : 0;

  // Render current weapon values
  const currentLevelConfig = LEVELS[level - 1] || LEVELS[0];
  const weaponDetails = WEAPON_CONFIGS[activeWeapon];

  // Shield color settings
  const shieldColorClass = shield > 55 
    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
    : shield > 25 
    ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
    : 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.7)] animate-pulse';

  return (
    <div
      ref={overlayRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 w-full h-full pointer-events-none font-sans text-[#F5F2ED] select-none flex flex-col justify-between p-4 z-10"
    >
      {/* ----------------- TOP TACTICAL HUD PANEL ----------------- */}
      <div className="w-full flex justify-between items-start pointer-events-auto z-20 px-8 pt-8">
        {/* Left top system log */}
        <div className="backdrop-blur-md bg-[#0A0A0E]/90 border border-[#2D2D32] p-3 rounded-lg flex items-center gap-3.5 shadow-xl">
          <Activity className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          <div>
            <div className="text-[9px] text-[#D4AF37]/80 tracking-[0.2em] uppercase font-bold">STARFIGHTER SYSTEMS</div>
            <div className="text-xs font-mono font-bold tracking-wider flex items-center gap-2 text-[#F5F2ED]">
              SECTOR FLUX: <span className="text-emerald-400 animate-pulse">STABLE</span>
            </div>
          </div>
        </div>

        {/* Center top notification banner */}
        <div className="text-center flex flex-col items-center">
          <div className="backdrop-blur-md bg-[#0A0A0E]/95 border border-[#2D2D32] px-8 py-2.5 rounded-lg shadow-2xl max-w-sm relative">
            {/* Elegant corner lines to fit Sophisticated Dark aspect */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37]"></div>

            <div className="text-[10px] text-[#D4AF37] tracking-[0.25em] font-semibold uppercase opacity-85">CURRENT SECTOR</div>
            <h2 className="text-xl font-serif italic text-[#F5F2ED] tracking-wide truncate max-w-[240px] mt-0.5">
              {currentLevelConfig.name}
            </h2>
          </div>

          {/* Miniature sub warning indicators */}
          {phase === 'PLAYING' && (
            <div className="mt-2 flex gap-2">
              <span className={`text-[9px] px-2 py-0.5 rounded border font-mono tracking-widest ${shield < 30 ? 'bg-rose-950/40 border-rose-500 text-rose-400 animate-pulse' : 'bg-[#0A0A0E]/80 border-[#2D2D32] text-[#F5F2ED]/60'}`}>
                {shield < 30 ? '⚠️ DEFLECTOR FAILURE' : '🛡️ SHIELDS ARMED'}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded border font-mono tracking-widest ${energy < 20 ? 'bg-amber-950/40 border-amber-500 text-amber-300 animate-pulse' : 'bg-[#0A0A0E]/80 border-[#2D2D32] text-[#F5F2ED]/60'}`}>
                {energy < 20 ? '⚠️ CORE DRAIN' : '⚡ POWER SOURCE NOMINAL'}
              </span>
            </div>
          )}
        </div>

        {/* Right top scoring module */}
        <div className="backdrop-blur-md bg-[#0A0A0E]/90 border border-[#2D2D32] p-3 rounded-lg shadow-xl text-right">
          <div className="text-[9px] text-[#D4AF37]/80 tracking-[0.2em] uppercase font-bold">COMBAT TRANSCRIPT</div>
          <div className="text-base font-serif italic text-[#F5F2ED] tracking-wider flex items-center justify-end gap-1.5 mt-0.5">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            {score.toLocaleString()} <span className="text-[10px] uppercase font-sans font-semibold tracking-widest opacity-60 ml-0.5">PTS</span>
          </div>
        </div>
      </div>


      {/* ----------------- INTERACTIVE DYNAMIC RETICLE/CROSSHAIRS ----------------- */}
      {phase === 'PLAYING' && !isPaused && (
        <div
          className="absolute w-32 h-32 origin-center pointer-events-none transition-all duration-75 mix-blend-screen"
          style={{
            left: `${cursor.x - 64}px`,
            top: `${cursor.y - 64}px`,
          }}
        >
          {/* External elegant dashed gold ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#D4AF37]/25 animate-[spin_16s_linear_infinite]"></div>
          
          {/* Mid target cross circle */}
          <div className="absolute inset-3 rounded-full border border-[#F5F2ED]/10 flex items-center justify-center">
            {/* Center notches modeled after Sophisticated Dark */}
            <div className="absolute top-0 w-[1px] h-3 bg-[#F5F2ED]/40"></div>
            <div className="absolute bottom-0 w-[1px] h-3 bg-[#F5F2ED]/40"></div>
            <div className="absolute left-0 w-3 h-[1px] bg-[#F5F2ED]/40"></div>
            <div className="absolute right-0 w-3 h-[1px] bg-[#F5F2ED]/40"></div>
          </div>

          {/* High visibility central weapon highlight */}
          <div className="absolute inset-[48px] border-t border-b border-[#D4AF37]/80 shadow-[0_0_10px_#D4AF37] animate-pulse"></div>
          <div className="absolute inset-[48px] border-l border-r border-[#D4AF37]/80 shadow-[0_0_10px_#D4AF37] animate-pulse"></div>

          {/* Target telemetry readouts floating next to cursor */}
          <div className="absolute left-[78px] top-[14px] flex flex-col gap-1">
            <div className="text-[8px] bg-[#0A0A0E]/90 px-1.5 py-0.5 border border-[#2D2D32] text-[#F5F2ED]/60 font-mono">
              SEC_X:{Math.floor(cursor.x)} Y:{Math.floor(cursor.y)}
            </div>
            <div className="text-[8px] bg-[#0A0A0E]/90 px-1.5 py-0.5 border border-[#D4AF37]/20 text-[#D4AF37] tracking-widest font-mono font-bold uppercase whitespace-nowrap">
              {weaponDetails.name.toUpperCase()}
            </div>
          </div>
        </div>
      )}


      {/* ----------------- CORE INTERACTIVE SIDE HUDS ----------------- */}
      {/* LEFT STATUS SYSTEMS MONITOR */}
      {phase === 'PLAYING' && (
        leftCollapsed ? (
          <div className="absolute left-2.5 top-[18%] h-[320px] w-10 backdrop-blur-md bg-[#0A0A0E]/95 border border-[#2D2D32]/80 rounded-lg flex flex-col items-center justify-between py-4 pointer-events-auto shadow-2xl z-20 transition-all duration-150">
            {/* Expand button */}
            <button 
              onClick={() => setLeftCollapsed(false)}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#2D2D32] bg-black/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer"
              title="Expand System Diagnostics [>]"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>

            {/* Slim compact mini-gauges */}
            <div className="flex flex-col gap-6 w-full items-center my-4">
              {/* Shield Mini Gauge */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[7px] text-[#F5F2ED]/60 font-bold uppercase tracking-wider">SHD</span>
                <div className="w-3 h-16 bg-black/40 border border-[#2D2D32]/60 rounded flex flex-col justify-end p-[1px] overflow-hidden">
                  <div 
                    className={`w-full rounded-sm transition-all duration-150 ${shield > 55 ? 'bg-emerald-500' : shield > 25 ? 'bg-amber-500' : 'bg-rose-600 animate-pulse'}`}
                    style={{ height: `${shield}%` }}
                  />
                </div>
                <span className="text-[8px] font-mono font-bold text-white leading-none mt-1">{shield}%</span>
              </div>

              {/* Reactor Mini Gauge */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[7px] text-[#D4AF37] font-bold uppercase tracking-wider">PWR</span>
                <div className="w-3 h-16 bg-black/40 border border-[#2D2D32]/60 rounded flex flex-col justify-end p-[1px] overflow-hidden">
                  <div 
                    className="w-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37] rounded-sm transition-all duration-75"
                    style={{ height: `${energy}%` }}
                  />
                </div>
                <span className="text-[8px] font-mono font-bold text-white leading-none mt-1">{Math.floor(energy)}%</span>
              </div>
            </div>

            <div className="text-[10px] text-[#F5F2ED]/30 tracking-widest uppercase font-mono font-bold [writing-mode:vertical-lr] select-none hover:text-[#D4AF37] transition-colors cursor-pointer" onClick={() => setLeftCollapsed(false)}>
              SYSTEMS
            </div>
          </div>
        ) : (
          <div className="absolute left-2.5 top-[18%] h-[320px] w-52 backdrop-blur-md bg-[#0A0A0E]/95 border border-[#2D2D32]/80 p-3.5 rounded-xl flex flex-col justify-between pointer-events-auto shadow-2xl relative z-20 transition-all duration-150">
            {/* Subtle gold line on top to signify top class craft */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
            
            <div className="border-b border-[#2D2D32]/60 pb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[9px] tracking-[0.18em] text-[#D4AF37] font-semibold uppercase">SHIP INTEGRITY</span>
              </div>
              {/* Collapse button */}
              <button 
                onClick={() => setLeftCollapsed(true)}
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#2D2D32] hover:bg-[#D4AF37]/10 text-[#D4AF37] cursor-pointer font-mono font-bold transition-all"
                title="Minimize HUD Panel"
              >
                [ HIDE ]
              </button>
            </div>

            {/* Deflector Shield Component */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#F5F2ED]/70 uppercase tracking-widest flex items-center gap-1">🛡️ Deflector Hull</span>
                <span className={`font-bold ${shield < 30 ? 'text-rose-500 animate-pulse' : 'text-[#F5F2ED]'}`}>{shield}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#1A1A1E] border border-[#2D2D32]/60 p-[2px] rounded overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all duration-150 ${shieldColorClass}`}
                  style={{ width: `${shield}%` }}
                />
              </div>
            </div>

            {/* Ship Reactor Energy Reserves */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#F5F2ED]/70 uppercase tracking-widest flex items-center gap-1">⚡ Reactor Reserves</span>
                <span className="font-bold text-[#F5F2ED]">{Math.floor(energy)}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#1A1A1E] border border-[#2D2D32]/60 p-[2px] rounded overflow-hidden">
                <div
                  className="h-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] rounded-sm transition-all duration-75"
                  style={{ width: `${energy}%` }}
                />
              </div>
            </div>

            {/* Minimalist vector map of starship */}
            <div className="flex items-center justify-center p-2 bg-[#121216]/60 rounded border border-[#2D2D32]/5 w-full">
              <svg viewBox="0 0 100 65" className="w-20 h-10 text-[#F5F2ED]/25">
                {/* Back thrusters */}
                <path d="M 12 48 L 26 48 L 30 52 L 70 52 L 74 48 L 88 48" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="4.5" className={`${phase === 'PLAYING' ? 'text-[#D4AF37]/50 fill-amber-950/20 animate-pulse' : ''}`} stroke="currentColor" strokeWidth="0.8" />
                {/* Cockpit wing shape */}
                <polygon points="50,12 72,42 28,42" fill="none" stroke="currentColor" strokeWidth="1.2" />
                {/* Lasers visual alignments */}
                <line x1="22" y1="36" x2="22" y2="18" stroke={activeWeapon === WeaponID.PLASMA_LASER ? '#D4AF37' : 'currentColor'} strokeWidth={activeWeapon === WeaponID.PLASMA_LASER ? '1.5' : '0.8'} />
                <line x1="78" y1="36" x2="78" y2="18" stroke={activeWeapon === WeaponID.PLASMA_LASER ? '#D4AF37' : 'currentColor'} strokeWidth={activeWeapon === WeaponID.PLASMA_LASER ? '1.5' : '0.8'} />
                <polygon points="47,54 53,54 50,62" className="text-[#D4AF37]/65 animate-pulse" stroke="currentColor" fill="none" />
              </svg>
              <div className="text-[7px] text-[#F5F2ED]/40 font-mono uppercase leading-tight ml-2 border-l border-[#2D2D32] pl-1.5">
                <div>MK-7 VNGD</div>
                <div className="text-[#D4AF37]/75 font-semibold">WARP ACTIVE</div>
                <div>THR: AUTO</div>
              </div>
            </div>

            {/* Systems log readout */}
            <div className="text-[8px] text-[#F5F2ED]/35 flex flex-col gap-0.5 border-t border-[#2D2D32]/40 pt-1.5 font-mono">
              <div>&gt; starfield_lock: active</div>
              <div>&gt; reactor_grid: stable</div>
              {shield < 30 && <div className="text-rose-500 animate-pulse">&gt; deflector_risk: severe</div>}
            </div>
          </div>
        )
      )}

      {/* RIGHT ARMAMENT WEAPONS CONTROL BOARD */}
      {phase === 'PLAYING' && (
        rightCollapsed ? (
          <div className="absolute right-2.5 top-[18%] h-[320px] w-10 backdrop-blur-md bg-[#0A0A0E]/95 border border-[#2D2D32]/80 rounded-lg flex flex-col items-center justify-between py-4 pointer-events-auto shadow-2xl z-20 transition-all duration-150">
            {/* Expand button */}
            <button 
              onClick={() => setRightCollapsed(false)}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#2D2D32] bg-black/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer"
              title="Expand Armaments Panel [<]"
            >
              <Target className="w-3.5 h-3.5" />
            </button>

            {/* Weapon circular selection indicators */}
            <div className="flex flex-col gap-3.5 w-full items-center my-4">
              {Object.values(WEAPON_CONFIGS).map((w, idx) => {
                const isActive = activeWeapon === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWeapon(w.id);
                      playSound.laser(w.id);
                    }}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer relative group ${
                      isActive ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_8px_#D4AF37]' : 'border-[#2D2D32] bg-black/25 hover:border-[#D4AF37]/45'
                    }`}
                    title={`Switch to ${w.name} [Shortcut: ${idx + 1}]`}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: w.color,
                        boxShadow: isActive ? `0 0 6px ${w.color}` : 'none'
                      }}
                    />
                    {/* Floating Tooltip displaying weapon info */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-[#0A0A0E] border border-[#D4AF37] text-white whitespace-nowrap px-2 py-1 rounded text-[10px] font-serif shadow-lg z-30">
                      <div className="font-bold">{w.name}</div>
                      <div className="text-[8px] text-[#F5F2ED]/60 font-mono mt-0.5">COST: {w.energyCost}P | DMG: {w.damage}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] text-[#F5F2ED]/30 tracking-widest uppercase font-mono font-bold [writing-mode:vertical-rl] rotate-180 select-none hover:text-[#D4AF37] transition-colors cursor-pointer" onClick={() => setRightCollapsed(false)}>
              ARMAMENTS
            </div>
          </div>
        ) : (
          <div className="absolute right-2.5 top-[18%] h-[320px] w-52 backdrop-blur-md bg-[#0A0A0E]/95 border border-[#2D2D32]/80 p-3.5 rounded-xl flex flex-col justify-between pointer-events-auto shadow-2xl relative z-20 transition-all duration-150">
            <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
            
            <div className="border-b border-[#2D2D32]/60 pb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[9px] tracking-[0.18em] text-[#D4AF37] font-semibold uppercase">WEAPONS BOARD</span>
              </div>
              {/* Collapse button */}
              <button 
                onClick={() => setRightCollapsed(true)}
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#2D2D32] hover:bg-[#D4AF37]/10 text-[#D4AF37] cursor-pointer font-mono font-bold transition-all"
                title="Minimize Weapons Board"
              >
                [ HIDE ]
              </button>
            </div>

            {/* Beautifully aligned weapon selections */}
            <div className="flex flex-col gap-1.5">
              {Object.values(WEAPON_CONFIGS).map((w, idx) => {
                const isActive = activeWeapon === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWeapon(w.id);
                      playSound.laser(w.id);
                    }}
                    className={`group relative text-left p-1.5 rounded transition-all flex items-center justify-between border cursor-pointer ${
                      isActive
                        ? 'bg-[#D4AF37]/5 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/10'
                        : 'bg-black/20 border-[#2D2D32] hover:border-[#D4AF37]/45 hover:bg-white/5 text-[#F5F2ED]/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <div
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{
                          backgroundColor: isActive ? w.color : '#2D2D32',
                          boxShadow: isActive ? `0 0 6px ${w.color}` : 'none',
                        }}
                      />
                      <div>
                        <div className="text-[10.5px] font-serif font-semibold tracking-wide leading-none">{w.name}</div>
                        <div className="text-[8px] text-[#F5F2ED]/40 leading-none mt-1 group-hover:text-[#F5F2ED]/70 font-mono">
                          COST: {w.energyCost}P | DMG: {w.damage}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`text-[8px] border px-1 py-0.5 rounded leading-none transition-all font-mono font-bold ${
                      isActive ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#D4AF37]' : 'bg-black/30 border-[#2D2D32] text-[#F5F2ED]/40'
                    }`}>
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick descriptive performance gauge */}
            <div className="p-2 bg-[#121216]/60 rounded border border-[#2D2D32]/30 flex flex-col gap-1 text-[8px] text-[#F5F2ED]/70">
              <div className="font-serif italic text-white text-[10px] leading-tight flex items-center justify-between">
                <span>{weaponDetails.name}</span>
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-ping" style={{ backgroundColor: weaponDetails.color }}></span>
              </div>
              <div className="leading-snug text-[#F5F2ED]/45 mt-0.5 line-clamp-1">{weaponDetails.description}</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-[#2D2D32]/40 pt-1 font-mono mt-0.5 text-[7.5px]">
                <span>RELOAD:</span>
                <span className="text-right text-white font-bold">{weaponDetails.fireRate}ms</span>
                <span>TONE:</span>
                <span className="text-right text-[#D4AF37] font-bold">{weaponDetails.soundFrequency}Hz</span>
              </div>
            </div>
          </div>
        )
      )}


      {/* ----------------- BOTTOM TACTICAL FLIGHT INSTRUMENTS ----------------- */}
      <div className="w-full flex justify-between items-end gap-6 pointer-events-auto z-20 px-8 pb-8">
        
        {/* Left instrumentation: telemetry stat logs */}
        <div className="backdrop-blur-md bg-[#0A0A0E]/90 border border-[#2D2D32] p-4 rounded-lg shadow-xl flex items-center gap-4 min-w-[240px] relative">
          <div className="absolute top-1.5 right-1.5 text-[8px] text-[#D4AF37] tracking-widest font-mono font-semibold">PILOT LOG</div>
          <div className="flex flex-col gap-2 w-full">
            <div className="text-[10px] font-semibold text-[#D4AF37] tracking-[0.2em] border-b border-[#2D2D32] pb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> telemetry stats
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
              <span className="text-[#F5F2ED]/50 uppercase text-[9px]">Rocks Blasted:</span>
              <span className="font-bold text-white text-right">{asteroidsBlasted}</span>
              <span className="text-[#F5F2ED]/50 uppercase text-[9px]">Weapon Cycles:</span>
              <span className="font-bold text-white text-right">{stats.shotsFired}</span>
              <span className="text-[#F5F2ED]/50 uppercase text-[9px]">Aim Accuracy:</span>
              <span className={`font-bold text-right ${calculatedAccuracy > 65 ? 'text-emerald-400' : calculatedAccuracy > 35 ? 'text-amber-400' : 'text-rose-400'}`}>
                {calculatedAccuracy}%
              </span>
            </div>
          </div>
        </div>

        {/* Center steering sensor telemetry sliders */}
        <div className="flex-1 max-w-sm flex flex-col items-center">
          <div className="w-full relative py-1.5 flex items-center justify-center">
            {/* Elegant slider bar */}
            <div className="w-full h-[3px] bg-[#1a1a20]/80 rounded relative border border-[#2D2D32]">
              <div
                className="absolute w-4 h-4 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] rounded-full top-1/2 -translate-y-1/2"
                style={{
                  left: `${(cursor.x / (overlayRef.current?.clientWidth || 800)) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#D4AF37]/20 pointer-events-none"></div>
          </div>
          <div className="text-[8px] text-[#D4AF37] tracking-[0.25em] font-bold uppercase mt-1">
            STARSHIP STEERING COMPASS SENSORS [YAW/PITCH]
          </div>
        </div>

        {/* Right progress dashboard to unlock hyperspace warp */}
        <div className="backdrop-blur-md bg-[#0A0A0E]/90 border border-[#2D2D32] p-4 rounded-lg shadow-xl flex flex-col gap-2 w-64">
          <div className="text-[10px] font-semibold text-[#D4AF37] tracking-[0.2em] border-b border-[#2D2D32]/60 pb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> SEC CLEARANCE
            </span>
            <span className="text-[#D4AF37] text-[11px] font-mono leading-none font-bold animate-pulse">
              {asteroidsBlasted}/{currentLevelConfig.targetCount} CLEARED
            </span>
          </div>

          {/* Dotted progress representation */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-[#1A1A1E] border border-[#2D2D32] p-[2px] rounded overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] rounded-sm transition-all duration-300"
                style={{ width: `${Math.min(100, (asteroidsBlasted / currentLevelConfig.targetCount) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-white min-w-[28px] text-right">
              {Math.min(100, Math.floor((asteroidsBlasted / currentLevelConfig.targetCount) * 100))}%
            </span>
          </div>

          <div className="text-[8px] text-[#F5F2ED]/40 flex items-center justify-between font-mono mt-0.5">
            <span>TASK: SECURE EXPULSION CORRIDOR COGNIZANT</span>
            <span className="hover:text-white cursor-pointer hover:underline text-[#D4AF37]" onClick={() => {
              playSound.upgrade();
              setAudioPrompt(false);
            }}>
              🔈 SYSTEM AUDIO
            </span>
          </div>
        </div>

      </div>


      {/* ----------------------------------------------------------------- */}
      {/* ------------------- STYLIZED INTRO/OVERLAY SCREENS -------------- */}
      {/* ----------------------------------------------------------------- */}

      {/* INTRO SCREEN BRIEFING */}
      {phase === 'INTRO' && (
        <div className="absolute inset-0 bg-[#050508]/95 backdrop-blur-md flex items-center justify-center p-6 text-center pointer-events-auto z-40">
          <div className="max-w-xl bg-[#0A0A0E] border border-[#2D2D32] p-10 rounded-xl shadow-2xl relative">
            {/* Elegant gold corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]"></div>

            <h1 className="text-3xl md:text-4xl font-serif text-[#F5F2ED] tracking-wide mb-1 flex items-center justify-center gap-3">
              Asteroid Cockpit Shooter
            </h1>
            <p className="text-[#D4AF37] text-[10px] tracking-[0.3em] uppercase mb-8 font-semibold">
              SOPHISTICATED DEEP SPACE INTRUSION SIMULATOR
            </p>

            {/* Simulated instructions checklist card */}
            <div className="bg-[#050508] border border-[#2D2D32] rounded-lg p-5 text-left text-xs mb-8 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#2D2D32] pb-2.5 text-[#F5F2ED] font-serif italic text-base">
                <HelpCircle className="w-4 h-4 text-[#D4AF37]" /> Core Simulator Pre-Flight Telemetries
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[#F5F2ED]/80 leading-relaxed font-sans">
                <div className="space-y-1.5">
                  <div className="text-[#D4AF37] font-semibold tracking-wider font-serif">🕹️ HUD PILOT NAVIGATION</div>
                  <div className="text-[11px] text-[#F5F2ED]/70">
                    Use your <strong className="text-[#F5F2ED]">mouse cursor</strong> to control the target reticle angle on the windshield HUD.
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[#D4AF37] font-semibold tracking-wider font-serif">⚔️ INTEGRATED WEAPON SYSTEMS</div>
                  <div className="text-[11px] text-[#F5F2ED]/70">
                    Hold <strong className="text-[#F5F2ED]">Left Click</strong> to cycle projectiles. Tap keys <strong className="text-[#F5F2ED]">[1], [2], [3], [4]</strong> to swap weaponry matrices.
                  </div>
                </div>
              </div>

              {/* Sophisticated weapon stats performance report list */}
              <div className="pt-2 border-t border-[#2D2D32]/60">
                <div className="font-serif italic text-[11px] text-[#D4AF37] mb-2">Armament Performance Analysis Matrices</div>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  {Object.values(WEAPON_CONFIGS).map(w => (
                    <div key={w.id} className="bg-[#0C0C10] p-2 rounded border border-[#2D2D32] flex flex-col justify-between">
                      <span className="font-bold text-white uppercase text-[9px] truncate">{w.name}</span>
                      <span className="text-[#D4AF37] text-[8px] mt-1 tracking-tighter">COST:{w.energyCost}P/DMG:{w.damage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {audioPrompt && (
              <div className="flex items-center gap-2 justify-center text-xs text-[#D4AF37] bg-[#D4AF37]/5 border border-[#D4AF37]/35 px-4 py-2 rounded-lg mb-8 animate-pulse font-mono">
                <Volume2 className="w-4 h-4 text-[#D4AF37]" /> PILOT AUDIO MATRIX CHANNELS ONLINE
              </div>
            )}

            <button
              onClick={startSimulation}
              className="w-full transform active:scale-95 transition-all py-4 bg-gradient-to-r from-[#D4AF37] to-amber-700 hover:from-amber-500 hover:to-amber-800 text-black font-serif italic font-bold tracking-[0.12em] text-sm rounded-lg border border-[#D4AF37] shadow-xl shadow-black/80 flex items-center justify-center gap-2.5 cursor-pointer pointer-events-auto"
            >
              <Play className="w-4 h-4 text-black stroke-[3]" /> INITIALIZE FUSION THERMATS & DEPART
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODULE */}
      {phase === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-[#050508]/95 backdrop-blur-md flex items-center justify-center p-6 text-center pointer-events-auto z-40">
          <div className="max-w-md bg-[#0A0A0E] border border-rose-950/60 p-10 rounded-xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rose-500"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-rose-500"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-rose-500"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rose-500"></div>

            <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/20 border border-rose-500/50 flex items-center justify-center mb-5">
              <Shield className="w-7 h-7 text-rose-500 animate-bounce" />
            </div>

            <h1 className="text-3xl font-serif text-rose-500 tracking-wide mb-1 uppercase">
              HULL COLLAPSED
            </h1>
            <p className="text-[#F5F2ED]/50 text-[10px] tracking-widest uppercase mb-6 font-mono">
              deflectors_reloading: failed [0.00% SEC integrity]
            </p>

            {/* Scoreboard summary debriefing */}
            <div className="bg-[#050508] border border-[#2D2D32] rounded-lg p-5 text-left text-xs mb-8 space-y-2.5 font-mono">
              <div className="text-[#D4AF37] font-serif italic text-sm text-center border-b border-[#2D2D32] pb-2 uppercase tracking-widest">
                Flight Telemetry Journal
              </div>
              <div className="grid grid-cols-2 gap-y-2 pt-1 font-mono text-[11px]">
                <span className="text-[#F5F2ED]/50">TOTAL PILOT SCORE:</span>
                <span className="text-right text-[#D4AF37] font-bold">{score.toLocaleString()} PTS</span>
                
                <span className="text-[#F5F2ED]/50">SOCIETIES VISITED:</span>
                <span className="text-right text-white font-bold">{level} LEVELS</span>

                <span className="text-[#F5F2ED]/50">ASTEROIDS ANNIHILATED:</span>
                <span className="text-right text-white font-bold">{asteroidsBlasted}</span>

                <span className="text-[#F5F2ED]/50">TOTAL AMMUNITIONS FIRED:</span>
                <span className="text-right text-white font-bold">{stats.shotsFired}</span>

                <span className="text-[#F5F2ED]/50">SENSORY WEAPON ACCURACY:</span>
                <span className="text-right text-emerald-400 font-bold">{calculatedAccuracy}%</span>
              </div>
            </div>

            <button
              onClick={startSimulation}
              className="w-full transform active:scale-95 transition-all py-3 bg-rose-700 hover:bg-rose-600 text-white font-serif italic font-bold tracking-[0.1em] rounded-lg border border-rose-500 shadow-xl cursor-pointer pointer-events-auto"
            >
              <RotateCcw className="w-4 h-4 inline mr-1.5" /> REBOOT COCKPIT SIMULATION
            </button>
          </div>
        </div>
      )}

      {/* SUPREME VICTORY BRIEFING */}
      {phase === 'VICTORY' && (
        <div className="absolute inset-0 bg-[#050508]/95 backdrop-blur-md flex items-center justify-center p-6 text-center pointer-events-auto z-40">
          <div className="max-w-md bg-[#0A0A0E] border border-amber-950/60 p-10 rounded-xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]"></div>

            <div className="w-16 h-16 mx-auto rounded-full bg-amber-950/20 border border-[#D4AF37]/50 flex items-center justify-center mb-5 animate-pulse">
              <Award className="w-8 h-8 text-[#D4AF37] animate-spin" />
            </div>

            <h1 className="text-3xl font-serif text-[#D4AF37] tracking-wide mb-1 uppercase">
              VOID SECURED
            </h1>
            <p className="text-[#F5F2ED]/50 text-[10px] tracking-widest uppercase mb-6 font-mono">
              cosmic_matrix: cleared [100.00% EXTRUSION completed]
            </p>

            <div className="bg-[#050508] border border-[#2D2D32] rounded-lg p-5 text-left text-xs mb-8 space-y-2.5 font-mono">
              <div className="text-[#D4AF37] font-serif italic text-sm text-center border-b border-[#2D2D32] pb-2 uppercase tracking-widest">
                Supreme Pilot Debrief
              </div>
              <div className="grid grid-cols-2 gap-y-2 pt-1 font-mono text-[11px]">
                <span className="text-[#F5F2ED]/50">SUPREME SCORE:</span>
                <span className="text-right text-[#D4AF37] font-extrabold">{score.toLocaleString()} PTS</span>
                
                <span className="text-[#F5F2ED]/50">ASTEROIDS REQUISITIONED:</span>
                <span className="text-right text-white font-bold">{asteroidsBlasted}</span>

                <span className="text-[#F5F2ED]/50">WEAPONS DISK CYCLES:</span>
                <span className="text-right text-white font-bold">{stats.shotsFired} SHOTS</span>

                <span className="text-[#F5F2ED]/50">COMBAT PRECISION SIGHT:</span>
                <span className="text-right text-emerald-400 font-bold">{calculatedAccuracy}%</span>

                <span className="text-[#F5F2ED]/50">SUPREME PILOT TIER:</span>
                <span className="text-right text-amber-400 font-bold uppercase animate-pulse">SUPREME WARRIOR GOLD</span>
              </div>
            </div>

            <button
              onClick={startSimulation}
              className="w-full transform active:scale-95 transition-all py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-700 hover:from-amber-500 hover:to-amber-800 text-black font-serif italic font-bold tracking-[0.1em] rounded-lg border border-[#D4AF37] shadow-xl cursor-pointer pointer-events-auto"
            >
              <RotateCcw className="w-4 h-4 inline mr-1.5 text-black stroke-[3]" /> SECURE ANOTHER GALAXY
            </button>
          </div>
        </div>
      )}


      {/* WARPING FLIGHT STATUS DEEP SEQUENCE */}
      {phase === 'WARPING' && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 text-center select-none z-30 animate-pulse">
          <div className="max-w-sm px-8 py-6 rounded border border-[#D4AF37]/50 bg-[#0A0A0E] shadow-2xl relative">
            <div className="text-white font-serif italic text-xl tracking-wider animate-pulse flex items-center justify-center gap-2">
              🌠 WARPING SPACE SECTORS
            </div>
            <p className="text-[#D4AF37] text-[10px] tracking-widest uppercase mt-2 font-mono">
              recharging_warp_drive: stable [excess laser drained]
            </p>
            {/* Elegant luxury loading tracking line */}
            <div className="w-full h-[2px] bg-[#1A1A1E] border border-[#2D2D32] rounded overflow-hidden mt-4">
              <div className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] w-full" />
            </div>
          </div>
        </div>
      )}


      {/* PAUSED ENGINE */}
      {isPaused && phase === 'PLAYING' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 text-center pointer-events-auto z-40">
          <div className="max-w-xs bg-[#0A0A0E] border border-[#2D2D32] p-7 rounded-lg shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#D4AF37]/10 border border-[#D4AF37] flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-[#D4AF37] animate-pulse" />
            </div>

            <h1 className="text-lg font-serif text-[#F5F2ED] tracking-wide mb-1 uppercase">
              Simulation Standby
            </h1>
            <p className="text-[#F5F2ED]/60 text-xs mb-6 leading-relaxed">
              Motors and target updates are frozen. Press <kbd className="bg-black/50 border border-[#2D2D32] px-1.5 py-0.5 rounded text-white font-mono text-[10px]">ESC</kbd> to return to active tracking.
            </p>

            <button
              onClick={() => setIsPaused(false)}
              className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-700 hover:from-amber-500 hover:to-amber-800 text-black font-serif italic font-semibold text-xs tracking-widest rounded-md border border-[#D4AF37] cursor-pointer pointer-events-auto shadow-md"
            >
              RESUME TRACKING VOIDS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
