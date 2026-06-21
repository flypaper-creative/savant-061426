const fs = require('fs');

function patchFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/'\/assets\//g, "'./assets/");
  fs.writeFileSync(path, content);
}

patchFile('src/components/AsteroidCanvas.tsx');
patchFile('src/components/LogoCanvas.tsx');

console.log('Fixed absolute paths to relative paths');
