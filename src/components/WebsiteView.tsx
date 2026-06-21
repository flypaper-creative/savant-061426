import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GamePhase } from '../types';
import { Globe, Shield, Zap, Sparkles, Code, Play, ArrowRight } from 'lucide-react';

interface WebsiteViewProps {
  setPhase: (p: GamePhase) => void;
}

const letterAnimation = {
  hidden: { y: 100, opacity: 0, rotate: 10 },
  visible: { y: 0, opacity: 1, rotate: 0, transition: { type: "spring", damping: 12, stiffness: 100 } }
};

export const WebsiteView: React.FC<WebsiteViewProps> = ({ setPhase }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title1 = "Beyond".split("");
  const title2 = "the Horizon".split("");

  return (
    <div className="w-full min-h-screen bg-[#020205] text-[#F5F2ED] font-sans overflow-x-hidden selection:bg-indigo-500/30">
      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-full relative"
          >
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 py-8 px-12 flex justify-between items-center z-50 mix-blend-difference">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="font-mono text-[11px] tracking-[0.4em] uppercase text-white cursor-pointer relative group"
              >
                MAINFRAME.OS
                <div className="absolute -bottom-2 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
              </motion.div>
              <motion.nav 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="hidden md:flex gap-12 font-mono text-[10px] tracking-[0.3em] text-[#F5F2ED]/60 uppercase"
              >
                {['Manifesto', 'Systems', 'Uplink'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="relative hover:text-white transition-colors group py-2">
                    {item}
                    <div className="absolute top-1/2 -left-3 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 -translate-y-1/2 transition-all" />
                  </a>
                ))}
              </motion.nav>
            </header>

            {/* Hero Section */}
            <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
              {/* Premium Background Effects */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                 <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                 <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-rose-600/10 blur-[150px] rounded-full mix-blend-screen" />
                 <div className="absolute inset-0 bg-[#020205]/40 backdrop-blur-[20px] z-10" />
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGgxdjFIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz4KPC9zdmc+')] opacity-60 z-20" />
                 <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent z-20" />
                 <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent z-20" />
              </div>

              <div className="relative z-30 flex flex-col items-center max-w-5xl px-6 text-center mt-12">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-10 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 font-mono text-[9px] uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span>Connection Established</span>
                  </div>
                </motion.div>

                <h1 className="text-7xl md:text-[8rem] lg:text-[10rem] font-sans tracking-tighter leading-[0.85] font-light text-white mb-10 drop-shadow-2xl">
                  <motion.div className="flex overflow-hidden justify-center pb-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.8 } } }}>
                    {title1.map((char, i) => <motion.span key={i} variants={letterAnimation} className="inline-block">{char}</motion.span>)}
                  </motion.div>
                  <motion.div className="flex overflow-hidden justify-center items-center gap-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 1.2 } } }}>
                    <motion.div variants={letterAnimation} className="w-16 md:w-32 h-[3px] bg-gradient-to-r from-transparent to-indigo-500 rounded-full hidden md:block" />
                    <div className="flex">
                      {title2.map((char, i) => <motion.span key={i} variants={letterAnimation} className="inline-block">{char === " " ? "\u00A0" : char}</motion.span>)}
                    </div>
                    <motion.div variants={letterAnimation} className="w-16 md:w-32 h-[3px] bg-gradient-to-l from-transparent to-rose-500 rounded-full hidden md:block" />
                  </motion.div>
                </h1>

                <motion.p
                  initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 1.8, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="font-mono text-xs md:text-[13px] text-[#F5F2ED]/60 uppercase tracking-[0.25em] max-w-2xl leading-loose mb-16"
                >
                  We are a digital product agency forging high-performance, cinematic web experiences. You just flew through our interactive introduction layer.
                </motion.p>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col sm:flex-row gap-6 md:gap-8"
                >
                  <button className="group relative px-10 py-5 bg-white text-black font-sans font-semibold text-[11px] tracking-[0.2em] uppercase overflow-hidden">
                    <span className="relative z-10 flex items-center gap-3">
                      Explore Systems
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gray-200 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
                  </button>
                  <button 
                    onClick={() => setPhase('PLAYING')}
                    className="group relative px-10 py-5 bg-transparent border border-white/20 text-white font-sans font-semibold text-[11px] tracking-[0.2em] uppercase hover:border-white/40 transition-all overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <Play size={12} className="group-hover:scale-110 transition-transform" />
                      Re-engage Flight
                    </span>
                    <div className="absolute inset-0 bg-white/[0.03] scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-300 ease-in-out z-0" />
                  </button>
                </motion.div>
                
                {/* Scroll Indicator */}
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 1 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                >
                  <span className="font-mono text-[9px] tracking-[0.3em] text-white/40 uppercase">Scroll</span>
                  <div className="w-px h-12 bg-white/10 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1/2 bg-white/60 animate-[drop_2s_linear_infinite]" />
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Content Section Example */}
            <section className="relative z-10 w-full bg-white text-black py-40 px-6 md:px-16 overflow-hidden">
              <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                  <div className="sticky top-32">
                    <h2 className="text-5xl md:text-7xl font-light tracking-tighter leading-[0.9] mb-8">
                      Engineering<br/> <span className="font-medium">the Impossible.</span>
                    </h2>
                    <p className="text-gray-500 font-mono text-[11px] uppercase tracking-[0.2em] leading-[2.5] max-w-md">
                      Our architecture blends high-performance WebGL, complex state logic, and deeply crafted interface design to push the modern browser to its absolute limits.
                    </p>
                    <button className="mt-12 w-16 h-16 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-500">
                      <ArrowRight size={20} strokeWidth={1} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-20">
                     {[ 
                       { icon:Globe, color:'text-indigo-600', title:'Global Scale', desc:'Built for planetary reach, localized instantly across CDNs.' },
                       { icon:Shield, color:'text-rose-600', title:'Fortress Sec', desc:'Encrypted data pathways and impenetrable state management.' },
                       { icon:Zap, color:'text-amber-500', title:'Hyper Performance', desc:'60fps targets, minimal payload footprints, zero judder.' },
                       { icon:Code, color:'text-teal-600', title:'Clean Code', desc:'Meticulously organized architectures for absolute maintainability.' }
                     ].map((item, i) => (
                       <div key={i} className="group flex flex-col gap-5 border-t border-black/10 pt-8 hover:border-black/40 transition-colors">
                          <item.icon className={`${item.color} group-hover:scale-110 transition-transform duration-500`} size={32} strokeWidth={1.5} />
                          <h3 className="font-sans font-medium text-2xl tracking-tight">{item.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed max-w-[250px]">{item.desc}</p>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
