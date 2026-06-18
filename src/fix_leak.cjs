const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

const regex = /const animateFire = \(\) => {[\s\S]*?animateFire\(\);/;
const rep = `
    let fireAnimId: number;
    const animateFire = () => {
      fireAnimId = requestAnimationFrame(animateFire);
      neonCtx.fillStyle = '#050000';
      neonCtx.fillRect(0, 0, 512, 256);
      const grd = neonCtx.createRadialGradient(256, 128, 10, 256, 128, 256);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.2, '#fff1a0');
      grd.addColorStop(0.5, '#ff6200');
      grd.addColorStop(0.8, '#880000');
      grd.addColorStop(1, '#050000');
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
    
    threeRendererRef.current.userData = { fireAnimId };
`;

if(content.match(regex)) {
   content = content.replace(regex, rep);
   
   // cancel on unmount
   if (content.match(/return \(\) => {\n\s*cancelAnimationFrame\(/)) {
     content = content.replace(/return \(\) => {\n\s*cancelAnimationFrame\(.*?\);/g, (m) => m + `\n      if(threeRendererRef.current?.userData?.fireAnimId) cancelAnimationFrame(threeRendererRef.current.userData.fireAnimId);`);
   }
   
   fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
   console.log('patched asteroid fire leak');
} else {
   console.log('failed patch');
}
