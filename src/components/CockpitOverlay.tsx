import React, { useEffect, useState, useRef } from 'react';
import { WeaponID, GamePhase, PilotStats, PilotPerks, DifficultyLevel, SystemID, StarSystem, ThemeType } from '../types';
import { WEAPON_CONFIGS, LEVELS } from '../constants';
import { Shield, Zap, Target, Crosshair, Award, Volume2, HelpCircle, Activity, Globe, Compass, Play, RotateCcw, GripHorizontal, Move, Sparkles } from 'lucide-react';
import { playSound } from '../utils/audio';

interface CockpitOverlayProps {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
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
  perks: PilotPerks;
  setPerks: React.Dispatch<React.SetStateAction<PilotPerks>>;
  touchControlMode: 'TETHER' | 'JOYSTICK';
  setTouchControlMode: (m: 'TETHER' | 'JOYSTICK') => void;
  isTouchDevice: boolean;
  setIsTouchDevice: (v: boolean) => void;
  overdriveCharge: number;
  setOverdriveCharge: React.Dispatch<React.SetStateAction<number>>;
  overdriveActive: boolean;
  setOverdriveActive: React.Dispatch<React.SetStateAction<boolean>>;
  difficulty: DifficultyLevel;
  setDifficulty: React.Dispatch<React.SetStateAction<DifficultyLevel>>;
  activeSystemId: SystemID;
  setActiveSystemId: React.Dispatch<React.SetStateAction<SystemID>>;
  systems: StarSystem[];
  setSystems: React.Dispatch<React.SetStateAction<StarSystem[]>>;}

