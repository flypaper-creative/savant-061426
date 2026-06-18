const fs = require('fs');

let content = fs.readFileSync('src/components/CockpitOverlay.tsx', 'utf8');

if (!content.includes('const generatedPerks')) {
    const importRegex = /import React, \{ useState, useEffect, useCallback \} from 'react';/;
    content = content.replace(importRegex, "import React, { useState, useEffect, useCallback, useMemo } from 'react';\nimport { Aperture, Crosshair, Target, Package, Battery, Cross, Circle, Square } from 'lucide-react';");

    const hookRegex = /const CockpitOverlay: React\.FC<CockpitOverlayProps> = \((.*?)\) => \{/;
    const hookReplacement = `const CockpitOverlay: React.FC<CockpitOverlayProps> = ($1) => {
  const generatedPerks = useMemo(() => {
    if (phase !== 'PERK_SELECTION') return [];
    const pool = [
      { id: 'deflector', icon: Shield, color: '#3b82f6', title: 'DEFLECTOR', desc: 'Increases deflector capacity by +25 and deploys instant nanites.', category: 'DEFENSE', 
        apply: (setPerks: any, setShield: any, setEnergy: any) => { 
           setPerks((prev: any) => ({ ...prev, maxShield: prev.maxShield + 25 }));
           setShield((prev: any) => prev + 25);
        }
      },
      { id: 'reactor', icon: Zap, color: '#eab308', title: 'REACTOR', desc: 'Overcharges engines to expand reserve capacity by +30 and boosts regen by +40%.', category: 'RESERVES', 
        apply: (setPerks: any, setShield: any, setEnergy: any) => { 
           setPerks((prev: any) => ({ ...prev, maxEnergy: prev.maxEnergy + 30, energyRegenRate: prev.energyRegenRate + 0.40 }));
           setEnergy((prev: any) => prev + 30);
        }
      },
      { id: 'catalyst', icon: Target, color: '#ef4444', title: 'CATALYST', desc: 'Recalibrates magnetic fields to swell output by +15% and bounds Twin-Shot by +20%.', category: 'ATTACK', 
        apply: (setPerks: any) => { 
           setPerks((prev: any) => ({ ...prev, damageMultiplier: prev.damageMultiplier + 0.15, doubleShotChance: prev.doubleShotChance + 0.20 }));
        }
      },
      { id: 'hull', icon: Package, color: '#10b981', title: 'HULL PLATING', desc: 'Instant emergency repair: Restores 100% of deflector shields immediately.', category: 'SURVIVAL', 
        apply: (setPerks: any, setShield: any) => { 
           setShield(9999); // Component caps it via maxShield
        }
      }
    ];

    if (!perks.unlockedGauss) {
       pool.push({ id: 'gauss', icon: Crosshair, color: '#06b6d4', title: 'GAUSS CANNON', desc: 'Unlocks the Gauss Accelerator weapon system. Very high velocity kinetic projectiles.', category: 'WEAPON', apply: (setPerks: any) => setPerks((p:any) => ({...p, unlockedGauss: true})) });
    }
    if (!perks.unlockedPhaser) {
       pool.push({ id: 'phaser', icon: Aperture, color: '#a855f7', title: 'PHASER BANK', desc: 'Unlocks the directed Phaser Bank system. Extremely fast firing rate.', category: 'WEAPON', apply: (setPerks: any) => setPerks((p:any) => ({...p, unlockedPhaser: true})) });
    }
    if (!perks.unlockedNuke) {
       pool.push({ id: 'nuke', icon: Circle, color: '#f97316', title: 'TACTICAL NUKE', desc: 'Unlocks Tactical Nuclear Missiles. Massive blast radius, supreme damage.', category: 'WEAPON', apply: (setPerks: any) => setPerks((p:any) => ({...p, unlockedNuke: true})) });
    }

    // shuffle and pick 3
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [phase, level, perks]);`;
    content = content.replace(hookRegex, hookReplacement);

    const jsxRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?(?=<div className="mt-10 pt-4 text-center)/;
    const jsxReplacement = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {generatedPerks.map((p, idx) => {
                 const Icon = p.icon;
                 return (
                  <div key={idx}
                    onClick={() => {
                      p.apply(setPerks, setShield, setEnergy);
                      playSound.upgrade();
                      setPhase('PLAYING');
                    }}
                    className="group bg-transparent border border-white/10 hover:border-white/50 p-8 text-left transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between relative"
                    style={{ '--hover-color': p.color } as any}
                  >
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 group-hover:border-[var(--hover-color)] transition-colors"></div>
                    <div>
                      <div className="w-12 h-12 flex items-center justify-center mb-5 text-white/50 group-hover:text-[var(--hover-color)] group-hover:scale-110 transition-all">
                        <Icon className="w-6 h-6 drop-shadow-md" />
                      </div>
                      <h3 className="text-lg tracking-[0.2em] text-white/80 group-hover:text-white transition-colors font-sans uppercase">{p.title}</h3>
                      <p className="text-[10px] text-[#F5F2ED]/50 mt-3 leading-relaxed font-mono uppercase">
                        {p.desc}
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-white/40 group-hover:text-[var(--hover-color)] transition-colors">
                      <span>{p.category}</span>
                      <span>SELECT &rarr;</span>
                    </div>
                  </div>
                 );
              })}
            </div>\n\n            `;
    content = content.replace(jsxRegex, jsxReplacement);

    fs.writeFileSync('src/components/CockpitOverlay.tsx', content);
    console.log('Perk logic injected!');
}
