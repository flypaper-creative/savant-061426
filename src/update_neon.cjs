const fs = require('fs');

let logoContent = fs.readFileSync('src/components/LogoCanvas.tsx', 'utf8');

const logoRegex = /const gradient = envCtx\.createLinearGradient\(0, 0, 128, 128\);[\s\S]*?envCtx\.arc\(Math\.random\(\)\*128, Math\.random\(\)\*128, Math\.random\(\)\*2, 0, Math\.PI\*2\);\n\s*envCtx\.fill\(\);\n\s*\}/;

const logoRep = `// Dark machinery background
    envCtx.fillStyle = '#050508'; 
    envCtx.fillRect(0, 0, 128, 128);

    envCtx.fillStyle = '#111116';
    envCtx.fillRect(10, 10, 100, 100);
    envCtx.fillStyle = '#1a1a24';
    envCtx.fillRect(20, 20, 80, 50);

    // Intricate neon tubing
    const drawTube = (points, color, glow, width) => {
      envCtx.lineWidth = width;
      envCtx.lineCap = 'round';
      envCtx.lineJoin = 'round';
      envCtx.shadowBlur = glow;
      envCtx.shadowColor = color;
      envCtx.strokeStyle = color;
      envCtx.beginPath();
      envCtx.moveTo(points[0], points[1]);
      for(let i=2; i<points.length; i+=2) {
         envCtx.lineTo(points[i], points[i+1]);
      }
      envCtx.stroke();
      envCtx.shadowBlur = 0;
    }

    drawTube([0, 60, 30, 60, 45, 85, 80, 85, 95, 60, 128, 60], '#00ffff', 10, 3);
    drawTube([0, 60, 30, 60, 45, 85, 80, 85, 95, 60, 128, 60], '#ffffff', 0, 1);

    drawTube([60, 0, 60, 30, 45, 45, 45, 128], '#ff007f', 10, 3);
    drawTube([60, 0, 60, 30, 45, 45, 45, 128], '#ffffff', 0, 1);`;

if (logoContent.match(logoRegex)) {
  logoContent = logoContent.replace(logoRegex, logoRep);
  fs.writeFileSync('src/components/LogoCanvas.tsx', logoContent);
  console.log("LogoCanvas patched");
} else {
  console.log("Failed to match LogoCanvas regex");
}


let astContent = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

const astRegex = /\/\/ Cyberpunk gradient background\n\s*const neonGrad = neonCtx\.createLinearGradient\(0, 0, 512, 256\);[\s\S]*?neonCtx\.fillRect\(100, 0, 8, 256\);/;

const astRep = `// Dark machinery background
    neonCtx.fillStyle = '#050508'; 
    neonCtx.fillRect(0, 0, 512, 256);

    neonCtx.fillStyle = '#111116';
    neonCtx.fillRect(50, 50, 400, 150);
    neonCtx.fillStyle = '#1a1a24';
    neonCtx.fillRect(100, 80, 200, 100);

    // Intricate neon tubing
    const drawTube = (points, color, glow, width) => {
      neonCtx.lineWidth = width;
      neonCtx.lineCap = 'round';
      neonCtx.lineJoin = 'round';
      neonCtx.shadowBlur = glow;
      neonCtx.shadowColor = color;
      neonCtx.strokeStyle = color;
      neonCtx.beginPath();
      neonCtx.moveTo(points[0], points[1]);
      for(let i=2; i<points.length; i+=2) {
         neonCtx.lineTo(points[i], points[i+1]);
      }
      neonCtx.stroke();
      neonCtx.shadowBlur = 0;
    }

    drawTube([0, 120, 100, 120, 150, 170, 300, 170, 350, 120, 512, 120], '#00ffff', 15, 6);
    drawTube([0, 120, 100, 120, 150, 170, 300, 170, 350, 120, 512, 120], '#ffffff', 0, 2);

    drawTube([250, 0, 250, 80, 200, 130, 200, 256], '#ff007f', 15, 6);
    drawTube([250, 0, 250, 80, 200, 130, 200, 256], '#ffffff', 0, 2);

    drawTube([400, 256, 400, 180, 450, 130, 450, 0], '#bf00ff', 15, 6);
    drawTube([400, 256, 400, 180, 450, 130, 450, 0], '#ffffff', 0, 2);`;

if (astContent.match(astRegex)) {
  astContent = astContent.replace(astRegex, astRep);
  fs.writeFileSync('src/components/AsteroidCanvas.tsx', astContent);
  console.log("AsteroidCanvas patched");
} else {
  console.log("Failed to match AsteroidCanvas regex");
}
