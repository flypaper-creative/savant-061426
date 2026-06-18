import React, { useState } from 'react';
import LogoCanvas from './LogoCanvas';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 w-full h-16 bg-[#050508]/80 backdrop-blur-md border-b border-white/5 z-[100] flex items-center justify-between px-8 pointer-events-auto shadow-none">
      <div className="flex items-center gap-2">
        <LogoCanvas />
        <h1 className="text-white font-sans text-xl md:text-xl tracking-[0.25em] font-medium text-white/90">
          savant
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
