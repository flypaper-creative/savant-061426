const fs = require('fs');

let content = fs.readFileSync('src/components/CockpitOverlay.tsx', 'utf8');

content = content.replace(/screenShake: number;\n\s*setScreenShake: React\.Dispatch<React\.SetStateAction<number>>;\n/g, '');
content = content.replace(/screenShake,\n\s*setScreenShake,\n/g, '');
content = content.replace(/,\s*screenShake,\s*setScreenShake\s*/g, '');
content = content.replace(/,\s*setScreenShake\s*\]/g, ']'); // any dependency array

fs.writeFileSync('src/components/CockpitOverlay.tsx', content);
console.log('CockpitOverlay.tsx patched for screenShake');