export default function CockpitOverlay({
  theme,
  setTheme,
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
  perks,
  setPerks,
  touchControlMode,
  setTouchControlMode,
  isTouchDevice,
  setIsTouchDevice,
  overdriveCharge,
  setOverdriveCharge,
  overdriveActive,
  setOverdriveActive,
  difficulty,
  setDifficulty,
  activeSystemId,
  setActiveSystemId,
  systems,
  setSystems,
}: CockpitOverlayProps) {
  // Local cursor tracker for cockpit glass relative coordinates
  const [cursor, setCursor] = useState({ x: 400, y: 300 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const [audioPrompt, setAudioPrompt] = useState(true);
  const [isMuted, setIsMuted] = useState(playSound.getMuted());

  // Interactive, draggable, and snapping/dockable HUD panels config state (relative X/Y positions on screen)
  const [panelPositions, setPanelPositions] = useState<Record<string, {
    xPct: number;
    yPct: number;
    isCollapsed: boolean;
    dockSide: 'left' | 'right' | 'bottom' | 'none';
  }>>({
    systems: { xPct: 1, yPct: 18, isCollapsed: false, dockSide: 'left' },
    weapons: { xPct: 78, yPct: 18, isCollapsed: false, dockSide: 'right' },
    telemetry: { xPct: 1, yPct: 76, isCollapsed: false, dockSide: 'bottom' },
    overdrive: { xPct: 33, yPct: 74, isCollapsed: false, dockSide: 'bottom' },
    clearance: { xPct: 69, yPct: 76, isCollapsed: false, dockSide: 'bottom' },
  });

  

  // Auto-adapt layout on tiny smaller devices (responsiveness fallback)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      const isUltraSmall = window.innerWidth < 640;
      
      setPanelPositions(prev => ({
        systems: {
          ...prev.systems,
          isCollapsed: isMobile ? true : prev.systems.isCollapsed,
          xPct: isMobile ? 0.5 : 1,
          yPct: isMobile ? 12 : 18,
          dockSide: isMobile ? 'left' : 'left'
        },
        weapons: {
          ...prev.weapons,
          isCollapsed: isMobile ? true : prev.weapons.isCollapsed,
          xPct: isMobile ? (isUltraSmall ? 85 : 90) : 78,
          yPct: isMobile ? 12 : 18,
          dockSide: isMobile ? 'right' : 'right'
        },
        telemetry: {
          ...prev.telemetry,
          isCollapsed: isUltraSmall ? true : prev.telemetry.isCollapsed,
          xPct: isMobile ? 0.5 : 1,
          yPct: isMobile ? (isUltraSmall ? 70 : 86) : 76,
          dockSide: 'bottom'
        },
        overdrive: {
          ...prev.overdrive,
          isCollapsed: isUltraSmall ? false : prev.overdrive.isCollapsed,
          xPct: isMobile ? (isUltraSmall ? 10 : 15) : 33,
          yPct: isMobile ? (isUltraSmall ? 84 : 70) : 74,
          dockSide: 'bottom'
        },
        clearance: {
          ...prev.clearance,
          isCollapsed: isUltraSmall ? true : prev.clearance.isCollapsed,
          xPct: isMobile ? (isUltraSmall ? 68 : 15) : 69,
          yPct: isMobile ? (isUltraSmall ? 70 : 86) : 76,
          dockSide: 'bottom'
        }
      }));
    };

    handleResize(); // trigger once initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth drag event capture (supports desk-mice and finger-touches under frame boundaries)
  const handlePanelDragStart = (panelId: string, event: React.MouseEvent | React.TouchEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    setDraggingPanelId(panelId);
    
    const startXPct = panelPositions[panelId]?.xPct ?? 0;
    const startYPct = panelPositions[panelId]?.yPct ?? 0;

    const onDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const dx = ((currentX - clientX) / rect.width) * 100;
      const dy = ((currentY - clientY) / rect.height) * 100;
      
      // Calculate next coordinates and constrain tightly inside cockpit boundaries
      const nextXPct = Math.max(0.1, Math.min(94, startXPct + dx));
      const nextYPct = Math.max(8, Math.min(90, startYPct + dy));

      // Realtime Dock-Zone indicators
      let snapDock: 'left' | 'right' | 'bottom' | 'none' = 'none';
      if (nextXPct < 12) snapDock = 'left';
      else if (nextXPct > 72) snapDock = 'right';
      else if (nextYPct > 68) snapDock = 'bottom';

      setPanelPositions(prev => ({
        ...prev,
        [panelId]: {
          ...prev[panelId],
          xPct: nextXPct,
          yPct: nextYPct,
          dockSide: snapDock
        }
      }));
    };

    const onDragEnd = () => {
      setDraggingPanelId(null);
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
    };

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
  };

  const togglePanelCollapse = (panelId: string) => {
    setPanelPositions(prev => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        isCollapsed: !prev[panelId].isCollapsed
      }
    }));
    playSound.upgrade();
  };

  const manuallyDockPanel = (panelId: string, side: 'left' | 'right' | 'bottom') => {
    let xPct = 1;
    let yPct = 18;
    if (side === 'right') {
      xPct = 78;
      yPct = 18;
    } else if (side === 'bottom') {
      if (panelId === 'systems' || panelId === 'telemetry') {
        xPct = 1;
        yPct = 76;
      } else if (panelId === 'weapons' || panelId === 'clearance') {
        xPct = 69;
        yPct = 76;
      } else {
        xPct = 33;
        yPct = 74;
      }
    }

    setPanelPositions(prev => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        xPct,
        yPct,
        dockSide: side,
        isCollapsed: false
      }
    }));
    playSound.upgrade();
  };

  const resetAllHUDPanels = () => {
    setPanelPositions({
      systems: { xPct: 1, yPct: 18, isCollapsed: false, dockSide: 'left' },
      weapons: { xPct: 78, yPct: 18, isCollapsed: false, dockSide: 'right' },
      telemetry: { xPct: 1, yPct: 76, isCollapsed: false, dockSide: 'bottom' },
      overdrive: { xPct: 33, yPct: 74, isCollapsed: false, dockSide: 'bottom' },
      clearance: { xPct: 69, yPct: 76, isCollapsed: false, dockSide: 'bottom' },
    });
    playSound.upgrade();
  };

  // Track mouse coordinates on overlay plane for custom crosshair rendering
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Switch weapons on keyboard keys '1', '2', '3', '4' & Ultimate overdrive activations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'PLAYING') return;

      if (e.key === '1') setActiveWeapon(WeaponID.PLASMA_LASER);
      if (e.key === '2') setActiveWeapon(WeaponID.PROTON_TORPEDO);
      if (e.key === '3') setActiveWeapon(WeaponID.ION_BEAM);
      if (e.key === '4') setActiveWeapon(WeaponID.FLAK_CANNON);

      // Overdrive trigger with Spacebar
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (overdriveCharge >= 100 && !overdriveActive) {
          setOverdriveActive(true);
          setScreenShake(26);
          playSound.warp();
        }
      }
      
      // Pause switch with ESC or 'p' / 'P'
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused(!isPaused);
      }

      // Mute switch with 'm' or 'M'
      if (e.key === 'm' || e.key === 'M') {
        const nextVal = !playSound.getMuted();
        playSound.setMuted(nextVal);
        setIsMuted(nextVal);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isPaused, overdriveCharge, overdriveActive, setActiveWeapon, setIsPaused, setOverdriveActive, setScreenShake]);

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
    setPerks({
      maxShield: 100,
      maxEnergy: 100,
      energyRegenRate: 1.0,
      damageMultiplier: 1.0,
      doubleShotChance: 0.10,
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
      className={`absolute inset-0 w-full h-full pointer-events-none select-none flex flex-col justify-between p-4 z-10 ${shield < 20 && phase === 'PLAYING' ? 'animate-glitch' : ''}`}
    >
            {/* MINIMAL SYMMETRIC HUD */}

      {/* TOP DOCK */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl px-12 pt-8 flex justify-between items-start pointer-events-auto z-20">
          {/* Left Top: Score and Asteroids Blasted */}
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 p-5 rounded-lg flex flex-col gap-1 shadow-2xl min-w-[200px]">
              <div className="text-[10px] text-[#D4AF37]/80 tracking-[0.2em] font-bold">TACTICAL SCORE</div>
              <div className="text-3xl font-bold tracking-wider text-[#F5F2ED]">{score.toLocaleString()}</div>
              <div className="text-[10px] text-[#F5F2ED]/60 uppercase tracking-widest mt-1 font-semibold">TARGETS OVERCOME: <span className="text-white">{asteroidsBlasted}</span></div>
          </div>
          
          {/* Center Top: Location */}
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 px-10 py-4 rounded-lg text-center shadow-2xl min-w-[300px]">
              <div className="text-[10px] text-[#D4AF37] tracking-[0.25em] font-bold uppercase opacity-85">SECTOR</div>
              <h2 className="text-2xl font-bold text-[#F5F2ED] tracking-widest mt-1">{currentLevelConfig.name}</h2>
              {phase === 'PLAYING' && (
              <div className="mt-3 text-[10px] tracking-widest font-bold">
                {shield < 30 ? <span className="text-rose-500 animate-pulse">DEFLECTOR CRITICAL</span> : <span className="text-emerald-500">SYSTEMS NOMINAL</span>}
              </div>
              )}
          </div>

          {/* Right Top: System Controls */}
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 p-5 rounded-lg flex flex-col gap-3 items-end shadow-2xl min-w-[200px]">
            <label className="text-[10px] text-[#D4AF37] font-bold tracking-[0.2em]">COMMS</label>
            <button
              onClick={() => { const nextVal = !isMuted; playSound.setMuted(nextVal); setIsMuted(nextVal); }}
              className="text-xs font-bold tracking-wider hover:text-white transition-colors uppercase text-[#D4AF37]"
            >
              {isMuted ? '🔇 Muted' : '🔊 Live Audio'}
            </button>
          </div>
      </div>

      {phase === 'PLAYING' && (
      <>
        {/* DRAGGABLE HUD PANELS */}
        <div 
          className="absolute pointer-events-auto z-30 transition-all duration-75 ease-linear w-[250px]"
          style={{ left: `${panelPositions.systems.xPct}%`, top: `${panelPositions.systems.yPct}%`, transform: 'translate(-50%, -50%)', opacity: draggingPanelId === 'systems' ? 0.7 : 1 }}
        >
          <div className="bg-[#0A0A0E]/80 backdrop-blur-md border border-[#2D2D32] shadow-2xl rounded-sm overflow-hidden">
            <div 
              className="bg-[#121218] border-b border-[#2D2D32] px-3 py-1.5 flex justify-between items-center cursor-move"
              onMouseDown={(e) => handlePanelDragStart('systems', e)}
              onTouchStart={(e) => handlePanelDragStart('systems', e)}
            >
              <div className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#06B6D4]"/><span className="text-[9px] font-bold text-[#F5F2ED] tracking-widest leading-none mt-0.5">SYSTEMS MON</span></div>
              <button onClick={() => togglePanelCollapse('systems')} className="text-[#F5F2ED]/50 hover:text-white"><GripHorizontal className="w-3 h-3"/></button>
            </div>
            {!panelPositions.systems.isCollapsed && (
              <div className="p-4 space-y-3">
                 <div className="flex justify-between items-center"><span className="text-[9px] text-[#F5F2ED] uppercase tracking-wider">CORE TEMP:</span><span className="text-[10px] text-amber-500 font-bold">{(100 - energy).toFixed(1)}°K</span></div>
                 <div className="flex justify-between items-center"><span className="text-[9px] text-[#F5F2ED] uppercase tracking-wider">HULL STRESS:</span><span className="text-[10px] text-emerald-500 font-bold">{(100 - shield).toFixed(1)}%</span></div>
                 <div className="flex justify-between items-center"><span className="text-[9px] text-[#F5F2ED] uppercase tracking-wider">ACTIVE PERKS:</span><span className="text-[10px] text-[#06B6D4] font-bold">x{(perks.damageMultiplier).toFixed(2)}</span></div>
              </div>
            )}
          </div>
        </div>

        <div 
          className="absolute pointer-events-auto z-30 transition-all duration-75 ease-linear w-[250px]"
          style={{ left: `${panelPositions.telemetry.xPct}%`, top: `${panelPositions.telemetry.yPct}%`, transform: 'translate(-50%, -50%)', opacity: draggingPanelId === 'telemetry' ? 0.7 : 1 }}
        >
          <div className="bg-[#0A0A0E]/80 backdrop-blur-md border border-[#2D2D32] shadow-2xl rounded-sm overflow-hidden">
            <div 
              className="bg-[#121218] border-b border-[#2D2D32] px-3 py-1.5 flex justify-between items-center cursor-move"
              onMouseDown={(e) => handlePanelDragStart('telemetry', e)}
              onTouchStart={(e) => handlePanelDragStart('telemetry', e)}
            >
              <div className="flex items-center gap-2"><Compass className="w-3 h-3 text-[#D4AF37]"/><span className="text-[9px] font-bold text-[#F5F2ED] tracking-widest leading-none mt-0.5">TELEMETRY</span></div>
              <button onClick={() => togglePanelCollapse('telemetry')} className="text-[#F5F2ED]/50 hover:text-white"><GripHorizontal className="w-3 h-3"/></button>
            </div>
            {!panelPositions.telemetry.isCollapsed && (
              <div className="p-4 flex flex-col gap-2">
                 <div className="text-[10px] text-[#F5F2ED] tracking-widest font-mono">X: {cursor.x.toFixed(1)}</div>
                 <div className="text-[10px] text-[#F5F2ED] tracking-widest font-mono">Y: {cursor.y.toFixed(1)}</div>
                 <div className="text-[10px] text-[#F5F2ED] tracking-widest font-mono">Z: SEC-{(level * 14).toFixed(0)}</div>
              </div>
            )}
          </div>
        </div>

      {/* BOTTOM DOCK */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl px-12 flex justify-between items-end pointer-events-auto z-20">
          {/* Weapons */}
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 p-5 rounded-lg flex gap-4 shadow-2xl">
              {Object.values(WEAPON_CONFIGS).map((w, index) => {
                  const isActive = activeWeapon === w.id;
                  const isLocked = false;
                  return (
                      <button key={w.id} onClick={() => !isLocked && setActiveWeapon(w.id)} className={`relative flex flex-col items-center p-4 rounded-md border transition-all ${isActive ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#050508]/80 border-[#2D2D32] text-[#F5F2ED]/50 hover:bg-[#1A1A1E]'}`}>
                          <span className="text-[10px] font-bold mb-2 opacity-60">[{index+1}]</span>
                          <Sparkles className={`w-6 h-6 mb-3 ${isActive ? 'text-[#D4AF37]' : 'text-[#F5F2ED]/40'}`} />
                          <span className="text-[10px] uppercase tracking-widest font-bold">{isLocked ? 'LOCKED' : w.name}</span>
                          {!isLocked && <span className="text-[8px] mt-1 text-[#D4AF37]/70">COST:{w.energyCost} DMG:{w.damage}</span>}
                      </button>
                  )
              })}
          </div>

          {/* Overdrive */}
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 p-6 rounded-lg flex flex-col w-80 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] text-[#A855F7] tracking-[0.2em] font-bold">OVERDRIVE RESERVE</span>
                  <span className="text-xs text-white font-bold">{Math.floor(overdriveCharge)}%</span>
              </div>
              <div className="h-3 bg-black rounded-full overflow-hidden border border-[#2D2D32]">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-[#A855F7]" style={{ width: `${Math.min(100, overdriveCharge)}%` }} />
              </div>
              {overdriveCharge >= 100 && <div className="mt-3 text-[10px] text-center font-bold tracking-widest text-[#A855F7] animate-pulse">PRESS 'Q' TO IGNITE</div>}
          </div>
      </div>

      {/* LEFT DOCK */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-auto z-20">
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 px-5 py-10 rounded-lg flex flex-col items-center gap-6 shadow-2xl">
              <div className="text-[10px] text-[#06B6D4] tracking-[0.2em] font-bold rotate-180 uppercase" style={{ writingMode: 'vertical-rl' }}>Deflector</div>
              <div className="h-72 w-5 bg-black rounded-full overflow-hidden border border-[#2D2D32] shadow-inner relative flex items-end">
                  <div className="w-full bg-gradient-to-t from-cyan-900 to-[#06B6D4] transition-all" style={{ height: `${Math.max(0, Math.min(100, (shield/perks.maxShield)*100))}%` }} />
              </div>
              <div className="text-base font-bold text-white tracking-widest">{Math.floor(shield)}</div>
          </div>
      </div>

      {/* RIGHT DOCK */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-auto z-20">
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 px-5 py-10 rounded-lg flex flex-col items-center gap-6 shadow-2xl">
              <div className="text-[10px] text-[#D4AF37] tracking-[0.2em] font-bold uppercase" style={{ writingMode: 'vertical-rl' }}>Reactor</div>
              <div className="h-72 w-5 bg-black rounded-full overflow-hidden border border-[#2D2D32] shadow-inner relative flex items-end">
                  <div className="w-full bg-gradient-to-t from-amber-900 to-[#D4AF37] transition-all" style={{ height: `${Math.max(0, Math.min(100, (energy/perks.maxEnergy)*100))}%` }} />
              </div>
              <div className="text-base font-bold text-white tracking-widest">{Math.floor(energy)}</div>
          </div>
      </div>
      
      {/* Central Aiming Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full border border-dashed border-[#D4AF37]/30 animate-[spin_16s_linear_infinite]"></div>
          <div className="absolute w-[100px] h-[100px] border border-[#F5F2ED]/5 rounded-full flex items-center justify-center">
            <div className="absolute top-0 w-[1px] h-3 bg-[#F5F2ED]/25"></div>
            <div className="absolute bottom-0 w-[1px] h-3 bg-[#F5F2ED]/25"></div>
            <div className="absolute left-0 w-3 h-[1px] bg-[#F5F2ED]/25"></div>
            <div className="absolute right-0 w-3 h-[1px] bg-[#F5F2ED]/25"></div>
          </div>
          <div className="absolute w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]"></div>
      </div>
      </>
      )}

      {phase === 'INTRO' && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-40 backdrop-blur-sm bg-black/40">
          <button
            onClick={startSimulation}
            className="transform hover:scale-[1.03] active:scale-[0.98] transition-all px-16 py-6 bg-[#D4AF37] hover:bg-[#E5C050] text-[#0A0A0E] font-bold tracking-[0.25em] text-lg rounded-lg shadow-2xl flex items-center justify-center gap-4 cursor-pointer pointer-events-auto"
          >
             ENGAGE THRUSTERS
          </button>
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

            <h1 className="text-3xl font-sans text-rose-500 tracking-[0.15em] mb-1 font-extrabold uppercase">
              DEFEAT
            </h1>
            <p className="text-[#F5F2ED]/50 text-[10px] tracking-widest uppercase mb-6 font-sans">
              deflectors_reloading: failed [0.00% SEC integrity]
            </p>

            {/* Scoreboard summary debriefing */}
            <div className="bg-[#050508] border border-[#2D2D32] rounded-lg p-5 text-left text-xs mb-8 space-y-2.5 font-sans">
              <div className="text-[#D4AF37] font-sans text-xs text-center border-b border-[#2D2D32]/60 pb-2 uppercase tracking-widest font-bold">
                REPORT
              </div>
              <div className="grid grid-cols-2 gap-y-2 pt-1 font-sans text-[11px]">
                <span className="text-[#F5F2ED]/50">SCORE:</span>
                <span className="text-right text-[#D4AF37] font-bold">{score.toLocaleString()} PTS</span>
                
                <span className="text-[#F5F2ED]/50">SYSTEMS:</span>
                <span className="text-right text-white font-bold">{level} SYSTEM{level > 1 ? 'S' : ''}</span>

                <span className="text-[#F5F2ED]/50">ASTEROIDS:</span>
                <span className="text-right text-white font-bold">{asteroidsBlasted}</span>

                <span className="text-[#F5F2ED]/50">DISCHARGES:</span>
                <span className="text-right text-white font-bold">{stats.shotsFired}</span>

                <span className="text-[#F5F2ED]/50">ACCURACY:</span>
                <span className="text-right text-emerald-400 font-bold">{calculatedAccuracy}%</span>
              </div>
            </div>

            <button
              onClick={startSimulation}
              className="w-full transform active:scale-[0.98] transition-all py-3 bg-rose-950/45 hover:bg-rose-900/60 text-rose-200 font-sans font-extrabold tracking-[0.15em] text-xs rounded-lg border border-rose-500 shadow-xl cursor-pointer pointer-events-auto"
            >
              <RotateCcw className="w-4 h-4 inline mr-1.5 text-rose-400" /> REBOOT
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

            <h1 className="text-3xl font-sans text-[#D4AF37] tracking-[0.15em] mb-1 font-extrabold uppercase">
              VICTORY
            </h1>
            <p className="text-[#F5F2ED]/50 text-[10px] tracking-widest uppercase mb-6 font-sans">
              cosmic_matrix: cleared [100.00% EXTRUSION completed]
            </p>

            <div className="bg-[#050508] border border-[#2D2D32] rounded-lg p-5 text-left text-xs mb-8 space-y-2.5 font-sans">
              <div className="text-[#D4AF37] font-sans text-xs text-center border-b border-[#2D2D32]/60 pb-2 uppercase tracking-widest font-bold">
                LOG
              </div>
              <div className="grid grid-cols-2 gap-y-2 pt-1 font-sans text-[11px]">
                <span className="text-[#F5F2ED]/50">SCORE:</span>
                <span className="text-right text-[#D4AF37] font-extrabold">{score.toLocaleString()} PTS</span>
                
                <span className="text-[#F5F2ED]/50">ASTEROIDS:</span>
                <span className="text-right text-white font-bold">{asteroidsBlasted}</span>

                <span className="text-[#F5F2ED]/50">DISCHARGES:</span>
                <span className="text-right text-white font-bold">{stats.shotsFired} SHOTS</span>

                <span className="text-[#F5F2ED]/50">ACCURACY:</span>
                <span className="text-right text-emerald-400 font-bold">{calculatedAccuracy}%</span>

                <span className="text-[#F5F2ED]/50">RANK:</span>
                <span className="text-right text-amber-400 font-bold uppercase animate-pulse">GOLD</span>
              </div>
            </div>

            <button
              onClick={startSimulation}
              className="w-full transform active:scale-[0.98] transition-all py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:from-amber-400 hover:to-amber-700 text-black font-sans font-extrabold tracking-[0.15em] text-xs rounded-lg border border-[#D4AF37] shadow-xl cursor-pointer pointer-events-auto"
            >
              <RotateCcw className="w-4 h-4 inline mr-1.5 text-black stroke-[2]" /> ENGAGE
            </button>
          </div>
        </div>
      )}


      {/* ROGUEMIN ROGUE-LITE CHOOSE UPGRADE CARD MATRIX */}
      {phase === 'PERK_SELECTION' && (
        <div className="absolute inset-0 bg-[#050508]/95 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto z-40 animate-fade-in">
          <div className="max-w-4xl w-full bg-[#0A0A0E] border border-[#2D2D32] p-8 md:p-12 rounded-xl shadow-2xl relative">
            {/* Retro gold space corner borders */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]"></div>

            <div className="text-center mb-8">
              <span className="text-[9px] text-[#D4AF37] tracking-[0.35em] font-bold uppercase opacity-85 font-sans">CLEAR</span>
              <h1 className="text-3xl font-sans text-white tracking-[0.18em] font-extrabold mt-2 font-sans">OVERCLOCK</h1>
              <p className="text-[#F5F2ED]/60 text-xs mt-1.5 max-w-lg mx-auto leading-relaxed">
                Requisite cargo modules harvested. Overclock ship processors to synthesize a custom tactical upgrade for the next systor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Option 1 */}
              <div 
                onClick={() => {
                  setPerks(prev => {
                    const newMax = prev.maxShield + 25;
                    setShield(newMax); // Full restoration
                    return { ...prev, maxShield: newMax };
                  });
                  playSound.upgrade();
                  setPhase('PLAYING');
                }}
                className="group bg-[#0D0D12] border border-[#2D2D32] hover:border-[#06B6D4] p-6 rounded-lg text-left transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center mb-4 text-[#06B6D4] group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-[#06B6D4]" />
                  </div>
                  <h3 className="text-base font-sans tracking-wider text-[#F5F2ED] group-hover:text-[#06B6D4] transition-colors font-semibold">DEFLECTOR</h3>
                  <p className="text-xs text-[#F5F2ED]/60 mt-3 leading-relaxed">
                    Increases deflector armor capacity by <strong className="text-white">+25</strong> and deploys instant nanites to fully restore shield modules.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2D2D32]/60 flex justify-between items-center text-[10px] uppercase font-sans tracking-wider text-[#06B6D4]/80">
                  <span>DEFENSE</span>
                  <span>SELECT ➔</span>
                </div>
              </div>

              {/* Option 2 */}
              <div 
                onClick={() => {
                  setPerks(prev => {
                    const newMax = prev.maxEnergy + 30;
                    setEnergy(newMax); // Full recharge
                    return { ...prev, maxEnergy: newMax, energyRegenRate: prev.energyRegenRate + 0.40 };
                  });
                  playSound.upgrade();
                  setPhase('PLAYING');
                }}
                className="group bg-[#0D0D12] border border-[#2D2D32] hover:border-[#A855F7] p-6 rounded-lg text-left transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/30 flex items-center justify-center mb-4 text-[#A855F7] group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-[#A855F7]" />
                  </div>
                  <h3 className="text-base font-sans tracking-wider text-[#F5F2ED] group-hover:text-[#A855F7] transition-colors font-semibold">REACTOR</h3>
                  <p className="text-xs text-[#F5F2ED]/60 mt-3 leading-relaxed">
                    Overcharges primary engines to expand reserve capacity by <strong className="text-white">+30</strong> power units and boosts regeneration speed by <strong className="text-white">+40%</strong>.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2D2D32]/60 flex justify-between items-center text-[10px] uppercase font-sans tracking-wider text-[#A855F7]/80">
                  <span>RESERVES</span>
                  <span>SELECT ➔</span>
                </div>
              </div>

              {/* Option 3 */}
              <div 
                onClick={() => {
                  setPerks(prev => ({
                    ...prev,
                    damageMultiplier: prev.damageMultiplier + 0.15,
                    doubleShotChance: prev.doubleShotChance + 0.20
                  }));
                  playSound.upgrade();
                  setPhase('PLAYING');
                }}
                className="group bg-[#0D0D12] border border-[#2D2D32] hover:border-[#D4AF37] p-6 rounded-lg text-left transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-4 text-[#D4AF37] group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-base font-sans tracking-wider text-[#F5F2ED] group-hover:text-[#D4AF37] transition-colors font-semibold">CATALYST</h3>
                  <p className="text-xs text-[#F5F2ED]/60 mt-3 leading-relaxed">
                    Recalibrates magnetic fields to swell projectile damage output by <strong className="text-white">+15%</strong> and expands Twin-Shot probability triggers by <strong className="text-white">+20%</strong>.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2D2D32]/60 flex justify-between items-center text-[10px] uppercase font-sans tracking-wider text-[#D4AF37]/80">
                  <span>ATTACK</span>
                  <span>SELECT ➔</span>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-4 border-t border-[#2D2D32]/40 text-center text-[10px] text-[#F5F2ED]/40 font-sans tracking-widest uppercase">
              current_piloting_stats • max_shld: {perks.maxShield} • max_enrg: {perks.maxEnergy} • dmg_mult: {perks.damageMultiplier.toFixed(2)}x
            </div>
          </div>
        </div>
      )}


      {/* WARPING FLIGHT STATUS DEEP SEQUENCE */}
      {phase === 'WARPING' && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 text-center select-none z-30 animate-pulse">
          <div className="max-w-sm px-8 py-6 rounded border border-[#D4AF37]/50 bg-[#0A0A0E] shadow-2xl relative">
            <div className="text-white font-sans italic text-xl tracking-wider animate-pulse flex items-center justify-center gap-2">
              🌠 WARPING SPACE SYSTEMS
            </div>
            <p className="text-[#D4AF37] text-[10px] tracking-widest uppercase mt-2 font-sans">
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

            <h1 className="text-lg font-sans text-[#F5F2ED] tracking-wide mb-1 uppercase">
              Simulation Standby
            </h1>
            <p className="text-[#F5F2ED]/60 text-xs mb-6 leading-relaxed">
              Motors and target updates are frozen. Press <kbd className="bg-black/50 border border-[#2D2D32] px-1.5 py-0.5 rounded text-white font-sans text-[10px]">ESC</kbd> to return to active tracking.
            </p>

            <button
              onClick={() => setIsPaused(false)}
              className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-700 hover:from-amber-500 hover:to-amber-800 text-black font-sans italic font-semibold text-xs tracking-widest rounded-md border border-[#D4AF37] cursor-pointer pointer-events-auto shadow-md"
            >
              RESUME TRACKING VOIDS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
