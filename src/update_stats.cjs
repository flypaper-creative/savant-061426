const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

// Also throttle the stats
const regex = /setStats\(s => \(\{\n\s*\.\.\.s,\n\s*shotsHit: s\.shotsHit \+ 1,\n\s*\}\)\);/g;

const replacement = `// Accumulate hits silently - throttle React updates
            (currentEnergyRef as any).pendingShotsHit = ((currentEnergyRef as any).pendingShotsHit || 0) + 1;
            if ((currentEnergyRef as any).pendingShotsHit > 5) {
               setStats(s => ({ ...s, shotsHit: s.shotsHit + (currentEnergyRef as any).pendingShotsHit }));
               (currentEnergyRef as any).pendingShotsHit = 0;
            }`;

if (!regex.test(content)) {
  console.log('Regex fail for shotsHit');
} else {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
  console.log('shotsHit throttle patched!');
}
