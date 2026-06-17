import fs from 'fs';

const content = fs.readFileSync('src/components/CockpitOverlay.tsx', 'utf8');

const startPattern = '{/* ----------------- TOP TACTICAL HUD PANEL ----------------- */}';
const endPattern = '{/* GAME OVER MODULE */}';

const startIndex = content.indexOf(startPattern);
const endIndex = content.indexOf(endPattern);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find boundaries.');
    process.exit(1);
}

const newLayout = `      {/* MINIMAL SYMMETRIC HUD */}

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
      {/* BOTTOM DOCK */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl px-12 flex justify-between items-end pointer-events-auto z-20">
          {/* Weapons */}
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 p-5 rounded-lg flex gap-4 shadow-2xl">
              {Object.values(WEAPON_CONFIGS).map((w, index) => {
                  const isActive = activeWeapon === w.id;
                  const isLocked = perks.unlockedWeapons && !perks.unlockedWeapons.includes(w.id as any);
                  return (
                      <button key={w.id} onClick={() => !isLocked && setWeapon(w.id as any)} className={\`relative flex flex-col items-center p-4 rounded-md border transition-all \${isActive ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#050508]/80 border-[#2D2D32] text-[#F5F2ED]/50 hover:bg-[#1A1A1E]'}\`}>
                          <span className="text-[10px] font-bold mb-2 opacity-60">[{index+1}]</span>
                          <w.icon className={\`w-6 h-6 mb-3 \${isActive ? 'text-[#D4AF37]' : 'text-[#F5F2ED]/40'}\`} />
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
                  <div className="h-full bg-gradient-to-r from-purple-600 to-[#A855F7]" style={{ width: \`\${Math.min(100, overdriveCharge)}%\` }} />
              </div>
              {overdriveCharge >= 100 && <div className="mt-3 text-[10px] text-center font-bold tracking-widest text-[#A855F7] animate-pulse">PRESS 'Q' TO IGNITE</div>}
          </div>
      </div>

      {/* LEFT DOCK */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-auto z-20">
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 px-5 py-10 rounded-lg flex flex-col items-center gap-6 shadow-2xl">
              <div className="text-[10px] text-[#06B6D4] tracking-[0.2em] font-bold rotate-180 uppercase" style={{ writingMode: 'vertical-rl' }}>Deflector</div>
              <div className="h-72 w-5 bg-black rounded-full overflow-hidden border border-[#2D2D32] shadow-inner relative flex items-end">
                  <div className="w-full bg-gradient-to-t from-cyan-900 to-[#06B6D4] transition-all" style={{ height: \`\${Math.max(0, Math.min(100, (shield/perks.maxShield)*100))}%\` }} />
              </div>
              <div className="text-base font-bold text-white tracking-widest">{Math.floor(shield)}</div>
          </div>
      </div>

      {/* RIGHT DOCK */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-auto z-20">
          <div className="bg-[#0A0A0E]/60 backdrop-blur-md border border-[#2D2D32]/50 px-5 py-10 rounded-lg flex flex-col items-center gap-6 shadow-2xl">
              <div className="text-[10px] text-[#D4AF37] tracking-[0.2em] font-bold uppercase" style={{ writingMode: 'vertical-rl' }}>Reactor</div>
              <div className="h-72 w-5 bg-black rounded-full overflow-hidden border border-[#2D2D32] shadow-inner relative flex items-end">
                  <div className="w-full bg-gradient-to-t from-amber-900 to-[#D4AF37] transition-all" style={{ height: \`\${Math.max(0, Math.min(100, (energy/perks.maxEnergy)*100))}%\` }} />
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

      {phase === 'READY' && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-40 backdrop-blur-sm bg-black/40">
          <button
            onClick={startSimulation}
            className="transform hover:scale-[1.03] active:scale-[0.98] transition-all px-16 py-6 bg-[#D4AF37] hover:bg-[#E5C050] text-[#0A0A0E] font-bold tracking-[0.25em] text-lg rounded-lg shadow-2xl flex items-center justify-center gap-4 cursor-pointer pointer-events-auto"
          >
             ENGAGE THRUSTERS
          </button>
      </div>
      )}

`;

const replacedContent = content.slice(0, startIndex) + newLayout + content.slice(endIndex);

fs.writeFileSync('src/components/CockpitOverlay.tsx', replacedContent);
console.log('Successfully applied minimal docked layout.');
