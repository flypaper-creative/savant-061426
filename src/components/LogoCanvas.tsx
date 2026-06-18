import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const generateProceduralTexture = (type: string): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  if (type === 'damascus') {
    const imgData = ctx.createImageData(512, 512);
    for(let i=0; i<512; i++) {
      for(let j=0; j<512; j++) {
        const v = Math.sin(i*0.03 + Math.sin(j*0.04)*4 + Math.sin(i*0.01)*2) * 0.5 + 0.5;
        const c = v * 255;
        const idx = (j*512+i)*4;
        imgData.data[idx] = imgData.data[idx+1] = imgData.data[idx+2] = c;
        imgData.data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  else if (type === 'leather') {
    const imgData = ctx.createImageData(512, 512);
    for(let i=0; i<512; i++) {
        for(let j=0; j<512; j++) {
        const c = Math.random() * 60 + 50;
        const idx = (j*512+i)*4;
        imgData.data[idx] = imgData.data[idx+1] = imgData.data[idx+2] = c;
        imgData.data[idx+3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    ctx.globalAlpha = 0.3;
    const grad = ctx.createRadialGradient(256,256,0,256,256,300);
    grad.addColorStop(0, '#000');
    grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,512,512);
    ctx.globalAlpha = 1.0;
  }
  else if (type === 'marble') {
    const imgData = ctx.createImageData(512, 512);
    for(let i=0; i<512; i++) {
      for(let j=0; j<512; j++) {
        const v = Math.abs(Math.sin((i+j)*0.01 + Math.sin(i*0.02)*2));
        const c = 255 - Math.pow(1-v, 4)*150; 
        const idx = (j*512+i)*4;
        imgData.data[idx] = imgData.data[idx+1] = imgData.data[idx+2] = c;
        imgData.data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  else if (type === 'carbon') {
    for(let y=0; y<512; y+=16) {
      for(let x=0; x<512; x+=16) {
        const isEven = ((x/16)+(y/16))%2 === 0;
        const gradient = isEven 
            ? ctx.createLinearGradient(x,y,x+16,y)
            : ctx.createLinearGradient(x,y,x,y+16);
        gradient.addColorStop(0, '#222');
        gradient.addColorStop(0.5, '#444');
        gradient.addColorStop(1, '#222');
        ctx.fillStyle = gradient;
        ctx.fillRect(x,y,16,16);
      }
    }
  }
  else if (type === 'hammered') {
      ctx.fillStyle = '#888';
      ctx.fillRect(0,0,512,512);
      for(let i=0; i<1500; i++) {
        const x = Math.random()*512;
        const y = Math.random()*512;
        const r = Math.random()*15 + 5;
        const grad = ctx.createRadialGradient(x-r*0.2, y-r*0.2, 0, x, y, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
  }
  else if (type === 'brushed') {
      ctx.fillStyle = '#888';
      ctx.fillRect(0,0,512,512);
      for(let i=0; i<3000; i++) {
        ctx.fillStyle = Math.random()>0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, Math.random()*512, 512, Math.random()*2+1);
      }
  }
  else if (type === 'magma') {
      const imgData = ctx.createImageData(512, 512);
      for(let i=0; i<512; i++) {
      for(let j=0; j<512; j++) {
        const v = Math.sin(i*0.02 + Math.sin(j*0.03)*3) * Math.cos(j*0.015 + Math.sin(i*0.02)*2);
        const idx = (j*512+i)*4;
        if (v > 0.5) {
          imgData.data[idx] = 255; imgData.data[idx+1] = 100; imgData.data[idx+2] = 0; imgData.data[idx+3] = 255;
        } else {
          imgData.data[idx] = 0; imgData.data[idx+1] = 0; imgData.data[idx+2] = 0; imgData.data[idx+3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  else if (type === 'bio') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,512,512);
    for(let i=0; i<200; i++) {
        const x = Math.random()*512;
        const y = Math.random()*512;
        const r = Math.random()*6 + 2;
        const grad = ctx.createRadialGradient(x,y,0,x,y,r);
        grad.addColorStop(0, '#00ffff');
        grad.addColorStop(0.5, '#00aaaa');
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  
  if (['carbon','leather','hammered','brushed','damascus','marble'].includes(type) === false) {
     tex.colorSpace = THREE.NoColorSpace;
  } else {
     tex.colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
};

type MatConfig = {
  name: string;
  btn: string;
  apply: (mat: THREE.MeshPhysicalMaterial, lights: THREE.Group, envMap: THREE.Texture, getTex: (type: string)=>THREE.CanvasTexture) => void;
};

const MAT_OPTIONS: MatConfig[] = [
  {
    name: 'Carbon Fiber', btn: '#222',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0x111111);
      mat.metalness = 0.5;
      mat.roughness = 0.5;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.1;
      const tex = getTex('carbon');
      mat.map = tex;
      mat.bumpMap = tex;
      mat.bumpScale = 0.02;

      lights.add(new THREE.AmbientLight(0xffffff, 0.5));
      const l1 = new THREE.DirectionalLight(0xffffff, 3.0); l1.position.set(5,5,5); lights.add(l1);
      const l2 = new THREE.DirectionalLight(0xaaaaff, 2.0); l2.position.set(-5,2,-5); lights.add(l2);
    }
  },
  {
    name: 'Damascus Steel', btn: '#667',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0xaaaaaa);
      mat.metalness = 1.0;
      mat.roughness = 0.4;
      const tex = getTex('damascus');
      mat.roughnessMap = tex;
      mat.bumpMap = tex;
      mat.bumpScale = 0.05;

      lights.add(new THREE.AmbientLight(0xffffff, 0.4));
      const l1 = new THREE.DirectionalLight(0xffffff, 4.0); l1.position.set(2, 5, 5); lights.add(l1);
      const l2 = new THREE.PointLight(0xffaa55, 100); l2.position.set(-5, 0, 0); lights.add(l2);
    }
  },
  {
    name: 'Hammered Brass', btn: '#b87333',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0xd4af37);
      mat.metalness = 1.0;
      mat.roughness = 0.3;
      const tex = getTex('hammered');
      mat.bumpMap = tex;
      mat.bumpScale = -0.1;

      lights.add(new THREE.AmbientLight(0xffffff, 0.3));
      const l1 = new THREE.PointLight(0xffffff, 50); l1.position.set(3, 3, 3); lights.add(l1);
      const l2 = new THREE.PointLight(0xffaa00, 40); l2.position.set(-3, -3, 2); lights.add(l2);
    }
  },
  {
    name: 'Weathered Leather', btn: '#5c3a21',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0x4a2f1d);
      mat.metalness = 0.0;
      mat.roughness = 0.9;
      const tex = getTex('leather');
      mat.bumpMap = tex;
      mat.bumpScale = 0.01;
      mat.roughnessMap = tex;

      lights.add(new THREE.AmbientLight(0xffffff, 1.0));
      const l1 = new THREE.DirectionalLight(0xffeedd, 1.5); l1.position.set(5,5,5); lights.add(l1);
    }
  },
  {
    name: 'Carrara Marble', btn: '#e8e8e8',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0xffffff);
      mat.metalness = 0.0;
      mat.roughness = 0.2;
      mat.transmission = 0.4;
      mat.thickness = 1.5;
      const tex = getTex('marble');
      mat.map = tex;

      lights.add(new THREE.AmbientLight(0xffffff, 1.5));
      const l1 = new THREE.DirectionalLight(0xffffff, 1.0); l1.position.set(0, 10, 0); lights.add(l1);
    }
  },
  {
    name: 'Anodized Titanium', btn: 'linear-gradient(45deg, #ff00ff, #00ffff)',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0x888888);
      mat.metalness = 1.0;
      mat.roughness = 0.4;
      mat.iridescence = 1.0;
      mat.iridescenceIOR = 1.8;
      const tex = getTex('brushed');
      mat.roughnessMap = tex;

      lights.add(new THREE.AmbientLight(0xffffff, 0.2));
      const l1 = new THREE.PointLight(0x00ffff, 40); l1.position.set(5,0,0); lights.add(l1);
      const l2 = new THREE.PointLight(0xff00ff, 40); l2.position.set(-5,0,0); lights.add(l2);
      const l3 = new THREE.PointLight(0xffff00, 20); l3.position.set(0,5,5); lights.add(l3);
    }
  },
  {
    name: 'Vantablack', btn: '#000',
    apply: (mat, lights, envMap) => {
      mat.color.setHex(0x000000);
      mat.metalness = 0.0;
      mat.roughness = 1.0;
      mat.envMap = null;

      // Only one extremely sharp rim light
      const rim = new THREE.DirectionalLight(0xffffff, 10.0);
      rim.position.set(0, 5, -5);
      lights.add(rim);
    }
  },
  {
    name: 'Bismuth Crystal', btn: 'conic-gradient(from 0deg, pink, yellow, cyan, pink)',
    apply: (mat, lights, envMap) => {
      mat.color.setHex(0xffffff);
      mat.metalness = 1.0;
      mat.roughness = 0.1;
      mat.iridescence = 1.0;
      mat.iridescenceIOR = 2.5;

      lights.add(new THREE.AmbientLight(0xffffff, 0.4));
      const l1 = new THREE.DirectionalLight(0xffffff, 2.0); l1.position.set(5,5,5); lights.add(l1);
      const l2 = new THREE.DirectionalLight(0xffffff, 2.0); l2.position.set(-5,-5,5); lights.add(l2);
    }
  },
  {
    name: 'Aerogel', btn: '#aaddff',
    apply: (mat, lights, envMap) => {
      mat.color.setHex(0xbbddff);
      mat.metalness = 0.0;
      mat.roughness = 0.5;
      mat.transmission = 1.0;
      mat.opacity = 0.9;
      mat.transparent = true;
      mat.ior = 1.1;
      mat.envMap = null;

      // Backlit heavily
      const back = new THREE.PointLight(0x0044ff, 200); back.position.set(0,0,-5); lights.add(back);
      const front = new THREE.DirectionalLight(0xffffff, 0.5); front.position.set(0,0,5); lights.add(front);
    }
  },
  {
    name: 'Molten Core', btn: '#ff3300',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0x110000);
      mat.metalness = 0.8;
      mat.roughness = 0.6;
      mat.emissive.setHex(0xff2200);
      mat.emissiveIntensity = 2.0;
      const tex = getTex('magma');
      mat.emissiveMap = tex;

      lights.add(new THREE.AmbientLight(0xff0000, 0.5));
      const pulse = new THREE.PointLight(0xffaa00, 100); pulse.position.set(0,0,2); lights.add(pulse);
    }
  },
  {
    name: 'Holographic Glass', btn: '#eeffff',
    apply: (mat, lights, envMap) => {
      mat.color.setHex(0xffffff);
      mat.metalness = 0.1;
      mat.roughness = 0.05;
      mat.transmission = 1.0;
      mat.thickness = 0.2;
      mat.iridescence = 1.0;
      mat.iridescenceIOR = 1.3;

      lights.add(new THREE.AmbientLight(0xffffff, 1.5));
      const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(2,5,5); lights.add(dl);
    }
  },
  {
    name: 'Deep Sea Bio', btn: '#00ffcc',
    apply: (mat, lights, envMap, getTex) => {
      mat.color.setHex(0x001122);
      mat.metalness = 0.2;
      mat.roughness = 0.8;
      mat.clearcoat = 1.0;
      mat.emissive.setHex(0x00ffee);
      mat.emissiveIntensity = 4.0;
      mat.emissiveMap = getTex('bio');

      lights.add(new THREE.AmbientLight(0x0000ff, 0.5));
      const fill = new THREE.PointLight(0x00aaff, 20); fill.position.set(5,5,5); lights.add(fill);
    }
  }
];

