import React from "react";
import { Plus, Minus, Zap, Target, ArrowUp, ArrowDown, Globe } from "lucide-react";
import { motion } from "motion/react";
import { GamePhase } from "../types";

interface CockpitFlightControlsOverlayProps {
  isShootingRef: React.MutableRefObject<boolean>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  overdriveActive: boolean;
  setOverdriveActive: (val: boolean) => void;
  zoomRef: React.MutableRefObject<number>;
  playSound: any;
  setPhase: (p: GamePhase) => void;
}

export const CockpitFlightControlsOverlay: React.FC<CockpitFlightControlsOverlayProps> = ({
  isShootingRef,
  keysRef,
  overdriveActive,
  setOverdriveActive,
  zoomRef,
  playSound,
  setPhase,
}) => {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex justify-between items-end p-8 pb-12">
      
      {/* Left side: Flight & Zoom Controls */}
      <div className="flex flex-col items-start gap-8 pointer-events-auto relative">
        {/* Decorative Tech Elements */}
        <div className="absolute -left-4 -top-8 wpx h-32 border-l border-cyan-500/30">
          <div className="absolute top-0 -left-[2.5px] w-1 h-4 bg-cyan-400" />
          <div className="absolute top-1/2 -left-[2.5px] w-1 h-1 bg-cyan-400" />
        </div>
        <div className="text-cyan-400 font-mono text-[9px] tracking-[0.3em] uppercase opacity-80 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          Flight Systems <span className="opacity-50">// V-0.9</span>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex gap-1 bg-[#020205] p-1 border border-cyan-900/40 relative shadow-[0_0_20px_rgba(6,182,212,0.1)]" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-transparent pointer-events-none" />
          
          <motion.button
            whileTap={{ scale: 0.95, backgroundColor: "rgba(6, 182, 212, 0.3)" }}
            className="w-14 h-12 flex items-center justify-center bg-cyan-950/40 text-cyan-400 border-r border-cyan-800/50 transition-colors hover:bg-cyan-900/60 relative group"
            onPointerDown={() => { zoomRef.current = Math.max(0.4, zoomRef.current - 0.2); }}
          >
            <div className="absolute top-1 left-1 w-1 h-1 bg-cyan-500/50 group-hover:bg-cyan-400" />
            <Plus size={20} strokeWidth={1.5} />
          </motion.button>
          
          <div className="flex flex-col justify-center px-3 text-[10px] text-cyan-600 font-mono uppercase tracking-[0.4em] writing-vertical relative">
            <span className="z-10 bg-[#020205] px-1 py-2">ZOOM</span>
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-900/50 -translate-x-1/2" />
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95, backgroundColor: "rgba(6, 182, 212, 0.3)" }}
            className="w-14 h-12 flex items-center justify-center bg-cyan-950/40 text-cyan-400 border-l border-cyan-800/50 transition-colors hover:bg-cyan-900/60 relative group"
            onPointerDown={() => { zoomRef.current = Math.min(2.0, zoomRef.current + 0.2); }}
          >
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-cyan-500/50 group-hover:bg-cyan-400" />
            <Minus size={20} strokeWidth={1.5} />
          </motion.button>
        </div>

        {/* Speed / Engine Controls */}
        <div className="flex flex-col gap-2 relative">
          <div className="absolute -left-2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0" />
           <motion.button
            whileTap={{ scale: 0.95, backgroundColor: "rgba(59, 130, 246, 0.3)" }}
            className="w-20 h-24 flex flex-col items-center justify-center gap-2 bg-[#020205] text-blue-400 border border-blue-900/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all hover:bg-blue-950/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-blue-500/50 relative overflow-hidden group"
            style={{ clipPath: 'polygon(15px 0, 100% 0, 100% 100%, 0 100%, 0 15px)' }}
            onPointerDown={() => { keysRef.current['w'] = true; }}
            onPointerUp={() => { keysRef.current['w'] = false; }}
            onPointerLeave={() => { keysRef.current['w'] = false; }}
          >
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <ArrowUp size={24} strokeWidth={1.5} className="group-hover:-translate-y-1 transition-transform" />
            <span className="text-[10px] uppercase font-mono tracking-widest mt-1">Boost</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95, backgroundColor: "rgba(59, 130, 246, 0.3)" }}
            className="w-20 h-16 flex flex-col items-center justify-center gap-1 bg-[#020205] text-blue-500 border border-blue-900/40 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all hover:bg-blue-950/60 hover:border-blue-600/40 opacity-80 relative group"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
            onPointerDown={() => { keysRef.current['s'] = true; }}
            onPointerUp={() => { keysRef.current['s'] = false; }}
            onPointerLeave={() => { keysRef.current['s'] = false; }}
          >
            <ArrowDown size={18} strokeWidth={1.5} className="group-hover:translate-y-1 transition-transform" />
            <span className="text-[9px] uppercase font-mono tracking-[0.2em]">Brake</span>
          </motion.button>
        </div>
      </div>

      {/* Right side: Engagement / Combat Controls */}
      <div className="flex flex-col items-end gap-8 pointer-events-auto relative">
        <div className="absolute -right-4 -top-8 wpx h-32 border-r border-rose-500/30">
          <div className="absolute top-0 -right-[2.5px] w-1 h-4 bg-rose-400" />
          <div className="absolute top-1/2 -right-[2.5px] w-1 h-1 bg-rose-400" />
        </div>
        <div className="text-rose-400 font-mono text-[9px] tracking-[0.3em] uppercase opacity-80 mb-2 flex items-center gap-2">
          Weapons / Nav <span className="opacity-50">// TRGT-L</span>
          <span className="w-2 h-2 bg-rose-400 animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
        </div>

        <div className="flex gap-4 items-end">
          {/* Mainframe Link */}
          <motion.button
            whileTap={{ scale: 0.95, backgroundColor: "rgba(99, 102, 241, 0.4)" }}
            className="relative h-20 px-8 flex flex-col items-center justify-center gap-2 bg-[#020205] text-indigo-400 border border-indigo-800/60 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all overflow-hidden hover:bg-indigo-950/80 hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:border-indigo-400/80 group"
            style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
            onClick={() => { 
                playSound.startEngine();
                setPhase("TRANSITIONING_TO_SITE");
            }}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoMjB2MjBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGgxdjFIMHoiIGZpbGw9InJnYmEoOTksMTAyLDI0MSwwLjE1KSIvPgo8L3N2Zz4=')] opacity-50 z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center justify-center z-10 w-8 h-8">
               <Globe size={22} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10" strokeWidth={1.5} />
               <div className="absolute inset-0 border border-indigo-400/50 rounded-full animate-[spin_4s_linear_infinite]" />
               <div className="absolute inset-0 border-t border-indigo-300 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
            </div>
            <span className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] text-indigo-200 z-10 whitespace-nowrap drop-shadow-md">Access Site</span>
          </motion.button>

          {/* Warp Travel / Overdrive */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`relative w-20 h-20 flex flex-col items-center justify-center gap-1 bg-[#020205] border shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all overflow-hidden group ${
               overdriveActive 
                 ? "text-amber-200 border-amber-400 scale-105 shadow-[0_0_40px_rgba(245,158,11,0.5)] bg-amber-950/80" 
                 : "text-amber-500 border-amber-900/60 hover:border-amber-400/80 hover:bg-amber-950/60 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]"
            }`}
             style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
            onClick={() => { 
               setOverdriveActive(!overdriveActive); 
               if (!overdriveActive) playSound.startEngine();
            }}
          >
            {overdriveActive && <div className="absolute inset-0 bg-amber-500/20 animate-pulse pointer-events-none" />}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent group-hover:opacity-100 opacity-0 transition-opacity" />
            <div className="absolute top-1 left-1 w-1 h-1 bg-amber-500/50 group-hover:bg-amber-400 shadow-[0_0_5px_#fbbf24]" />
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-amber-500/50 group-hover:bg-amber-400 shadow-[0_0_5px_#fbbf24]" />
            <Zap size={22} strokeWidth={1.5} className={overdriveActive ? "animate-[shake_0.4s_ease-in-out_infinite]" : "group-hover:scale-110 transition-transform group-hover:drop-shadow-[0_0_8px_#fbbf24]"} />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] mt-1 z-10 font-bold">Warp</span>
          </motion.button>
        </div>

        {/* Primary Fire */}
         <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#020205] text-rose-500 border border-rose-900/60 shadow-[0_0_40px_rgba(244,63,94,0.15)] transition-all hover:bg-rose-950/80 hover:border-rose-400/80 hover:text-rose-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.4)] overflow-hidden group"
          style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
          onPointerDown={() => { 
             isShootingRef.current = true; 
             playSound.startEngine(); 
          }}
          onPointerUp={() => { isShootingRef.current = false; }}
          onPointerLeave={() => { isShootingRef.current = false; }}
        >
           <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.05)_1px,transparent_1px)] bg-[size:5px_5px] opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-rose-600/20 to-transparent group-hover:from-rose-500/40 transition-colors pointer-events-none" />
           <div className="absolute top-2 left-2 rotate-45 w-4 h-[1px] bg-rose-500/50 group-hover:bg-rose-400 shadow-[0_0_5px_#f43f5e]" />
           <div className="absolute bottom-2 right-2 rotate-45 w-4 h-[1px] bg-rose-500/50 group-hover:bg-rose-400 shadow-[0_0_5px_#f43f5e]" />
           <div className="absolute left-0 top-0 h-full w-2 bg-rose-500 blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
           
           <div className="relative">
             <Target size={28} strokeWidth={1.5} className="group-hover:rotate-90 transition-transform duration-500 drop-shadow-[0_0_8px_#f43f5e]" />
             <div className="absolute inset-0 bg-rose-500/30 blur-[12px] rounded-full group-hover:bg-rose-400/60" />
           </div>
           
           <span className="text-[12px] uppercase font-mono tracking-[0.4em] mt-1 shadow-black drop-shadow-[0_0_5px_rgba(244,63,94,0.8)] font-bold">Engage</span>
        </motion.button>
      </div>

    </div>
  );
};
