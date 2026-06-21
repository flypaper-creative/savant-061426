const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const \[screenShake, setScreenShake\] = useState<number>\(0\);\n/, '');

content = content.replace(/style=\{\{ transform: \`translate\(\$\{\(Math\.random\(\) - 0\.5\) \* screenShake\}px, \$\{\(Math\.random\(\) - 0\.5\) \* screenShake\}px\)\` \}\}/g, '');

content = content.replace(/className="w-full h-full relative"/g, 'className="w-full h-full relative game-shaker"');

content = content.replace(/screenShake=\{screenShake\}\n\s*setScreenShake=\{setScreenShake\}\n/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched for screenShake');
