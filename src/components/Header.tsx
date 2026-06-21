import React, { useState } from 'react';
import LogoCanvas from './LogoCanvas';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const renderTriangleA = (marginLeft?: string) => (
    <svg className="mr-[0.05em]" style={{ transform: 'translateY(3px)', marginLeft: marginLeft || '0.05em', height: 'calc(0.95ex + 2px)' }} width="0.75em" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="miter">
      <polygon points="50,10 10,90 90,90" />
    </svg>
  );

  const renderTriangleV = (marginLeft?: string) => (
    <svg className="mr-[0.05em]" style={{ transform: 'translateY(3px)', marginLeft: marginLeft || '0.05em', height: 'calc(0.95ex + 2px)' }} width="0.75em" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="miter">
      <polygon points="10,10 90,10 50,90" />
    </svg>
  );

  return (
    <header className="absolute top-0 left-0 w-full h-16 bg-[#050508]/80 backdrop-blur-md border-b border-white/5 z-[100] flex items-center justify-between pl-2 pr-8 pointer-events-auto shadow-none">
      <div className="flex items-center -translate-x-[60px]">
        <LogoCanvas />
        <h1 
          className="text-white text-xl md:text-[22px] font-medium text-white/90 transition-all duration-1000 flex items-center ml-[46px] translate-y-[1px]"
          style={{ fontFamily: `'Michroma', sans-serif` }}
        >
          <span className="flex items-center tracking-[0.03em]">
            <span style={{ transform: 'translateX(1px)' }}>s</span>{renderTriangleA()}{renderTriangleV('calc(0.05em - 4px)')}{renderTriangleA('calc(0.05em - 4px)')}<span>nt</span>
          </span>
        </h1>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-10 items-center font-mono text-[10px] tracking-[0.3em] uppercase">
        <a href="#" className="text-white/60 hover:text-white transition-colors relative group">
          Missions
          <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
        </a>
        <a href="#" className="text-white/60 hover:text-white transition-colors relative group">
          Armory
          <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
        </a>
        <a href="#" className="text-white/60 hover:text-white transition-colors relative group">
          Leaderboard
          <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
        </a>
        <a href="#" className="text-white border border-white/20 px-5 py-2 hover:bg-white/10 hover:border-white transition-colors">
          TERMINAL
        </a>
      </nav>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden text-white/70 hover:text-white transition-colors"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 flex flex-col gap-6 items-center md:hidden font-mono text-[10px] tracking-[0.3em] uppercase">
          <a href="#" className="text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Missions</a>
          <a href="#" className="text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Armory</a>
          <a href="#" className="text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Leaderboard</a>
          <a href="#" className="text-white border border-white/20 px-8 py-3 w-full text-center mt-2 hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>TERMINAL</a>
        </div>
      )}
    </header>
  );
}
