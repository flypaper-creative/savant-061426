import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { WeaponID, GamePhase, PilotStats, PilotPerks, DifficultyLevel, SystemID, StarSystem, ThemeType } from '../types';
import { WEAPON_CONFIGS, LEVELS } from '../constants';
import { Shield, Zap, Target, Award, Activity, Sparkles, RotateCcw, Maximize2, Minimize2, Map as MapIcon, Crosshair, MapPin, AlertTriangle, Cpu, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { playSound } from '../utils/audio';
import { globalAsteroidsData, globalPickupsData } from './AsteroidCanvas';

const AITacticalReadout = ({ phase, activeSystemId, stats, shield, level }: { phase: GamePhase, activeSystemId: SystemID, stats: PilotStats, shield: number, level: number }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (phase !== 'PLAYING') return;

    let abortController = new AbortController();

    const fetchTacticalAdvice = async (action: string = "UPDATE") => {
      if (isTyping) return;
      setIsTyping(true);
      if (textRef.current) textRef.current.innerText = "> A.E.G.I.S. Uplink Established...";

      try {
        const response = await fetch('/api/ai/tactical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemName: activeSystemId,
            wave: level,
            health: shield,
            shotsHit: stats.shotsHit,
            shotsFired: stats.shotsFired,
            action: action
          }),
          signal: abortController.signal
        });

        if (!response.ok) {
          if (textRef.current) textRef.current.innerText = "> A.E.G.I.S: Processing cycle delayed. Conserving bandwidth.";
          return;
        }

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        if (textRef.current) {
          textRef.current.innerText = "> A.E.G.I.S: ";
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (textRef.current) {
                  textRef.current.innerText += parsed.text;
                }
              } catch (e) {
                // Ignore parse errors on chunks
              }
            }
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError' && textRef.current) {
          textRef.current.innerText = "> A.E.G.I.S: Tactical uplink offline.";
        }
      } finally {
        setIsTyping(false);
      }
    };

    // Trigger AI evaluation periodically or on major events.
    if (level === 1 && shield === 100) {
       fetchTacticalAdvice("SYSTEM_ENTER");
    } else {
       fetchTacticalAdvice("UPDATE");
    }

    const interval = setInterval(() => {
        if (shield < 50 && Math.random() > 0.5) {
            fetchTacticalAdvice("HEAVY_DAMAGE");
        } else {
            fetchTacticalAdvice("UPDATE");
        }
    }, 90000); // 90 seconds analysis heartbeat

    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, [phase, activeSystemId, level]);

  if (phase !== 'PLAYING') return null;

  return (
    <div className="flex items-center gap-2 pointer-events-auto">
      <div className="w-8 h-8 rounded-full border border-teal-500/50 bg-teal-900/40 shadow-[0_0_15px_rgba(20,184,166,0.4)] flex items-center justify-center relative overflow-hidden">
        <Cpu className="text-teal-400 w-4 h-4 animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-teal-500/20 animate-[pulse_2s_ease-in-out_infinite]" />
      </div>
      <div className="bg-black/60 border border-teal-900/60 p-1.5 px-3 rounded shadow-[0_0_10px_rgba(20,184,166,0.2)] backdrop-blur-sm min-w-[250px] max-w-[400px]">
        <div ref={textRef} className="text-style-popup">
           {'>'} A.E.G.I.S. Tactical AI Online...
        </div>
      </div>
    </div>
  );
};

const AIPilotReview = ({ stats, phase }: { stats: PilotStats, phase: GamePhase }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (phase !== 'GAME_OVER') return;
    let abortController = new AbortController();

    const fetchReview = async () => {
      setIsTyping(true);
      setComplete(false);
      try {
        const accuracy = stats.shotsFired > 0 ? ((stats.shotsHit / stats.shotsFired) * 100).toFixed(1) : "0.0";
        const response = await fetch('/api/ai/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: stats.score,
            asteroidsDestroyed: stats.asteroidsDestroyed,
            accuracy,
            playTime: stats.playTime
          }),
          signal: abortController.signal
        });

        if (!response.ok) {
           if (textRef.current) textRef.current.innerText = "A.E.G.I.S. Uplink disconnected. Review unavailable.";
           return;
        }

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        if (textRef.current) textRef.current.innerText = ""; // Clear loader

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (textRef.current) textRef.current.innerText += parsed.text;
              } catch (e) {}
            }
          }
        }
      } catch (e: any) {
         if (e.name !== 'AbortError' && textRef.current) {
            textRef.current.innerText = "A.E.G.I.S. Uplink disconnected. Review unavailable.";
         }
      } finally {
        setIsTyping(false);
        setComplete(true);
      }
    };
    
    fetchReview();
    return () => abortController.abort();
  }, [phase]);

  if (phase !== 'GAME_OVER') return null;

  return (
    <div className="bg-[#050508]/80 border border-teal-900/50 p-6 rounded-lg text-left mt-6 shadow-[0_0_20px_rgba(20,184,166,0.15)] relative overflow-hidden">
       <div className="absolute top-0 right-0 p-2 opacity-50"><Cpu className="text-teal-500 w-8 h-8" /></div>
       <div className="text-[10px] text-teal-500 mb-2 font-mono tracking-widest">{'>'} A.E.G.I.S. POST-MORTEM ANALYSIS</div>
       <div ref={textRef} className="text-sm text-teal-100/90 font-sans leading-relaxed tracking-wide min-h-[100px] whitespace-pre-wrap">
          Connecting to central network for pilot assessment...
       </div>
    </div>
  );
};

