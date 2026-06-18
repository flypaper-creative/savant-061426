import React, { useEffect, useState, useRef } from 'react';
import { WeaponID, GamePhase, PilotStats, PilotPerks, DifficultyLevel, SystemID, StarSystem, ThemeType } from '../types';
import { WEAPON_CONFIGS, LEVELS } from '../constants';
import { Shield, Zap, Target, Award, Activity, Sparkles, RotateCcw, Maximize2, Minimize2, Map as MapIcon, Crosshair, MapPin, AlertTriangle, Cpu, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
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
  setSystems: React.Dispatch<React.SetStateAction<StarSystem[]>>;
}

const CockpitOverlay = function CockpitOverlay({
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
  const overlayRef = useRef<HTMLDivElement>(null);
  
const generatedPerks = React.useMemo(() => {
    if (phase !== 'PERK_SELECTION') return [];
    const pool = [
      { id: 'deflector', icon: Shield, color: '#3b82f6', title: 'DEFLECTOR', desc: 'Increases deflector capacity by +25 and deploys instant nanites.', category: 'DEFENSE', 
        apply: (setPerks, setShield, setEnergy) => { 
           setPerks(prev => ({ ...prev, maxShield: prev.maxShield + 25 }));
           setShield(prev => prev + 25);
        }
      },
      { id: 'reactor', icon: Zap, color: '#eab308', title: 'REACTOR', desc: 'Overcharges engines to expand reserve capacity by +30 and boosts regen by +40%.', category: 'RESERVES', 
        apply: (setPerks, setShield, setEnergy) => { 
           setPerks(prev => ({ ...prev, maxEnergy: prev.maxEnergy + 30, energyRegenRate: prev.energyRegenRate + 0.40 }));
           setEnergy(prev => prev + 30);
        }
      },
      { id: 'catalyst', icon: Target, color: '#ef4444', title: 'CATALYST', desc: 'Recalibrates magnetic fields to swell output by +15% and bounds Twin-Shot by +20%.', category: 'ATTACK', 
        apply: (setPerks) => { 
           setPerks(prev => ({ ...prev, damageMultiplier: prev.damageMultiplier + 0.15, doubleShotChance: prev.doubleShotChance + 0.20 }));
        }
      },
      { id: 'hull', icon: Sparkles, color: '#10b981', title: 'HULL PLATING', desc: 'Instant emergency repair: Restores 100% of deflector shields immediately.', category: 'SURVIVAL', 
        apply: (setPerks, setShield) => { 
           setShield(9999); 
        }
      }
    ];

    if (!perks.unlockedGauss) {
       pool.push({ id: 'gauss', icon: Target, color: '#06b6d4', title: 'GAUSS CANNON', desc: 'Unlocks the Gauss Accelerator weapon system. Very high velocity kinetic projectiles.', category: 'WEAPON', apply: (setPerks) => setPerks(p => ({...p, unlockedGauss: true})) });
    }
    if (!perks.unlockedPhaser) {
       pool.push({ id: 'phaser', icon: Sparkles, color: '#a855f7', title: 'PHASER BANK', desc: 'Unlocks the directed Phaser Bank system. Extremely fast firing rate.', category: 'WEAPON', apply: (setPerks) => setPerks(p => ({...p, unlockedPhaser: true})) });
    }
    if (!perks.unlockedNuke) {
       pool.push({ id: 'nuke', icon: Activity, color: '#f97316', title: 'TACTICAL NUKE', desc: 'Unlocks Tactical Nuclear Missiles. Massive blast radius, supreme damage.', category: 'WEAPON', apply: (setPerks) => setPerks(p => ({...p, unlockedNuke: true})) });
    }

    // shuffle and pick 3
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [phase, level, perks]);

  const [isMuted, setIsMuted] = useState(playSound.getMuted());

  // Switch weapons on keyboard keys '1', '2', '3', '4' & Ultimate overdrive activations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'PLAYING') return;

      if (e.key === '1') setActiveWeapon(WeaponID.PLASMA_LASER);
      if (e.key === '2') setActiveWeapon(WeaponID.PROTON_TORPEDO);
      if (e.key === '3') setActiveWeapon(WeaponID.ION_BEAM);
      if (e.key === '4') setActiveWeapon(WeaponID.FLAK_CANNON);
      if (e.key === '5' && perks.unlockedGauss) setActiveWeapon(WeaponID.GAUSS_CANNON);
      if (e.key === '6' && perks.unlockedPhaser) setActiveWeapon(WeaponID.PHASER);
      if (e.key === '7' && perks.unlockedNuke) setActiveWeapon(WeaponID.NUKE);

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (overdriveCharge >= 100 && !overdriveActive) {
          setOverdriveActive(true);
          const rootElements = document.querySelectorAll('.game-shaker');
          if (rootElements.length > 0) {
             (rootElements[0] as HTMLElement).style.transform = `translate(${(Math.random()-0.5)*26}px, ${(Math.random()-0.5)*26}px)`;
             setTimeout(() => { (rootElements[0] as HTMLElement).style.transform = 'none'; }, 50);
          }
          playSound.warp();
        }
      }
      
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused(!isPaused);
      }

      if (e.key === 'm' || e.key === 'M') {
        const nextVal = !playSound.getMuted();
        playSound.setMuted(nextVal);
        setIsMuted(nextVal);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isPaused, overdriveCharge, overdriveActive, setActiveWeapon, setIsPaused, setOverdriveActive, perks]);

  useEffect(() => {
    if (phase === 'PLAYING' && shield < 30 && shield > 0) {
      const alarmTimer = setInterval(() => {
        playSound.alarm();
      }, 1000);
      return () => clearInterval(alarmTimer);
    }
  }, [phase, shield]);

  const startSimulation = () => {
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

  const initiateManualWarp = (sysId: SystemID) => {
    playSound.warp();
    setPhase('WARPING');
    setActiveSystemId(sysId);
    setAsteroidsBlasted(0);
    setTimeout(() => {
      setPhase('PLAYING');
    }, 3200);
  };

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftTab, setLeftTab] = useState('VITALS');
  const [rightTab, setRightTab] = useState('WAYPOINT');

  const calculatedAccuracy = stats.shotsFired > 0 
    ? Math.min(100, Math.floor((stats.shotsHit / stats.shotsFired) * 100)) 
    : 0;

  const currentLevelConfig = LEVELS[level - 1] || LEVELS[0];

  const currentSystem = systems.find((s) => s.id === activeSystemId) || systems[0];
  const quota = currentSystem ? currentSystem.quota : 15;

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-10 ${shield < 20 && phase === 'PLAYING' ? 'animate-glitch' : ''}`}
    >
      {phase === 'PLAYING' && (
      <>
        {/* ADOBE-STYLE HUD LAYOUT */}
        <div className="absolute inset-0 w-full h-full p-0 flex justify-between pointer-events-none z-20 box-border overflow-hidden">
          
          {/* LEFT PANEL */}
          <div className={`pointer-events-auto h-full bg-[#1e1e1e]/95 border-r border-[#333] flex flex-col z-50 font-sans text-xs text-gray-300 transition-all duration-300 ${leftCollapsed ? 'w-10' : 'w-64'}`}>
            {leftCollapsed ? (
              <div className="flex flex-col items-center py-2 h-full gap-4 relative">
                <button onClick={() => setLeftCollapsed(false)} className="text-gray-400 hover:text-[#F59E0B] p-2 hover:bg-[#333] rounded">
                  <Maximize2 className="w-4 h-4" />
                </button>
                <div className="w-1 h-32 bg-[#111] mt-4 border border-[#333] relative">
                  <div className="absolute bottom-0 w-full bg-[#F59E0B]" style={{height: `${Math.max(0, Math.min(100, (shield/perks.maxShield)*100))}%`}}></div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center bg-[#2d2d2d] px-3 py-1.5 border-b border-[#111] shadow-sm relative">
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#F59E0B]/70"></div>
                  <span className="font-semibold text-gray-100 tracking-[0.2em] text-[10px] uppercase">Ship Status</span>
                  <button onClick={() => setLeftCollapsed(true)} className="text-gray-400 hover:text-[#F59E0B]">
                    <Minimize2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex border-b border-[#333] bg-[#252525]">
                  {['VITALS', 'WEAPONS', 'STATS'].map(tab => (
                    <button key={tab} onClick={() => setLeftTab(tab)} className={`flex-1 py-1 text-[9px] tracking-wider border-r border-[#333] ${leftTab === tab ? 'bg-[#1e1e1e] text-[#F59E0B] border-t-2 border-t-[#F59E0B] font-bold shadow-inner' : 'hover:bg-[#2a2a2a]'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                  {leftTab === 'VITALS' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] tracking-widest"><span className="text-gray-400 font-bold">DEFLECTOR</span> <span className="text-[#F59E0B]">{Math.floor(shield)} / {perks.maxShield}</span></div>
                        <div className="w-full h-2 bg-[#111] border border-[#333] relative">
                          <div className="h-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] transition-all" style={{ width: `${Math.max(0, Math.min(100, (shield/perks.maxShield)*100))}%` }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] tracking-widest"><span className="text-gray-400 font-bold">REACTOR</span> <span className="text-[#D4AF37]">{Math.floor(energy)} / {perks.maxEnergy}</span></div>
                        <div className="w-full h-2 bg-[#111] border border-[#333] relative">
                          <div className="h-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] transition-all" style={{ width: `${Math.max(0, Math.min(100, (energy/perks.maxEnergy)*100))}%` }} />
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-[#333]">
                        <div className="flex justify-between text-[10px] tracking-widest"><span className="text-[#A855F7] font-bold">OVERDRIVE</span> <span className="text-white">{Math.floor(overdriveCharge)}%</span></div>
                        <div 
                          className={`w-full h-1.5 bg-[#111] border ${overdriveCharge >= 100 ? 'border-[#A855F7] cursor-pointer hover:bg-[#A855F7]/20' : 'border-[#A855F7]/30'}`}
                          onClick={() => {
                            if (overdriveCharge >= 100 && !overdriveActive) setOverdriveActive(true);
                          }}
                        >
                          <div className={`h-full bg-[#A855F7] shadow-[0_0_8px_#A855F7] ${overdriveActive ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(100, overdriveCharge)}%` }} />
                        </div>
                        {overdriveCharge >= 100 && !overdriveActive && <div onClick={() => setOverdriveActive(true)} className="cursor-pointer text-[10px] text-[#A855F7] animate-pulse pt-1 tracking-widest text-center">{isTouchDevice ? 'TAP TO IGNITE' : 'PRESS SPACE'}</div>}
                        {overdriveActive && <div className="text-[10px] text-white animate-pulse pt-1 tracking-widest text-center">OVERDRIVE ACTIVE</div>}
                      </div>
                    </div>
                  )}
                  {leftTab === 'WEAPONS' && (
                    <div className="flex flex-col gap-3">
                      {Object.values(WEAPON_CONFIGS).map((w, index) => {
                        let isLocked = false;
                        if (w.id === WeaponID.GAUSS_CANNON) isLocked = !perks.unlockedGauss;
                        if (w.id === WeaponID.PHASER) isLocked = !perks.unlockedPhaser;
                        if (w.id === WeaponID.NUKE) isLocked = !perks.unlockedNuke;
                        const isActive = activeWeapon === w.id;
                        return (
                          <div key={w.id} onClick={() => !isLocked && setActiveWeapon(w.id)} className={`cursor-pointer relative overflow-hidden flex items-center gap-3 p-3 border transition-all ${isLocked ? 'opacity-30 border-[#333] bg-[#111]' : isActive ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'bg-[#252525] border-[#444] hover:border-[#666]'}`}>
                            <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-[#111] text-[8px] border-l border-b border-inherit">{index + 1}</div>
                            <Sparkles className="w-4 h-4" />
                            <div className="flex flex-col">
                              <span className="text-[10px] tracking-widest font-bold">{w.name} {isLocked && '(LCK)'}</span>
                              <span className="text-[8px] text-gray-500 tracking-wider">PWR: {w.energyCost} / DMG: {w.damage}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {leftTab === 'STATS' && (
                    <div className="flex flex-col gap-3 text-[10px] tracking-widest font-mono">
                      <div className="flex justify-between pb-2 border-b border-[#333]"><span>SCORE</span> <span className="text-white">{score.toLocaleString()}</span></div>
                      <div className="flex justify-between pb-2 border-b border-[#333]"><span>TARGETS</span> <span className="text-[#F59E0B]">{asteroidsBlasted}</span></div>
                      <div className="flex justify-between pb-2 border-b border-[#333]"><span>ACCURACY</span> <span className="text-white">{calculatedAccuracy}%</span></div>
                      <div className="flex justify-between pb-2 border-b border-[#333]"><span>DMG MULT</span> <span className="text-white">x{perks.damageMultiplier.toFixed(2)}</span></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className={`pointer-events-auto h-full bg-[#1e1e1e]/95 border-l border-[#333] flex flex-col z-50 font-sans text-xs text-gray-300 transition-all duration-300 ${rightCollapsed ? 'w-10' : 'w-72'}`}>
             {rightCollapsed ? (
              <div className="flex flex-col items-center py-2 h-full gap-4 relative">
                <button onClick={() => setRightCollapsed(false)} className="text-gray-400 hover:text-[#00ffcc] p-2 hover:bg-[#333] rounded">
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center bg-[#2d2d2d] px-3 py-1.5 border-b border-[#111] shadow-sm relative">
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#00ffcc]/70"></div>
                  <button onClick={() => setRightCollapsed(true)} className="text-gray-400 hover:text-[#00ffcc]">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <span className="font-semibold text-gray-100 tracking-[0.2em] text-[10px] uppercase">Nav & Tactics</span>
                </div>
                <div className="flex border-b border-[#333] bg-[#252525]">
                  {['WAYPOINT', 'MAP'].map(tab => (
                    <button key={tab} onClick={() => setRightTab(tab)} className={`flex-1 py-1 text-[9px] tracking-wider border-r border-[#333] ${rightTab === tab ? 'bg-[#1e1e1e] text-[#00ffcc] border-t-2 border-t-[#00ffcc] font-bold shadow-inner' : 'hover:bg-[#2a2a2a]'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                  {rightTab === 'WAYPOINT' && (
                    <div className="flex flex-col gap-4">
                      <div className="p-3 border border-[#00ffcc]/30 bg-[#00ffcc]/5 flex flex-col gap-2">
                        <div className="text-[9px] text-[#00ffcc] tracking-widest font-bold">CURRENT SECTOR</div>
                        <div className="text-lg font-sans font-light tracking-[0.2em] text-white">{currentSystem.name}</div>
                        <div className="text-[10px] tracking-widest font-mono text-gray-400">LVL {level}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[10px] tracking-widest text-gray-500">QUOTA PROGRESS</div>
                        <div className="w-full h-1 bg-[#111] border border-[#333]">
                          <div className="h-full bg-white shadow-[0_0_5px_#fff]" style={{ width: `${Math.min(100, (asteroidsBlasted / quota) * 100)}%` }}></div>
                        </div>
                        <div className="text-[9px] text-right text-gray-400 font-mono">{asteroidsBlasted} / {quota}</div>
                      </div>
                    </div>
                  )}
                  {rightTab === 'MAP' && (
                    <div className="flex flex-col gap-3">
                      <div className="text-[9px] tracking-widest text-[#00ffcc] mb-2 font-bold flex items-center justify-between">
                        <span>STAR CHART</span>
                        <MapIcon className="w-3 h-3" />
                      </div>
                      {systems.map((sys, idx) => (
                        <div 
                          key={sys.id} 
                          onClick={() => {
                            if (activeSystemId !== sys.id && phase === 'PLAYING') {
                                initiateManualWarp(sys.id);
                            }
                          }}
                          className={`p-3 border cursor-pointer ${activeSystemId === sys.id ? 'bg-[#00ffcc]/10 border-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.1)]' : 'bg-[#252525] border-[#333] hover:border-[#666]'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] tracking-[0.2em] font-bold ${activeSystemId === sys.id ? 'text-[#00ffcc]' : 'text-gray-300'}`}>{sys.name}</span>
                            {activeSystemId === sys.id && <MapPin className="w-3 h-3 text-[#00ffcc]" />}
                          </div>
                          <div className="text-[8px] text-gray-500 mt-1 uppercase tracking-widest font-mono">{sys.hazardLevel}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Central Aiming Crosshairs (Minimalist) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30">
            <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
            </div>
            <div className="absolute w-[180px] h-[180px] border border-white/5 rounded-full flex items-center justify-center">
              <div className="absolute top-0 w-[1px] h-2 bg-white/30"></div>
              <div className="absolute bottom-0 w-[1px] h-2 bg-white/30"></div>
              <div className="absolute left-0 w-2 h-[1px] bg-white/30"></div>
              <div className="absolute right-0 w-2 h-[1px] bg-white/30"></div>
            </div>
        </div>
      </>
      )}

      {phase === 'INTRO' && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-40 backdrop-blur-[6px] bg-[#050508]/80">
          <button
            onClick={startSimulation}
            className="group relative px-12 py-5 bg-transparent text-[#F59E0B] font-mono tracking-[0.4em] text-sm uppercase cursor-pointer border border-[#F59E0B]/30 hover:border-[#F59E0B]/80 transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
             <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#F59E0B]"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#F59E0B]"></div>
             <span className="relative z-10 group-hover:text-white transition-colors">INITIALIZE LINK</span>
             <div className="absolute inset-0 bg-[#F59E0B]/5 group-hover:bg-[#F59E0B]/10 transition-colors"></div>
          </button>
      </div>
      )}

      {/* GAME OVER MODULE */}
      {phase === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-[#050508]/90 backdrop-blur-md flex items-center justify-center p-6 text-center pointer-events-auto z-40">
           <div className="max-w-md w-full bg-[#050508]/60 border border-rose-900/40 p-10 relative">
             <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-rose-500/70"></div>
             <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-rose-500/70"></div>

            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center relative">
               <div className="absolute inset-0 border border-rose-500/30 animate-[spin_4s_linear_infinite]"></div>
               <div className="absolute inset-2 border border-rose-500/60 rotate-45"></div>
               <Shield className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>

            <h1 className="text-3xl font-sans text-white tracking-[0.3em] mb-2 font-light uppercase">
               LINK SEVERED
            </h1>
            <p className="text-[#F5F2ED]/40 text-[10px] tracking-widest uppercase mb-8 font-mono">
              deflectors_reloading: failed [0.00% SEC integrity]
            </p>

            <div className="bg-transparent border border-[#2D2D32]/50 p-5 text-left text-xs mb-8 space-y-3 font-mono relative">
               <div className="absolute left-0 top-0 w-1 h-full bg-rose-500/20"></div>
              <div className="text-rose-500 text-xs text-center border-b border-[#2D2D32]/60 pb-3 uppercase tracking-widest">
                TELEMETRY REPORT
              </div>
              <div className="grid grid-cols-2 gap-y-3 pt-2 text-[10px] px-2 text-[#F5F2ED]/60">
                <span>TOTAL SCORE</span>
                <span className="text-right text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{score.toLocaleString()}</span>
                
                <span>SYSTEMS CLEARED</span>
                <span className="text-right text-white">{level}</span>

                <span>VIABLE TARGETS</span>
                <span className="text-right text-white">{asteroidsBlasted}</span>

                <span>BEAM DISCHARGES</span>
                <span className="text-right text-white">{stats.shotsFired}</span>

                <span>CALC ACCURACY</span>
                <span className="text-right text-white">{calculatedAccuracy}%</span>
              </div>
            </div>

            <button
               onClick={startSimulation}
               className="group relative w-full py-4 text-rose-400 font-mono tracking-[0.3em] text-[10px] uppercase cursor-pointer border border-rose-900/50 hover:border-rose-500/80 transition-all hover:text-white bg-transparent"
             >
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-rose-500/50"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-rose-500/50"></div>
                REBOOT SEQUENCE
             </button>
          </div>
        </div>
      )}

      {/* SUPREME VICTORY BRIEFING */}
      {phase === 'VICTORY' && (
        <div className="absolute inset-0 bg-[#050508]/90 backdrop-blur-md flex items-center justify-center p-6 text-center pointer-events-auto z-40">
           <div className="max-w-md w-full bg-[#050508]/60 border border-[#D4AF37]/30 p-10 relative">
             <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#D4AF37]/80"></div>
             <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#D4AF37]/80"></div>

            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center relative">
               <div className="absolute inset-0 border border-[#D4AF37]/30 animate-[spin_10s_linear_infinite]"></div>
               <div className="absolute inset-1 border border-dashed border-[#D4AF37]/50 animate-[spin_8s_linear_infinite_reverse]"></div>
               <Award className="w-5 h-5 text-[#D4AF37]" />
            </div>

            <h1 className="text-3xl font-sans text-white tracking-[0.3em] mb-2 font-light uppercase drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
               ASCENSION
            </h1>
            <p className="text-[#D4AF37]/60 text-[10px] tracking-widest uppercase mb-8 font-mono">
              cosmic_matrix: nullified [100.00% EXTRUSION]
            </p>

            <div className="bg-transparent border border-[#2D2D32]/50 p-5 text-left text-xs mb-8 space-y-3 font-mono relative">
               <div className="absolute left-0 top-0 w-1 h-full bg-[#D4AF37]/20"></div>
              <div className="text-[#D4AF37] text-xs text-center border-b border-[#2D2D32]/60 pb-3 uppercase tracking-widest">
                FINAL LOG
              </div>
              <div className="grid grid-cols-2 gap-y-3 pt-2 text-[10px] px-2 text-[#F5F2ED]/60">
                <span>FINAL SCORE</span>
                <span className="text-right text-[#D4AF37] font-bold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">{score.toLocaleString()}</span>
                
                <span>UNITS PURGED</span>
                <span className="text-right text-white">{asteroidsBlasted}</span>

                <span>TOTAL DISCHARGES</span>
                <span className="text-right text-white">{stats.shotsFired}</span>

                <span>LIFETIME ACCURACY</span>
                <span className="text-right text-white">{calculatedAccuracy}%</span>

                <span>EVALUATION RATING</span>
                <span className="text-right text-[#D4AF37] animate-pulse">SAVANT // GOLD</span>
              </div>
            </div>

            <button
               onClick={startSimulation}
               className="group relative w-full py-4 text-[#D4AF37] font-mono tracking-[0.3em] text-[10px] uppercase cursor-pointer border border-[#D4AF37]/40 hover:border-[#D4AF37]/80 transition-all hover:text-white bg-transparent shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)]"
             >
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37]"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37]"></div>
                NEW SESSION
             </button>
          </div>
        </div>
      )}

      {/* ROGUEMIN ROGUE-LITE CHOOSE UPGRADE CARD MATRIX */}
      {phase === 'PERK_SELECTION' && (
        <div className="absolute inset-0 bg-[#050508]/90 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto z-40 animate-fade-in relative">
          <div className="max-w-4xl w-full bg-[#050508]/60 border border-[#2D2D32]/50 p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#F59E0B]"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#F59E0B]"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#F59E0B]"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#F59E0B]"></div>

            <div className="text-center mb-10">
              <span className="text-[10px] text-[#F59E0B] tracking-[0.4em] font-bold uppercase opacity-90 font-mono">SECTOR CLEARED</span>
              <h1 className="text-4xl font-sans text-white tracking-[0.3em] font-light mt-2 drop-shadow-lg uppercase">SYSTEM UPGRADE</h1>
              <p className="text-[#F5F2ED]/60 text-[10px] mt-4 max-w-lg mx-auto leading-relaxed font-mono uppercase tracking-widest">
                Requisite cargo modules harvested. Overclock core architecture to synthesize a custom tactical expansion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {generatedPerks.map((p, idx) => {
                 const Icon = p.icon;
                 return (
                  <div key={idx}
                    onClick={() => {
                      if (p.id === 'hull') { p.apply(setPerks, (v) => setShield(perks.maxShield), setEnergy); } else { p.apply(setPerks, setShield, setEnergy); }
                      playSound.upgrade();
                      setPhase('PLAYING');
                    }}
                    className="group bg-transparent border border-white/10 hover:border-white/50 p-8 text-left transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between relative"
                  >
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 transition-colors"></div>
                    <div>
                      <div className="w-12 h-12 flex items-center justify-center mb-5 text-white/50 group-hover:scale-110 transition-all">
                        <Icon className="w-6 h-6 drop-shadow-md" style={{ color: p.color }} />
                      </div>
                      <h3 className="text-lg tracking-[0.2em] transition-colors font-sans uppercase" style={{ color: p.color }}>{p.title}</h3>
                      <p className="text-[10px] text-[#F5F2ED]/50 mt-3 leading-relaxed font-mono uppercase">
                        {p.desc}
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-white/40 transition-colors" style={{ color: p.color }}>
                      <span>{p.category}</span>
                      <span>SELECT &rarr;</span>
                    </div>
                  </div>
                 );
              })}
            </div>

            <div className="mt-10 pt-4 text-center text-[10px] text-[#F5F2ED]/30 font-mono tracking-[0.2em] uppercase">
              [ module ] struct_capacity: {perks.maxShield} // reserve_cap: {perks.maxEnergy} // sys_mult: {perks.damageMultiplier.toFixed(2)}x
            </div>
          </div>
        </div>
      )}

      {/* WARPING FLIGHT STATUS DEEP SEQUENCE */}
      {phase === 'WARPING' && (
        <div className="absolute inset-0 bg-[#050508]/60 backdrop-blur-sm flex items-center justify-center p-6 text-center select-none z-30">
          <div className="max-w-sm w-full px-10 py-8 bg-transparent border border-[#F59E0B]/30 relative flex flex-col items-center shadow-[0_0_50px_rgba(245,158,11,0.1)]">
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F59E0B]/70"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F59E0B]/70"></div>
            <div className="text-white font-sans text-2xl tracking-[0.2em] font-light uppercase flex items-center justify-center gap-3 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
              WARP ENGAGED
            </div>
            <p className="text-[#F59E0B]/80 text-[10px] tracking-[0.4em] uppercase mt-2 font-mono">
              traversing_cosmic_web
            </p>
            <div className="w-full h-[1px] bg-[#F59E0B]/20 overflow-hidden mt-6 relative">
              <div className="absolute top-0 left-0 h-full bg-[#F59E0B] shadow-[0_0_10px_#22d3ee] animate-[ping_1.5s_linear_infinite]" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* PAUSED ENGINE */}
      {isPaused && phase === 'PLAYING' && (
        <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-md flex items-center justify-center p-6 text-center pointer-events-auto z-40">
          <div className="max-w-xs w-full bg-[#050508]/60 border border-[#F59E0B]/40 p-10 relative shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col items-center">
             <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#F59E0B]/70"></div>
             <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#F59E0B]/70"></div>

            <div className="w-12 h-12 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 border border-[#F59E0B]/40 animate-[spin_6s_linear_infinite]"></div>
              <Activity className="w-5 h-5 text-[#F59E0B] animate-pulse drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
            </div>

            <h1 className="text-2xl font-sans text-white tracking-[0.3em] font-light mb-2 uppercase drop-shadow-md">
              STANDBY
            </h1>
            <p className="text-[#F5F2ED]/40 text-[10px] mb-8 tracking-widest font-mono uppercase">
              simulation_paused
            </p>

            <button
               onClick={() => setIsPaused(false)}
               className="group relative w-full py-4 text-[#F59E0B] font-mono tracking-[0.3em] text-[10px] uppercase cursor-pointer border border-[#F59E0B]/40 hover:border-[#F59E0B]/80 transition-all hover:text-white bg-transparent shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]"
             >
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F59E0B]/70"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F59E0B]/70"></div>
                RESUME
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CockpitOverlay);
