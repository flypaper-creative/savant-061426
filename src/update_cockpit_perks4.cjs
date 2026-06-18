const fs = require('fs');
let content = fs.readFileSync('src/components/CockpitOverlay.tsx', 'utf8');

const anchor = "const [isMuted, setIsMuted] = useState(playSound.getMuted());";
const hookData = `
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
`;
if (!content.includes('const generatedPerks = React.useMemo')) {
  content = content.replace(anchor, hookData + '\n  ' + anchor);
}

fs.writeFileSync('src/components/CockpitOverlay.tsx', content);