const RadarMiniMap = ({ phase }: { phase: GamePhase }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase !== 'PLAYING') return;

    let animId: number;
    const drawRadar = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radarRadius = Math.min(cx, cy) - 2;

      ctx.clearRect(0, 0, w, h);

      // Draw radar grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
      ctx.lineWidth = 1;

      // Concentric rings
      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius * 0.66, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius * 0.33, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Sweep animation
      const time = performance.now();
      const sweepAngle = (time / 1000) * Math.PI * 1.5;
      
      const sweepGrad = ctx.createConicGradient(sweepAngle - 0.5, cx, cy);
      sweepGrad.addColorStop(0, "rgba(6, 182, 212, 0)");
      sweepGrad.addColorStop(0.2, "rgba(6, 182, 212, 0.4)");
      sweepGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
      
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius, sweepAngle - 0.5, sweepAngle);
      ctx.lineTo(cx, cy);
      ctx.fill();

      // Draw active elements
      // Tuning relative scale. Z is mostly between -8000 to +2000
      const maxDist = 6000; 

      // Pickups (Yellow/Neon)
      if (globalPickupsData) {
        ctx.fillStyle = "#facc15"; 
        globalPickupsData.forEach(pk => {
          const sx = cx + (pk.x / maxDist) * radarRadius;
          const sy = cy + (pk.z / maxDist) * radarRadius; 
          
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Asteroids (Red)
      if (globalAsteroidsData) {
        ctx.fillStyle = "#ef4444";
        globalAsteroidsData.forEach(ast => {
          if (ast.health <= 0) return;
          
          const sx = cx + (ast.x / maxDist) * radarRadius;
          const sy = cy + ((ast.z + 2000) / maxDist) * radarRadius; // adjust for camera offset

          // Bounds check
          const distSq = (sx - cx)*(sx-cx) + (sy-cy)*(sy-cy);
          if (distSq > radarRadius * radarRadius) return;

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(1.5, ast.radius / 150), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Ship indicator (Center)
      ctx.fillStyle = "#22d3ee";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx + 3, cy + 3);
      ctx.lineTo(cx - 3, cy + 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(drawRadar);
    };

    animId = requestAnimationFrame(drawRadar);
    return () => cancelAnimationFrame(animId);
  }, [phase]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={140} height={140} className="rounded-full bg-[#020205]/80 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]" />
      {/* Radar frame accents */}
      <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-full opacity-60"></div>
      <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-full opacity-60"></div>
      <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-full opacity-60"></div>
      <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-full opacity-60"></div>
    </div>
  );
};

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

    // shuffle and pick 3
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [phase, level, perks]);

  const [isMuted, setIsMuted] = useState(playSound.getMuted());

  // Switch weapons on keyboard keys & Ultimate overdrive activations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'PLAYING') return;

      const weaponArray = Object.values(WEAPON_CONFIGS);
      const keyMap = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '[', ']'];
      const index = keyMap.indexOf(e.key);
      if (index >= 0 && index < weaponArray.length) {
        setActiveWeapon(weaponArray[index].id);
      }

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
  const [leftTabs, setLeftTabs] = useState<string[]>(['VITALS', 'WEAPONS', 'STATS']);
  const [rightTabs, setRightTabs] = useState<string[]>(['WAYPOINT', 'MAP']);
  const [leftTab, setLeftTab] = useState('VITALS');
  const [rightTab, setRightTab] = useState('WAYPOINT');

  const handleDragStart = (e: React.DragEvent, tab: string, sourceSide: 'left' | 'right') => {
    e.dataTransfer.setData('tabName', tab);
    e.dataTransfer.setData('sourceSide', sourceSide);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSide: 'left' | 'right') => {
    e.preventDefault();
    const tab = e.dataTransfer.getData('tabName');
    const sourceSide = e.dataTransfer.getData('sourceSide') as 'left' | 'right';

    if (!tab || sourceSide === targetSide) return;

    if (sourceSide === 'left') {
      const updatedLeft = leftTabs.filter(t => t !== tab);
      const updatedRight = [...rightTabs, tab];
      setLeftTabs(updatedLeft);
      setRightTabs(updatedRight);
      setRightTab(tab);
      if (leftTab === tab && updatedLeft.length > 0) {
        setLeftTab(updatedLeft[0]);
      }
    } else {
      const updatedRight = rightTabs.filter(t => t !== tab);
      const updatedLeft = [...leftTabs, tab];
      setRightTabs(updatedRight);
      setLeftTabs(updatedLeft);
      setLeftTab(tab);
      if (rightTab === tab && updatedRight.length > 0) {
        setRightTab(updatedRight[0]);
      }
    }
  };

  const [isShaking, setIsShaking] = useState(false);
  const prevShieldRef = useRef(shield);

  const [waveAlert, setWaveAlert] = useState<{ number: number; title: string } | null>(null);

  const WAVE_NAMES: Record<number, string> = {
    1: 'WAVE 1: INITIAL DEFENSE FIELD',
    2: 'WAVE 2: RECON FLANK MANEUVERS',
    3: 'WAVE 3: PILOT INTERCEPT SQUAD',
    4: 'WAVE 4: DENSE METEORIC BARRIER',
    5: 'WAVE 5: METEORIC STORM CORE',
  };

  const currentSystem = systems.find((s) => s.id === activeSystemId) || systems[0];
  const quota = currentSystem ? currentSystem.quota : 15;

  useEffect(() => {
    if (phase === 'PLAYING') {
      const calcWave = Math.min(5, Math.floor(asteroidsBlasted / Math.max(1, quota / 5)) + 1);
      const waveTitle = WAVE_NAMES[calcWave] || `WAVE ${calcWave}: HOSTILE INGRESS`;
      
      setWaveAlert({ number: calcWave, title: waveTitle });
      
      const timer = setTimeout(() => {
        setWaveAlert(null);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setWaveAlert(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asteroidsBlasted, phase, activeSystemId]);

  useEffect(() => {
    if (phase === 'PLAYING' && shield < prevShieldRef.current) {
      setIsShaking(true);
      const timer = setTimeout(() => {
        setIsShaking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
    prevShieldRef.current = shield;
  }, [shield, phase]);

  const calculatedAccuracy = stats.shotsFired > 0 
    ? Math.min(100, Math.floor((stats.shotsHit / stats.shotsFired) * 100)) 
    : 0;

  const currentLevelConfig = LEVELS[level - 1] || LEVELS[0];

  const renderVitals = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] tracking-widest"><span className="text-cyan-600 font-bold">DEFLECTOR</span> <span className="text-cyan-300">{Math.floor(shield)}</span></div>
          <div className="w-full h-1.5 bg-black/50 border border-cyan-900/40 relative">
            <div className="h-full bg-cyan-300 shadow-[0_0_10px_#67e8f9] transition-all" style={{ width: `${Math.max(0, Math.min(100, (shield/perks.maxShield)*100))}%` }} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] tracking-widest"><span className="text-cyan-600 font-bold">REACTOR</span> <span className="text-cyan-500">{Math.floor(energy)}</span></div>
          <div className="w-full h-1.5 bg-black/50 border border-cyan-900/40 relative">
            <div className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all" style={{ width: `${Math.max(0, Math.min(100, (energy/perks.maxEnergy)*100))}%` }} />
          </div>
        </div>
        <div className="space-y-1.5 pt-3 border-t border-cyan-900/40">
          <div className="flex justify-between text-[9px] tracking-widest"><span className="text-indigo-400 font-bold">OVERDRIVE</span> <span className="text-white">{Math.floor(overdriveCharge)}%</span></div>
          <div 
            className={`w-full h-1.5 bg-black/50 border ${overdriveCharge >= 100 ? 'border-indigo-400 cursor-pointer hover:bg-indigo-400/20' : 'border-cyan-900/40'}`}
            onClick={() => {
              if (overdriveCharge >= 100 && !overdriveActive) setOverdriveActive(true);
            }}
          >
            <div className={`h-full bg-indigo-400 shadow-[0_0_8px_#818cf8] ${overdriveActive ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(100, overdriveCharge)}%` }} />
          </div>
          {overdriveCharge >= 100 && !overdriveActive && <div onClick={() => setOverdriveActive(true)} className="cursor-pointer text-[8px] text-indigo-400 animate-pulse pt-0.5 tracking-wider text-center">{isTouchDevice ? 'TAP TO IGNITE' : 'PRESS SPACE'}</div>}
          {overdriveActive && <div className="text-[8px] text-white animate-pulse pt-0.5 tracking-wider text-center">ACTIVE</div>}
        </div>
      </div>
    );
  };

  const renderWeapons = () => {
    return (
      <div className="flex flex-col gap-2">
        {Object.values(WEAPON_CONFIGS).map((w, index) => {
          const isLocked = false; // Unlocked for maximum sandbox playability
          const isActive = activeWeapon === w.id;
          return (
            <div key={w.id} onClick={() => !isLocked && setActiveWeapon(w.id)} className={`cursor-pointer relative overflow-hidden flex items-center gap-2 p-2 border rounded transition-all ${isLocked ? 'opacity-30 border-white/5 bg-black/20' : isActive ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'bg-black/10 border-cyan-900/40 hover:border-cyan-700/60 hover:bg-cyan-900/10'}`}>
              <div className="absolute top-0 right-0 px-1 py-0.5 bg-black/60 text-[7px] border-l border-b border-cyan-900/40 text-cyan-600">{index + 1}</div>
              <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-cyan-700'}`} />
              <div className="flex flex-col">
                <span className="text-[9px] tracking-widest font-bold whitespace-nowrap">{w.name} {isLocked && '(LCK)'}</span>
                <span className={`text-[7.5px] tracking-wider ${isActive ? 'text-cyan-200' : 'text-cyan-600'}`}>PWR: {w.energyCost} / DMG: {w.damage}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStats = () => {
    return (
      <div className="flex flex-col gap-2 text-[9px] tracking-widest font-mono text-cyan-600">
        <div className="flex justify-between pb-1.5 border-b border-cyan-900/30"><span>SCORE</span> <span className="text-cyan-100">{score.toLocaleString()}</span></div>
        <div className="flex justify-between pb-1.5 border-b border-cyan-900/30"><span>TARGETS</span> <span className="text-cyan-300">{asteroidsBlasted}</span></div>
        <div className="flex justify-between pb-1.5 border-b border-cyan-900/30"><span>ACCURACY</span> <span className="text-cyan-100">{calculatedAccuracy}%</span></div>
        <div className="flex justify-between pb-1.5 border-b border-cyan-900/30"><span>DMG MULT</span> <span className="text-cyan-100">x{perks.damageMultiplier.toFixed(2)}</span></div>
      </div>
    );
  };

  const renderWaypoint = () => {
    return (
      <div className="flex flex-col gap-3">
        <div className="p-2 border border-cyan-400/30 bg-black/35 rounded flex flex-col gap-1.5">
          <div className="text-[8px] text-cyan-400 tracking-widest font-bold">CURRENT SECTOR</div>
          <div className="text-sm font-sans font-light tracking-[0.2em] text-cyan-50 truncate">{currentSystem.name}</div>
          <div className="text-[9px] tracking-widest font-mono text-cyan-600">LVL {level}</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-[8px] tracking-widest text-cyan-600">QUOTA PROGRESS</div>
          <div className="w-full h-1 bg-black/50 border border-cyan-900/40">
            <div className="h-full bg-cyan-200 shadow-[0_0_5px_#a5f3fc]" style={{ width: `${Math.min(100, (asteroidsBlasted / quota) * 100)}%` }}></div>
          </div>
          <div className="text-[8px] text-right text-cyan-600 font-mono">{asteroidsBlasted} / {quota}</div>
        </div>
      </div>
    );
  };

  const renderMap = () => {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-[8px] tracking-widest text-cyan-400 mb-1 font-bold flex items-center justify-between">
          <span>STAR CHART</span>
          <MapIcon className="w-3 h-3 text-cyan-400" />
        </div>
        {systems.map((sys) => (
          <div 
            key={sys.id} 
            onClick={() => {
              if (activeSystemId !== sys.id && phase === 'PLAYING') {
                  initiateManualWarp(sys.id);
              }
            }}
            className={`p-2 border cursor-pointer rounded transition-all ${activeSystemId === sys.id ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'bg-black/10 border-cyan-900/40 hover:border-cyan-700/60 hover:bg-cyan-900/10'}`}
          >
            <div className="flex justify-between items-center">
              <span className={`text-[9px] tracking-[0.1em] font-bold ${activeSystemId === sys.id ? 'text-cyan-300' : 'text-cyan-700'}`}>{sys.name}</span>
              {activeSystemId === sys.id && <MapPin className="w-3 h-3 text-cyan-400" />}
            </div>
            <div className="text-[7.5px] text-cyan-800 mt-0.5 uppercase tracking-widest font-mono truncate">{sys.hazardLevel}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = (tabName: string) => {
    switch (tabName) {
      case 'VITALS': return renderVitals();
      case 'WEAPONS': return renderWeapons();
      case 'STATS': return renderStats();
      case 'WAYPOINT': return renderWaypoint();
      case 'MAP': return renderMap();
      default: return null;
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-10 ${shield < 20 && phase === 'PLAYING' ? 'animate-glitch' : ''} ${isShaking ? 'animate-shake' : ''}`}
    >
      {/* FILM GRAIN SCreEN LAYER */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 film-grain scanlines z-[60] mix-blend-overlay ${phase === 'PLAYING' ? 'opacity-[0.15]' : 'opacity-10'} ${isHit ? "bg-red-900/40 opacity-[0.25]" : "bg-transparent"}`}></div>
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-100 z-10 ${isHit ? "bg-red-500/10" : "bg-transparent"}`}></div>

      {/* CANOPY A-PILLARS */}
      {phase === 'PLAYING' && (
        <>
          {/* LEFT A-PILLAR HUD EDGE */}
          <motion.div 
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 left-0 bottom-0 w-[4vw] min-w-[40px] flex flex-col items-end pr-1 py-10 z-20 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-400/0 via-cyan-400/30 to-cyan-400/0" />
            <div className="w-1 h-24 bg-cyan-500/20 rounded-l-sm mt-20 relative">
               <div className="absolute top-1/2 left-0 w-full h-8 bg-cyan-400 -translate-y-1/2 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
            </div>
            <div className="w-px h-32 bg-cyan-600/50 mr-1 mt-auto mb-20 flex flex-col justify-between">
              <div className="w-2 h-px bg-cyan-400 -translate-x-full" />
              <div className="w-3 h-px bg-cyan-400 -translate-x-full" />
              <div className="w-1 h-px bg-cyan-400 -translate-x-full" />
            </div>
          </motion.div>

          {/* RIGHT A-PILLAR HUD EDGE */}
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 right-0 bottom-0 w-[4vw] min-w-[40px] flex flex-col items-start pl-1 py-10 z-20 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-cyan-900/10 to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 30% 100%)' }} />
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-400/0 via-cyan-400/30 to-cyan-400/0" />
            <div className="w-1 h-32 bg-cyan-500/20 rounded-r-sm mt-32 relative">
               <div className="absolute top-1/4 left-0 w-full h-4 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
               <div className="absolute bottom-1/4 left-0 w-full h-6 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
            </div>
          </motion.div>

          {/* TOP HUD EDGE */}
          <motion.div 
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 h-16 flex justify-center items-end pb-2 z-20 pointer-events-none"
          >
             <div className="absolute inset-0 bg-gradient-to-b from-[#02050a]/80 to-transparent backdrop-blur-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
             <div className="absolute bottom-0 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
             <div className="relative flex gap-8">
                <div className="w-16 h-[2px] bg-cyan-500/30">
                  <div className="w-1/3 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>
                <div className="w-16 h-[2px] bg-cyan-500/30 flex justify-end">
                  <div className="w-1/2 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>
             </div>
          </motion.div>

          <motion.div
            initial={{ top: -50, opacity: 0 }}
            animate={{ top: 16, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 drop-shadow-[0_4px_20px_rgba(0,0,0,1)] gap-2"
          >
            <div className="flex flex-col items-center px-8 py-2 bg-[#02050a]/40 border border-cyan-500/20 rounded-b-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
              <div className="text-cyan-400 font-mono text-[9px] tracking-[0.4em] uppercase mb-1 opacity-80">Sector Link</div>
              <div className="text-cyan-50 font-sans text-xl font-light tracking-[0.2em] uppercase">{currentSystem.name}</div>
            </div>
            
            <div className="mt-2">
              <AITacticalReadout phase={phase} activeSystemId={activeSystemId} stats={stats} shield={shield} level={level} />
            </div>
          </motion.div>
        </>
      )}

      {phase === 'PLAYING' && (
      <>
        {/* HIGH-TECH LOWER COCKPIT DASHBOARD */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 flex justify-center items-end box-border pb-4 perspective-[1200px]">
          
          <div className="w-full max-w-[1400px] flex justify-between items-end gap-6 px-12" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(8deg) translateY(20px)' }}>
            
            {/* LEFT MFD (Multi-Function Display) */}
            <motion.div 
              initial={{ y: 100, opacity: 0, rotateY: 25 }}
              animate={{ y: 0, opacity: 1, rotateY: 15 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="pointer-events-auto w-72 h-64 bg-[#02050a]/80 backdrop-blur-2xl flex flex-col z-50 text-xs text-cyan-50 border border-cyan-500/40 shadow-[0_0_50px_rgba(8,145,178,0.2)] relative overflow-hidden group"
              style={{ transform: 'translateZ(30px)', clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
            >
               <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"></div>
               <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none opacity-50" />
               <div className="flex border-b border-cyan-500/30 bg-cyan-950/40 relative z-10">
                  {leftTabs.map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setLeftTab(tab)} 
                      className={`flex-1 py-2 text-[9px] font-mono tracking-[0.3em] uppercase border-r border-cyan-500/30 transition-all ${leftTab === tab ? 'bg-cyan-500/20 text-cyan-100 border-t-2 border-t-cyan-400 font-bold shadow-[inset_0_-15px_30px_rgba(8,145,178,0.3)]' : 'text-cyan-600 hover:text-cyan-300 hover:bg-cyan-900/40'}`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-cyan-50 relative z-10">
                  {renderTabContent(leftTab)}
               </div>
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/50 rounded-br-lg m-1 opacity-50" />
            </motion.div>

            {/* CENTER DASH PANEL (Radar/Scanner) */}
            <motion.div 
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 24, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0 }}
              className="pointer-events-auto flex-1 h-40 bg-[#02050a]/80 backdrop-blur-2xl flex flex-col z-50 text-xs text-cyan-50 border-t-2 border-cyan-400 shadow-[0_-20px_60px_rgba(6,182,212,0.3)] relative items-center justify-center group"
              style={{ clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%, 0 20px)' }}
            >
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,145,178,0.2)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
               <div className="absolute top-0 w-full h-[1px] bg-cyan-300/50 group-hover:h-[2px] transition-all group-hover:bg-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
               <div className="relative z-10 w-full px-6 h-full flex flex-col justify-end pb-4">
                  <div className="flex justify-between items-end w-full px-8 font-mono text-[10px] text-cyan-200 tracking-[0.2em] relative">
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-cyan-600/80 uppercase">Vel. Vector</span>
                       <span className="text-2xl font-bold font-sans tracking-normal drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{Math.floor((score || 0) / 100)}<span className="text-xs text-cyan-400/80 ml-1">k/s</span></span>
                    </div>

                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-none translate-y-6">
                       <RadarMiniMap phase={phase} />
                    </div>

                    <div className="flex flex-col items-center gap-1">
                       <span className="text-cyan-600/80 uppercase">Sys. Clock</span>
                       <span className="text-2xl font-bold font-sans tracking-normal drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{(stats.playTime / 60).toFixed(2)}<span className="text-xs text-cyan-400/80 ml-1">cy</span></span>
                    </div>
                  </div>
               </div>
               
               {/* Center Panel Decorative Accents */}
               <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50" />
               <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50" />
               <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]" />
            </motion.div>

            {/* RIGHT MFD */}
            <motion.div 
              initial={{ y: 100, opacity: 0, rotateY: -25 }}
              animate={{ y: 0, opacity: 1, rotateY: -15 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="pointer-events-auto w-72 h-64 bg-[#02050a]/80 backdrop-blur-2xl flex flex-col z-50 text-xs text-cyan-50 border border-cyan-500/40 shadow-[0_0_50px_rgba(8,145,178,0.2)] relative overflow-hidden group"
              style={{ transform: 'translateZ(30px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 30px 100%, 0 calc(100% - 30px))' }}
            >
               <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"></div>
               <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none opacity-50" />
               <div className="flex border-b border-cyan-500/30 bg-cyan-950/40 relative z-10">
                  {rightTabs.map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setRightTab(tab)} 
                      className={`flex-1 py-2 text-[9px] font-mono tracking-[0.3em] uppercase border-r border-cyan-500/30 transition-all ${rightTab === tab ? 'bg-cyan-500/20 text-cyan-100 border-t-2 border-t-cyan-400 font-bold shadow-[inset_0_-15px_30px_rgba(8,145,178,0.3)]' : 'text-cyan-600 hover:text-cyan-300 hover:bg-cyan-900/40'}`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-cyan-50 relative z-10">
                  {renderTabContent(rightTab)}
               </div>
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50 rounded-bl-lg m-1 opacity-50" />
            </motion.div>

          </div>
        </div>

        {/* CENTERED WAVE ALERT OVERLAY */}
        {waveAlert && (
          <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center">
            <div className="px-5 py-3 border border-red-500/30 bg-black/80 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.25)] flex flex-col items-center gap-1.5 backdrop-blur-md animate-[pulse_1.5s_infinite]">
              <div className="text-[9px] text-red-500 font-mono tracking-[0.3em] uppercase">HOSTILE FIELD DETECTED</div>
              <div className="text-sm font-sans font-medium tracking-[0.15em] text-white whitespace-nowrap uppercase">{waveAlert.title}</div>
              <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-0.5"></div>
            </div>
          </div>
        )}

        {/* Central Aiming Crosshairs (Sophisticated Savant Tactical Aesthetic) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-all duration-200">
            {/* Primary Inner Reticle */}
            <div className={`w-16 h-16 relative flex items-center justify-center ${energy / perks.maxEnergy < 0.2 ? 'animate-[spin_0.5s_linear_infinite] opacity-80' : energy / perks.maxEnergy < 0.5 ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_10s_linear_infinite]'}`}>
              <div className={`absolute top-0 w-px h-2 ${energy / perks.maxEnergy < 0.2 ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]'} transition-colors duration-300`}></div>
              <div className={`absolute bottom-0 w-px h-2 ${energy / perks.maxEnergy < 0.2 ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]'} transition-colors duration-300`}></div>
              <div className={`absolute left-0 w-2 h-px ${energy / perks.maxEnergy < 0.2 ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]'} transition-colors duration-300`}></div>
              <div className={`absolute right-0 w-2 h-px ${energy / perks.maxEnergy < 0.2 ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]'} transition-colors duration-300`}></div>
            </div>
            
            {/* Gimbal Tracking Dot */}
            <div className={`absolute w-1.5 h-1.5 ${energy / perks.maxEnergy < 0.2 ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-[pulse_0.5s_ease-in-out_infinite]' : energy / perks.maxEnergy < 0.5 ? 'bg-amber-300 shadow-[0_0_10px_#fcd34d]' : 'bg-cyan-200 shadow-[0_0_10px_#fff]'} rounded-full transition-colors duration-300`}></div>
            
            {/* Dynamic Outer Targeting Brackets */}
            <div className={`absolute w-32 h-32 transition-all duration-300 ${overdriveCharge >= 100 ? 'scale-110' : energy / perks.maxEnergy < 0.2 ? 'scale-90 opacity-70' : 'scale-100'}`}>
              <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${energy / perks.maxEnergy < 0.2 ? 'border-red-500 shadow-[0_0_15px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'border-amber-500 shadow-[0_0_12px_#f59e0b]' : 'border-cyan-500/50'} rounded-tl-sm transition-colors duration-300`}></div>
              <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${energy / perks.maxEnergy < 0.2 ? 'border-red-500 shadow-[0_0_15px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'border-amber-500 shadow-[0_0_12px_#f59e0b]' : 'border-cyan-500/50'} rounded-tr-sm transition-colors duration-300`}></div>
              <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${energy / perks.maxEnergy < 0.2 ? 'border-red-500 shadow-[0_0_15px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'border-amber-500 shadow-[0_0_12px_#f59e0b]' : 'border-cyan-500/50'} rounded-bl-sm transition-colors duration-300`}></div>
              <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${energy / perks.maxEnergy < 0.2 ? 'border-red-500 shadow-[0_0_15px_#ef4444]' : energy / perks.maxEnergy < 0.5 ? 'border-amber-500 shadow-[0_0_12px_#f59e0b]' : 'border-cyan-500/50'} rounded-br-sm transition-colors duration-300`}></div>
            </div>

            {/* Overdrive Resonance Ring */}
            {overdriveCharge >= 100 && (
              <div className="absolute w-40 h-40 border border-fuchsia-500/40 rounded-full animate-[ping_2s_ease-out_infinite] blur-sm"></div>
            )}
            
            <div className="absolute w-[220px] h-[220px] border border-cyan-500/10 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite_reverse]">
               <div className="absolute top-0 w-1 h-3 bg-cyan-500/20"></div>
               <div className="absolute bottom-0 w-1 h-3 bg-cyan-500/20"></div>
               <div className="absolute left-0 w-3 h-1 bg-cyan-500/20"></div>
               <div className="absolute right-0 w-3 h-1 bg-cyan-500/20"></div>
            </div>
            
            <div className="absolute w-[300px] h-[300px] border-t border-b border-cyan-500/5 rounded-full flex items-center justify-center animate-[spin_40s_ease-in-out_infinite]"></div>
        </div>
      </>
      )}

      {phase === 'INTRO' && (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-40 bg-[#020205]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(2,2,5,1)_100%)] pointer-events-none" />
          
          <div className="flex flex-col items-center justify-center gap-12 z-20">
             <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 border border-slate-700/50 bg-slate-900/50 text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em] rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  System Restoring
                </div>
                <h1 className="text-4xl md:text-6xl font-sans font-light tracking-[0.2em] text-white uppercase mt-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  Beyond<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-medium">The Horizon</span>
                </h1>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.4em] max-w-sm mx-auto mt-6">
                  Interactive WebGL Experience Layer
                </p>
             </div>

            <button
              onClick={startSimulation}
              className="group relative px-12 py-5 bg-transparent text-white font-mono tracking-[0.4em] text-sm uppercase cursor-pointer transition-all mt-8 overflow-hidden"
            >
               <div className="absolute inset-0 border border-white/20 group-hover:border-white/60 transition-colors bg-white/5 group-hover:bg-white/10" />
               <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white transition-all group-hover:w-4 group-hover:h-4 group-hover:border-4" />
               <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400 transition-all group-hover:w-4 group-hover:h-4 group-hover:border-4" />
               <span className="relative z-10 font-bold transition-all group-hover:tracking-[0.5em] group-hover:text-cyan-200">INITIATE SEQUENCE</span>
               
               {/* scanning beam effect */}
               <div className="absolute top-0 left-0 h-full w-[2px] bg-cyan-400/80 shadow-[0_0_10px_rgba(6,182,212,0.8)] -translate-x-4 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
            </button>
          </div>
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

                <span>FLIGHT TIME</span>
                <span className="text-right text-white">{(stats.playTime / 60).toFixed(2)} min</span>
              </div>
            </div>

            <AIPilotReview stats={stats} phase={phase} />

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
           <div className="max-w-md w-full bg-[#050508]/60 border border-cyan-400/30 p-10 relative">
             <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-cyan-400/80"></div>
             <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-cyan-400/80"></div>

            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center relative">
               <div className="absolute inset-0 border border-cyan-400/30 animate-[spin_10s_linear_infinite]"></div>
               <div className="absolute inset-1 border border-dashed border-cyan-400/50 animate-[spin_8s_linear_infinite_reverse]"></div>
               <Award className="w-5 h-5 text-cyan-400" />
            </div>

            <h1 className="text-3xl font-sans text-cyan-50 tracking-[0.3em] mb-2 font-light uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] shadow-cyan-500/50">
               ASCENSION
            </h1>
            <p className="text-cyan-400/60 text-[10px] tracking-widest uppercase mb-8 font-mono">
              cosmic_matrix: nullified [100.00% EXTRUSION]
            </p>

            <div className="bg-transparent border border-[#2D2D32]/50 p-5 text-left text-xs mb-8 space-y-3 font-mono relative">
               <div className="absolute left-0 top-0 w-1 h-full bg-cyan-400/20"></div>
              <div className="text-cyan-400 text-xs text-center border-b border-[#2D2D32]/60 pb-3 uppercase tracking-widest">
                FINAL LOG
              </div>
              <div className="grid grid-cols-2 gap-y-3 pt-2 text-[10px] px-2 text-[#F5F2ED]/60">
                <span>FINAL SCORE</span>
                <span className="text-right text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{score.toLocaleString()}</span>
                
                <span>UNITS PURGED</span>
                <span className="text-right text-cyan-50">{asteroidsBlasted}</span>

                <span>TOTAL DISCHARGES</span>
                <span className="text-right text-cyan-50">{stats.shotsFired}</span>

                <span>LIFETIME ACCURACY</span>
                <span className="text-right text-cyan-50">{calculatedAccuracy}%</span>

                <span>FLIGHT TIME</span>
                <span className="text-right text-cyan-50">{(stats.playTime / 60).toFixed(2)} min</span>

                <span>EVALUATION RATING</span>
                <span className="text-right text-cyan-400 animate-pulse">SAVANT // CYAN</span>
              </div>
            </div>

            <button
               onClick={startSimulation}
               className="group relative w-full py-4 text-cyan-400 font-mono tracking-[0.3em] text-[10px] uppercase cursor-pointer border border-cyan-400/40 hover:border-cyan-400/80 transition-all hover:text-cyan-50 bg-transparent shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]"
             >
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400"></div>
                NEW SESSION
             </button>
          </div>
        </div>
      )}

      {/* ROGUEMIN ROGUE-LITE CHOOSE UPGRADE CARD MATRIX */}
      {phase === 'PERK_SELECTION' && (
        <div className="absolute inset-0 bg-[#050508]/90 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto z-40 animate-fade-in relative">
          <div className="max-w-4xl w-full bg-[#050508]/60 border border-[#2D2D32]/50 p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-cyan-400"></div>

            <div className="text-center mb-10">
              <span className="text-[10px] text-cyan-400 tracking-[0.4em] font-bold uppercase opacity-90 font-mono">SECTOR CLEARED</span>
              <h1 className="text-4xl font-sans text-cyan-50 tracking-[0.3em] font-light mt-2 drop-shadow-lg uppercase shadow-cyan-500/20">SYSTEM UPGRADE</h1>
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
          <div className="max-w-sm w-full px-10 py-8 bg-transparent border border-cyan-400/30 relative flex flex-col items-center shadow-[0_0_50px_rgba(34,211,238,0.1)]">
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/70"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/70"></div>
            <div className="text-cyan-50 font-sans text-2xl tracking-[0.2em] font-light uppercase flex items-center justify-center gap-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] shadow-cyan-500/50">
              WARP ENGAGED
            </div>
            <p className="text-cyan-400/80 text-[10px] tracking-[0.4em] uppercase mt-2 font-mono">
              traversing_cosmic_web
            </p>
            <div className="w-full h-[1px] bg-cyan-400/20 overflow-hidden mt-6 relative">
              <div className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-[ping_1.5s_linear_infinite]" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* PAUSED ENGINE */}
      {isPaused && phase === 'PLAYING' && (
        <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-md flex items-center justify-center p-6 text-center pointer-events-auto z-40">
          <div className="max-w-xs w-full bg-[#050508]/60 border border-cyan-400/40 p-10 relative shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col items-center">
             <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/70"></div>
             <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/70"></div>

            <div className="w-12 h-12 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 border border-cyan-400/40 animate-[spin_6s_linear_infinite]"></div>
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
            </div>

            <h1 className="text-2xl font-sans text-cyan-50 tracking-[0.3em] font-light mb-2 uppercase drop-shadow-md shadow-cyan-500/50">
              STANDBY
            </h1>
            <p className="text-cyan-400/60 text-[10px] mb-8 tracking-widest font-mono uppercase">
              simulation_paused
            </p>

            <button
               onClick={() => setIsPaused(false)}
               className="group relative w-full py-4 text-cyan-400 font-mono tracking-[0.3em] text-[10px] uppercase cursor-pointer border border-cyan-400/40 hover:border-cyan-400/80 transition-all hover:text-cyan-50 bg-transparent shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]"
             >
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/70"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/70"></div>
                RESUME
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CockpitOverlay);
