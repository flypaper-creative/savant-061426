const fs = require('fs');
let code = fs.readFileSync('src/components/LogoCanvas.tsx', 'utf8');
code = code.replace(/const generateProceduralTexture[\s\S]*?const handleMaterialChange[\s\S]*?};\n/m, '');
fs.writeFileSync('src/components/LogoCanvas.tsx', code);
