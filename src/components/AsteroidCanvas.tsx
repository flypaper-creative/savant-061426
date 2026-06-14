import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Asteroid, Projectile, ExplosionParticle, Star, WeaponID, PilotStats, GamePhase } from '../types';
import { WEAPON_CONFIGS, LEVELS, INITIAL_SHIELD, INITIAL_ENERGY } from '../constants';
import { playSound } from '../utils/audio';

interface AsteroidCanvasProps {
  activeWeapon: WeaponID;
  shield: number;
  setShield: React.Dispatch<React.SetStateAction<number>>;
  energy: number;
  setEnergy: React.Dispatch<React.SetStateAction<number>>;
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  asteroidsBlasted: number;
  setAsteroidsBlasted: React.Dispatch<React.SetStateAction<number>>;
  stats: PilotStats;
  setStats: React.Dispatch<React.SetStateAction<PilotStats>>;
  isPaused: boolean;
  screenShake: number;
  setScreenShake: React.Dispatch<React.SetStateAction<number>>;
}

export default function AsteroidCanvas({
  activeWeapon,
  shield,
  setShield,
  energy,
  setEnergy,
  phase,
  setPhase,
  level,
  setLevel,
  score,
  setScore,
  asteroidsBlasted,
  setAsteroidsBlasted,
  stats,
  setStats,
  isPaused,
  screenShake,
  setScreenShake,
}: AsteroidCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas context dimension trackers
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Game assets and coordinate trackers stored inside mutable refs for the high-frequency tick loop
  const starsRef = useRef<Star[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<ExplosionParticle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });
  const isShootingRef = useRef<boolean>(false);
  const lastFiredTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);

  // Track shield/energy via refs to bypass state updates inside 60fps loop if possible
  const currentShieldRef = useRef(shield);
  const currentEnergyRef = useRef(energy);
  const currentPhaseRef = useRef(phase);
  const currentLevelRef = useRef(level);
  
  // Warp speed simulation variables
  const warpFactorRef = useRef<number>(1.0);
  const warpGoalRef = useRef<number>(1.0);
  const lastSpawnTimeRef = useRef<number>(0);
  const levelAsteroidsDestroyedRef = useRef<number>(0);

  // Field of View parameters for 3D projection
  const FOV = 320; 

  // Keep refs in sync with props
  useEffect(() => { currentShieldRef.current = shield; }, [shield]);
  useEffect(() => { currentEnergyRef.current = energy; }, [energy]);
  useEffect(() => { currentPhaseRef.current = phase; }, [phase]);
  useEffect(() => { currentLevelRef.current = level; }, [level]);

  // Handle ResizeObserver to fit exactly the cockpit window without stretching
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(300, width),
        height: Math.max(200, height),
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update mouse position translated relative to canvas
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isShootingRef.current = true;
      playSound.startEngine(); // Start audio context on first click interaction
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isShootingRef.current = false;
    }
  }, []);

  // Initialize Stars
  const initializeStars = useCallback((count: number) => {
    const list: Star[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 1000,
        brightness: 0.5 + Math.random() * 0.5,
      });
    }
    starsRef.current = list;
  }, []);

  // Set up game initial launch
  useEffect(() => {
    initializeStars(150);
    // Auto start background hum lazily on load if context is ready
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      playSound.stopEngine();
    };
  }, [initializeStars]);

  // Restart game triggers
  const resetGameEntities = useCallback(() => {
    asteroidsRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    levelAsteroidsDestroyedRef.current = 0;
    warpFactorRef.current = 1.0;
    warpGoalRef.current = 1.0;
    playSound.updateEnginePitch(1.0);
  }, []);

  useEffect(() => {
    if (phase === 'PLAYING') {
      levelAsteroidsDestroyedRef.current = 0;
    } else if (phase === 'INTRO' || phase === 'GAME_OVER' || phase === 'VICTORY') {
      resetGameEntities();
    }
  }, [phase, resetGameEntities]);

  // Trigger high velocity explosion particles
  const spawnExplosion = useCallback((x: number, y: number, z: number, color: string, count: number = 24, isHeavy: boolean = false) => {
    playSound.explosion(isHeavy);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isHeavy ? 10 : 5) + Math.random() * (isHeavy ? 15 : 6);
      
      particlesRef.current.push({
        x,
        y,
        z,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * (isHeavy ? 10 : 4),
        color,
        size: (isHeavy ? 3.5 : 2.0) + Math.random() * 3,
        life: 0,
        maxLife: 30 + Math.floor(Math.random() * 40),
      });
    }
  }, []);

  // Custom function to create vector projectiles directed in 3D outer space
  const fireActiveWeapon = useCallback((activeWep: WeaponID, mouseX: number, mouseY: number) => {
    const now = Date.now();
    const config = WEAPON_CONFIGS[activeWep];
    
    if (now - lastFiredTimeRef.current < config.fireRate) return;
    if (currentEnergyRef.current < config.energyCost) {
      // Out of energy beep alarm
      playSound.alarm();
      lastFiredTimeRef.current = now + 200; // soft block
      return;
    }

    // Spend energy
    setEnergy(prev => Math.max(0, prev - config.energyCost));
    lastFiredTimeRef.current = now;

    // Track total weapons fired
    setStats(s => ({
      ...s,
      shotsFired: s.shotsFired + 1,
    }));

    playSound.laser(activeWep);

    const screenCenterX = dimensions.width / 2;
    const screenCenterY = dimensions.height / 2;

    // Calculate aiming vector projecting mouse relative screen to 3D space depth z=800
    const targetZ = 850;
    const thetaX = (mouseX - screenCenterX) / FOV;
    const thetaY = (mouseY - screenCenterY) / FOV;
    const target3D_X = thetaX * targetZ;
    const target3D_Y = thetaY * targetZ;

    // Add screenshake feedback
    setScreenShake(prev => Math.min(20, prev + (config.id === WeaponID.PROTON_TORPEDO ? 12 : 3)));

    if (activeWep === WeaponID.PLASMA_LASER) {
      // Dual plasma lasers fire from left and right turrets
      const cannons = [
        { x: -160, y: 120, z: 20 }, // left gun
        { x: 160, y: 120, z: 20 },  // right gun
      ];

      cannons.forEach((gun) => {
        const dx = target3D_X - gun.x;
        const dy = target3D_Y - gun.y;
        const dz = targetZ - gun.z;
        const magnitude = Math.sqrt(dx*dx + dy*dy + dz*dz);

        projectilesRef.current.push({
          id: Math.random().toString(),
          x: gun.x,
          y: gun.y,
          z: gun.z,
          targetX: mouseX,
          targetY: mouseY,
          vx: (dx / magnitude) * config.projectileSpeed,
          vy: (dy / magnitude) * config.projectileSpeed,
          vz: (dz / magnitude) * config.projectileSpeed,
          damage: config.damage,
          color: config.color,
          size: 4,
          type: activeWep,
        });
      });
    } else if (activeWep === WeaponID.PROTON_TORPEDO) {
      // Single central torpedo launched from reactor core
      const gun = { x: 0, y: 180, z: 15 };
      const dx = target3D_X - gun.x;
      const dy = target3D_Y - gun.y;
      const dz = targetZ - gun.z;
      const magnitude = Math.sqrt(dx*dx + dy*dy + dz*dz);

      projectilesRef.current.push({
        id: Math.random().toString(),
        x: gun.x,
        y: gun.y,
        z: gun.z,
        targetX: mouseX,
        targetY: mouseY,
        vx: (dx / magnitude) * config.projectileSpeed,
        vy: (dy / magnitude) * config.projectileSpeed,
        vz: (dz / magnitude) * config.projectileSpeed,
        damage: config.damage,
        color: config.color,
        size: 14,
        type: activeWep,
      });
    } else if (activeWep === WeaponID.ION_BEAM) {
      // Continuous instant-hit ion beam
      // Instant projectile generated to align with ray direction
      projectilesRef.current.push({
        id: Math.random().toString(),
        x: target3D_X,
        y: target3D_Y,
        z: targetZ,
        targetX: mouseX,
        targetY: mouseY,
        vx: 0,
        vy: 0,
        vz: 0,
        damage: config.damage,
        color: config.color,
        size: 3,
        type: activeWep,
      });

      // Hitscan checks instantaneously: find asteroid closest to the mouse ray
      let closestAsteroid: Asteroid | null = null;
      let closestDist = Infinity;

      // Project the mouse line of sight. Any active asteroid overlapping coordinates get zapped!
      asteroidsRef.current.forEach((ast) => {
        if (ast.z < 60) return; // ignore right behind window
        const astScreenX = screenCenterX + (ast.x / ast.z) * FOV;
        const astScreenY = screenCenterY + (ast.y / ast.z) * FOV;
        const astProjRadius = (ast.radius / ast.z) * FOV;

        const distanceToCursor = Math.sqrt(
          Math.pow(astScreenX - mouseX, 2) + Math.pow(astScreenY - mouseY, 2)
        );

        if (distanceToCursor <= astProjRadius + 15) {
          if (ast.z < closestDist) {
            closestDist = ast.z;
            closestAsteroid = ast;
          }
        }
      });

      if (closestAsteroid) {
        const ast = closestAsteroid as Asteroid;
        ast.health -= config.damage;
        ast.hitFlashTime = 4; // micro flash
        
        // Target feedback hit stats
        setStats(s => ({ ...s, shotsHit: s.shotsHit + 1 }));

        // Spawn smaller beam collision electric sparks
        spawnExplosion(ast.x, ast.y, ast.z, '#ff00ff', 4, false);

        if (ast.health <= 0) {
          const sizeMultiplier = ast.radius > 40 ? 2.5 : 1.0;
          setScore(prev => prev + Math.floor(100 * sizeMultiplier * currentLevelRef.current));
          setAsteroidsBlasted(prev => prev + 1);
          levelAsteroidsDestroyedRef.current += 1;
          
          spawnExplosion(ast.x, ast.y, ast.z, '#af52de', 16, ast.radius > 40);
          
          // Remove from ref
          asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== ast.id);
        }
      }
    } else if (activeWep === WeaponID.FLAK_CANNON) {
      // Fires a spread array of fragmentation shrapnel pellets
      const gunX = 0;
      const gunY = 150;
      const gunZ = 15;

      const spreadCount = 6;
      for (let s = 0; s < spreadCount; s++) {
        // Add random scatter offset to the target position
        const scatterX = target3D_X + (Math.random() - 0.5) * 320;
        const scatterY = target3D_Y + (Math.random() - 0.5) * 320;
        const scatterZ = targetZ;

        const dx = scatterX - gunX;
        const dy = scatterY - gunY;
        const dz = scatterZ - gunZ;
        const magnitude = Math.sqrt(dx*dx + dy*dy + dz*dz);

        projectilesRef.current.push({
          id: Math.random().toString(),
          x: gunX,
          y: gunY,
          z: gunZ,
          targetX: mouseX + (Math.random() - 0.5) * 60,
          targetY: mouseY + (Math.random() - 0.5) * 60,
          vx: (dx / magnitude) * (config.projectileSpeed + (Math.random() - 0.5) * 6),
          vy: (dy / magnitude) * (config.projectileSpeed + (Math.random() - 0.5) * 6),
          vz: (dz / magnitude) * config.projectileSpeed,
          damage: config.damage,
          color: config.color,
          size: 2.5,
          type: activeWep,
        });
      }
    }
  }, [dimensions, setEnergy, setScore, setAsteroidsBlasted, setStats, setScreenShake, spawnExplosion]);

  // Main Loop Implementation (60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrameId: number;

    const gameTick = () => {
      if (isPaused) {
        localFrameId = requestAnimationFrame(gameTick);
        return;
      }

      const p = currentPhaseRef.current;
      const currLvl = currentLevelRef.current;
      const lvlConfig = LEVELS[currLvl - 1] || LEVELS[0];

      // 1. Process Shooting Input
      if (isShootingRef.current && p === 'PLAYING') {
        fireActiveWeapon(activeWeapon, mouseRef.current.x, mouseRef.current.y);
      }

      // 2. Clear screen and redraw background canvas
      ctx.fillStyle = '#020205'; // Very dark indigo space
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const screenCenterX = dimensions.width / 2;
      const screenCenterY = dimensions.height / 2;

      // Handle custom screenshake translations
      ctx.save();
      if (screenShake > 0.1) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
        // Decrease shake exponential decayed rate
        setScreenShake(prev => Math.max(0, prev * 0.88));
      }

      // 3. Process Warp Acceleration factor dynamics
      if (p === 'WARPING') {
        warpGoalRef.current = 24.0;
        // Ship vibrates intensely during hyperspace charge
        setScreenShake(s => Math.max(s, 4));
      } else {
        warpGoalRef.current = 1.0;
      }
      // Ease warpFactor toward its target
      warpFactorRef.current += (warpGoalRef.current - warpFactorRef.current) * 0.055;
      playSound.updateEnginePitch(warpFactorRef.current);

      // 4. Update and Draw Celestial Stars (3D Deep Flight)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.5;
      
      starsRef.current.forEach((star) => {
        // Star movement speed is altered by weapon levels and if we are warping
        const travelSpeed = 2.0 * lvlConfig.starSpeedMultiplier * warpFactorRef.current;
        star.z -= travelSpeed;

        if (star.z <= 1) {
          star.z = 1000;
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
        }

        // Draw 3D projected Star line streaks
        const sx = screenCenterX + (star.x / star.z) * FOV;
        const sy = screenCenterY + (star.y / star.z) * FOV;

        if (sx >= 0 && sx <= dimensions.width && sy >= 0 && sy <= dimensions.height) {
          const starPrevZ = star.z + travelSpeed * 3; // streak tail length based on warp speed
          const prevSx = screenCenterX + (star.x / starPrevZ) * FOV;
          const prevSy = screenCenterY + (star.y / starPrevZ) * FOV;

          const streakAlpha = Math.min(1.0, (1000 - star.z) / 400);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${streakAlpha * star.brightness})`;
          ctx.moveTo(prevSx, prevSy);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }
      });

      // 5. Generate Dynamic Asteroids Spawner
      if (p === 'PLAYING') {
        const timeNow = Date.now();
        if (timeNow - lastSpawnTimeRef.current > lvlConfig.spawnInterval) {
          const spawnCount = Math.random() > 0.7 ? 2 : 1;
          for (let s = 0; s < spawnCount; s++) {
            // Distance from center
            const spawnRadius = 250 + Math.random() * 300;
            const spawnAngle = Math.random() * Math.PI * 2;
            const isTargetedToWindshield = Math.random() > 0.6; // some asteroids crash direct, some drift away

            const xPos = isTargetedToWindshield ? (Math.random() - 0.5) * 180 : Math.cos(spawnAngle) * spawnRadius;
            const yPos = isTargetedToWindshield ? (Math.random() - 0.5) * 140 : Math.sin(spawnAngle) * spawnRadius;

            const astRadius = 22 + Math.random() * 46; // small quick vs massive chunky stones
            const hpFactor = astRadius > 45 ? 2.2 : 1.0;

            asteroidsRef.current.push({
              id: Math.random().toString(),
              x: xPos,
              y: yPos,
              z: 1000,
              radius: astRadius,
              size: astRadius,
              maxHealth: Math.floor(lvlConfig.asteroidMaxHealth * hpFactor),
              health: Math.floor(lvlConfig.asteroidMaxHealth * hpFactor),
              speed: lvlConfig.asteroidSpeedMin + Math.random() * (lvlConfig.asteroidSpeedMax - lvlConfig.asteroidSpeedMin),
              rotationAngle: Math.random() * Math.PI,
              rotationSpeed: (Math.random() - 0.5) * 0.04,
              craterSeeds: Array.from({ length: 8 }, () => Math.random()),
              hitFlashTime: 0,
            });
          }
          lastSpawnTimeRef.current = timeNow;
        }

        // Auto transition into Hyperspace Warp when the target count of level is blasted
        if (levelAsteroidsDestroyedRef.current >= lvlConfig.targetCount) {
          setPhase('WARPING');
          playSound.warp();
          
          // Clear remaining projectiles
          projectilesRef.current = [];

          // Transition to next level after brief epic warp drive sequence
          setTimeout(() => {
            resetGameEntities();
            if (currLvl < LEVELS.length) {
              setLevel(prev => prev + 1);
              setPhase('PLAYING');
              playSound.upgrade();
              // Re-fill energy on upgrade
              setEnergy(100);
            } else {
              setPhase('VICTORY');
            }
          }, 3200);
        }
      }

      // 6. Projectiles updates & 3D Intersection Collision Checking
      const activeProjectiles: Projectile[] = [];
      projectilesRef.current.forEach((proj) => {
        if (proj.type === WeaponID.ION_BEAM) {
          // Ion beam is drawn for a single frame as lightning flashes, then immediately expires
          ctx.beginPath();
          ctx.strokeStyle = proj.color;
          ctx.lineWidth = 4 + Math.random() * 3;
          ctx.shadowColor = proj.color;
          ctx.shadowBlur = 15;
          
          // Draw dual beams matching plasma gun mount positions
          const screenMX = mouseRef.current.x;
          const screenMY = mouseRef.current.y;
          
          ctx.moveTo(-160 + screenCenterX, 120 + screenCenterY);
          ctx.lineTo(screenMX, screenMY);
          ctx.moveTo(160 + screenCenterX, 120 + screenCenterY);
          ctx.lineTo(screenMX, screenMY);
          ctx.stroke();
          
          // clear shadow settings and let the frame carry the damage calculations instantly
          ctx.shadowBlur = 0;
          return;
        }

        // Physical kinetic travel (Z decreases from cannon plane, increasing path to space)
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.z += proj.vz;

        // Draw projected laser projectile
        const screenX = screenCenterX + (proj.x / proj.z) * FOV;
        const screenY = screenCenterY + (proj.y / proj.z) * FOV;
        const visualProjSize = (proj.size / proj.z) * FOV;

        const maxProjDistance = 1100;
        if (proj.z > maxProjDistance || proj.z < 5) {
          return; // expires
        }

        // Draw glowing laser trail vector
        const prevZ = proj.z - proj.vz * 1.5;
        const prevScreenX = screenCenterX + (proj.x / prevZ) * FOV;
        const prevScreenY = screenCenterY + (proj.y / prevZ) * FOV;

        ctx.beginPath();
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = Math.max(1, visualProjSize * 0.82);
        ctx.lineCap = 'round';
        ctx.moveTo(prevScreenX, prevScreenY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();

        // 3D Bounding-Sphere projectile colliders!
        let hasHit = false;
        for (let i = 0; i < asteroidsRef.current.length; i++) {
          const ast = asteroidsRef.current[i];
          
          // Calculate three-dimensional offset distance
          const dist3D = Math.sqrt(
            Math.pow(proj.x - ast.x, 2) +
            Math.pow(proj.y - ast.y, 2) +
            Math.pow(proj.z - ast.z, 2)
          );

          // If standard or torpedo size overlaps the bounding sphere radius of the rock
          if (dist3D <= ast.radius + proj.size * 2) {
            hasHit = true;
            ast.health -= proj.damage;
            ast.hitFlashTime = 4; // Trigger white visual damage flash

            // Increment dynamic pilot accuracy trackers
            setStats(s => ({
              ...s,
              shotsHit: s.shotsHit + 1,
            }));

            if (proj.type === WeaponID.PROTON_TORPEDO) {
              // Torpedo trigger massive secondary shockwave explosion!
              spawnExplosion(ast.x, ast.y, ast.z, '#ff5e00', 35, true);
              setScreenShake(s => Math.min(25, s + 18));

              // Splash damage to nearby asteroids residing in 3D sphere!
              const splashRadius = 250;
              asteroidsRef.current.forEach((other) => {
                if (other.id === ast.id) return;
                const distToOther = Math.sqrt(
                  Math.pow(ast.x - other.x, 2) +
                  Math.pow(ast.y - other.y, 2) +
                  Math.pow(ast.z - other.z, 2)
                );
                if (distToOther < splashRadius) {
                  const proportionalDmg = Math.floor(proj.damage * (1 - distToOther / splashRadius));
                  other.health -= proportionalDmg;
                  other.hitFlashTime = 6;
                }
              });
            } else {
              // Small spark splash
              spawnExplosion(proj.x, proj.y, proj.z, proj.color, 8, false);
            }

            // Remove destroyed asteroids and award scores
            if (ast.health <= 0) {
              const scoreBonusMultiplier = ast.radius > 45 ? 2.5 : 1.0;
              setScore(prev => prev + Math.floor(100 * scoreBonusMultiplier * currLvl));
              setAsteroidsBlasted(prev => prev + 1);
              levelAsteroidsDestroyedRef.current += 1;
              
              // Split and spray rock particles
              spawnExplosion(ast.x, ast.y, ast.z, '#a1a1aa', 20, ast.radius > 45);
              
              asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== ast.id);
            }
            break; // expire this kinetic bullet
          }
        }

        if (!hasHit) {
          activeProjectiles.push(proj);
        }
      });
      projectilesRef.current = activeProjectiles;

      // 7. Update and Draw 3D Asteroid Space Rocks
      // Sort asteroids in reverse 3D order (back-to-front) to draw farther elements behind closer elements
      const sortedAsteroids = [...asteroidsRef.current].sort((a, b) => b.z - a.z);

      sortedAsteroids.forEach((ast) => {
        ast.z -= ast.speed;
        ast.rotationAngle += ast.rotationSpeed;

        if (ast.hitFlashTime > 0) {
          ast.hitFlashTime -= 1;
        }

        const screenX = screenCenterX + (ast.x / ast.z) * FOV;
        const screenY = screenCenterY + (ast.y / ast.z) * FOV;
        const visualProjRadius = (ast.radius / ast.z) * FOV;

        // Collision Check: Crash into Windshield HUD Screen!
        if (ast.z <= 20) {
          // If the rock hits near center or passes boundary, it impacts shields
          // Coordinates center (x, y) near (0,0) represents cockpit trajectory
          const scaleDiffX = Math.abs(ast.x);
          const scaleDiffY = Math.abs(ast.y);

          if (scaleDiffX < 320 && scaleDiffY < 240) {
            // direct crash impact!
            playSound.shieldHit();
            setShield(prev => Math.max(0, prev - Math.floor(ast.radius * 0.45)));
            
            // Spawn fire explosion and screen shudder
            spawnExplosion(ast.x, ast.y, 25, '#ff4500', 30, true);
            setScreenShake(30);

            // Check for game over
            if (currentShieldRef.current - Math.floor(ast.radius * 0.45) <= 0) {
              setPhase('GAME_OVER');
            }
          }
          // Remove rock from physical world after collision
          asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== ast.id);
          return;
        }

        // Render rock on viewport if inside bounds
        const boundarySafetyBuffer = visualProjRadius * 3;
        if (
          screenX >= -boundarySafetyBuffer &&
          screenX <= dimensions.width + boundarySafetyBuffer &&
          screenY >= -boundarySafetyBuffer &&
          screenY <= dimensions.height + boundarySafetyBuffer
        ) {
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(ast.rotationAngle);

          // Render styled geometric polygon for detailed rocky look
          ctx.beginPath();
          const points = 10;
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            // Generate craters using seeds to remain constant on rotate
            const crIndex = i % ast.craterSeeds.length;
            const seed = ast.craterSeeds[crIndex];
            const offsetRadius = visualProjRadius * (0.85 + seed * 0.28);
            const px = Math.cos(angle) * offsetRadius;
            const py = Math.sin(angle) * offsetRadius;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();

          // Fill shades based on hitting state or distance (simulate fog/shading)
          const zDepthRatio = Math.max(0.0, Math.min(1.0, 1.0 - ast.z / 900));
          
          if (ast.hitFlashTime > 0) {
            ctx.fillStyle = '#ffffff'; // White hitflash indicator
            ctx.strokeStyle = '#ffffff';
          } else {
            // Farther nodes are shaded darker to emphasize spatial depth and realism
            const brightness = Math.floor(25 + zDepthRatio * 90);
            ctx.fillStyle = `rgb(${brightness}, ${brightness + 4}, ${brightness + 10})`;
            ctx.strokeStyle = `rgb(${brightness + 55}, ${brightness + 65}, ${brightness + 85})`;
          }
          ctx.lineWidth = Math.max(1, 2.5 * zDepthRatio);
          ctx.fill();
          ctx.stroke();

          // Render subtle craters to look polished
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          for (let c = 0; c < 3; c++) {
            const cSeed = ast.craterSeeds[c];
            const cx = (cSeed - 0.5) * visualProjRadius * 0.7;
            const cy = (ast.craterSeeds[c + 3] - 0.5) * visualProjRadius * 0.7;
            const cr = (ast.craterSeeds[c + 1] * 0.18 + 0.05) * visualProjRadius;

            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
          }

          // Mini rock level indicators / diagnostic label
          if (visualProjRadius > 35 && ast.hitFlashTime === 0) {
            ctx.restore();
            ctx.save();
            ctx.translate(screenX, screenY + visualProjRadius + 14);
            ctx.font = '500 10px monospace';
            ctx.fillStyle = 'rgba(255, 30, 30, 0.7)';
            ctx.textAlign = 'center';
            // Display small visual scanner HP indicator on chunkier elements!
            const hpPct = Math.ceil((ast.health / ast.maxHealth) * 100);
            ctx.fillText(`MSTR-ROCK [HP:${hpPct}%]`, 0, 0);
          }

          ctx.restore();
        }
      });

      // 8. Draw 3D Floating Explosion & Debris Particles
      const activeParticles: ExplosionParticle[] = [];
      particlesRef.current.forEach((ptc) => {
        ptc.life += 1;
        ptc.x += ptc.vx;
        ptc.y += ptc.vy;
        ptc.z += ptc.vz;

        if (ptc.life < ptc.maxLife) {
          activeParticles.push(ptc);

          const screenX = screenCenterX + (ptc.x / ptc.z) * FOV;
          const screenY = screenCenterY + (ptc.y / ptc.z) * FOV;
          const visualProjSize = (ptc.size / ptc.z) * FOV;

          if (
            screenX >= 0 &&
            screenX <= dimensions.width &&
            screenY >= 0 &&
            screenY <= dimensions.height
          ) {
            const opacity = 1.0 - ptc.life / ptc.maxLife;
            ctx.beginPath();
            ctx.arc(screenX, screenY, Math.max(0.5, visualProjSize), 0, Math.PI * 2);
            ctx.fillStyle = ptc.color;
            ctx.globalAlpha = opacity;
            ctx.fill();
            ctx.globalAlpha = 1.0; // reset
          }
        }
      });
      particlesRef.current = activeParticles;

      // 9. Draw Screen HUD Target lock feedback inside gameloop
      if (p === 'PLAYING') {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        let foundLock = false;

        asteroidsRef.current.forEach((ast) => {
          if (foundLock || ast.z < 60) return;
          const astScreenX = screenCenterX + (ast.x / ast.z) * FOV;
          const astScreenY = screenCenterY + (ast.y / ast.z) * FOV;
          const astProjRadius = (ast.radius / ast.z) * FOV;

          const distanceToCursor = Math.sqrt(
            Math.pow(astScreenX - mx, 2) + Math.pow(astScreenY - my, 2)
          );

          if (distanceToCursor <= astProjRadius + 20) {
            // Render green Target Lock bounding bracket
            foundLock = true;
            ctx.strokeStyle = 'rgba(52, 199, 89, 0.8)';
            ctx.lineWidth = 1.5;
            const bSize = Math.max(15, astProjRadius * 1.35);

            ctx.beginPath();
            // Top Left corner bracket
            ctx.moveTo(astScreenX - bSize, astScreenY - bSize + 8);
            ctx.lineTo(astScreenX - bSize, astScreenY - bSize);
            ctx.lineTo(astScreenX - bSize + 8, astScreenY - bSize);

            // Top Right bracket
            ctx.moveTo(astScreenX + bSize, astScreenY - bSize + 8);
            ctx.lineTo(astScreenX + bSize, astScreenY - bSize);
            ctx.lineTo(astScreenX + bSize - 8, astScreenY - bSize);

            // Bottom Left bracket
            ctx.moveTo(astScreenX - bSize, astScreenY + bSize - 8);
            ctx.lineTo(astScreenX - bSize, astScreenY + bSize);
            ctx.lineTo(astScreenX - bSize + 8, astScreenY + bSize);

            // Bottom Right bracket
            ctx.moveTo(astScreenX + bSize, astScreenY + bSize - 8);
            ctx.lineTo(astScreenX + bSize, astScreenY + bSize);
            ctx.lineTo(astScreenX + bSize - 8, astScreenY + bSize);
            ctx.stroke();

            // Lock warning label text
            ctx.fillStyle = 'rgba(52, 199, 89, 0.9)';
            ctx.font = '700 9px monospace';
            ctx.fillText('TRGT ACQD', astScreenX + bSize + 6, astScreenY - 4);
            ctx.fillText(`DIST: ${Math.floor(ast.z)}M`, astScreenX + bSize + 6, astScreenY + 6);
          }
        });
      }

      ctx.restore(); // reset screen vibration offset

      // 10. Automatically slowly regenerate Energy reserves
      if (p === 'PLAYING') {
        const rechargeRate = 0.42; // energy recharge per frame
        setEnergy((prev) => Math.min(INITIAL_ENERGY, prev + rechargeRate));
      }

      localFrameId = requestAnimationFrame(gameTick);
    };

    localFrameId = requestAnimationFrame(gameTick);
    animationFrameIdRef.current = localFrameId;

    return () => {
      cancelAnimationFrame(localFrameId);
    };
  }, [dimensions, activeWeapon, isPaused, fireActiveWeapon, setEnergy, setShield, setPhase, setLevel, screenShake, setScreenShake]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-black flex items-center justify-center cursor-none"
    >
      <canvas
        ref={canvasRef}
        id="starfighter_canvas"
        style={{ width: '100%', height: '100%' }}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="block"
      />
    </div>
  );
}
