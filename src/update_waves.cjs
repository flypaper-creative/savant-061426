const fs = require('fs');

let content = fs.readFileSync('src/components/AsteroidCanvas.tsx', 'utf8');

const regex = /const activeAsteroidCount = asteroidsRef\.current\.filter\(a => a\.health > 0 && a\.type !== AsteroidType\.DEBRIS\)\.length;[\s\S]*?lastSpawnTimeRef\.current = timeNow;\n\s*\}/;

const replacement = `const activeAsteroidCount = asteroidsRef.current.filter(a => a.health > 0 && a.type !== AsteroidType.DEBRIS).length;
        
        // Wave-based structured combat instead of randomized streaming
        const timeSinceLastSpawn = timeNow - lastSpawnTimeRef.current;
        const shouldSpawnNextWave = activeAsteroidCount === 0 || timeSinceLastSpawn > (lvlConfig.spawnInterval * spawnMultiplier * 4);

        if (shouldSpawnNextWave && levelAsteroidsDestroyedRef.current < lvlConfig.targetCount) {
          // Increment internal wave counter
          const waveNum = Math.floor(levelAsteroidsDestroyedRef.current / Math.max(1, lvlConfig.targetCount / 5)) + 1;
          
          let formation = 'SCATTER';
          let spawnCount = 3 + Math.floor(Math.random() * 3);
          
          // Organized progression of wave formations
          if (currLvl >= 1) {
             const wavePatternRoll = Math.random();
             if (wavePatternRoll > 0.85) formation = 'V_FORMATION';
             else if (wavePatternRoll > 0.70 && currLvl > 1) formation = 'WALL';
             else if (wavePatternRoll > 0.55 && currLvl > 2) formation = 'TWIN_FLANK';
             else if (wavePatternRoll > 0.40 && currLvl > 3) formation = 'RING';
             else formation = 'SCATTER';
          }

          if (formation === 'V_FORMATION') spawnCount = 3;
          if (formation === 'WALL') spawnCount = 5;
          if (formation === 'TWIN_FLANK') spawnCount = 4;
          if (formation === 'RING') spawnCount = 6;
          
          for (let s = 0; s < spawnCount; s++) {
            let baseX = 0;
            let baseY = 0;
            let baseZ = 6000 + Math.random() * 800;
            let astType = AsteroidType.NORMAL;
            let isDrone = false;

            // Orchestrated Structure coordinates
            if (formation === 'V_FORMATION') {
              isDrone = true;
              astType = AsteroidType.ENEMY_SHIP;
              if (s === 0) { baseX = 0; baseY = 200; baseZ = 6000; }
              if (s === 1) { baseX = -400; baseY = 0; baseZ = 6500; }
              if (s === 2) { baseX = 400; baseY = 0; baseZ = 6500; }
            } else if (formation === 'WALL') {
              baseX = -800 + (s * 400);
              baseY = (Math.random() - 0.5) * 100;
              baseZ = 6500;
              if (s % 2 === 0) astType = AsteroidType.RADIOACTIVE;
            } else if (formation === 'TWIN_FLANK') {
              astType = AsteroidType.ICE;
              baseX = s % 2 === 0 ? -900 : 900;
              baseY = (s < 2) ? 200 : -200;
              baseZ = 6000 + (s < 2 ? 0 : 400);
            } else if (formation === 'RING') {
              const angle = (s / spawnCount) * Math.PI * 2;
              baseX = Math.cos(angle) * 700;
              baseY = Math.sin(angle) * 700;
              baseZ = 6200;
              astType = AsteroidType.NORMAL;
              if (s === 0) astType = AsteroidType.GOLDEN;
            } else {
              // 'SCATTER' standard
              const spawnRadius = 250 + Math.random() * 900; 
              const spawnAngle = Math.random() * Math.PI * 2;
              baseX = Math.cos(spawnAngle) * spawnRadius;
              baseY = Math.sin(spawnAngle) * spawnRadius * 1.5;

              // Distribute localized sub-species types intelligently
              if (currentActiveSectorIdRef.current === SystemID.BETELGEUSE) {
                astType = AsteroidType.ICE; 
              } else {
                const randType = Math.random();
                if (currLvl >= 3 && randType < 0.1) astType = AsteroidType.ENEMY_SHIP;
                else if (randType < 0.22) astType = AsteroidType.RADIOACTIVE;
                else if (randType < 0.35) astType = AsteroidType.GOLDEN;
                else if (randType < 0.45) astType = AsteroidType.ICE;
                else if (randType < 0.49 && currLvl > 1) astType = AsteroidType.NOVA;
                else if (randType < 0.53 && currLvl > 2) astType = AsteroidType.TIME_WARP;
              }
              if (astType === AsteroidType.ENEMY_SHIP) isDrone = true;
            }

            const isSpecialAbility = astType === AsteroidType.NOVA || astType === AsteroidType.TIME_WARP;
            const astRadius = isDrone ? 35 : isSpecialAbility ? 45 : 15 + Math.random() * 70; 
            const hpBonus = astType === AsteroidType.ICE ? 1.7 : isDrone ? 1.5 : isSpecialAbility ? 2.5 : 1.0;
            const hpFactor = (astRadius > 45 ? 2.2 : 1.0) * hpBonus;
            
            // Speed logic
            let speedFact = astType === AsteroidType.GOLDEN ? 1.4 : isDrone ? 0.9 : isSpecialAbility ? 0.8 : 1.0;
            if (formation === 'TWIN_FLANK') speedFact = 1.8;
            if (formation === 'V_FORMATION') speedFact = 1.5;
            if (formation === 'RING') speedFact = 1.1;

            const baseSpd = lvlConfig.asteroidSpeedMin + Math.random() * (lvlConfig.asteroidSpeedMax - lvlConfig.asteroidSpeedMin);
            const sizeRatio = Math.max(0, (astRadius - 10) / 80);
            const physicsSpeedModifier = 1.35 - sizeRatio * 0.7;
            const asteroidSpeed = baseSpd * speedFact * physicsSpeedModifier * speedMultiplier;

            asteroidsRef.current.push({
              id: Math.random().toString(),
              x: baseX,
              y: baseY,
              z: baseZ,
              radius: astRadius,
              size: astRadius,
              maxHealth: Math.max(10, Math.floor(lvlConfig.asteroidMaxHealth * hpFactor * hpMultiplier)),
              health: Math.max(10, Math.floor(lvlConfig.asteroidMaxHealth * hpFactor * hpMultiplier)),
              speed: asteroidSpeed,
              rotationAngle: Math.random() * Math.PI,
              rotationSpeed: isDrone ? 0.0 : (Math.random() - 0.5) * 0.08,
              rotSpeedX: isDrone ? 0.0 : (Math.random() - 0.5) * 0.06,
              rotSpeedY: isDrone ? 0.0 : (Math.random() - 0.5) * 0.06,
              rotSpeedZ: isDrone ? 0.01 : (Math.random() - 0.5) * 0.06,
              shapeScaleX: isDrone ? 1.0 : 0.7 + Math.random() * 0.6,
              shapeScaleY: isDrone ? 0.4 : 0.7 + Math.random() * 0.6,
              shapeScaleZ: isDrone ? 1.2 : 0.7 + Math.random() * 0.6,
              craterSeeds: Array.from({ length: 8 }, () => Math.random()),
              hitFlashTime: 0,
              type: astType,
              droneFireCooldown: isDrone ? 40 + Math.random() * 40 : undefined,
              flightPattern: formation,
              flightOffset: s,
            });

            // Spawn smaller pebble debris around standard asteroids (keep clean for formations)
            if (!isDrone && formation === 'SCATTER' && Math.random() > 0.5) {
              const debrisCount = 1 + Math.floor(Math.random() * 2);
              for(let d=0; d<debrisCount; d++) {
                  const dRadius = 1 + Math.random() * 4;
                  asteroidsRef.current.push({
                    id: Math.random().toString(),
                    x: baseX + (Math.random() - 0.5) * 150,
                    y: baseY + (Math.random() - 0.5) * 150,
                    z: baseZ + (Math.random() - 0.5) * 150,
                    radius: dRadius,
                    size: dRadius,
                    maxHealth: 5,
                    health: 5,
                    speed: asteroidSpeed * (0.8 + Math.random() * 0.4),
                    rotationAngle: Math.random() * Math.PI,
                    rotationSpeed: (Math.random() - 0.5) * 0.2,
                    rotSpeedX: (Math.random() - 0.5) * 0.15,
                    rotSpeedY: (Math.random() - 0.5) * 0.15,
                    rotSpeedZ: (Math.random() - 0.5) * 0.15,
                    shapeScaleX: 0.5 + Math.random() * 1.0,
                    shapeScaleY: 0.5 + Math.random() * 1.0,
                    shapeScaleZ: 0.5 + Math.random() * 1.0,
                    craterSeeds: Array.from({ length: 4 }, () => Math.random()),
                    hitFlashTime: 0,
                    type: AsteroidType.DEBRIS,
                  });
              }
            }
          }
          lastSpawnTimeRef.current = timeNow;
        }`;

if (!regex.test(content)) {
  console.log('Could not match regex for wave logic replacement. Please check the current file.');
} else {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/AsteroidCanvas.tsx', content);
  console.log('Wave logic replaced successfully.');
}
