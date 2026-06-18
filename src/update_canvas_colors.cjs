const fs = require('fs');
let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');
content = content.replace(/#06B6D4/g, '#F59E0B');
content = content.replace(/rgba\(6, 182, 212/g, 'rgba(245, 158, 11');
content = content.replace(/0x06B6D4/g, '0xF59E0B');
fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);

content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/#06B6D4/g, '#F59E0B');
content = content.replace(/rgba\(6,182,212/g, 'rgba(245,158,11');
fs.writeFileSync('src/App.tsx', content);
