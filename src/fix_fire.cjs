const fs = require('fs');

function processLogo() {
  let content = fs.readFileSync('src/components/LogoCanvas.tsx', 'utf8');

  // Replace environment map setup
  const setupRegex = /\/\/ Create radial gradient for explosion[\s\S]*?envTex\.mapping = THREE\.EquirectangularReflectionMapping;/;
  
  const newSetup = `// Animated fire setup
    const particles: any[] = [];
    for(let i=0; i<40; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 40,
        r: Math.random() * 15 + 10,
        speed: Math.random() * 0.02 + 0.01,
        color: Math.random() > 0.5 ? '#ffaa00' : '#ff3300'
      });
    }

    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.colorSpace = THREE.SRGBColorSpace;
    envTex.mapping = THREE.EquirectangularReflectionMapping;`;

  if (content.match(setupRegex)) {
    content = content.replace(setupRegex, newSetup);
  }

  const pmremRegex = /const pmremGenerator = new THREE\.PMREMGenerator\(renderer\);\n\s*scene\.environment = pmremGenerator\.fromEquirectangular\(envTex\)\.texture;\n\s*pmremGenerator\.dispose\(\);/;
  if (content.match(pmremRegex)) {
    content = content.replace(pmremRegex, 'scene.environment = envTex;');
  }

  const animateRegex = /if \(logoMesh\) {\n\s*logoMesh\.rotation\.y \+= 0\.02;\n\s*lightGroup\.rotation\.y -= 0\.02;\n\s*scene\.environmentRotation\.y -= 0\.02;/;
  const newAnimate = `if (logoMesh) {
        logoMesh.rotation.y += 0.02;
        lightGroup.rotation.y -= 0.02;
        scene.environmentRotation.y -= 0.02;
        
        envCtx.fillStyle = '#050000';
        envCtx.fillRect(0, 0, 128, 128);
        
        const grd = envCtx.createRadialGradient(64, 64, 5, 64, 64, 64);
        grd.addColorStop(0, '#ffffff'); // bright core
        grd.addColorStop(0.2, '#fff1a0'); // yellow center
        grd.addColorStop(0.4, '#ff6200'); // orange fire
        grd.addColorStop(0.7, '#880000'); // dark red edge
        grd.addColorStop(1, '#050000'); // smoke/darkness
        envCtx.fillStyle = grd;
        envCtx.fillRect(0, 0, 128, 128);

        particles.forEach(p => {
           p.dist -= p.speed * 20; // move inward or outward
           p.angle += p.speed;
           if(p.dist <= 0) {
              p.dist = 64;
              p.r = Math.random() * 15 + 5;
           }
           const x = 64 + Math.cos(p.angle) * p.dist;
           const y = 64 + Math.sin(p.angle) * (p.dist * 0.5); // squash y to make it look like a fire base maybe?
           envCtx.beginPath();
           envCtx.arc(x, y, p.r, 0, Math.PI * 2);
           const burstGrd = envCtx.createRadialGradient(x, y, 0, x, y, p.r);
           burstGrd.addColorStop(0, p.color);
           burstGrd.addColorStop(1, 'transparent');
           envCtx.fillStyle = burstGrd;
           envCtx.fill();
        });
        envTex.needsUpdate = true;`;

  if (content.match(animateRegex)) {
    content = content.replace(animateRegex, newAnimate);
  }

  fs.writeFileSync('src/components/LogoCanvas.tsx', content);
  console.log("LogoCanvas animated fire apply done!");
}

function processAsteroid() {
  let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

  // Find where neonCanvas is created and neonTex is assigned
  const setupRegex = /\/\/ Create radial gradient for explosion[\s\S]*?neonTex\.mapping = THREE\.EquirectangularReflectionMapping;/;

  const newSetup = `// Animated fire particles context
    const fireParticles: any[] = [];
    for(let i=0; i<80; i++) {
       fireParticles.push({
         angle: Math.random() * Math.PI * 2,
         dist: Math.random() * 120,
         r: Math.random() * 30 + 10,
         speed: Math.random() * 0.02 + 0.01,
         color: Math.random() > 0.5 ? '#ffaa00' : '#ff3300'
       });
    }

    const neonTex = new THREE.CanvasTexture(neonCanvas);
    neonTex.colorSpace = THREE.SRGBColorSpace;
    neonTex.mapping = THREE.EquirectangularReflectionMapping;`;

  if (content.match(setupRegex)) {
    content = content.replace(setupRegex, newSetup);
  }
  
  // Actually, wait, scene.environment is set here! Let's not use pmremGenerator
  const pmremRegex = /const envMap = pmremGenerator\.fromEquirectangular\(neonTex\)\.texture;\n\s*scene\.environment = envMap;/;
  if (content.match(pmremRegex)) {
    content = content.replace(pmremRegex, 'scene.environment = neonTex;');
  }
  
  // To animate it, we need to inject the update step into the animate/render loop.
  // The animation loop is `function animate() { ... }` or similar. Let's find `renderer.render(scene, camera);` and inject before it.
  // But wait, there might be multiple. Wait, the main loop is `let animationId: number; const animate = () => { ... }` or similar.
  // Wait, in AsteroidCanvas, animation happens in `const render = (time: number) => { ... }` ? Or maybe `requestAnimationFrame` ?
  // Let's print out what the animate loop looks like first.
  
  fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
}

processLogo();
processAsteroid();
