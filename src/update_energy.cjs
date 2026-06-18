const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

const regex = /\/\/ 10\. Automatically slowly regenerate Energy reserves\n\s*if \(p === 'PLAYING'\) {\n\s*const rechargeRate = 0.42 \* perks.energyRegenRate; \/\/ energy recharge per frame\n\s*currentEnergyRef.current = Math.min\(perks.maxEnergy, currentEnergyRef.current \+ rechargeRate\);\n\s*setEnergy\(currentEnergyRef.current\);\n\s*}/m;

const replacement = `// 10. Automatically slowly regenerate Energy reserves
      if (p === 'PLAYING') {
        const rechargeRate = 0.42 * perks.energyRegenRate; // energy recharge per frame
        currentEnergyRef.current = Math.min(perks.maxEnergy, currentEnergyRef.current + rechargeRate);
        
        // OPTIMIZATION: Throttle energy React state updates
        if (Date.now() - (currentEnergyRef as any).lastSyncTime > 150 || !(currentEnergyRef as any).lastSyncTime) {
           setEnergy(currentEnergyRef.current);
           (currentEnergyRef as any).lastSyncTime = Date.now();
        }
      }`;

if (!regex.test(content)) {
  console.log('Regex fail for energy throttle');
} else {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
  console.log('Energy throttle patched!');
}
