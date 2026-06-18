const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

// replace props
content = content.replace(/screenShake: number;\n\s*setScreenShake: React\.Dispatch<React\.SetStateAction<number>>;\n/g, '');
content = content.replace(/screenShake,\n\s*setScreenShake,\n/g, '');

// insert ref
if (!content.includes('const screenShakeRef = useRef<number>(0);')) {
   content = content.replace(/const isShootingRef = useRef<boolean>\(false\);/, 'const isShootingRef = useRef<boolean>(false);\n  const screenShakeRef = useRef<number>(0);');
}

// replace all setScreenShake(prev => ...) with screenShakeRef.current += ...
content = content.replace(/setScreenShake\(\s*prev\s*=>\s*Math\.min\((.*?), prev \+ (.*?)\)\)/g, 'screenShakeRef.current = Math.min($1, screenShakeRef.current + $2)');
content = content.replace(/setScreenShake\(\s*s\s*=>\s*Math\.min\((.*?), s \+ (.*?)\)\)/g, 'screenShakeRef.current = Math.min($1, screenShakeRef.current + $2)');
content = content.replace(/setScreenShake\(\s*s\s*=>\s*Math\.max\(s, (.*?)\)\)/g, 'screenShakeRef.current = Math.max(screenShakeRef.current, $1)');
content = content.replace(/setScreenShake\(30\);/g, 'screenShakeRef.current = 30;');

// Update the render loop logic
const shakeRegex = /if \(screenShake > 0\.1\) \{\s*const shakeX = [^;]+;\s*const shakeY = [^;]+;\s*ctx\.translate\(shakeX, shakeY\);\s*\/\/ Decrease shake exponential decayed rate\s*setScreenShake\(prev => Math\.max\(0, prev \* 0\.88\)\);\s*\}/;

const shakeReplacement = `if (screenShakeRef.current > 0.1) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
        
        const rootElements = document.querySelectorAll('.game-shaker');
        rootElements.forEach(el => {
           (el as HTMLElement).style.transform = \`translate(\${shakeX}px, \${shakeY}px)\`;
        });
        
        screenShakeRef.current *= 0.88;
      } else if (screenShakeRef.current > 0) {
        const rootElements = document.querySelectorAll('.game-shaker');
        rootElements.forEach(el => {
           (el as HTMLElement).style.transform = 'none';
        });
        screenShakeRef.current = 0;
      }`;

content = content.replace(shakeRegex, shakeReplacement);

// remove screenShake, setScreenShake from dependency array
content = content.replace(/,\s*screenShake,\s*setScreenShake\s*/g, '');

fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
console.log('AsteroidCanvas.tsx patched for screenShake');
