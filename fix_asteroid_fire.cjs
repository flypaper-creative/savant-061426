const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

const setupRegex = /const neonTex = new THREE\.CanvasTexture\(neonCanvas\);\n\s*neonTex\.colorSpace = THREE\.SRGBColorSpace;/;

const injectedAnim = `const neonTex = new THREE.CanvasTexture(neonCanvas);
    neonTex.colorSpace = THREE.SRGBColorSpace;
    
    // Animate fire independently
    const animateFire = () => {
      requestAnimationFrame(animateFire);
      neonCtx.fillStyle = '#050000';
      neonCtx.fillRect(0, 0, 512, 256);
      const grd = neonCtx.createRadialGradient(256, 128, 10, 256, 128, 256);
      grd.addColorStop(0, '#ffffff'); // bright core
      grd.addColorStop(0.2, '#fff1a0'); // yellow center
      grd.addColorStop(0.5, '#ff6200'); // orange fire
      grd.addColorStop(0.8, '#880000'); // dark red edge
      grd.addColorStop(1, '#050000'); // smoke/darkness
      neonCtx.fillStyle = grd;
      neonCtx.fillRect(0, 0, 512, 256);
      
      fireParticles.forEach(p => {
         p.dist -= p.speed * 40;
         p.angle += p.speed;
         if(p.dist <= 0) {
            p.dist = 120;
            p.r = Math.random() * 30 + 10;
         }
         const x = 256 + Math.cos(p.angle) * p.dist;
         const y = 128 + Math.sin(p.angle) * (p.dist * 0.5);
         neonCtx.beginPath();
         neonCtx.arc(x, y, p.r, 0, Math.PI * 2);
         const burstGrd = neonCtx.createRadialGradient(x, y, 0, x, y, p.r);
         burstGrd.addColorStop(0, p.color);
         burstGrd.addColorStop(1, 'transparent');
         neonCtx.fillStyle = burstGrd;
         neonCtx.fill();
      });
      neonTex.needsUpdate = true;
    };
    animateFire();
`;

if(content.match(setupRegex)) {
  content = content.replace(setupRegex, injectedAnim);
  fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
  console.log("Injected asteroid fire animation loop!");
} else {
  console.log("Failed to match setupRegex in AsteroidCanvas");
}
