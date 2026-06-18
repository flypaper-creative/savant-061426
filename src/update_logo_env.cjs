const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

// 1. Remove rotation and adjust material for logo7.glb
const logoMaterialRegex = /child\.geometry\.rotateZ\(Math\.PI\);\n\s*child\.material = new THREE\.MeshPhysicalMaterial\(\{[\s\S]*?\}\);/;

const logoMaterialReplacement = `child.material = new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              metalness: 1.0,
              roughness: 0.1,
              envMapIntensity: 6.0,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1,
            });`;

if (content.match(logoMaterialRegex)) {
  content = content.replace(logoMaterialRegex, logoMaterialReplacement);
  console.log("Logo7 material patched");
} else {
  console.log("Failed to match logo material regex");
}

// 2. Separate scene.environment from the starry background and make it super neon
const envRegex = /const envTex = new THREE\.CanvasTexture\(envCanvas\);\n\s*envTex\.colorSpace = THREE\.SRGBColorSpace;\n\s*envTex\.mapping = THREE\.EquirectangularReflectionMapping;\n\s*const envMap = pmremGenerator\.fromEquirectangular\(envTex\)\.texture;\n\s*scene\.environment = envMap;/;

const envReplacement = `const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.colorSpace = THREE.SRGBColorSpace;
    envTex.mapping = THREE.EquirectangularReflectionMapping;

    // Create a dedicated separate hyper-neon environment map for reflective surfaces (like the HUD logo and ships)
    const neonCanvas = document.createElement('canvas');
    neonCanvas.width = 512;
    neonCanvas.height = 256;
    const neonCtx = neonCanvas.getContext('2d')!;
    
    // Cyberpunk gradient background
    const neonGrad = neonCtx.createLinearGradient(0, 0, 512, 256);
    neonGrad.addColorStop(0, '#ff007f'); // Neon pink
    neonGrad.addColorStop(0.5, '#7928ca'); // Deep purple
    neonGrad.addColorStop(1, '#00f0ff'); // Cyan
    neonCtx.fillStyle = neonGrad;
    neonCtx.fillRect(0, 0, 512, 256);
    
    // Add bright horizontal & vertical laser streaks for sharp chrome reflections
    neonCtx.fillStyle = '#ffffff';
    neonCtx.fillRect(0, 120, 512, 16);
    neonCtx.fillStyle = '#ff00ff';
    neonCtx.fillRect(250, 0, 12, 256);
    neonCtx.fillStyle = '#00ffff';
    neonCtx.fillRect(100, 0, 8, 256);
    
    const neonTex = new THREE.CanvasTexture(neonCanvas);
    neonTex.colorSpace = THREE.SRGBColorSpace;
    neonTex.mapping = THREE.EquirectangularReflectionMapping;
    
    const envMap = pmremGenerator.fromEquirectangular(neonTex).texture;
    scene.environment = envMap;`;

if (content.match(envRegex)) {
  content = content.replace(envRegex, envReplacement);
  console.log("Neon environment map injected");
} else {
  console.log("Failed to match neon env map regex");
}

fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
