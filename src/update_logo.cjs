const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

// Update material for logo7.glb
const materialRegex = /child\.material = new THREE\.MeshPhysicalMaterial\(\{\n\s*color: 0x111111,\n\s*metalness: 1\.0,\n\s*roughness: 0\.1,\n\s*envMapIntensity: 3\.0,\n\s*clearcoat: 1\.0,\n\s*clearcoatRoughness: 0\.1,\n\s*\}\);/g;

const materialReplacement = `child.material = new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              metalness: 1.0,
              roughness: 0.05,
              envMapIntensity: 3.0,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
            });`;

if (content.match(materialRegex)) {
  content = content.replace(materialRegex, materialReplacement);
} else {
  console.log("Material regex failed");
}

// Initial HUD logo rot
const hudRotRegex = /hudLogo\.rotation\.x = Math\.PI \/ 6;/g;
if (content.match(hudRotRegex)) {
  content = content.replace(hudRotRegex, 'hudLogo.rotation.x = 0;');
} else {
   console.log("HUD Logo Rot failed");
}

const novaInitRegex = /hUDLogoMeshRef\.current\.rotation\.set\(0, 0, Math\.PI\);/g;
if (content.match(novaInitRegex)) {
  content = content.replace(novaInitRegex, 'hUDLogoMeshRef.current.rotation.set(0, 0, 0);');
} else {
  console.log("Nova init regex failed");
}

const novaAnimRegex = /hUDLogoMeshRef\.current\.rotation\.x = easeOutCubic \* Math\.PI \* 0\.15;\n\s*hUDLogoMeshRef\.current\.rotation\.z = Math\.PI;/g;
if (content.match(novaAnimRegex)) {
  content = content.replace(novaAnimRegex, 'hUDLogoMeshRef.current.rotation.x = 0;\n               hUDLogoMeshRef.current.rotation.z = 0;');
} else {
  console.log("Nova anim regex failed");
}

fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
console.log('Logo patched');