export default function LogoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const lightGroupRef = useRef<THREE.Group | null>(null);
  const envMapRef = useRef<THREE.Texture | null>(null);
  const textureCacheRef = useRef<Record<string, THREE.CanvasTexture>>({});

  const getTex = (type: string) => {
     if (!textureCacheRef.current[type]) {
       textureCacheRef.current[type] = generateProceduralTexture(type);
     }
     return textureCacheRef.current[type];
  };

  const resetMaterial = (mat: THREE.MeshPhysicalMaterial, envMap: THREE.Texture) => {
      mat.color.setHex(0xffffff);
      mat.metalness = 0;
      mat.roughness = 0.5;
      mat.clearcoat = 0;
      mat.clearcoatRoughness = 0;
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 1;
      mat.transmission = 0;
      mat.ior = 1.5;
      mat.thickness = 0;
      mat.iridescence = 0;
      mat.iridescenceIOR = 1.3;
      mat.map = null;
      mat.roughnessMap = null;
      mat.normalMap = null;
      mat.bumpMap = null;
      mat.bumpScale = 1;
      mat.emissiveMap = null;
      mat.transparent = true;
      mat.opacity = 1.0;
      mat.envMap = envMap;
      mat.envMapIntensity = 6.0;
      mat.needsUpdate = true;
  };

  const handleMaterialChange = (matConf: MatConfig) => {
    if (materialRef.current && lightGroupRef.current) {
       // Reset
       if (envMapRef.current) resetMaterial(materialRef.current, envMapRef.current);
       lightGroupRef.current.clear();
       
       // Apply new
       if (envMapRef.current) matConf.apply(materialRef.current, lightGroupRef.current, envMapRef.current, getTex);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(64, 64);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    lightGroupRef.current = new THREE.Group();
    scene.add(lightGroupRef.current);

    // Animated fire setup for bottom 2/3 reflection
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 256;
    envCanvas.height = 256;
    const envCtx = envCanvas.getContext('2d')!;
    
    const fireParticles: any[] = [];
    for(let i=0; i<60; i++) {
      fireParticles.push({
        x: Math.random() * 256,
        y: 256 + Math.random() * 50,
        r: Math.random() * 20 + 10,
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 3 + 2,
        color: Math.random() > 0.5 ? '#ff8800' : '#ff2200',
        life: Math.random()
      });
    }

    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.colorSpace = THREE.SRGBColorSpace;
    envTex.mapping = THREE.EquirectangularReflectionMapping;

    scene.environment = envTex;
    envMapRef.current = envTex;

    let logoMesh: THREE.Object3D | null = null;
    const loader = new GLTFLoader();
    loader.load('/assets/logo7/logo7.glb', (gltf) => {
      logoMesh = gltf.scene;
      
      const sharedMat = new THREE.MeshPhysicalMaterial();
      materialRef.current = sharedMat;

      logoMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.center();
          child.material = sharedMat;
        }
      });
      
      // Default to first material
      handleMaterialChange(MAT_OPTIONS[0]);

      // Center and scale the logo
      const box = new THREE.Box3().setFromObject(logoMesh);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.0 / maxDim; // Fit within view
      logoMesh.scale.set(scale, scale, scale);
      
      // Re-center
      const center = box.getCenter(new THREE.Vector3());
      logoMesh.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      const wrapper = new THREE.Group();
      wrapper.add(logoMesh);
      scene.add(wrapper);
      logoMesh = wrapper; // animate the wrapper
    });

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (logoMesh) {
        logoMesh.rotation.y += 0.02;
        if (lightGroupRef.current) lightGroupRef.current.rotation.y -= 0.02;
        scene.environmentRotation.y -= 0.02;
      }
      
      // Machinery base
      const silverBg = envCtx.createLinearGradient(0, 0, 0, 256);
      silverBg.addColorStop(0, '#888888');
      silverBg.addColorStop(0.3, '#dddddd');
      silverBg.addColorStop(0.5, '#444444');
      silverBg.addColorStop(0.8, '#eeeeee');
      silverBg.addColorStop(1, '#050505');
      envCtx.fillStyle = silverBg;
      envCtx.fillRect(0, 0, 256, 256);

      // Sci-fi grid
      envCtx.lineWidth = 1;
      envCtx.strokeStyle = 'rgba(255,255,255,0.1)';
      envCtx.beginPath();
      for(let i=0; i<256; i+=16) {
        envCtx.moveTo(i, 0); envCtx.lineTo(i, 256);
        envCtx.moveTo(0, i); envCtx.lineTo(256, i);
      }
      envCtx.stroke();

      // Tech details / panels
      envCtx.strokeStyle = '#222222';
      envCtx.lineWidth = 3;
      envCtx.fillStyle = '#111111';
      envCtx.fillRect(20, 10, 40, 30);
      envCtx.strokeRect(20, 10, 40, 30);
      envCtx.fillRect(160, 20, 60, 40);
      envCtx.strokeRect(160, 20, 60, 40);
      
      envCtx.beginPath();
      envCtx.moveTo(0, 80); envCtx.lineTo(80, 80); envCtx.lineTo(120, 120); envCtx.lineTo(256, 120);
      envCtx.moveTo(0, 180); envCtx.lineTo(100, 180); envCtx.lineTo(140, 220); envCtx.lineTo(256, 220);
      envCtx.stroke();

      // Bright studio / machinery lights
      envCtx.fillStyle = '#ffffff';
      envCtx.fillRect(50, 10, 40, 4);
      envCtx.fillRect(160, 10, 40, 4);
      
      // Glowing LEDs
      envCtx.shadowColor = '#00ffff';
      envCtx.shadowBlur = 10;
      envCtx.fillStyle = '#00ffff';
      envCtx.fillRect(40, 90, 15, 6);
      envCtx.shadowColor = '#ff00ff';
      envCtx.fillStyle = '#ff00ff';
      envCtx.fillRect(180, 140, 20, 6);
      envCtx.shadowBlur = 0;

      // Restrict fire to bottom 2/3 (soft mask)
      const fadeStart = 256 / 3;
      
      // Fire overlay
      envCtx.globalCompositeOperation = 'hard-light';
      const fireBg = envCtx.createLinearGradient(0, fadeStart - 20, 0, 256);
      fireBg.addColorStop(0, 'rgba(0,0,0,0)');
      fireBg.addColorStop(0.3, 'rgba(120,20,0,0.5)');
      fireBg.addColorStop(0.6, 'rgba(255,80,0,0.7)');
      fireBg.addColorStop(1, 'rgba(255,200,50,0.9)');
      envCtx.fillStyle = fireBg;
      envCtx.fillRect(0, fadeStart - 20, 256, 256 - (fadeStart - 20));

      // Draw moving fire particles
      envCtx.globalCompositeOperation = 'lighter';
      fireParticles.forEach((p) => {
        p.x += Math.sin(p.life * 10) * 0.5 + p.speedX; // Flickering sway
        p.y -= p.speedY + (Math.random() * 1.5); // Add chaotic upward burst
        p.life -= 0.015;
        
        if (p.y <= fadeStart || p.life <= 0) {
          p.y = 256 + Math.random() * 20;
          p.x = Math.random() * 256;
          p.life = 1.0;
        }
        
        envCtx.beginPath();
        envCtx.arc(p.x, p.y, Math.max(0.1, p.r * p.life), 0, Math.PI * 2);
        const grad = envCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(0.1, p.r * p.life));
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        envCtx.fillStyle = grad;
        envCtx.fill();
        
        // Wrap around horizontally
        if (p.x < 0) p.x += 256;
        if (p.x > 256) p.x -= 256;
      });
      
      envCtx.globalCompositeOperation = 'source-over';
      
      envTex.needsUpdate = true;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative flex items-center pr-4">
      <svg width="0" height="0" className="absolute">
        <filter id="hollow-shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feFlood floodColor="rgba(6,182,212,0.8)" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feComposite in="shadow" in2="SourceAlpha" operator="out" result="hollow_shadow" />
          <feMerge>
            <feMergeNode in="hollow_shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>
      <div 
        ref={containerRef} 
        className="w-16 h-16 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group"
        style={{ filter: 'url(#hollow-shadow)' }} 
      />
      <div className="absolute top-14 left-0 w-24 flex flex-wrap gap-1 z-50 justify-center">
        {MAT_OPTIONS.map((m, i) => (
          <button
            key={i}
            title={m.name}
            onClick={(e) => { e.stopPropagation(); handleMaterialChange(m); }}
            className="w-3 h-3 rounded-full border border-white/30 hover:scale-150 transition-all opacity-50 hover:opacity-100"
            style={{ background: m.btn }}
          />
        ))}
      </div>
    </div>
  );
}

