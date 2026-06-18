const fs = require('fs');

let logoContent = fs.readFileSync('src/components/LogoCanvas.tsx', 'utf8');

if (!logoContent.includes('.rotateZ(Math.PI)')) {
  logoContent = logoContent.replace(
    /child\.geometry\.center\(\);/,
    `child.geometry.center();\n          child.geometry.rotateZ(Math.PI);`
  );
  fs.writeFileSync('src/components/LogoCanvas.tsx', logoContent);
  console.log("Flipped in Logo");
}

let astContent = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');
if (!astContent.includes('.rotateZ(Math.PI)')) {
  // It might be there near line 1500 but let's check
  // In `AsteroidCanvas.tsx` it says:
  // child.geometry.center();
  // child.material = new THREE.MeshPhysicalMaterial ...
  const astRegex = /child\.geometry\.center\(\);\n\s*child\.material = new THREE\.MeshPhysicalMaterial/;
  if (astContent.match(astRegex)) {
    astContent = astContent.replace(astRegex, "child.geometry.center();\n            child.geometry.rotateZ(Math.PI);\n            child.material = new THREE.MeshPhysicalMaterial");
    fs.writeFileSync('src/components/AsteroidCanvas.tsx', astContent);
    console.log("Flipped in Ast");
  }
}
