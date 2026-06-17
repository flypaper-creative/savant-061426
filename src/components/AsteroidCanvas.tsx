import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asteroid, Projectile, ExplosionParticle, Star, WeaponID, PilotStats, GamePhase, AsteroidType, Pickup3D, PilotPerks, DifficultyLevel, SystemID, StarSystem, FloatingText, Shockwave } from '../types';
import { WEAPON_CONFIGS, LEVELS, INITIAL_SHIELD, INITIAL_ENERGY } from '../constants';
import { playSound } from '../utils/audio';

// --- EXTERNAL MATTE PAINTING CONFIGURATION ---
// To use the beautiful attached image, please upload it to the "public" folder
// using the file explorer and set EXTERNAL_BG_URL to its filename (e.g. '/my-background.png').
// You can also use a video by setting an mp4 URL and setting TYPE to 'video'.
export const EXTERNAL_BG_URL: string | null = '/assets/bkgs/ORION_NEBULA.png'; // e.g., '/bg.png' or '/video.mp4'
export const EXTERNAL_BG_TYPE: 'image' | 'video' | 'procedural' = 'image';
// ---------------------------------------------

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
  perks: PilotPerks;
  setPerks: React.Dispatch<React.SetStateAction<PilotPerks>>;
  touchControlMode: 'TETHER' | 'JOYSTICK';
  setTouchControlMode: (m: 'TETHER' | 'JOYSTICK') => void;
  isTouchDevice: boolean;
  setIsTouchDevice: (v: boolean) => void;
  overdriveCharge: number;
  setOverdriveCharge: React.Dispatch<React.SetStateAction<number>>;
  overdriveActive: boolean;
  setOverdriveActive: React.Dispatch<React.SetStateAction<boolean>>;
  difficulty: DifficultyLevel;
  setDifficulty: React.Dispatch<React.SetStateAction<DifficultyLevel>>;
  activeSystemId: SystemID;
  setActiveSystemId: (id: SystemID) => void;
  systems: StarSystem[];
  setSystems: React.Dispatch<React.SetStateAction<StarSystem[]>>;
  customBg?: { url: string; type: 'image' | 'video' } | null;
}

