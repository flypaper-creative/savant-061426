const fs = require('fs');
let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

// asteroidMeshPoolRef
content = content.replace(
  `asteroidMeshPoolRef.current.set(AsteroidType.ENEMY_SHIP, []);`,
  `asteroidMeshPoolRef.current.set(AsteroidType.ENEMY_SHIP, []);\n    asteroidMeshPoolRef.current.set(AsteroidType.ALIEN_SUBMARINE, []);`
);

// enemy logic
content = content.replace(
  `ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.DRONE`,
  `ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE || ast.type === AsteroidType.DRONE`
);

// line 3092 homingStrength
content = content.replace(
  `(ast.type === AsteroidType.ENEMY_SHIP ? 0.0035 : 0.0015)`,
  `((ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE) ? 0.0035 : 0.0015)`
);

// line 3103 isHeavy
content = content.replace(
  `const isHeavy = ast.type === AsteroidType.ENEMY_SHIP;`,
  `const isHeavy = (ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE);`
);

// collision logic 1
content = content.replace(
  `ast.type === AsteroidType.ENEMY_SHIP) hitDamage *= 2.5;`,
  `(ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE)) hitDamage *= 2.5;`
);

// collision logic 2
content = content.replace(
  `ast.type === AsteroidType.ENEMY_SHIP ? '#ef4444' : '#FF4500';`,
  `(ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE) ? '#ef4444' : '#FF4500';`
);

// HUD filter
content = content.replace(
  `ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.DRONE) return;`,
  `ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE || ast.type === AsteroidType.DRONE) return;`
);

// cached mesh
content = content.replace(
  /if \(ast\.type === AsteroidType\.ENEMY_SHIP && cachedEnemyShipModelRef\.current\) \{\s*mesh = cachedEnemyShipModelRef\.current\.clone\(\);\s*\}/,
  `if (ast.type === AsteroidType.ENEMY_SHIP && cachedEnemyShipModelRef.current) {
                mesh = cachedEnemyShipModelRef.current.clone();
              } else if (ast.type === AsteroidType.ALIEN_SUBMARINE && cachedSubmarineModelRef.current) {
                mesh = cachedSubmarineModelRef.current.clone();
              }`
);

// mesh scale
content = content.replace(
  `if (ast.type === AsteroidType.ENEMY_SHIP) {
                    customizedMat = null;
                  }`,
  `if (ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE) {
                    customizedMat = null;
                  }`
);

content = content.replace(
  `if (ast.type === AsteroidType.ENEMY_SHIP) {
            mesh.scale.set(scaleX, scaleY, scaleZ);
          }`,
  `if (ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE) {
            mesh.scale.set(scaleX, scaleY, scaleZ);
          }`
);

// rotation
content = content.replace(
  `if (ast.type === AsteroidType.ENEMY_SHIP) {
            mesh.rotation.set(0, Math.PI, 0); // Face camera
          }`,
  `if (ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.ALIEN_SUBMARINE) {
            mesh.rotation.set(0, Math.PI, 0); // Face camera
          }`
);

fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
console.log('Submarines updated');
