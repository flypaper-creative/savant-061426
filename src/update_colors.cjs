const fs = require('fs');
let content = fs.readFileSync('src/components/CockpitOverlay.tsx', 'utf8');
content = content.replace(/#06B6D4/g, '#F59E0B');
content = content.replace(/rgba\(6,182,212/g, 'rgba(245,158,11');
fs.writeFileSync('src/components/CockpitOverlay.tsx', content);