// Procedural texture utilities to create realistic deep space backdrops and minerals
function createRockyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rocky gray-basalt base color
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, 0, 512, 512);

    // Fine mineral grains and speckling
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(40 + Math.random() * 60);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Shadowed impact craters and organic depth
    for (let c = 0; c < 28; c++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const r = 8 + Math.random() * 32;
      const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      grad.addColorStop(0, 'rgba(15, 15, 17, 0.7)');
      grad.addColorStop(0.4, 'rgba(30, 30, 35, 0.4)');
      grad.addColorStop(0.7, 'rgba(80, 80, 90, 0.15)');
      grad.addColorStop(1, 'rgba(63, 63, 70, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Rim highlights for crater ridges
      ctx.strokeStyle = 'rgba(140, 140, 150, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + 1, cy - 1, r, 0.2, Math.PI * 0.9);
      ctx.stroke();
    }

    // Fractured fault lines & cracks
    ctx.strokeStyle = 'rgba(10, 10, 12, 0.65)';
    ctx.lineWidth = 1.2;
    for (let l = 0; l < 15; l++) {
      ctx.beginPath();
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (Math.random() - 0.5) * 45;
        cy += (Math.random() - 0.5) * 45;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createIceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Frozen glacial blue-white core gradient
    const gradBase = ctx.createLinearGradient(0, 0, 512, 512);
    gradBase.addColorStop(0, '#c8e2fb');
    gradBase.addColorStop(0.5, '#7fbeeb');
    gradBase.addColorStop(1, '#aed9f8');
    ctx.fillStyle = gradBase;
    ctx.fillRect(0, 0, 512, 512);

    // Internal frozen crystalline fractures
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    for (let c = 0; c < 45; c++) {
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 3; s++) {
        cx += (Math.random() - 0.5) * 80;
        cy += (Math.random() - 0.5) * 80;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Cold frost grains
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createMagmaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark scorched charcoal obsidian base
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 512, 512);

    // Coarse cinder grain specs
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const c = Math.floor(10 + Math.random() * 20);
      ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Glowing thermodynamic lava rivers and volcanic cracks
    ctx.lineWidth = 3.5;
    for (let l = 0; l < 22; l++) {
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      
      const r = Math.floor(220 + Math.random() * 35);
      const g = Math.floor(80 + Math.random() * 70);
      const b = Math.floor(10 + Math.random() * 25);
      
      // Outer heat glow
      ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 60;
        cy += (Math.random() - 0.5) * 60;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGoldenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Metallic bronze-gold marble base
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#b45309');
    grad.addColorStop(0.3, '#f59e0b');
    grad.addColorStop(0.7, '#fbbf24');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Gleaming rich pyrite crystal plates
    ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
    for (let p = 0; p < 35; p++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      ctx.lineTo(Math.random() * 512, Math.random() * 512);
      ctx.lineTo(Math.random() * 512, Math.random() * 512);
      ctx.closePath();
      ctx.fill();
    }

    // Fine gold veins
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.0;
    for (let v = 0; v < 12; v++) {
      ctx.beginPath();
      let vx = Math.random() * 512;
      let vy = Math.random() * 512;
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 3; s++) {
        vx += (Math.random() - 0.5) * 90;
        vy += (Math.random() - 0.5) * 90;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createDroneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Titanium-plated dark cyber armor plating
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 0, 256, 256);

    // High tech wire mesh overlay lines
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 256; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    // Glowing electronic circuitry paths
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // flashing enemy red
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      let cx = Math.random() * 256;
      let cy = Math.random() * 256;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 3; s++) {
        const dir = Math.floor(Math.random() * 4);
        const len = 20 + Math.random() * 40;
        if (dir === 0) cx += len;
        else if (dir === 1) cx -= len;
        else if (dir === 2) cy += len;
        else cy -= len;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createPlanet1Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;
    const r = 240;

    // Atmospheric scattering outer glow (gas giant halo)
    const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r + 15);
    glowGrad.addColorStop(0, 'rgba(234, 88, 12, 0.45)');
    glowGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.18)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 15, 0, Math.PI * 2);
    ctx.fill();

    // Clip to draw Jupiter's circular face
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // 1. Gaseous bands (deep copper/orange base)
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 0, 512, 512);

    const bands = 24;
    for (let i = 0; i < bands; i++) {
      const y = (i / bands) * 512;
      const height = (512 / bands) * (0.6 + Math.random() * 0.6);
      ctx.fillStyle = i % 2 === 0 ? '#ea580c' : i % 3 === 0 ? '#fed7aa' : '#c2410c';
      ctx.fillRect(0, y, 512, height);
    }

    // Great Red Spot
    ctx.fillStyle = 'rgba(127, 29, 29, 0.85)';
    ctx.beginPath();
    ctx.ellipse(340, 360, 48, 28, Math.PI / 16, 0, Math.PI * 2);
    ctx.fill();

    // Micro storms (cyclones)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let s = 0; s < 5; s++) {
      ctx.beginPath();
      ctx.ellipse(140 + s * 60, 180 + Math.sin(s) * 40, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Spherical overlay shadow for photorealistic 3D volume
    const shadowGrad = ctx.createRadialGradient(cx - 80, cy - 80, r * 0.15, cx, cy, r);
    shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)'); // specular highlight
    shadowGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.0)');   // well-lit center
    shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');     // terminator twilight
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');     // pitch black far side
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createPlanet2Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;
    const r = 240;

    // Atmospheric volcanic sulfur yellow-red corona glow
    const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r + 18);
    glowGrad.addColorStop(0, 'rgba(220, 38, 38, 0.4)'); // dark neon red
    glowGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.18)'); // yellow sulfur
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
    ctx.fill();

    // Clip volcanic sphere surface
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Scorched dark continental basalt background
    ctx.fillStyle = '#0f171c';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing magma rivers, fissures and volcanos
    for (let m = 0; m < 55; m++) {
      const mx = Math.random() * 512;
      const my = Math.random() * 512;
      const size = 15 + Math.random() * 55;
      const lGrad = ctx.createRadialGradient(mx, my, 0, mx, my, size);
      lGrad.addColorStop(0, '#f97316'); // bright neon orange
      lGrad.addColorStop(0.3, '#dc2626'); // lava red
      lGrad.addColorStop(0.8, '#450a0a'); // cooling crust
      lGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lGrad;
      ctx.beginPath();
      ctx.arc(mx, my, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Volcanic ash clouds overlays
    ctx.fillStyle = 'rgba(24, 24, 27, 0.65)';
    for (let c = 0; c < 12; c++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 40 + Math.random() * 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3D Spherical volume shading overlay
    const shadowGrad = ctx.createRadialGradient(cx - 70, cy - 70, r * 0.12, cx, cy, r);
    shadowGrad.addColorStop(0, 'rgba(255, 237, 213, 0.15)'); // soft light specular
    shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.0)');
    shadowGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.7)');     // dark terminator
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');     // total pitch black segment
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createGalaxyClusterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
    coreGrad.addColorStop(0, 'rgba(255, 230, 200, 1.0)');
    coreGrad.addColorStop(0.15, 'rgba(236, 72, 153, 0.6)'); // bright pink nebula core
    coreGrad.addColorStop(0.4, 'rgba(99, 102, 241, 0.25)'); // deep indigo arms
    coreGrad.addColorStop(0.7, 'rgba(30, 27, 75, 0.08)');  // wispy purple borders
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 200, 0, Math.PI * 2);
    ctx.fill();

    // Draw spiral arm streams
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.18)'; // soft warm orange arms
    for (let arm = 0; arm < 4; arm++) {
      ctx.lineWidth = 4 + Math.random() * 8;
      ctx.beginPath();
      const baseAngle = (arm * Math.PI) / 2;
      for (let r = 8; r < 220; r += 4) {
        const theta = baseAngle + r * 0.035; // spirals tightly with radius
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        if (r === 8) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Thousands of mini-cluster star dust specs
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 1.5) * 220;
      const sx = cx + Math.cos(angle + dist * 0.015) * dist;
      const sy = cy + Math.sin(angle + dist * 0.015) * dist;
      const size = 0.5 + Math.random() * 1.5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(191, 219, 254, 0.7)';
      ctx.fillRect(sx, sy, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createSupernovaRemnantTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;
    
    // Shockwave concentric expansion rings
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 240);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0)'); // inner void
    grad.addColorStop(0.4, 'rgba(244, 63, 94, 0.45)'); // expanding hot plasma magenta
    grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.22)'); // soft outer violet shockfront
    grad.addColorStop(0.9, 'rgba(59, 130, 246, 0.05)'); // blue interstellar dispersion boundary
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fill();

    // Chaotic fiery veins/cracks of the supernova explosion paths
    ctx.lineWidth = 1.5;
    for (let path = 0; path < 12; path++) {
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(253, 224, 71, 0.35)' : 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let px = cx;
      let py = cy;
      const angle = (path * Math.PI * 2) / 12 + (Math.random() - 0.5) * 0.4;
      for (let segment = 0; segment < 6; segment++) {
        const segDist = 30 + Math.random() * 30;
        px += Math.cos(angle) * segDist + (Math.random() - 0.5) * 15;
        py += Math.sin(angle) * segDist + (Math.random() - 0.5) * 15;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Concentric Saturnian orbital bands
    for (let x = 0; x < 512; x++) {
      const alpha = Math.sin(x * 0.12) * Math.cos(x * 0.05) * 0.35 + 0.45;
      const warmHex = x % 3 === 0 ? 'rgba(254, 215, 170, ' : x % 5 === 0 ? 'rgba(194, 65, 12, ' : 'rgba(254, 240, 138, ';
      ctx.fillStyle = `${warmHex}${Math.max(0, alpha)})`;
      ctx.fillRect(x, 0, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createNebulaTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 256);
    // Beautiful organic fluffy cloud paint using circular walks
    for (let i = 0; i < 18; i++) {
      const cx = 128 + (Math.random() - 0.5) * 90;
      const cy = 128 + (Math.random() - 0.5) * 90;
      const r = 35 + Math.random() * 70;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, colorHex);
      grad.addColorStop(0.5, colorHex + '25');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function loadBackgroundTexture(systemId: string | undefined): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const proceduralTex = createMattePaintingTexture(systemId);

  // Use the explicitly defined EXTERNAL_BG_URL constant instead of dynamic system IDs
  if (EXTERNAL_BG_URL) {
      const tex = loader.load(EXTERNAL_BG_URL, (loadedTex) => {
        loadedTex.colorSpace = THREE.SRGBColorSpace;
      }, undefined, () => {
         tex.image = proceduralTex.image as any;
         tex.needsUpdate = true;
      });
      return tex;
  }

  return proceduralTex as unknown as THREE.Texture;
}

function createMattePaintingTexture(systemId?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 2048, 1024);

    if (systemId === SystemID.ALPHA_CENTAURI) {
      // Space backdrop (cold void)
      const spaceGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      spaceGrad.addColorStop(0, '#000000');
      spaceGrad.addColorStop(1, '#050a14');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Distant stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 1500; i++) {
        const sx = Math.random() * 2048;
        const sy = Math.random() * 1024;
        const sw = Math.random() * 1.5;
        ctx.globalAlpha = Math.random() * 0.7 + 0.1;
        ctx.fillRect(sx, sy, sw, sw);
      }
      ctx.globalAlpha = 1.0;

      // Dark rust/iron dust clouds
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 6; i++) {
        const nx = Math.random() * 2048;
        const ny = Math.random() * 1024;
        const nr = 400 + Math.random() * 600;
        const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        nGrad.addColorStop(0, `rgba(45, 20, 15, 0.15)`);
        nGrad.addColorStop(0.5, `rgba(20, 10, 15, 0.05)`);
        nGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = nGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Matte Painting of Derelict Mothership (Gigantic fragmented hull)
      ctx.save();
      ctx.translate(1024, 700);
      ctx.rotate(-Math.PI * 0.05);

      // Main hull structure
      const hullGrad = ctx.createLinearGradient(-1500, -200, 1500, 500);
      hullGrad.addColorStop(0, '#11151c');
      hullGrad.addColorStop(0.5, '#222836');
      hullGrad.addColorStop(1, '#080a0e');
      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(-1600, 200);
      ctx.lineTo(-1200, -100);
      ctx.lineTo(-400, -250);
      ctx.lineTo(800, -150);
      ctx.lineTo(1500, 300);
      ctx.lineTo(1600, 600);
      ctx.lineTo(-1500, 600);
      ctx.closePath();
      ctx.fill();

      // Debris and fragmented panels
      ctx.fillStyle = '#0f121a';
      for (let i = 0; i < 400; i++) {
        const dx = (Math.random() - 0.5) * 3200;
        const dy = -300 + Math.random() * 800;
        const dw = 10 + Math.random() * 150;
        const dh = 10 + Math.random() * 50;
        ctx.fillRect(dx, dy, dw, dh);
      }

      // Glowing exposed core / hazard lights
      for (let i = 0; i < 60; i++) {
        const lx = (Math.random() - 0.5) * 2800;
        const ly = -100 + Math.random() * 400;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)'; // Red or Amber lights
        ctx.beginPath();
        ctx.arc(lx, ly, 2 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
        // tiny glow
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

    } else {
      // Default / Other systems: Deep space gradient backdrop
      const spaceGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      spaceGrad.addColorStop(0, '#020008'); // very dark purple-black
      spaceGrad.addColorStop(0.5, '#050314'); // mid dark blue
      spaceGrad.addColorStop(1, '#0a0518'); // dark purple
      
      // Override background colors based on system
      if (systemId === SystemID.BETELGEUSE) {
        spaceGrad.addColorStop(0, '#021810');
        spaceGrad.addColorStop(0.5, '#04281b');
        spaceGrad.addColorStop(1, '#020c0f');
      } else if (systemId === SystemID.ANDROMEDA) {
        spaceGrad.addColorStop(0, '#0b0213');
        spaceGrad.addColorStop(1, '#1b0730');
      }

      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Dynamic tiny stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 2000; i++) {
        const sx = Math.random() * 2048;
        const sy = Math.random() * 1024;
        const sw = Math.random() * 1.5;
        ctx.globalAlpha = Math.random() * 0.8 + 0.2;
        ctx.fillRect(sx, sy, sw, sw);
      }
      ctx.globalAlpha = 1.0;

      // Beautiful Nebula Clouds
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 8; i++) {
         const nx = Math.random() * 2048;
         const ny = Math.random() * 600;
         const nr = 300 + Math.random() * 500;
         const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
         
         let r = Math.floor(100 + Math.random() * 155);
         let g = Math.floor(20 + Math.random() * 100);
         let b = Math.floor(150 + Math.random() * 105);
         
         if (systemId === SystemID.BETELGEUSE) {
           r = Math.floor(20 + Math.random() * 50);
           g = Math.floor(150 + Math.random() * 105);
           b = Math.floor(100 + Math.random() * 100);
         }

         nGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
         nGrad.addColorStop(0.5, `rgba(${Math.floor(r*0.6)}, ${Math.floor(g*0.4)}, ${Math.floor(b*0.8)}, 0.05)`);
         nGrad.addColorStop(1, 'rgba(0,0,0,0)');
         ctx.fillStyle = nGrad;
         ctx.beginPath();
         ctx.arc(nx, ny, nr, 0, Math.PI * 2);
         ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Huge Stormy gas giant at the bottom
      const px = 1024;
      const py = 1500;
      const pr = 1100;

      const pGlow = ctx.createRadialGradient(px, py, pr * 0.95, px, py, pr + 180);
      
      let glowOuter = 'rgba(234, 88, 12, 0.8)';
      let glowInner = 'rgba(250, 204, 21, 0.3)';
      if (systemId === SystemID.BETELGEUSE) {
        glowOuter = 'rgba(16, 185, 129, 0.8)';
        glowInner = 'rgba(52, 211, 153, 0.3)';
      } else if (systemId === SystemID.SIRIUS_PRIME) {
        glowOuter = 'rgba(236, 72, 153, 0.8)';
        glowInner = 'rgba(244, 114, 182, 0.3)';
      }
      
      pGlow.addColorStop(0, glowOuter);
      pGlow.addColorStop(0.4, glowInner);
      pGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pGlow;
      ctx.beginPath();
      ctx.arc(px, py, pr + 180, 0, Math.PI * 2);
      ctx.fill();

      // Planet body clipping region
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.clip();

      const pBodyGrad = ctx.createLinearGradient(px, py - pr, px, py + pr);
      if (systemId === SystemID.BETELGEUSE) {
        pBodyGrad.addColorStop(0, '#6ee7b7');
        pBodyGrad.addColorStop(0.08, '#10b981');
        pBodyGrad.addColorStop(0.2, '#047857');
        pBodyGrad.addColorStop(0.4, '#064e3b');
      } else if (systemId === SystemID.SIRIUS_PRIME) {
        pBodyGrad.addColorStop(0, '#fbcfe8');
        pBodyGrad.addColorStop(0.08, '#ec4899');
        pBodyGrad.addColorStop(0.2, '#be185d');
        pBodyGrad.addColorStop(0.4, '#831843');
      } else {
        pBodyGrad.addColorStop(0, '#fef08a');
        pBodyGrad.addColorStop(0.08, '#f59e0b');
        pBodyGrad.addColorStop(0.2, '#b45309');
        pBodyGrad.addColorStop(0.4, '#451a03');
      }
      pBodyGrad.addColorStop(1, '#000000');
      ctx.fillStyle = pBodyGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Gas giant storm bands
      ctx.globalCompositeOperation = 'overlay';
      for (let i = 0; i < 45; i++) {
        ctx.beginPath();
        const bandY = py - pr + 50 + i * 30;
        ctx.ellipse(
          px + (Math.random() - 0.5) * 400, 
          bandY, 
          1600, 
          30 + Math.random() * 90, 
          (Math.random() - 0.5) * 0.1, 
          0, 
          Math.PI * 2
        );
        const isDark = Math.random() > 0.5;
        ctx.fillStyle = isDark 
          ? `rgba(0, 0, 0, ${0.1 + Math.random() * 0.3})`
          : `rgba(255, 255, 255, ${0.05 + Math.random() * 0.15})`;
        ctx.fill();
      }
      
      // Giant Spot
      if (systemId !== SystemID.SIRIUS_PRIME) {
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const spotX = px + (Math.random() - 0.5) * 1200;
          const spotY = py - pr + 150 + Math.random() * 400;
          ctx.ellipse(spotX, spotY, 150 + Math.random() * 200, 60 + Math.random() * 80, 0, 0, Math.PI * 2);
          const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 200);
          spotGrad.addColorStop(0, 'rgba(153, 27, 27, 0.6)');
          spotGrad.addColorStop(1, 'rgba(153, 27, 27, 0)');
          ctx.fillStyle = spotGrad;
          ctx.fill();
        }
      }

      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
  perks,
  setPerks,
  touchControlMode,
  setTouchControlMode,
  isTouchDevice,
  setIsTouchDevice,
  overdriveCharge,
  setOverdriveCharge,
  overdriveActive,
  setOverdriveActive,
  difficulty,
  setDifficulty,
  activeSystemId,
  setActiveSystemId,
  systems,
  setSystems,
  customBg,
}: AsteroidCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const threeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Model templates cache
  const cachedAsteroidModelRef = useRef<THREE.Object3D | null>(null);
  const cachedEnemyShipModelRef = useRef<THREE.Object3D | null>(null);
  const cachedLogoModelRef = useRef<THREE.Object3D | null>(null);
  const modelsLoadedRef = useRef<boolean>(false);

  // Mapped lists to synchronize physics and 3D objects
  const threeAsteroidsMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const threeProjectilesMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const threePickupsMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const threeStarsRef = useRef<THREE.LineSegments | null>(null);
  const threeParticlesPoolRef = useRef<THREE.Points | null>(null);
  
  // Custom HUD Hologram elements
  const hUDLogoMeshRef = useRef<THREE.Object3D | null>(null);
  const hUDLogoGroupRef = useRef<THREE.Group | null>(null);
  const hUDShieldBubbleRef = useRef<THREE.Mesh | null>(null);
  
  // Background gaseous drift nebulae
  const threeNebulaGroupRef = useRef<THREE.Group | null>(null);

  // Procedural texture cache references
  const rockyTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const iceTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const magmaTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const goldenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const droneTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Cached materials to avoid WebGL state changes and GC churn
  const rockyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const iceMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const magmaMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const goldenMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const droneMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const novaMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const warpMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const matteMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Re-usable mesh pools to completely avoid GC allocations
  const asteroidMeshPoolRef = useRef<Map<AsteroidType, THREE.Object3D[]>>(new Map());

  // Canvas context dimension trackers
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Game assets and coordinate trackers stored inside mutable refs for the high-frequency tick loop
  const starsRef = useRef<Star[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<ExplosionParticle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const pickupsRef = useRef<Pickup3D[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  const comboCountRef = useRef<number>(0);
  const comboTimerRef = useRef<number>(0);

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
  const playStartTimeRef = useRef<number | null>(null);
  const novaSequenceRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const levelAsteroidsDestroyedRef = useRef<number>(0);

  // Smooth ship rotation variables for parallax drift & roll
  const yawVelocityRef = useRef<number>(0);
  const pitchVelocityRef = useRef<number>(0);
  const currentRollRef = useRef<number>(0);

  // Background slow nebulae coordinate layers
  const nebulaeRef = useRef([
    { x: -500, y: -450, size: 700, color: 'rgba(74, 20, 140, 0.11)' }, // deep purple
    { x: 500, y: 350, size: 800, color: 'rgba(13, 71, 161, 0.10)' },  // deep blue
    { x: -200, y: 450, size: 600, color: 'rgba(0, 77, 64, 0.09)' },   // dark teal
  ]);

  // Field of View parameters for 3D projection
  const FOV = 160; 

  // Keep refs in sync with props
  useEffect(() => { currentShieldRef.current = shield; }, [shield]);
  useEffect(() => { currentEnergyRef.current = energy; }, [energy]);
  useEffect(() => { currentPhaseRef.current = phase; }, [phase]);
  useEffect(() => { currentLevelRef.current = level; }, [level]);

  const currentOverdriveActiveRef = useRef(overdriveActive);
  const currentOverdriveChargeRef = useRef(overdriveCharge);
  const shieldRippleRef = useRef<number>(0);

  useEffect(() => { currentOverdriveActiveRef.current = overdriveActive; }, [overdriveActive]);
  useEffect(() => { currentOverdriveChargeRef.current = overdriveCharge; }, [overdriveCharge]);

  const currentDifficultyRef = useRef(difficulty);
  const currentActiveSectorIdRef = useRef(activeSystemId);
  useEffect(() => { currentDifficultyRef.current = difficulty; }, [difficulty]);

  useEffect(() => {
    currentActiveSectorIdRef.current = activeSystemId;
    asteroidsRef.current = [];
    projectilesRef.current = [];
    pickupsRef.current = [];
    
    // Update matte painting texture
    if (matteMaterialRef.current) {
      const newTex = loadBackgroundTexture(activeSystemId);
      if (matteMaterialRef.current.map) {
        matteMaterialRef.current.map.dispose();
      }
      matteMaterialRef.current.map = newTex;
      matteMaterialRef.current.needsUpdate = true;
    }

    // Smoothly shift flashlight / spotlight visual colors matching target stellar section
    if (threeSceneRef.current) {
      let activeColor = 0x22d3ee; // Amethyst Teal
      if (activeSystemId === SystemID.KEPLER_186F) {
        activeColor = 0xf97316; // Obsidian Lava Orange
      } else if (activeSystemId === SystemID.SIRIUS_PRIME) {
        activeColor = 0xec4899; // Vaporwave Cyber Pink
      }
      
      threeSceneRef.current.traverse((child) => {
        if (child instanceof THREE.SpotLight) {
          child.color.setHex(activeColor);
        }
      });
    }
  }, [activeSystemId]);

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

  // Handle Three.js WebGL scene initialization, lights, infinite grid, nebulae, and asset loaders
  useEffect(() => {
    const canvas3D = threeCanvasRef.current;
    if (!canvas3D) return;

    // Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.name = "GameScene";
    threeSceneRef.current = scene; scene.fog = new THREE.Fog(0x000000, 500, 2600);

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, dimensions.width / dimensions.height, 1, 10000); // increase far plane
    camera.name = "MainCamera";
    camera.position.set(0, 0, -2000);
    camera.lookAt(0, 0, -2001);
    threeCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas3D,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(dimensions.width, dimensions.height);
    threeRendererRef.current = renderer;

    // Add Ambient deep space navy indigo fill lighting
    const ambientLight = new THREE.AmbientLight(0x0a0a14, 1.6);
    ambientLight.name = "AmbientLight";
    scene.add(ambientLight);

    // Warm high-contrast golden stellar light representation
    const dirLight = new THREE.DirectionalLight(0xffedd5, 3.4);
    dirLight.name = "DirectionalLight";
    dirLight.position.set(400, 300, 200);
    scene.add(dirLight);

    // Deep blue rim light from the opposite side
    const rimLight = new THREE.DirectionalLight(0x4466ff, 4.5);
    rimLight.name = "RimLight";
    rimLight.position.set(-500, -200, -1000);
    scene.add(rimLight);

    // Headlight sensor beam aligned forward with cockpit travel
    const headlight = new THREE.SpotLight(0x22d3ee, 3.0, 1000, Math.PI / 4, 0.45, 0.85);
    headlight.name = "Headlight";
    headlight.position.set(0, 0, -2000);
    headlight.target.position.set(0, 0, -2001);
    scene.add(headlight);
    scene.add(headlight.target);
    // Fog to fade out asteroids in the distance
    scene.fog = new THREE.FogExp2(0x020205, 0.00030);
    
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Create an equirectangular canvas for environment map
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 2048;
    envCanvas.height = 1024;
    const ctx = envCanvas.getContext('2d')!;
    
    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.5, '#020510');
    grad.addColorStop(1, '#050a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Nebula blobs
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const r = 200 + Math.random() * 400;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const rC = Math.floor(Math.random() * 80);
        const gC = Math.floor(Math.random() * 100 + 40);
        const bC = Math.floor(Math.random() * 200 + 55);
        g.addColorStop(0, 'rgba(' + rC + ',' + gC + ',' + bC + ',0.25)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 2048, 1024);
    }
    
    // Add bright stars
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 2500; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const s = Math.random() * 2.5;
        ctx.globalAlpha = Math.random() * 0.8 + 0.2;
        ctx.fillRect(x, y, s, s);
    }
    
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.colorSpace = THREE.SRGBColorSpace;
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmremGenerator.fromEquirectangular(envTex).texture;
    scene.environment = envMap;
    // We can also set background to envMap if we want
    // scene.background = envMap; 
    
    // Also create a massive backdrop sphere
    const spaceGeo = new THREE.SphereGeometry(8000, 32, 32);
    const spaceMat = new THREE.MeshBasicMaterial({
        map: envTex,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
    });
    const spaceMesh = new THREE.Mesh(spaceGeo, spaceMat);
    spaceMesh.name = 'DeepSpaceBackground';
    scene.add(spaceMesh);



    // Cache procedural textures on refs for high-performance retrieval
    rockyTextureRef.current = createRockyTexture();
    iceTextureRef.current = createIceTexture();
    magmaTextureRef.current = createMagmaTexture();
    goldenTextureRef.current = createGoldenTexture();
    droneTextureRef.current = createDroneTexture();

    // Pre-create and cache reusable materials to avoid real-time shader compilation
    rockyMaterialRef.current = new THREE.MeshStandardMaterial({
      map: rockyTextureRef.current,
      bumpMap: rockyTextureRef.current,
      bumpScale: 0.08,
      color: 0x71717a,
      roughness: 0.9,
      metalness: 0.1,
    });
    iceMaterialRef.current = new THREE.MeshStandardMaterial({
      map: iceTextureRef.current,
      bumpMap: iceTextureRef.current,
      bumpScale: 0.04,
      color: 0xdbeafe,
      roughness: 0.05,
      metalness: 0.15,
      opacity: 0.88,
      transparent: true,
      emissive: 0x93c5fd,
      emissiveIntensity: 0.45,
    });
    magmaMaterialRef.current = new THREE.MeshStandardMaterial({
      map: magmaTextureRef.current,
      bumpMap: magmaTextureRef.current,
      bumpScale: 0.07,
      color: 0x22c55e,
      emissive: 0x15803d,
      emissiveIntensity: 0.75,
      roughness: 0.7,
      metalness: 0.25,
    });
    goldenMaterialRef.current = new THREE.MeshStandardMaterial({
      map: goldenTextureRef.current,
      bumpMap: goldenTextureRef.current,
      bumpScale: 0.04,
      color: 0xf59e0b,
      roughness: 0.1,
      metalness: 0.99,
      emissive: 0xb45309,
      emissiveIntensity: 0.3,
    });
    droneMaterialRef.current = new THREE.MeshStandardMaterial({
      map: droneTextureRef.current,
      bumpMap: droneTextureRef.current,
      bumpScale: 0.02,
      color: 0x1e1b4b,
      roughness: 0.2,
      metalness: 0.95,
      emissive: 0xef4444,
      emissiveIntensity: 0.65,
    });
    
    novaMaterialRef.current = new THREE.MeshStandardMaterial({
      map: magmaTextureRef.current,
      bumpMap: magmaTextureRef.current,
      bumpScale: 0.04,
      color: 0xffedd5,
      emissive: 0xf97316, // blazing orange
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.5,
    });
    
    warpMaterialRef.current = new THREE.MeshStandardMaterial({
      map: iceTextureRef.current,
      bumpMap: iceTextureRef.current,
      bumpScale: 0.02,
      color: 0xddd6fe,
      emissive: 0x8b5cf6, // deep violet pulse
      emissiveIntensity: 1.5,
      roughness: 0.4,
      metalness: 0.9,
    });

    // Populate active mesh pools Map
    asteroidMeshPoolRef.current.set(AsteroidType.NORMAL, []);
    asteroidMeshPoolRef.current.set(AsteroidType.ICE, []);
    asteroidMeshPoolRef.current.set(AsteroidType.RADIOACTIVE, []);
    asteroidMeshPoolRef.current.set(AsteroidType.GOLDEN, []);
    asteroidMeshPoolRef.current.set(AsteroidType.DRONE, []);
    asteroidMeshPoolRef.current.set(AsteroidType.NOVA, []);
    asteroidMeshPoolRef.current.set(AsteroidType.TIME_WARP, []);
    asteroidMeshPoolRef.current.set(AsteroidType.DEBRIS, []);
    asteroidMeshPoolRef.current.set(AsteroidType.ENEMY_SHIP, []);

    // 1. Distant Background Matte Painting (HUGE Planet + Space)
    // Removed MattePainting background as requested


    // Holographic Cockpit Status Console Group (bottom-right dashboard float)
    const hudGroup = new THREE.Group();
    hudGroup.name = "HUDConsole";
    hudGroup.position.set(220, -150, -2320);
    scene.add(hudGroup);
    hUDLogoGroupRef.current = hudGroup;

    // Shield holographic bubble
    const shieldGeo = new THREE.SphereGeometry(24, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
        fog: false,
      });
    const shieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
    shieldBubble.name = "ShieldHologram";
    hudGroup.add(shieldBubble);
    hUDShieldBubbleRef.current = shieldBubble;

    // Initialize 3D Stars Starfield Line segments
    const starCount = 6000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 6);
    const starColors = new Float32Array(starCount * 6);
    for (let i = 0; i < starCount; i++) {
        const i6 = i * 6;
        const x = (Math.random() - 0.5) * 8000;
        const y = (Math.random() - 0.5) * 8000;
        const z = Math.random() * 6000;
        
        starPositions[i6] = x;
        starPositions[i6 + 1] = y;
        starPositions[i6 + 2] = z;
        starPositions[i6 + 3] = x;
        starPositions[i6 + 4] = y;
        starPositions[i6 + 5] = z + (Math.random() * 40 + 10);
        
        // Add some color variation (blueish, whitish, yellowish)
        let r=1, g=1, b=1;
        const rand = Math.random();
        if (rand < 0.2) { r = 0.6; g = 0.8; b = 1.0; } // blue
        else if (rand < 0.4) { r = 1.0; g = 0.9; b = 0.7; } // yellow/gold
        else if (rand < 0.6) { r = 0.9; g = 0.5; b = 0.5; } // red/orange
        
        starColors[i6] = r; starColors[i6+1] = g; starColors[i6+2] = b;
        starColors[i6+3] = r; starColors[i6+4] = g; starColors[i6+5] = b;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    const starLines = new THREE.LineSegments(starGeometry, starMaterial);
    starLines.name = "StarFieldLines";
    scene.add(starLines);
    threeStarsRef.current = starLines;

    // Initialize 3D Particle Sparks Pool
    const maxParticles = 2000;
    const partGeo = new THREE.BufferGeometry();
    const partPositions = new Float32Array(maxParticles * 3);
    const partColors = new Float32Array(maxParticles * 3);
    for (let i = 0; i < maxParticles * 3; i++) partPositions[i] = 99999; // hide initially
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(partColors, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#bfdbfe');
      grad.addColorStop(1, 'transparent');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 16, 16);
    }
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const partMat = new THREE.PointsMaterial({
      size: 14,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const particlePoints = new THREE.Points(partGeo, partMat);
    particlePoints.name = "ParticleSystem";
    scene.add(particlePoints);
    threeParticlesPoolRef.current = particlePoints;

    // Far deep space drifting nebulae plane modules representations
    const nebGroup = new THREE.Group();
    nebGroup.name = "NebulaCluster";
    scene.add(nebGroup);
    threeNebulaGroupRef.current = nebGroup;

    const nebColors = ['#5b21b6', '#1e3a8a', '#0d9488']; // amethyst purple, sapphire blue, teal galaxy
    nebColors.forEach((color, idx) => {
      const texture = createNebulaTexture(color);
      const geom = new THREE.PlaneGeometry(2400 - idx * 400, 2400 - idx * 400);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `NebulaPlane_${idx + 1}`;
      mesh.position.set((idx - 1) * 600, (idx - 1) * 200, -1800 - idx * 160 - 2000);
      nebGroup.add(mesh);
    });

    // Asset GLTF Eager Loaders
    const loader = new GLTFLoader();

    // 1. Load ast.glb (Asteroids template)
    loader.load(
      '/assets/ast/ast.glb',
      (gltf) => {
        const model = gltf.scene;
        // Normalize
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.center();

            const nameLower = child.name.toLowerCase();
            if (
              nameLower.includes('outline') ||
              nameLower.includes('contour') ||
              nameLower.includes('toon') ||
              nameLower.includes('cartoon') ||
              nameLower.includes('wireframe')
            ) {
              child.visible = false;
              child.scale.set(0,0,0); // suppress from the scene tree completely
            } else if (child.material) {
              child.material.roughness = 0.8;
              child.material.metalness = 0.2;
            }
          }
        });
        const scaleFactor = 2.0 / maxDim; // diam size 2, rad size 1
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        cachedAsteroidModelRef.current = model;
        console.log('🚀 Loaded ast.glb asteroid resource successfully');
      },
      undefined,
      (err) => {
        console.warn('⚠️ Fallback back to procedural 3D asteroid rock', err);
        const fallbackGeo = new THREE.DodecahedronGeometry(1.0, 1);
        const fallbackMat = new THREE.MeshStandardMaterial({
          color: 0x4B3F35,
          roughness: 0.9,
          metalness: 0.1,
        });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        cachedAsteroidModelRef.current = fallbackMesh;
      }
    );

    // 1.5 Load ship.glb (Enemy ship)
    loader.load(
      '/assets/ship/ship.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.center();
          }
        });
        const scaleFactor = 30.0 / maxDim;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        // Default rotation so it faces camera?
        // model.rotation.y = Math.PI;
        cachedEnemyShipModelRef.current = model;
        console.log('🚀 Loaded ship.glb enemy resource successfully');
      },
      undefined,
      (err) => console.warn('Failed to load ship.glb', err)
    );

    // 2. Load logo7.glb (Holographic cockpit ship)
    loader.load(
      '/assets/logo7/logo7.glb',
      (gltf) => {
        const model = gltf.scene;
        // Normalize
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.center();
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0x111111,
              metalness: 1.0,
              roughness: 0.1,
              envMapIntensity: 3.0,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1,
            });
          }
        });
        const scaleFactor = 4.0 / maxDim; // Size 4 units (shrunk 75%)
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        cachedLogoModelRef.current = model;

        // Clone and mount inside HUD hologram
        const hudLogo = model.clone();
        hudLogo.scale.copy(model.scale).multiplyScalar(1.5);
        hudLogo.rotation.x = Math.PI / 6;
        // Removed second logo at the bottom right of the screen completely per user request
        // hudGroup.add(hudLogo);
        hUDLogoMeshRef.current = hudLogo;

        console.log('🚀 Loaded logo7.glb starship emblem successfully');
        modelsLoadedRef.current = true;
      },
      undefined,
      (err) => {
        console.warn('⚠️ Fallback back to vector starfighter wedge', err);
        const fallbackGroup = new THREE.Group();
        fallbackGroup.name = "FallbackHUDLogo";
        const bodyGeo = new THREE.ConeGeometry(5, 18, 4);
        bodyGeo.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.1 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.name = "FallbackLogoBody";
        fallbackGroup.add(body);

        const wingGeo = new THREE.BoxGeometry(16, 1, 4);
        const wing = new THREE.Mesh(wingGeo, bodyMat);
        wing.name = "FallbackLogoWing";
        wing.position.set(0, -1, 4);
        fallbackGroup.add(wing);

        cachedLogoModelRef.current = fallbackGroup;

        // HUD center
        const hudLogo = fallbackGroup.clone();
        hudLogo.scale.set(1.2, 1.2, 1.2);
        // Removed second logo at the bottom right of the screen completely per user request
        // hudGroup.add(hudLogo);
        hUDLogoMeshRef.current = hudLogo;

        modelsLoadedRef.current = true;
      }
    );

    // Clean up
    return () => {
      renderer.dispose();
      [threeAsteroidsMapRef, threeProjectilesMapRef, threePickupsMapRef].forEach((mapRef) => {
        mapRef.current.forEach((obj) => {
          scene.remove(obj);
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
                else child.material.dispose();
              }
            }
          });
        });
        mapRef.current.clear();
      });
    };
  }, []);

  // Sync aspect ratio and perspective FOV with window resize
  useEffect(() => {
    if (threeRendererRef.current && threeCameraRef.current) {
      threeRendererRef.current.setSize(dimensions.width, dimensions.height);
      const fovRad = 2 * Math.atan((dimensions.height / 2) / FOV);
      threeCameraRef.current.fov = fovRad * (180 / Math.PI);
      threeCameraRef.current.aspect = dimensions.width / dimensions.height;
      threeCameraRef.current.updateProjectionMatrix();
    }
  }, [dimensions]);

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

  // Multi-Touch tracking for mobile controllers (Joystick & Tether)
  const touchLeftStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchLeftCurrentRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (!isTouchDevice) {
      setIsTouchDevice(true);
    }

    isShootingRef.current = true;
    playSound.startEngine();

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const tx = touch.clientX - rect.left;
      const ty = touch.clientY - rect.top;

      if (touchControlMode === 'JOYSTICK') {
        if (tx < rect.width * 0.45) {
          touchLeftStartRef.current = { x: tx, y: ty };
          touchLeftCurrentRef.current = { x: tx, y: ty };
        } else {
          mouseRef.current = { x: tx, y: ty };
        }
      } else {
        mouseRef.current = { x: tx, y: ty };
      }
    }
  }, [touchControlMode, isTouchDevice, setIsTouchDevice]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    let leftTouchFound = false;
    let rightTouchX = mouseRef.current.x;
    let rightTouchY = mouseRef.current.y;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const tx = touch.clientX - rect.left;
      const ty = touch.clientY - rect.top;

      if (touchControlMode === 'JOYSTICK') {
        if (tx < rect.width * 0.45) {
          leftTouchFound = true;
          if (!touchLeftStartRef.current) {
            touchLeftStartRef.current = { x: tx, y: ty };
          }
          touchLeftCurrentRef.current = { x: tx, y: ty };
        } else {
          rightTouchX = tx;
          rightTouchY = ty;
        }
      } else {
        rightTouchX = tx;
        rightTouchY = ty;
      }
    }

    if (touchControlMode === 'JOYSTICK' && !leftTouchFound) {
      touchLeftStartRef.current = null;
      touchLeftCurrentRef.current = null;
    }

    mouseRef.current = { x: rightTouchX, y: rightTouchY };
  }, [touchControlMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isShootingRef.current = false;
      touchLeftStartRef.current = null;
      touchLeftCurrentRef.current = null;
    } else {
      if (touchControlMode === 'JOYSTICK') {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        let leftFound = false;

        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          const tx = touch.clientX - rect.left;
          if (tx < rect.width * 0.45) {
            leftFound = true;
          }
        }

        if (!leftFound) {
          touchLeftStartRef.current = null;
          touchLeftCurrentRef.current = null;
        }
      }
    }
  }, [touchControlMode]);

  // Initialize Stars
  const initializeStars = useCallback((count: number) => {
    const list: Star[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: (Math.random() - 0.5) * 5000,
        y: (Math.random() - 0.5) * 5000,
        z: 120 + Math.random() * 5880, // Massive Z depth
        brightness: 0.5 + Math.random() * 0.5,
      });
    }
    starsRef.current = list;
  }, []);

  // Set up game initial launch
  useEffect(() => {
    initializeStars(1500);
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
    pickupsRef.current = [];
    floatingTextsRef.current = [];
    comboCountRef.current = 0;
    comboTimerRef.current = 0;
    levelAsteroidsDestroyedRef.current = 0;
    warpFactorRef.current = 1.0;
    warpGoalRef.current = 1.0;
    playSound.updateEnginePitch(1.0);
    setOverdriveActive(false);
    setOverdriveCharge(0);
    shieldRippleRef.current = 0;
  }, [setOverdriveActive, setOverdriveCharge]);

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
    const particleCount = isHeavy ? count * 4 : count * 2;
    if (isHeavy) {
      shockwavesRef.current.push({
        x, y, z, radius: 0, maxRadius: (isHeavy ? 150 : 20) + count * 2 + Math.random() * 100, color
      });

      // Spawn large shatter chunks
      const chunkCount = 4 + Math.floor(Math.random() * 5);
      for(let d=0; d<chunkCount; d++) {
          const dRadius = 4 + Math.random() * 12; // chunk debris
          asteroidsRef.current.push({
            id: Math.random().toString(),
            x: x + (Math.random() - 0.5) * 50,
            y: y + (Math.random() - 0.5) * 50,
            z: z + (Math.random() - 0.5) * 50,
            radius: dRadius,
            size: dRadius,
            maxHealth: 5,
            health: 5,
            speed: 5 + Math.random() * 15, 
            rotationAngle: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            rotSpeedX: (Math.random() - 0.5) * 0.2,
            rotSpeedY: (Math.random() - 0.5) * 0.2,
            rotSpeedZ: (Math.random() - 0.5) * 0.2,
            shapeScaleX: 0.5 + Math.random() * 1.0,
            shapeScaleY: 0.5 + Math.random() * 1.0,
            shapeScaleZ: 0.5 + Math.random() * 1.0,
            craterSeeds: Array.from({ length: 8 }, () => Math.random()),
            hitFlashTime: 0,
            type: AsteroidType.DEBRIS, // Assuming DEBRIS type is added in types.ts
          });
      }
    }
    for (let i = 0; i < particleCount; i++) {
      // Create a spherical explosion pattern
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = (isHeavy ? 15 : 6) + Math.random() * (isHeavy ? 20 : 8);
      
      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      // Mix some bright white/yellow sparks into the explosion
      const isSpark = Math.random() > 0.8;
      const finalColor = isSpark ? '#ffffff' : (Math.random() > 0.5 ? color : '#f59e0b');

      particlesRef.current.push({
        x,
        y,
        z,
        vx,
        vy,
        vz,
        color: finalColor,
        size: (isHeavy ? 5.0 : 2.5) + Math.random() * 4,
        life: 0,
        maxLife: (isHeavy ? 45 : 25) + Math.floor(Math.random() * 30),
      });
    }
  }, []);

  // Spawns randomized floating pickups in 3D outer space
  const handleAsteroidDrop = useCallback((ast: Asteroid) => {
    // Drop chance
    const dropChance = ast.type === AsteroidType.GOLDEN ? 1.0 : ast.type === AsteroidType.DRONE ? 0.75 : 0.22;
    if (Math.random() >= dropChance) return;

    // Pick type
    let type: 'SHIELD' | 'ENERGY' | 'SCRAP' = 'SCRAP';
    if (ast.type === AsteroidType.GOLDEN) {
      type = Math.random() > 0.4 ? 'SCRAP' : 'ENERGY';
    } else if (ast.type === AsteroidType.DRONE) {
      type = 'SHIELD';
    } else {
      const rand = Math.random();
      type = rand > 0.65 ? 'SHIELD' : rand > 0.35 ? 'ENERGY' : 'SCRAP';
    }

    pickupsRef.current.push({
      id: Math.random().toString(),
      x: ast.x + (Math.random() - 0.5) * 30,
      y: ast.y + (Math.random() - 0.5) * 30,
      z: ast.z,
      vx: (Math.random() - 0.5) * 1.0,
      vy: (Math.random() - 0.5) * 1.0,
      vz: -2.0, // drifts slowly forward toward cockpit windshield
      type,
      size: 16,
      brightness: 1.0,
      harvestProgress: 0,
    });
  }, []);

  // Custom function to spawn high energy homing rockets when Overdrive is active
  const fireOverdriveSeekers = useCallback((mouseX: number, mouseY: number) => {
    setStats(s => ({
      ...s,
      shotsFired: s.shotsFired + 3,
    }));
    playSound.overdriveFire();

    const screenCenterX = dimensions.width / 2;
    const screenCenterY = dimensions.height / 2;

    const targetZ = 850;
    const thetaX = (mouseX - screenCenterX) / FOV;
    const thetaY = (mouseY - screenCenterY) / FOV;
    const target3D_X = thetaX * targetZ;
    const target3D_Y = thetaY * targetZ;

    setScreenShake(prev => Math.min(25, prev + 6));

    const mounts = [
      { x: -140, y: 110, z: 20, color: '#ec4899' }, // Magenta neon rocket
      { x: 140, y: 110, z: 20, color: '#eab308' },  // Gold laser rocket
      { x: 0, y: 150, z: 15, color: '#a855f7' },    // Royal purple wave rocket
    ];

    mounts.forEach((mount) => {
      const dx = target3D_X - mount.x;
      const dy = target3D_Y - mount.y;
      const dz = targetZ - mount.z;
      const magnitude = Math.sqrt(dx*dx + dy*dy + dz*dz);

      projectilesRef.current.push({
        id: Math.random().toString(),
        x: mount.x,
        y: mount.y,
        z: mount.z,
        targetX: mouseX,
        targetY: mouseY,
        vx: (dx / (magnitude || 1)) * 13,
        vy: (dy / (magnitude || 1)) * 13,
        vz: (dz / (magnitude || 1)) * 13,
        damage: 22,
        color: mount.color,
        size: 10,
        type: WeaponID.PLASMA_LASER,
      });
    });
  }, [dimensions, setScreenShake, setStats]);

  // Custom function to create vector projectiles directed in 3D outer space
  const fireActiveWeapon = useCallback((activeWep: WeaponID, mouseX: number, mouseY: number) => {
    const now = Date.now();
    const config = WEAPON_CONFIGS[activeWep];
    
    let actualFireRate = config.fireRate;
    if (activeWep === WeaponID.PLASMA_LASER && comboCountRef.current >= 2) {
      actualFireRate = Math.max(60, config.fireRate - (comboCountRef.current * 10));
    }

    if (now - lastFiredTimeRef.current < actualFireRate) return;
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

    let adjustedX = mouseX;
    let adjustedY = mouseY;

    // Mobile Smart Snap assistance (Gravity Lock option)
    if (isTouchDevice) {
      let closestAst: Asteroid | null = null;
      let minDistance = 85; // snapping lock-on radius (in pixels)

      asteroidsRef.current.forEach((ast) => {
        if (ast.z < 60) return;
        const astScreenX = screenCenterX + (ast.x / ast.z) * FOV;
        const astScreenY = screenCenterY + (ast.y / ast.z) * FOV;
        const dist = Math.sqrt(Math.pow(astScreenX - mouseX, 2) + Math.pow(astScreenY - mouseY, 2));
        if (dist < minDistance) {
          minDistance = dist;
          closestAst = ast;
        }
      });

      if (closestAst) {
        const ast: Asteroid = closestAst;
        adjustedX = screenCenterX + (ast.x / ast.z) * FOV;
        adjustedY = screenCenterY + (ast.y / ast.z) * FOV;
      }
    }

    // Calculate aiming vector projecting adjusted relative screen to 3D space depth z=800
    const targetZ = 850;
    const thetaX = (adjustedX - screenCenterX) / FOV;
    const thetaY = (adjustedY - screenCenterY) / FOV;
    const target3D_X = thetaX * targetZ;
    const target3D_Y = thetaY * targetZ;

    // Add screenshake feedback
    setScreenShake(prev => Math.min(20, prev + (config.id === WeaponID.PROTON_TORPEDO ? 12 : 3)));

    const activeDamage = config.damage * perks.damageMultiplier;
    const triggerDouble = Math.random() < perks.doubleShotChance;

    if (activeWep === WeaponID.PLASMA_LASER) {
      // Dual plasma lasers fire from left and right turrets
      const cannons = [
        { x: -160, y: 120, z: 20 }, // left gun
        { x: 160, y: 120, z: 20 },  // right gun
      ];

      // Double-Shot trigger adds supplementary wing turrets
      if (triggerDouble) {
        cannons.push({ x: -120, y: 100, z: 28 });
        cannons.push({ x: 120, y: 100, z: 28 });
      }

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
          damage: activeDamage,
          color: config.color,
          size: 4,
          type: activeWep,
        });
      });
    } else if (activeWep === WeaponID.PROTON_TORPEDO) {
      // Single central torpedo launched from reactor core
      const cannons = [{ x: 0, y: 180, z: 15 }];
      if (triggerDouble) {
        cannons.push({ x: -90, y: 140, z: 22 });
      }

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
          damage: activeDamage,
          color: config.color,
          size: 14,
          type: activeWep,
        });
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
        damage: activeDamage,
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
        ast.health -= activeDamage;
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
          
          if (!currentOverdriveActiveRef.current) {
            setOverdriveCharge(prev => {
              const capBonus = ast.type === AsteroidType.GOLDEN ? 16 : ast.type === AsteroidType.DRONE ? 12 : 8;
              const nextVal = Math.min(100, prev + capBonus);
              if (prev < 100 && nextVal >= 100) {
                playSound.overdriveReady();
              }
              return nextVal;
            });
          }

          spawnExplosion(ast.x, ast.y, ast.z, '#af52de', 16, ast.radius > 40);
          handleAsteroidDrop(ast);
          
          // Remove from ref
          asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== ast.id);
        }
      }
    } else if (activeWep === WeaponID.FLAK_CANNON) {
      // Fires a spread array of fragmentation shrapnel pellets
      const gunX = 0;
      const gunY = 150;
      const gunZ = 15;

      const spreadCount = triggerDouble ? 10 : 6;
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
          damage: activeDamage,
          color: config.color,
          size: 2.5,
          type: activeWep,
        });
      }
    }
  }, [dimensions, setEnergy, setScore, setAsteroidsBlasted, setStats, setScreenShake, spawnExplosion, perks, handleAsteroidDrop]);

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

      // 1. Process Shooting Input & Overdrive Core battery drain updates
      if (p !== 'PLAYING') {
        playStartTimeRef.current = null;
        novaSequenceRef.current = 0;
        if (hUDLogoMeshRef.current && threeSceneRef.current) {
            threeSceneRef.current.remove(hUDLogoMeshRef.current);
        }
      }

      // 1. Process Shooting Input & Overdrive Core battery drain updates
      if (p === 'PLAYING') {
        if (playStartTimeRef.current === null) {
            playStartTimeRef.current = Date.now();
        }
        
        if (novaSequenceRef.current === 0 && Date.now() - playStartTimeRef.current > 17000) {
            novaSequenceRef.current = Date.now();
            
            spawnExplosion(0, 0, 4000, '#ffbf00', 5000, true);
            setScreenShake(s => Math.min(150, s + 150));
            playSound.shieldHit(); // substitute for loud crash
            
            if (hUDLogoMeshRef.current && threeSceneRef.current) {
                hUDLogoMeshRef.current.position.set(0, 0, -6000);
                hUDLogoMeshRef.current.scale.copy(cachedLogoModelRef.current!.scale).multiplyScalar(300);
                hUDLogoMeshRef.current.rotation.set(0, 0, Math.PI); 
                threeSceneRef.current.add(hUDLogoMeshRef.current);
            }
        }
        
        if (novaSequenceRef.current > 0) {
            const timeSince = Date.now() - novaSequenceRef.current;
            const duration = 6500;
            const progress = Math.min(1.0, timeSince / duration);
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            if (hUDLogoMeshRef.current) {
               hUDLogoMeshRef.current.position.z = -6000 + (easeOutCubic * 1300);
               hUDLogoMeshRef.current.rotation.y = easeOutCubic * Math.PI * 2;
               hUDLogoMeshRef.current.rotation.x = easeOutCubic * Math.PI * 0.15;
               hUDLogoMeshRef.current.rotation.z = Math.PI;
               
               if (progress < 1.0 && Math.random() > 0.6) {
                   spawnExplosion(
                     hUDLogoMeshRef.current.position.x + (Math.random()-0.5)*100, 
                     -hUDLogoMeshRef.current.position.y + (Math.random()-0.5)*100, 
                     -hUDLogoMeshRef.current.position.z - 2000, 
                     '#ffffff', 
                     100, 
                     false
                   );
               }
            }
        }
        if (currentOverdriveActiveRef.current) {
          const nextCharge = Math.max(0, currentOverdriveChargeRef.current - 0.33);
          setOverdriveCharge(nextCharge);
          if (nextCharge <= 0) {
            setOverdriveActive(false);
          }

          // Overdrive auto fire barrage loop
          const overdriveFireCooldown = 110; // ms
          if (Date.now() - lastFiredTimeRef.current > overdriveFireCooldown) {
            fireOverdriveSeekers(mouseRef.current.x, mouseRef.current.y);
            // set lastFiredTimeRef.current so it triggers next tick
            lastFiredTimeRef.current = Date.now();
          }
        } else if (isShootingRef.current) {
          fireActiveWeapon(activeWeapon, mouseRef.current.x, mouseRef.current.y);
        }
      }

      // 2. Clear transparent 2D HUD overlay canvas context so WebGL is visible behind
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const screenCenterX = dimensions.width / 2;
      const screenCenterY = dimensions.height / 2;

      // Compute ship yaw & pitch movement based on mouse cursor's offset from center, with full touch override support
      let offsetX = mouseRef.current.x - screenCenterX;
      let offsetY = mouseRef.current.y - screenCenterY;

      let joystickSteeringActive = false;
      let jYaw = 0;
      let jPitch = 0;

      if (isTouchDevice && touchControlMode === 'JOYSTICK' && touchLeftStartRef.current && touchLeftCurrentRef.current) {
        const dx = touchLeftCurrentRef.current.x - touchLeftStartRef.current.x;
        const dy = touchLeftCurrentRef.current.y - touchLeftStartRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 60;
        const clampedDx = distance > maxRadius ? (dx / distance) * maxRadius : dx;
        const clampedDy = distance > maxRadius ? (dy / distance) * maxRadius : dy;

        jYaw = -(clampedDx / maxRadius);
        jPitch = -(clampedDy / maxRadius);
        joystickSteeringActive = true;
      }

      // Target yaw and pitch angular speeds (turning ship right shifts universe left)
      const targetYawVel = joystickSteeringActive ? jYaw * 12 : -offsetX * 0.055;
      const targetPitchVel = joystickSteeringActive ? jPitch * 12 : -offsetY * 0.055;

      // Smoothly interpolate the velocities
      yawVelocityRef.current += (targetYawVel - yawVelocityRef.current) * 0.1;
      pitchVelocityRef.current += (targetPitchVel - pitchVelocityRef.current) * 0.1;

      const yaw = yawVelocityRef.current;
      const pitch = pitchVelocityRef.current;

      // Handle custom screenshake & roll translations
      ctx.save();
      
      // Camera tilt / Bank roll based on horizontal steering
      const rollFactor = -0.0012; // enhanced dynamic bank tilt
      const targetRoll = (mouseRef.current.x - screenCenterX) * rollFactor;
      currentRollRef.current += (targetRoll - currentRollRef.current) * 0.12;
      const roll = currentRollRef.current;

      // Sync deep space camera to flight controls for dynamic high fidelity 3D cockpit perspective shifts
      if (threeCameraRef.current) {
        const camera = threeCameraRef.current;
        camera.position.x = -yaw * 0.45;
        camera.position.y = pitch * 0.45;
        camera.rotation.z = -roll;
        
        if (screenShake > 0.1) {
          camera.position.x += (Math.random() - 0.5) * screenShake * 0.25;
          camera.position.y += (Math.random() - 0.5) * screenShake * 0.25;
        }
      }

      // Sync 3D Nebulae slow drift motion (deep background)
      if (threeNebulaGroupRef.current) {
        threeNebulaGroupRef.current.children.forEach((plane, idx) => {
          plane.rotation.z += 0.00015 * (idx === 1 ? -1 : 1);
          plane.position.x = (idx - 1) * 600 + yaw * 0.04;
          plane.position.y = (idx - 1) * 200 - pitch * 0.04;
        });
      }

      // Sync 3D Background matte painting parallax steering drift (realistically deep)
      if (threeSceneRef.current) {
        const scene = threeSceneRef.current;
        const matte = scene.getObjectByName('MattePaintingBackground');
        if (matte) {
          matte.position.x = yaw * 0.08;
          matte.position.y = -pitch * 0.08;
        }
      }

      // Apply screen space roll rotated around the cockpit window center
      ctx.translate(screenCenterX, screenCenterY);
      ctx.rotate(roll);
      ctx.translate(-screenCenterX, -screenCenterY);

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

      // 4. Update and Draw Celestial Stars (3D Deep Flight with dynamic Parallax Shift)
      ctx.lineWidth = 1.6;
      
      starsRef.current.forEach((star) => {
        // Star movement speed is altered by weapon levels and if we are warping
        const travelSpeed = (15.0 + 2.0 * lvlConfig.starSpeedMultiplier) * warpFactorRef.current;
        star.z -= travelSpeed;

        // Apply yaw & pitch steering drift (3D parallax rotation displacement)
        // Closer stars shift slightly more to create deep volumetric perspective
        const depthFactor = Math.max(0, (6000 - star.z) / 6000);
        star.x += yaw * (1.2 + depthFactor * 3.8);
        star.y += pitch * (1.2 + depthFactor * 3.8);

        // Frustum boundary wrapping to maintain high-density endless starfield
        const maxFrustX = (dimensions.width / 2) * (star.z / FOV) + 120;
        const maxFrustY = (dimensions.height / 2) * (star.z / FOV) + 120;

        if (star.z <= 120) {
          star.z = 6000;
          star.x = (Math.random() - 0.5) * 5000;
          star.y = (Math.random() - 0.5) * 5000;
        } else if (star.x > maxFrustX) {
          star.x = -maxFrustX + 15;
        } else if (star.x < -maxFrustX) {
          star.x = maxFrustX - 15;
        } else if (star.y > maxFrustY) {
          star.y = -maxFrustY + 15;
        } else if (star.y < -maxFrustY) {
          star.y = maxFrustY - 15;
        }

        // 2D Canvas star drawing is removed so that stars are rendered realistically
        // in the native 3D WebGL space behind the cockpit (referencing threeStarsRef).
      });

      // 5. Generate Dynamic Asteroids Spawner (Scales dynamically with chosen Pilot Difficulty levels)
      if (p === 'PLAYING') {
        const timeNow = Date.now();
        
        let spawnMultiplier = 1.0;
        let speedMultiplier = 1.0;
        let hpMultiplier = 1.0;

        if (difficulty === DifficultyLevel.RECRUIT) {
          spawnMultiplier = 1.45; // Slower spawn intervals for rookies
          speedMultiplier = 0.72; // Decreased drift speed
          hpMultiplier = 0.65;    // Rocks fracture with fewer plasma hits
        } else if (difficulty === DifficultyLevel.ELITE) {
          spawnMultiplier = 0.65; // Highly compressed dense asteroid fields
          speedMultiplier = 1.35; // Hyper-charged projectile drift velocities
          hpMultiplier = 1.45;    // Dense metallic cores requiring massive kinetic shock
        }

        const activeAsteroidCount = asteroidsRef.current.filter(a => a.health > 0 && a.type !== AsteroidType.DEBRIS).length;
        if (activeAsteroidCount < 15 && timeNow - lastSpawnTimeRef.current > (lvlConfig.spawnInterval * spawnMultiplier) * 0.3) {
          const spawnCount = Math.min(3, 15 - activeAsteroidCount);
          for (let s = 0; s < spawnCount; s++) {
            // Distance from center
            const spawnRadius = 250 + Math.random() * 800; // Even wider dispersal
            const spawnAngle = Math.random() * Math.PI * 2;
            const isTargetedToWindshield = Math.random() > 0.65;

            const baseX = isTargetedToWindshield ? (Math.random() - 0.5) * 300 : Math.cos(spawnAngle) * spawnRadius;
            const baseY = isTargetedToWindshield ? (Math.random() - 0.5) * 500 : Math.sin(spawnAngle) * spawnRadius * 1.5;
            const baseZ = 6000 + Math.random() * 2000;

            // Distribute sub-species types
            let astType = AsteroidType.NORMAL;
            if (currentActiveSectorIdRef.current === SystemID.BETELGEUSE) {
              astType = AsteroidType.ICE; // Removed ENEMY_SHIP per user request
            } else {
              const randType = Math.random();
              if (currLvl >= 2 && randType < 0.12) {
                astType = AsteroidType.GOLDEN; // Was drone before, removed per user request
              } else if (randType < 0.22) {
                astType = AsteroidType.RADIOACTIVE;
              } else if (randType < 0.35) {
                astType = AsteroidType.GOLDEN;
              } else if (randType < 0.45) {
                astType = AsteroidType.ICE;
              } else if (randType < 0.49) {
                astType = AsteroidType.NOVA;
              } else if (randType < 0.53) {
                astType = AsteroidType.TIME_WARP;
              }
            }

            const isDrone = false;
            const isSpecialAbility = astType === AsteroidType.NOVA || astType === AsteroidType.TIME_WARP;
            const astRadius = isDrone ? 20 : isSpecialAbility ? 45 : 10 + Math.random() * 80; // huge diverse sizes
            const hpBonus = astType === AsteroidType.ICE ? 1.7 : isDrone ? 1.3 : isSpecialAbility ? 2.5 : 1.0;
            const hpFactor = (astRadius > 45 ? 2.2 : 1.0) * hpBonus;
            const speedFact = astType === AsteroidType.GOLDEN ? 1.4 : isDrone ? 0.6 : isSpecialAbility ? 0.8 : 1.0;
            const baseSpd = lvlConfig.asteroidSpeedMin + Math.random() * (lvlConfig.asteroidSpeedMax - lvlConfig.asteroidSpeedMin);
            const sizeRatio = (astRadius - 10) / 80;
            const physicsSpeedModifier = 1.35 - sizeRatio * 0.7;
            const asteroidSpeed = baseSpd * speedFact * physicsSpeedModifier * speedMultiplier;

            asteroidsRef.current.push({
              id: Math.random().toString(),
              x: baseX,
              y: baseY,
              z: 6000 + Math.random() * 2000,
              radius: astRadius,
              size: astRadius,
              maxHealth: Math.max(10, Math.floor(lvlConfig.asteroidMaxHealth * hpFactor * hpMultiplier)),
              health: Math.max(10, Math.floor(lvlConfig.asteroidMaxHealth * hpFactor * hpMultiplier)),
              speed: asteroidSpeed,
              rotationAngle: Math.random() * Math.PI,
              rotationSpeed: isDrone ? 0.01 : (Math.random() - 0.5) * 0.08,
              rotSpeedX: isDrone ? 0.006 : (Math.random() - 0.5) * 0.06,
              rotSpeedY: isDrone ? 0.014 : (Math.random() - 0.5) * 0.06,
              rotSpeedZ: isDrone ? 0.008 : (Math.random() - 0.5) * 0.06,
              shapeScaleX: 0.7 + Math.random() * 0.6,
              shapeScaleY: 0.7 + Math.random() * 0.6,
              shapeScaleZ: 0.7 + Math.random() * 0.6,
              craterSeeds: Array.from({ length: 8 }, () => Math.random()),
              hitFlashTime: 0,
              type: astType,
              droneFireCooldown: isDrone ? 90 + Math.random() * 120 : undefined,
            });

            // Spawn smaller pebble debris around it to consistently fill screen
            const debrisCount = 3 + Math.floor(Math.random() * 4);
            for(let d=0; d<debrisCount; d++) {
                const dRadius = 1 + Math.random() * 6; // tiny debris
                asteroidsRef.current.push({
                  id: Math.random().toString(),
                  x: baseX + (Math.random() - 0.5) * 200,
                  y: baseY + (Math.random() - 0.5) * 200,
                  z: baseZ + (Math.random() - 0.5) * 200,
                  radius: dRadius,
                  size: dRadius,
                  maxHealth: 5,
                  health: 5,
                  speed: asteroidSpeed * (0.8 + Math.random() * 0.4), // random variance around parent speed
                  rotationAngle: Math.random() * Math.PI,
                  rotationSpeed: (Math.random() - 0.5) * 0.2, // fast tumbling
                  rotSpeedX: (Math.random() - 0.5) * 0.15,
                  rotSpeedY: (Math.random() - 0.5) * 0.15,
                  rotSpeedZ: (Math.random() - 0.5) * 0.15,
                  shapeScaleX: 0.5 + Math.random() * 1.0,
                  shapeScaleY: 0.5 + Math.random() * 1.0,
                  shapeScaleZ: 0.5 + Math.random() * 1.0,
                  craterSeeds: Array.from({ length: 8 }, () => Math.random()),
                  hitFlashTime: 0,
                  type: AsteroidType.DEBRIS,
                });
            }
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
              setPhase('PERK_SELECTION');
              playSound.upgrade();
              // Re-fill energy on upgrade
              setEnergy(perks.maxEnergy);
            } else {
              setPhase('VICTORY');
            }
          }, 3200);
        }
      }

      // 6. Projectiles updates & 3D Intersection Collision Checking
      const activeProjectiles: Projectile[] = [];
      projectilesRef.current.forEach((proj) => {
        if (proj.isEnemy) {
          // Travel towards player (vz is negative, moving from space closer)
          proj.x += proj.vx;
          proj.y += proj.vy;
          proj.z += proj.vz;

          // Parallax coordinate translation
          proj.x += yaw * 0.45;
          proj.y += pitch * 0.45;

          if (proj.z <= 25) {
            // direct impact on cockpit windshield shields!
            playSound.shieldHit();
            shieldRippleRef.current = 1.0;
            setShield(prev => Math.max(0, prev - 15));
            setScreenShake(s => Math.min(25, s + 12));
            spawnExplosion(proj.x, proj.y, 25, '#ef4444', 16, false);
            
            if (currentShieldRef.current - 15 <= 0) {
              setPhase('GAME_OVER');
            }
            return; // expires
          }

          // Render hostile plasma beam
          const screenX = screenCenterX + (proj.x / proj.z) * FOV;
          const screenY = screenCenterY + (proj.y / proj.z) * FOV;
          const visualProjSize = (proj.size / proj.z) * FOV;

          if (proj.z > 1150 || proj.z < 5) return; // expires

          const prevZ = proj.z - proj.vz * 1.5;
          const prevScreenX = screenCenterX + (proj.x / prevZ) * FOV;
          const prevScreenY = screenCenterY + (proj.y / prevZ) * FOV;

          ctx.beginPath();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = Math.max(2.5, visualProjSize);
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
          ctx.moveTo(prevScreenX, prevScreenY);
          ctx.lineTo(screenX, screenY);
          ctx.stroke();
          ctx.shadowBlur = 0;

          activeProjectiles.push(proj);
          return;
        }

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

        // If overdrive is active and this is a player kinetic projectile, steer towards the closest active asteroid (3D Homing)
        if (currentOverdriveActiveRef.current && !proj.isEnemy) {
          let closestAst: Asteroid | null = null;
          let minDistance = Infinity;
          asteroidsRef.current.forEach((ast) => {
            if (ast.z > 45 && ast.z < 950) {
              const dx = ast.x - proj.x;
              const dy = ast.y - proj.y;
              const dz = ast.z - proj.z;
              const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
              if (dist < minDistance) {
                minDistance = dist;
                closestAst = ast;
              }
            }
          });

          if (closestAst) {
            const ast = closestAst as Asteroid;
            const dx = ast.x - proj.x;
            const dy = ast.y - proj.y;
            const dz = ast.z - proj.z;
            const magnitude = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;

            // Apply a strong kinetic gravity steering pull
            const steerPull = 1.95;
            proj.vx += (dx / magnitude) * steerPull;
            proj.vy += (dy / magnitude) * steerPull;
            proj.vz += (dz / magnitude) * steerPull;

            // Normalize and clamp velocity to high-speed rocket threshold
            const speed = 28;
            const velocityMagnitude = Math.sqrt(proj.vx*proj.vx + proj.vy*proj.vy + proj.vz*proj.vz) || 1;
            proj.vx = (proj.vx / velocityMagnitude) * speed;
            proj.vy = (proj.vy / velocityMagnitude) * speed;
            proj.vz = (proj.vz / velocityMagnitude) * speed;
          }
        }

        // Physical kinetic travel (Z decreases from cannon plane, increasing path to space)
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.z += proj.vz;

        // Apply yaw & pitch steering drift (3D parallax translation)
        proj.x += yaw * 0.45;
        proj.y += pitch * 0.45;

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
        
        // Binary search to find starting index since asteroids are sorted by Z
        let startIdx = 0;
        let left = 0; let right = asteroidsRef.current.length - 1;
        while(left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (asteroidsRef.current[mid].z < proj.z - proj.size * 2 - 150) left = mid + 1;
          else right = mid - 1;
        }
        startIdx = Math.max(0, right);

        for (let i = startIdx; i < asteroidsRef.current.length; i++) {
          const ast = asteroidsRef.current[i];
          if(ast.health <= 0) continue;
          
          const dz = Math.abs(proj.z - ast.z);
          // early exit leveraging sorted Z!
          if (ast.z > proj.z + ast.radius + proj.size * 2) break; // passed the window
          
          if (dz > ast.radius + proj.size * 2) continue;

          // Calculate three-dimensional offset distance
          const dx = proj.x - ast.x;
          const dy = proj.y - ast.y;
          const distSq = dx*dx + dy*dy + dz*dz;

          // If standard or torpedo size overlaps the bounding sphere radius
          const hitRadius = ast.radius + proj.size * 2;
          if (distSq <= hitRadius * hitRadius) {
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
              spawnExplosion(ast.x, ast.y, ast.z, "#ff5e00", 35, true);
              setScreenShake(s => Math.min(25, s + 18));

              // Splash damage to nearby asteroids residing in 3D sphere!
              const splashRadiusSq = Math.pow(250, 2);
              asteroidsRef.current.forEach((other) => {
                if (other.health <= 0 || other.id === ast.id) return;
                const distToOtherSq = Math.pow(ast.x - other.x, 2) + Math.pow(ast.y - other.y, 2) + Math.pow(ast.z - other.z, 2);
                if (distToOtherSq < splashRadiusSq) {
                  const distToOther = Math.sqrt(distToOtherSq);
                  const proportionalDmg = Math.floor(proj.damage * (1 - distToOther / 250));
                  other.health -= proportionalDmg;
                  other.hitFlashTime = 6;
                }
              });
            } else {
              // Small spark splash
              spawnExplosion(proj.x, proj.y, Math.min(proj.z, ast.z), proj.color, 8, false);
            }

            // Mark for deletion if health zero
            if (ast.health <= 0) {
              const scoreBonusMultiplier = ast.radius > 45 ? 2.5 : 1.0;
              comboCountRef.current += 1;
              comboTimerRef.current = 150; 
              
              const calculatedScore = Math.floor(100 * scoreBonusMultiplier * currLvl * currentLevelRef.current * Math.min(10, comboCountRef.current));
              setScore(prev => prev + calculatedScore);
              
              floatingTextsRef.current.push({
                id: Math.random().toString(),
                x: ast.x + (Math.random() - 0.5) * 50,
                y: ast.y + (Math.random() - 0.5) * 50,
                z: ast.z,
                text: `+${calculatedScore}`,
                color: ast.type === AsteroidType.GOLDEN ? "#F59E0B" : "#38BDF8",
                size: ast.radius > 45 ? 24 : 16,
                life: 0,
                maxLife: 60
              });

              if (comboCountRef.current > 1) {
                floatingTextsRef.current.push({
                  id: Math.random().toString(),
                  x: ast.x + 30 + (Math.random() - 0.5) * 20,
                  y: ast.y - 30 + (Math.random() - 0.5) * 20,
                  z: ast.z,
                  text: `${comboCountRef.current}x COMBO!`,
                  color: "#F472B6", 
                  size: Math.min(28, 14 + comboCountRef.current * 2), 
                  life: 0,
                  maxLife: 45
                });
              }

              setAsteroidsBlasted(prev => prev + 1);
              levelAsteroidsDestroyedRef.current += 1;
              
              setSystems((prevSectors) => {
                const updated = prevSectors.map((s) => {
                  if (s.id === currentActiveSectorIdRef.current) {
                    return { ...s, captureProgress: Math.min(100, s.captureProgress + 100 / s.requiredKills) };
                  }
                  return s;
                });
                if (updated.find(s => s.id === currentActiveSectorIdRef.current)?.captureProgress >= 100) {
                  currentPhaseRef.current = "WARPING";
                  setPhase("WARPING");
                }
                return updated;
              });

              if (ast.type === AsteroidType.NOVA) {
                playSound.explosion(true);
                spawnExplosion(ast.x, ast.y, ast.z, "#ef4444", 120, true);
                setScreenShake(s => Math.min(45, s + 30));
                
                asteroidsRef.current.forEach(other => {
                  if (other.id !== ast.id) {
                    other.health -= 250; 
                    other.hitFlashTime = 12; 
                  }
                });
              } else if (ast.type === AsteroidType.TIME_WARP) {
                playSound.overdriveReady(); 
                spawnExplosion(ast.x, ast.y, ast.z, "#8b5cf6", 60, true);
                asteroidsRef.current.forEach(other => {
                  if (other.id !== ast.id) {
                    other.speed *= 0.15; 
                    other.rotationSpeed *= 0.15;
                    if (other.rotSpeedX) other.rotSpeedX *= 0.15;
                    if (other.rotSpeedY) other.rotSpeedY *= 0.15;
                    if (other.rotSpeedZ) other.rotSpeedZ *= 0.15;
                  }
                });
              } else {
                spawnExplosion(ast.x, ast.y, ast.z, "#a1a1aa", ast.radius > 45 ? 60 : 35, true);
                setScreenShake(s => Math.min(30, s + (ast.radius > 45 ? 15 : 8)));
              }

              handleAsteroidDrop(ast);
            }
            break; 
          }
        }

        if (!hasHit) {
          activeProjectiles.push(proj);
        }
      });
      projectilesRef.current = activeProjectiles;

      
      // Asteroid & Debris Arrays Sorted by Z for O(N log N) SWEEP AND PRUNE Spatial Partitioning
      // 6. Move Asteroids and Projectiles
      const newActiveAsteroids = [];
      const newPickups = [];

      // Update Projectiles physically
      projectilesRef.current.forEach(proj => {
        proj.z -= proj.vz || 60; // fly forward
        proj.x += proj.vx || 0;
        proj.y += proj.vy || 0;
      });

      const shipForwardSpeed = 35.0; // Fast base speed

      // Update Asteroids physically
      asteroidsRef.current.forEach(ast => {
        ast.z -= (ast.speed + shipForwardSpeed) * warpFactorRef.current;
        
        ast.x += yaw * 0.65;
        ast.y += pitch * 0.65;
        
        if (ast.vx) ast.x += ast.vx;
        if (ast.vy) ast.y += ast.vy;

        // Player takes hit if asteroid breaks windshield
        if (ast.z <= 25) {
          playSound.shieldHit();
          shieldRippleRef.current = 1.0;
          const hitDamage = Math.floor(ast.radius * (ast.type === AsteroidType.RADIOACTIVE ? 0.75 : 0.45));
          setShield(prev => Math.max(0, prev - hitDamage));
          
          const crashColor = ast.type === AsteroidType.RADIOACTIVE ? '#10B981' : ast.type === AsteroidType.ICE ? '#00EBFF' : '#FF4500';
          spawnExplosion(ast.x, ast.y, 25, crashColor, 32, true);
          setScreenShake(30);

          if (currentShieldRef.current - hitDamage <= 0) {
            setPhase('GAME_OVER');
            currentPhaseRef.current = 'GAME_OVER';
            return;
          }
          ast.health = 0; // destroyed
        }

        if (ast.health > 0) newActiveAsteroids.push(ast);
      });
      asteroidsRef.current = newActiveAsteroids;

      asteroidsRef.current.sort((a, b) => a.z - b.z);

      // Asteroid Collision System Update
      const asteroidCount = asteroidsRef.current.length;
      for (let i = 0; i < asteroidCount; i++) {
        const a = asteroidsRef.current[i];
        if(a.health <= 0) continue;
        for (let j = i + 1; j < asteroidCount; j++) {
          const b = asteroidsRef.current[j];
          if(b.health <= 0) continue;
          
          const dz = Math.abs(a.z - b.z);
          const rSum = a.radius + b.radius;
          
          if (dz > rSum) break; // MASSIVE PERFORMANCE LEAP: Since sorted by Z, if dz exceeds sum, all subsequent j will also exceed! 
          
          if(a.type === AsteroidType.DEBRIS && b.type === AsteroidType.DEBRIS) continue; // ignore tiny debris hitting tiny debris
          
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx*dx + dy*dy + dz*dz;
          
          if (distSq < rSum * rSum) {
            const dist = Math.sqrt(distSq);
            // Collision occurred!
            const volumeA = Math.pow(a.radius, 3);
            const volumeB = Math.pow(b.radius, 3);
            
            const isABodySignificantlyLarger = volumeA > volumeB * 3.0;
            const isBBodySignificantlyLarger = volumeB > volumeA * 3.0;
            const isAStriker = a.speed > b.speed;
            const isBStriker = b.speed > a.speed;

            if (isABodySignificantlyLarger && isAStriker) { // Big A strikes small B
              b.health = 0;
              spawnExplosion(b.x, b.y, b.z, "#a1a1aa", b.radius > 45 ? 60 : 35, b.radius > 20); 
            } else if (isBBodySignificantlyLarger && isBStriker) { // Big B strikes small A
              a.health = 0;
              spawnExplosion(a.x, a.y, a.z, "#a1a1aa", a.radius > 45 ? 60 : 35, a.radius > 20);
            } else {
              // Bouncing off each other
              const nx = dx / dist; const ny = dy / dist; const nz2 = (a.z - b.z) / dist;
              const tmpSpeed = a.speed;
              a.speed = b.speed;
              b.speed = tmpSpeed;
              const overlap = rSum - dist;
              a.x += nx * overlap * 0.5; a.y += ny * overlap * 0.5; a.z += nz2 * overlap * 0.5;
              b.x -= nx * overlap * 0.5; b.y -= ny * overlap * 0.5; b.z -= nz2 * overlap * 0.5;
              a.x += (Math.random() - 0.5) * 10;
              b.x += (Math.random() - 0.5) * 10;
              a.y += (Math.random() - 0.5) * 10;
              b.y += (Math.random() - 0.5) * 10;
            }
          }
        }
      }
      
      const newDebris = [];
        // Clear deleted asteroids properly
        asteroidsRef.current = asteroidsRef.current.filter(a => a.health > 0);

        // 8. Update logical positions of drifting 3D space particles (CPU-side physics is minimal)
      const activeParticles: ExplosionParticle[] = [];
      particlesRef.current.forEach((ptc) => {
        ptc.life += 1;
        ptc.x += ptc.vx;
        ptc.y += ptc.vy;
        ptc.z += ptc.vz - (shipForwardSpeed * warpFactorRef.current * 0.8);

        // Apply yaw & pitch steering drift (3D parallax rotation displacement)
        ptc.x += yaw * 0.45;
        ptc.y += pitch * 0.45;

        // Apply trail velocity during warping
        if (p === 'WARPING') {
          ptc.vz -= 0.85;
        }

        if (ptc.life < ptc.maxLife) {
          activeParticles.push(ptc);
        }
      });
      particlesRef.current = activeParticles;

      // Update logical positions for Floating Combat Text
      if (comboTimerRef.current > 0) {
        comboTimerRef.current--;
        if (comboTimerRef.current <= 0) {
          comboCountRef.current = 0;
        }
      }

      const activeFct: FloatingText[] = [];
      floatingTextsRef.current.forEach((fct) => {
        fct.life += 1;
        fct.y -= 1.25; // drift upward
        
        // Apply yaw/pitch logic so it stays pinned relative to 3D movement
        fct.x += yaw * 0.45;
        fct.y += pitch * 0.45;
        
        fct.z -= 1.0 + (shipForwardSpeed * warpFactorRef.current); // drift towards camera rapidly
        
        if (fct.life < fct.maxLife) {
          activeFct.push(fct);
        }
      });
      floatingTextsRef.current = activeFct;

      // 7.5. Update and Draw 3D Salvage Pickups
      const activePickups: Pickup3D[] = [];
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      pickupsRef.current.forEach((pk) => {
        // Drifts forward (z decreases towards screen plane)
        pk.z += pk.vz - (shipForwardSpeed * warpFactorRef.current); 

        // Apply yaw & pitch steering drift (3D parallax rotation displacement)
        pk.x += yaw * 0.45;
        pk.y += pitch * 0.45;

        // Apply pull force towards cursor if user hovers nearby
        const pkScreenX = screenCenterX + (pk.x / pk.z) * FOV;
        const pkScreenY = screenCenterY + (pk.y / pk.z) * FOV;
        const distToCursor = Math.sqrt(Math.pow(pkScreenX - mx, 2) + Math.pow(pkScreenY - my, 2));

        const visualProjRadius = (pk.size / pk.z) * FOV;
        const isHovered = distToCursor <= Math.max(30, visualProjRadius + 28);

        if (isHovered && p === 'PLAYING') {
          // Increment harvestProgress
          pk.harvestProgress += 0.033; // 30 frames to collect

          // Magnetize attraction pull! 
          // Pull 3D coordinates slowly towards the aiming cursor line rays
          const thetaX = (mx - screenCenterX) / FOV;
          const thetaY = (my - screenCenterY) / FOV;
          const target3D_X = thetaX * pk.z;
          const target3D_Y = thetaY * pk.z;

          pk.x += (target3D_X - pk.x) * 0.16;
          pk.y += (target3D_Y - pk.y) * 0.16;
          pk.vz = -6.0; // accelerates towards cockpit!
        } else {
          // Normal slow drift
          pk.vz = -2.0;
          // Slowly decay progress if neglected
          pk.harvestProgress = Math.max(0, pk.harvestProgress - 0.005);
        }

        // Check collection completed
        if (pk.harvestProgress >= 1.0) {
          playSound.upgrade(); // quick reward confirmation
          spawnExplosion(pk.x, pk.y, pk.z, pk.type === 'SHIELD' ? '#06B6D4' : pk.type === 'ENERGY' ? '#A855F7' : '#F5C31E', 15, false);

          if (pk.type === 'SHIELD') {
            setShield(prev => Math.min(perks.maxShield, prev + 25));
          } else if (pk.type === 'ENERGY') {
            setEnergy(prev => Math.min(perks.maxEnergy, prev + 35));
          } else if (pk.type === 'SCRAP') {
            setScore(prev => prev + 1500);
          }
          return; // collected!
        }

        // Check crash/bypass bounds
        if (pk.z <= 20) {
          // Bypassed cockpit, expires silently
          return;
        }

        const boundarySafetyBuffer = visualProjRadius * 3;
        if (
          pkScreenX >= -boundarySafetyBuffer &&
          pkScreenX <= dimensions.width + boundarySafetyBuffer &&
          pkScreenY >= -boundarySafetyBuffer &&
          pkScreenY <= dimensions.height + boundarySafetyBuffer
        ) {
          activePickups.push(pk);

          // Draw the pickup capsules on canvas viewport
          ctx.save();
          ctx.translate(pkScreenX, pkScreenY);

          const size = Math.max(7, visualProjRadius);

          // Draw neon outer bracket matching style
          let capStyle = '#F5C31E'; // yellow scrap
          let ringStyle = 'rgba(245, 195, 30, 0.4)';
          let iconText = 'SCRAP';
          if (pk.type === 'SHIELD') {
            capStyle = '#06B6D4'; // cyan shield
            ringStyle = 'rgba(6, 182, 212, 0.4)';
            iconText = 'SHLD';
          } else if (pk.type === 'ENERGY') {
            capStyle = '#A855F7'; // purple energy core
            ringStyle = 'rgba(168, 85, 247, 0.4)';
            iconText = 'ENRG';
          }

          // Outer glowing radar circle
          ctx.strokeStyle = ringStyle;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, size * (1.5 + Math.sin(Date.now() * 0.01) * 0.3), 0, Math.PI * 2);
          ctx.stroke();

          // Capsule box
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.strokeStyle = capStyle;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, Math.PI*2);
          ctx.fill();
          ctx.stroke();

          // Draw icon indicator or tracking locks
          ctx.fillStyle = capStyle;
          ctx.font = '700 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(iconText, 0, 0);

          // Draw harvesting tractor beam / lock scanner
          if (pk.harvestProgress > 0) {
            // green indicator outline circle progress
            ctx.strokeStyle = '#22C55E';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, size + 5, -Math.PI / 2, (-Math.PI / 2) + Math.PI * 2 * pk.harvestProgress);
            ctx.stroke();

            // Progress text overlay
            ctx.fillStyle = '#22C55E';
            ctx.font = '700 9px monospace';
            ctx.fillText(`${Math.floor(pk.harvestProgress * 100)}%`, 0, size + 14);

            // Draw tractor locking beam line connecting cockpit crosshair to capsule!
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.38)';
            ctx.lineWidth = 1.8 + Math.random()*2;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(pkScreenX, pkScreenY);
            ctx.stroke();
          }

          ctx.restore();
        }
      });
      pickupsRef.current = activePickups;

      // Draw Floating Combat Text
      floatingTextsRef.current.forEach(fct => {
        if (fct.z < 2) return;
        const screenX = screenCenterX + (fct.x / fct.z) * FOV;
        const screenY = screenCenterY + (fct.y / fct.z) * FOV;
        const scale = FOV / fct.z;
        const visualSize = Math.max(6, fct.size * scale);
        
        ctx.save();
        const alpha = Math.max(0, 1.0 - (fct.life / fct.maxLife));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fct.color;
        ctx.font = `900 ${visualSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Crisp high-tech text shadow
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1.5;
        ctx.shadowOffsetY = 1.5;
        
        ctx.fillText(fct.text, screenX, screenY);
        ctx.restore();
      });

      // 8.5 Draw Cosmic Shockwaves
      const activeShockwaves: Shockwave[] = [];
      shockwavesRef.current.forEach(sw => {
        if (sw.z < 20) return; // behind camera
        const screenX = screenCenterX + (sw.x / sw.z) * FOV;
        const screenY = screenCenterY + (sw.y / sw.z) * FOV;
        const scale = FOV / sw.z;
        const visualRadius = sw.radius * scale;

        ctx.save();
        const alpha = Math.max(0, 1.0 - (Math.pow(sw.radius / sw.maxRadius, 1.5))); // eased alpha
        ctx.globalAlpha = alpha;
        
        // Massive glow
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 30 * alpha;
        
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 12 * alpha * scale;
        ctx.beginPath();
        ctx.arc(screenX, screenY, visualRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = sw.color;
        ctx.globalAlpha = alpha * 0.45;
        ctx.beginPath();
        ctx.arc(screenX, screenY, visualRadius * 0.95, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // High velocity expansion
        sw.radius += sw.maxRadius * 0.05 + 8;
        sw.z -= 0.5; // slight drift
        
        if (sw.radius < sw.maxRadius) {
          activeShockwaves.push(sw);
        }
      });
      shockwavesRef.current = activeShockwaves;

      // 8.6 Draw Special Asteroid HUD Frames
      asteroidsRef.current.forEach((ast) => {
        if (ast.z < 60 || ast.type === AsteroidType.NORMAL || ast.type === AsteroidType.DEBRIS || ast.type === AsteroidType.ENEMY_SHIP || ast.type === AsteroidType.DRONE) return;
        
        const astScreenX = screenCenterX + (ast.x / ast.z) * FOV;
        const astScreenY = screenCenterY + (ast.y / ast.z) * FOV;
        const astProjRadius = (ast.radius / ast.z) * FOV;
        
        let powerColor = '#ffffff';
        let label = 'ANOMALY';
        if (ast.type === AsteroidType.RADIOACTIVE) { powerColor = '#10B981'; label = 'ISOTOPE'; }
        if (ast.type === AsteroidType.GOLDEN) { powerColor = '#F59E0B'; label = 'MINERAL'; }
        if (ast.type === AsteroidType.ICE) { powerColor = '#00EBFF'; label = 'CRYSTAL'; }
        if (ast.type === AsteroidType.NOVA) { powerColor = '#ef4444'; label = 'VOLATILE'; }
        if (ast.type === AsteroidType.TIME_WARP) { powerColor = '#8b5cf6'; label = 'TEMPORAL'; }

        ctx.save();
        ctx.strokeStyle = powerColor;
        ctx.fillStyle = powerColor;
        ctx.lineWidth = 1.0;
        ctx.globalAlpha = Math.max(0.2, 1.0 - (ast.z / 6000));

        // HUD style frame (bracket outside the asteroid radius)
        const frameSize = Math.max(12, astProjRadius * 1.5);
        ctx.beginPath();
        // Top Left corner bracket
        ctx.moveTo(astScreenX - frameSize, astScreenY - frameSize + 6);
        ctx.lineTo(astScreenX - frameSize, astScreenY - frameSize);
        ctx.lineTo(astScreenX - frameSize + 6, astScreenY - frameSize);

        // Top Right bracket
        ctx.moveTo(astScreenX + frameSize, astScreenY - frameSize + 6);
        ctx.lineTo(astScreenX + frameSize, astScreenY - frameSize);
        ctx.lineTo(astScreenX + frameSize - 6, astScreenY - frameSize);

        // Bottom Left bracket
        ctx.moveTo(astScreenX - frameSize, astScreenY + frameSize - 6);
        ctx.lineTo(astScreenX - frameSize, astScreenY + frameSize);
        ctx.lineTo(astScreenX - frameSize + 6, astScreenY + frameSize);

        // Bottom Right bracket
        ctx.moveTo(astScreenX + frameSize, astScreenY + frameSize - 6);
        ctx.lineTo(astScreenX + frameSize, astScreenY + frameSize);
        ctx.lineTo(astScreenX + frameSize - 6, astScreenY + frameSize);
        ctx.stroke();

        // Line pointing to it
        ctx.beginPath();
        ctx.moveTo(astScreenX + frameSize, astScreenY);
        ctx.lineTo(astScreenX + frameSize + 15, astScreenY - 15);
        ctx.lineTo(astScreenX + frameSize + 40, astScreenY - 15);
        ctx.stroke();

        // small circle color of special power
        ctx.beginPath();
        ctx.arc(astScreenX + frameSize + 46, astScreenY - 15, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '600 8px monospace';
        ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
        ctx.fillText(label, astScreenX + frameSize + 15, astScreenY - 20);
        ctx.restore();
      });

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

      // 9.5 Draw Touch Overlays if touch is engaged
      if (isTouchDevice && p === 'PLAYING') {
        const screenCenterX = dimensions.width / 2;
        const screenCenterY = dimensions.height / 2;

        // Draw the visual Neural Tactical Tether if in TETHER mode and shooting is active
        if (touchControlMode === 'TETHER' && isShootingRef.current) {
          ctx.save();
          
          // Outer gold energy circle radiating from touch focus
          const tRadius = 15 + Math.sin(Date.now() * 0.015) * 5;
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(mouseRef.current.x, mouseRef.current.y, tRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Outer secondary tracker brackets
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(mouseRef.current.x, mouseRef.current.y, tRadius + 8, 0, Math.PI * 2);
          ctx.stroke();

          // Draw neon tether laser connects center cockpit pointer to active finger
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
          ctx.lineWidth = 2 + Math.random() * 1.5;
          ctx.beginPath();
          ctx.moveTo(screenCenterX, screenCenterY + 120); // origin represents the ship's frontal blaster deck
          ctx.quadraticCurveTo(screenCenterX + (mouseRef.current.x - screenCenterX) * 0.4, screenCenterY + 100, mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();

          ctx.restore();
        }

        // Draw the virtual analog stick if in JOYSTICK mode
        if (touchControlMode === 'JOYSTICK') {
          ctx.save();
          let cx = dimensions.width * 0.15;
          let cy = dimensions.height * 0.70;
          let isInteracting = false;

          if (touchLeftStartRef.current && touchLeftCurrentRef.current) {
            cx = touchLeftStartRef.current.x;
            cy = touchLeftStartRef.current.y;
            isInteracting = true;
          }

          // Outer ring base
          ctx.strokeStyle = isInteracting ? 'rgba(212, 175, 55, 0.75)' : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = 'rgba(10, 10, 14, 0.6)';
          ctx.beginPath();
          ctx.arc(cx, cy, 60, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Cardinal guide whiskers (styled vector line markers)
          ctx.strokeStyle = isInteracting ? 'rgba(212, 175, 55, 0.35)' : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - 70, cy); ctx.lineTo(cx - 50, cy);
          ctx.moveTo(cx + 50, cy); ctx.lineTo(cx + 70, cy);
          ctx.moveTo(cx, cy - 70); ctx.lineTo(cx, cy - 50);
          ctx.moveTo(cx, cy + 50); ctx.lineTo(cx, cy + 70);
          ctx.stroke();

          // Inner bounds boundary ring
          ctx.strokeStyle = isInteracting ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, 40, 0, Math.PI * 2);
          ctx.stroke();

          // Draw active joystick thumb knob
          let kx = cx;
          let ky = cy;
          if (touchLeftStartRef.current && touchLeftCurrentRef.current) {
            const dx = touchLeftCurrentRef.current.x - touchLeftStartRef.current.x;
            const dy = touchLeftCurrentRef.current.y - touchLeftStartRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const clampR = 60;
            kx = touchLeftStartRef.current.x + (distance > clampR ? (dx / distance) * clampR : dx);
            ky = touchLeftStartRef.current.y + (distance > clampR ? (dy / distance) * clampR : dy);
          }

          // Knob glass backfill
          ctx.fillStyle = isInteracting ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.05)';
          ctx.strokeStyle = isInteracting ? '#D4AF37' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(kx, ky, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Knob center core dot
          ctx.fillStyle = isInteracting ? '#D4AF37' : 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(kx, ky, 6, 0, Math.PI * 2);
          ctx.fill();

          // Label indicator (YAW/PITCH)
          ctx.fillStyle = isInteracting ? '#D4AF37' : 'rgba(255, 255, 255, 0.25)';
          ctx.font = '700 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('STEERING GIMBAL', cx, cy - 78);

          ctx.restore();
        }
      }

      // 9.6 Draw Sci-fi Cockpit Struts & Viewport Grid Frame Overlay
      if (p === 'PLAYING') {
        ctx.save();
        
        const w = dimensions.width;
        const h = dimensions.height;
        const screenCenterX = w / 2;
        const screenCenterY = h / 2;
        
        // Let's draw some faint HUD framing grids in the corners of the viewport
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.16)';
        ctx.lineWidth = 1;
        
        // Corner brackets around the entire screen
        const bOffset = 20;
        const bLen = 40;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(bOffset, bOffset + bLen);
        ctx.lineTo(bOffset, bOffset);
        ctx.lineTo(bOffset + bLen, bOffset);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(w - bOffset, bOffset + bLen);
        ctx.lineTo(w - bOffset, bOffset);
        ctx.lineTo(w - bOffset - bLen, bOffset);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(bOffset, h - bOffset - bLen);
        ctx.lineTo(bOffset, h - bOffset);
        ctx.lineTo(bOffset + bLen, h - bOffset);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(w - bOffset, h - bOffset - bLen);
        ctx.lineTo(w - bOffset, h - bOffset);
        ctx.lineTo(w - bOffset - bLen, h - bOffset);
        ctx.stroke();

        // Let's draw stylish diagonal structural struts on the outer margins representing a multi-segmented viewport frame!
        ctx.strokeStyle = '#18181F';
        ctx.fillStyle = '#08080E';
        ctx.lineWidth = 2.5;

        // Top horizontal bezel strip
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, 14);
        ctx.lineTo(w - 60, 14);
        ctx.lineTo(w - 90, 8);
        ctx.lineTo(90, 8);
        ctx.lineTo(60, 14);
        ctx.lineTo(0, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bottom horizontal bezel strip
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(w, h);
        ctx.lineTo(w, h - 14);
        ctx.lineTo(w - 60, h - 14);
        ctx.lineTo(w - 90, h - 8);
        ctx.lineTo(90, h - 8);
        ctx.lineTo(60, h - 14);
        ctx.lineTo(0, h - 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Diagonal wing panels on the far left and right edges (to hold HUD panels)
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(24, 130);
        ctx.lineTo(24, h - 130);
        ctx.lineTo(0, h - 100);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w, 100);
        ctx.lineTo(w - 24, 130);
        ctx.lineTo(w - 24, h - 130);
        ctx.lineTo(w, h - 100);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Subtle horizontal digital alignment bars in center
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
        ctx.lineWidth = 0.8;
        
        ctx.beginPath();
        ctx.moveTo(screenCenterX - 180, screenCenterY);
        ctx.lineTo(screenCenterX - 80, screenCenterY);
        ctx.moveTo(screenCenterX + 80, screenCenterY);
        ctx.lineTo(screenCenterX + 180, screenCenterY);
        ctx.stroke();

        // Subtle pitch ladder ticks (for high tech piloting telemetry vibe)
        for (let dy = -120; dy <= 120; dy += 40) {
          if (dy === 0) continue;
          const alpha = 0.08 - Math.abs(dy) * 0.0003;
          ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(screenCenterX - 25, screenCenterY + dy);
          ctx.lineTo(screenCenterX + 25, screenCenterY + dy);
          ctx.stroke();
          
          ctx.font = '500 7.5px monospace';
          ctx.fillStyle = `rgba(212, 175, 55, ${alpha * 1.5})`;
          ctx.textAlign = 'right';
          ctx.fillText((dy > 0 ? '+' : '') + Math.floor(-dy / 4).toString(), screenCenterX - 30, screenCenterY + dy + 2.5);
          ctx.textAlign = 'left';
          ctx.fillText((dy > 0 ? '+' : '') + Math.floor(-dy / 4).toString(), screenCenterX + 30, screenCenterY + dy + 2.5);
        }

        ctx.restore();
      }

      // 9.7 Aegis Deflector Tactical Shield Ripple Visual Layer
      if (shieldRippleRef.current > 0 && p === 'PLAYING') {
        ctx.save();
        const rippleAlpha = shieldRippleRef.current;
        const screenCenterX = dimensions.width / 2;
        const screenCenterY = dimensions.height / 2;
        
        // Full screen red damage flash gradient vignette
        const dmgGrad = ctx.createRadialGradient(screenCenterX, screenCenterY, dimensions.height * 0.25, screenCenterX, screenCenterY, dimensions.width * 0.7);
        dmgGrad.addColorStop(0, `rgba(239, 68, 68, 0)`);
        dmgGrad.addColorStop(0.8, `rgba(239, 68, 68, ${rippleAlpha * 0.15})`);
        dmgGrad.addColorStop(1, `rgba(239, 68, 68, ${rippleAlpha * 0.6})`);
        ctx.fillStyle = dmgGrad;
        ctx.fillRect(-100, -100, dimensions.width + 200, dimensions.height + 200);

        ctx.strokeStyle = `rgba(30, 144, 255, ${rippleAlpha * 0.75})`; // Deep Sky Blue deflector glow
        ctx.shadowColor = 'rgba(0, 191, 255, 0.5)';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 14 * rippleAlpha;
        
        ctx.beginPath();
        // Radiates outwards
        const radius = (1 - rippleAlpha) * (dimensions.width * 0.55);
        ctx.arc(screenCenterX, screenCenterY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary inner warning halo
        ctx.strokeStyle = `rgba(239, 68, 68, ${rippleAlpha * 0.55})`; // crimson warn secondary ripple
        ctx.lineWidth = 4 * rippleAlpha;
        ctx.beginPath();
        ctx.arc(screenCenterX, screenCenterY, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        // WARNING flashing diagnostic labels
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(239, 68, 68, ${rippleAlpha * 0.95})`;
        ctx.font = '700 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ WARNING: AEGIS DEFLECTOR SHIELD DISRUPTION REGISTERED ⚡', screenCenterX, screenCenterY - 110);
        ctx.restore();

        // Decay ripple timer smoothly
        shieldRippleRef.current -= 0.022;
      }

      // 9.8 Ambient Overdrive Speed Warp Trails
      if (currentOverdriveActiveRef.current && p === 'PLAYING') {
        ctx.save();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)'; // beautiful violet warp speed threads
        ctx.lineWidth = 1.5;
        const screenCenterX = dimensions.width / 2;
        const screenCenterY = dimensions.height / 2;
        
        for (let i = 0; i < 6; i++) {
          const angle = (Date.now() / 400 + i * Math.PI / 3) % (Math.PI * 2);
          const distStart = 60 + ((Date.now() / 1.5 + i * 160) % 350);
          const distEnd = distStart + 120;
          
          const sx = screenCenterX + Math.cos(angle) * distStart;
          const sy = screenCenterY + Math.sin(angle) * distStart;
          const ex = screenCenterX + Math.cos(angle) * distEnd;
          const ey = screenCenterY + Math.sin(angle) * distEnd;
          
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore(); // reset screen vibration offset

      // 10. Automatically slowly regenerate Energy reserves
      if (p === 'PLAYING') {
        const rechargeRate = 0.42 * perks.energyRegenRate; // energy recharge per frame
        setEnergy((prev) => Math.min(perks.maxEnergy, prev + rechargeRate));
      }

      // --- THREEJS ENTITIES SYNCHRONIZATION AND RENDERING ---
      if (threeSceneRef.current && threeCameraRef.current && threeRendererRef.current) {
        const scene = threeSceneRef.current;
        const camera = threeCameraRef.current;

        // 1. Majestic Logo7 centerpiece removed per user request

        // Show & update dashboard console hologram indicator
        if (hUDLogoGroupRef.current) {
          hUDLogoGroupRef.current.visible = (p !== 'INTRO');
          
          if (hUDLogoGroupRef.current.visible) {
            hUDLogoGroupRef.current.rotation.y += 0.015;

            // Animate shield sphere glow color & opacity matching cockpit health
            if (hUDShieldBubbleRef.current) {
              const shRatio = currentShieldRef.current / 100;
              const bubbleMat = hUDShieldBubbleRef.current.material as THREE.MeshBasicMaterial;
              bubbleMat.opacity = 0.06 + (1 - shRatio) * 0.16 + (currentOverdriveActiveRef.current ? 0.28 : 0);
              
              if (currentOverdriveActiveRef.current) {
                bubbleMat.color.setHex(0xd946ef); // vibrant overdrive violet-magenta
                hUDLogoGroupRef.current.rotation.y += 0.035; // speed spin!
              } else if (shRatio < 0.4) {
                // flashing warning red
                const flash = Math.sin(Date.now() * 0.009) > 0 ? 0xef4444 : 0x7f1d1d;
                bubbleMat.color.setHex(flash);
              } else {
                bubbleMat.color.setHex(0x06b6d4); // healthy deflector blue
              }
            }
          }
        }

        // 2. Stars Lines Trail Warp effect in WebGL
        if (threeStarsRef.current) {
          const positions = threeStarsRef.current.geometry.attributes.position.array as Float32Array;
          let idxs = 0;
          const starsVel = currentOverdriveActiveRef.current ? 15.0 : warpFactorRef.current;
          
          starsRef.current.forEach((star) => {
            const sx = star.x;
            const sy = -star.y;
            const sz = -star.z - 2000;

            // stretches forward based on speed factor - highly dynamic cinematic streaks
            const length = currentOverdriveActiveRef.current ? 50.0 * starsVel : 8.0 * starsVel;
            const ez = sz + length;

            positions[idxs++] = sx;
            positions[idxs++] = sy;
            positions[idxs++] = sz;
            positions[idxs++] = sx;
            positions[idxs++] = sy;
            positions[idxs++] = ez;
          });
          threeStarsRef.current.geometry.attributes.position.needsUpdate = true;

          const starMat = threeStarsRef.current.material as THREE.LineBasicMaterial;
          if (currentOverdriveActiveRef.current) {
            starMat.color.setHex(0xd8b4fe); // neon purple for high speed overdrive
            starMat.opacity = 0.95;
          } else {
            starMat.color.setHex(0xffffff); // pure standard stars
            starMat.opacity = 0.7;
          }
        }

        // 3. Synchronize Asteroids using high performance Object Pooling and Material Caching
        const currentAsteroidIds = new Set(asteroidsRef.current.map(a => a.id));
        
        // Return dead asteroid meshes back to their specific subspecies pools and hide them
        threeAsteroidsMapRef.current.forEach((mesh, id) => {
          if (!currentAsteroidIds.has(id)) {
            scene.remove(mesh);
            mesh.visible = false;
            
            // Extract subspecies to return it to the correct pool
            const astType = (mesh as any).asteroidType as AsteroidType || AsteroidType.NORMAL;
            const pool = asteroidMeshPoolRef.current.get(astType);
            if (pool) {
              pool.push(mesh);
            }
            threeAsteroidsMapRef.current.delete(id);
          }
        });

        // Add/Update active asteroid meshes from pool
        asteroidsRef.current.forEach((ast) => {
          let mesh = threeAsteroidsMapRef.current.get(ast.id);
          if (!mesh) {
            // Attempt to retrieve an inactive mesh from the pool
            const pool = asteroidMeshPoolRef.current.get(ast.type);
            if (pool && pool.length > 0) {
              mesh = pool.pop()!;
              mesh.visible = true;
            } else {
              // Construct a new mesh only when the pool is completely exhausted
              if (ast.type === AsteroidType.ENEMY_SHIP && cachedEnemyShipModelRef.current) {
                mesh = cachedEnemyShipModelRef.current.clone();
              } else if (cachedAsteroidModelRef.current) {
                mesh = cachedAsteroidModelRef.current.clone();
                // Deform geometry before applying material to avoid scale stretching
                mesh.traverse((child) => {
                  if (child instanceof THREE.Mesh && child.geometry) {
                    child.geometry = child.geometry.clone();
                    const pos = child.geometry.attributes.position;
                    if (pos) {
                      const v = new THREE.Vector3();
                      for (let i = 0; i < pos.count; i++) {
                        v.fromBufferAttribute(pos, i);
                        const n = 1.0 + (Math.sin(v.x * 3.0 + ast.craterSeeds[0]*10) * Math.cos(v.y * 3.0 + ast.craterSeeds[1]*10) * Math.sin(v.z * 3.0 + ast.craterSeeds[2]*10)) * 0.3;
                        v.x *= (ast.shapeScaleX ?? 1.0) * n;
                        v.y *= (ast.shapeScaleY ?? 1.0) * n;
                        v.z *= (ast.shapeScaleZ ?? 1.0) * n;
                        pos.setXYZ(i, v.x, v.y, v.z);
                      }
                      child.geometry.computeVertexNormals();
                      const uv = child.geometry.attributes.uv;
                      if (uv) {
                        for (let i = 0; i < pos.count; i++) {
                           v.fromBufferAttribute(pos, i).normalize();
                           const u = 0.5 + Math.atan2(v.z, v.x) / (2 * Math.PI);
                           const vCoord = 0.5 - Math.asin(Math.max(-1, Math.min(1, v.y))) / Math.PI;
                           uv.setXY(i, u, vCoord);
                        }
                        uv.needsUpdate = true;
                      }
                      pos.needsUpdate = true;
                    }
                  }
                });
              } else {
                mesh = new THREE.Mesh(
                  new THREE.DodecahedronGeometry(1.0, 1),
                  rockyMaterialRef.current || new THREE.MeshStandardMaterial({ color: 0x5a504a, roughness: 0.9 })
                );
              }
              mesh.name = `ast-${ast.id}`;
              (mesh as any).asteroidType = ast.type; // Save type annotation for pool routing
              
              mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  let customizedMat: THREE.Material | null = null;
                  if (ast.type === AsteroidType.ENEMY_SHIP) {
                    customizedMat = null;
                  } else if (ast.type === AsteroidType.DRONE) {
                    customizedMat = droneMaterialRef.current!;
                  } else {
                    customizedMat = rockyMaterialRef.current!;
                  }
                  if (customizedMat) {
                    child.material = customizedMat;
                  }
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
            }
            
            mesh.name = `Asteroid_${ast.type}_${ast.id}`;
            scene.add(mesh);
            threeAsteroidsMapRef.current.set(ast.id, mesh);
          }

          // Move mesh
          mesh.position.set(ast.x, -ast.y, -ast.z - 2000);

          // Update non-uniform scale dimensions based on logical size and pre-calculated shape stretching
          // Fisheye scale effect when getting closer
          const fisheyeMultiplier = 1.0 + Math.max(0, (200 - ast.z) / 200) * 1.8;
          const scaleX = ast.radius * (ast.shapeScaleX ?? 1.0) * fisheyeMultiplier;
          const scaleY = ast.radius * (ast.shapeScaleY ?? 1.0) * fisheyeMultiplier;
          const scaleZ = ast.radius * (ast.shapeScaleZ ?? 1.0) * fisheyeMultiplier;
          if (ast.type === AsteroidType.ENEMY_SHIP) {
            mesh.scale.set(scaleX, scaleY, scaleZ);
          } else {
            // we already baked shapeScale into geometry for non-enemy rocks!
            mesh.scale.set(ast.radius * fisheyeMultiplier, ast.radius * fisheyeMultiplier, ast.radius * fisheyeMultiplier);
          }

          // Tumbling on three axes dynamically over time
          const rotSpeedX = ast.rotSpeedX ?? 0.01;
          const rotSpeedY = ast.rotSpeedY ?? 0.02;
          const rotSpeedZ = ast.rotSpeedZ ?? 0.015;
          const ageTicks = (Date.now() * 0.04);

          if (ast.type === AsteroidType.ENEMY_SHIP) {
            mesh.rotation.set(0, Math.PI, 0); // Face camera
          } else {
            mesh.rotation.set(
              ast.rotationAngle + ageTicks * rotSpeedX,
              ast.rotationAngle * 1.5 + ageTicks * rotSpeedY,
              ast.rotationAngle * 0.5 + ageTicks * rotSpeedZ
            );
          }

          // Shared material specific hit flash flare feedback glow effect
          if (ast.hitFlashTime > 0) {
            mesh.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
                const mat = child.material as any;
                mat.emissive.setHex(0xffffff);
                mat.emissiveIntensity = 1.0;
              }
            });
          } else {
            // Restore regular material emission intensities
            mesh.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material && 'emissive' in child.material) {
                const mat = child.material as any;
                if (ast.type === AsteroidType.RADIOACTIVE) {
                  mat.emissive.setHex(0x15803d);
                  mat.emissiveIntensity = 0.75;
                } else if (ast.type === AsteroidType.GOLDEN) {
                  mat.emissive.setHex(0xb45309);
                  mat.emissiveIntensity = 0.3;
                } else if (ast.type === AsteroidType.ICE) {
                  mat.emissive.setHex(0x93c5fd);
                  mat.emissiveIntensity = 0.45;
                } else if (ast.type === AsteroidType.DRONE) {
                  mat.emissive.setHex(0xef4444);
                  mat.emissiveIntensity = 0.65;
                } else if (ast.type === AsteroidType.NOVA) {
                  mat.emissive.setHex(0xf97316);
                  mat.emissiveIntensity = 1.5;
                } else if (ast.type === AsteroidType.TIME_WARP) {
                  mat.emissive.setHex(0x8b5cf6);
                  mat.emissiveIntensity = 1.5;
                } else {
                  mat.emissive.setHex(0x000000);
                  mat.emissiveIntensity = 0.0;
                }
              }
            });
          }
        });

        // 4. Synchronize Projectiles
        const currentProjectileIds = new Set(projectilesRef.current.map(p => p.id));
        
        threeProjectilesMapRef.current.forEach((mesh, id) => {
          if (!currentProjectileIds.has(id)) {
            scene.remove(mesh);
            mesh.traverse(child => {
              if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
              }
            });
            threeProjectilesMapRef.current.delete(id);
          }
        });

        projectilesRef.current.forEach((proj) => {
          let mesh = threeProjectilesMapRef.current.get(proj.id);
          if (!mesh) {
            const length = proj.type === WeaponID.PROTON_TORPEDO ? 16 : 30;
            const radius = proj.type === WeaponID.PROTON_TORPEDO ? 3.5 : 0.85;
            
            const group = new THREE.Group();
            const geom = new THREE.CylinderGeometry(radius, radius, length, 8);
            geom.rotateX(Math.PI / 2);
            
            const projColor = new THREE.Color(proj.color);
            const mat = new THREE.MeshBasicMaterial({
              color: projColor,
              transparent: true,
              opacity: 0.95,
              blending: THREE.AdditiveBlending,
            });
            
            const cylinder = new THREE.Mesh(geom, mat);
            group.add(cylinder);

            // Travelling pointlight to illuminate asteriods dynamically!
            const travelLight = new THREE.PointLight(projColor, 3.5, 150);
            travelLight.name = `ProjectileLight_${proj.id}`;
            group.add(travelLight);

            mesh = group;
            mesh.name = `Projectile_${proj.type}_${proj.id}`;
            scene.add(mesh);
            threeProjectilesMapRef.current.set(proj.id, mesh);
          }

          mesh.position.set(proj.x, -proj.y, -proj.z - 2000);
        });

        // 5. Synchronize Pickups
        const currentPickupIds = new Set(pickupsRef.current.map(p => p.id));
        
        threePickupsMapRef.current.forEach((mesh, id) => {
          if (!currentPickupIds.has(id)) {
            scene.remove(mesh);
            mesh.traverse(child => {
              if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
              }
            });
            threePickupsMapRef.current.delete(id);
          }
        });

        pickupsRef.current.forEach((pk) => {
          let mesh = threePickupsMapRef.current.get(pk.id);
          if (!mesh) {
            const group = new THREE.Group();
            let geom: THREE.BufferGeometry;
            let themeColor: number;
            
            if (pk.type === 'SHIELD') {
              geom = new THREE.OctahedronGeometry(8, 0);
              themeColor = 0x3b82f6;
            } else if (pk.type === 'ENERGY') {
              geom = new THREE.DodecahedronGeometry(8, 0);
              themeColor = 0xeab308;
            } else {
              geom = new THREE.IcosahedronGeometry(7, 0);
              themeColor = 0xa855f7;
            }
            
            const mat = new THREE.MeshStandardMaterial({
              color: themeColor,
              emissive: themeColor,
              emissiveIntensity: 0.85,
              metalness: 0.85,
              roughness: 0.15,
            });
            
            const crystal = new THREE.Mesh(geom, mat);
            group.add(crystal);

            const ringGeo = new THREE.TorusGeometry(12, 0.4, 6, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.45 });
            const ringY = new THREE.Mesh(ringGeo, ringMat);
            ringY.name = `PickupRing_${pk.id}`;
            ringY.rotation.x = Math.PI / 2;
            group.add(ringY);

            mesh = group;
            mesh.name = `Pickup_${pk.type}_${pk.id}`;
            scene.add(mesh);
            threePickupsMapRef.current.set(pk.id, mesh);
          }

          mesh.position.set(pk.x, -pk.y, -pk.z - 2000);
          mesh.rotation.y += 0.025;
          mesh.rotation.x += 0.012;
        });

        // 6. Synchronize Debris Sparks Particles
        if (threeParticlesPoolRef.current) {
          const positions = threeParticlesPoolRef.current.geometry.attributes.position.array as Float32Array;
          const colors = threeParticlesPoolRef.current.geometry.attributes.color.array as Float32Array;
          const maxParticles = 2000;
          
          let idx3 = 0;
          particlesRef.current.forEach((p, i) => {
            if (i >= maxParticles) return;
            positions[idx3] = p.x;
            positions[idx3 + 1] = -p.y;
            positions[idx3 + 2] = -p.z - 2000;

            const lifeRatio = Math.max(0, 1.0 - p.life / p.maxLife);
            const threeColor = new THREE.Color(p.color);
            colors[idx3] = threeColor.r * lifeRatio;
            colors[idx3 + 1] = threeColor.g * lifeRatio;
            colors[idx3 + 2] = threeColor.b * lifeRatio;
            idx3 += 3;
          });

          for (let i = idx3; i < maxParticles * 3; i++) {
            positions[i] = 99999;
          }

          threeParticlesPoolRef.current.geometry.attributes.position.needsUpdate = true;
          threeParticlesPoolRef.current.geometry.attributes.color.needsUpdate = true;
        }

        // 7. Fire WebGL high performance buffer draw
        threeRendererRef.current.render(scene, camera);
      }

      localFrameId = requestAnimationFrame(gameTick);
    };

    localFrameId = requestAnimationFrame(gameTick);
    animationFrameIdRef.current = localFrameId;

    return () => {
      cancelAnimationFrame(localFrameId);
    };
  }, [dimensions, activeWeapon, isPaused, fireActiveWeapon, fireOverdriveSeekers, setEnergy, setShield, setPhase, setLevel, screenShake, setScreenShake, perks, touchControlMode, isTouchDevice, overdriveActive, setOverdriveActive, overdriveCharge, setOverdriveCharge]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-[#020205] flex items-center justify-center cursor-none"
    >
      {/* Real-time Hardware Accelerated WebGL 3D Space Scene */}
      <canvas
        ref={threeCanvasRef}
        id="starfighter_three_canvas"
        className="absolute inset-0 block w-full h-full pointer-events-none"
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Vector 2D HUD Overlays and Cockpit Struts Overlay */}
      <canvas
        ref={canvasRef}
        id="starfighter_canvas"
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative block z-10"
      />
    </div>
  );
}
