import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default function LogoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(64, 64);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x222233, 0.5); // darker ambient
    scene.add(ambientLight);

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff0dd, 3.5);
    keyLight.position.set(5, 5, 4);
    scene.add(keyLight);

    // Cool fill light
    const fillLight = new THREE.DirectionalLight(0x4466ff, 2.0);
    fillLight.position.set(-5, -5, 5);
    scene.add(fillLight);
    
    // Intense rim/back light
    const rimLight = new THREE.DirectionalLight(0x00ffff, 5.0);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // Dynamic Reflection map where we draw SAVANT wordmark
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 1024;
    envCanvas.height = 512;
    const envCtx = envCanvas.getContext('2d')!;
    
    // Draw the wordmark into the reflection environment
    envCtx.fillStyle = '#111111'; // dark background for reflection
    envCtx.fillRect(0, 0, 1024, 512);

    envCtx.fillStyle = '#ffffff';
    envCtx.font = 'bold 150px Michroma, sans-serif';
    envCtx.textAlign = 'center';
    envCtx.textBaseline = 'middle';
    
    // As it will be mapped onto a sphere or rotated around, we draw "SAVANT"
    envCtx.fillText('SAVANT', 512, 256);
    envCtx.strokeStyle = '#00ffff';
    envCtx.lineWidth = 4;
    envCtx.strokeText('SAVANT', 512, 256);

    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.colorSpace = THREE.SRGBColorSpace;
    envTex.mapping = THREE.EquirectangularReflectionMapping;

    scene.environment = envTex;

    let logoMesh: THREE.Object3D | null = null;
    const loader = new GLTFLoader();
    loader.load('/assets/logo7/logo7.glb', (gltf) => {
      logoMesh = gltf.scene;
      
      const chromeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.05,
        clearcoat: 1.0,
        envMapIntensity: 4.0 // Amplify the text reflection
      });

      logoMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.computeBoundingBox();
        }
      });

      let maxHeight = 0;
      let targetMinY = Infinity;
      const meshes: THREE.Mesh[] = [];
      logoMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
          const box = child.geometry.boundingBox;
          if (box) {
             const height = box.max.y - box.min.y;
             if (height > maxHeight) maxHeight = height;
          }
        }
      });

      meshes.forEach(child => {
        const box = child.geometry.boundingBox!;
        const height = box.max.y - box.min.y;
        
        if (height < maxHeight * 0.95 && height > 0) {
            const scaleY = maxHeight / height;
            child.geometry.scale(1, scaleY, 1);
            child.geometry.computeBoundingBox();
        }
      });
      
      meshes.forEach(child => {
          const box = child.geometry.boundingBox!;
          if (box.min.y < targetMinY) targetMinY = box.min.y;
      });

      meshes.forEach(child => {
          const box = child.geometry.boundingBox!;
          const offset = targetMinY - box.min.y;
          if (Math.abs(offset) > 0.001) {
              child.geometry.translate(0, offset, 0);
          }
          child.geometry.center();
          child.material = chromeMat;
      });
      
      const box = new THREE.Box3().setFromObject(logoMesh);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.6 / maxDim; // Fit within view
      logoMesh.scale.set(scale, scale, scale);
      
      const center = box.getCenter(new THREE.Vector3());
      logoMesh.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      const wrapper = new THREE.Group();
      wrapper.add(logoMesh);
      scene.add(wrapper);
      logoMesh = wrapper; // animate the wrapper
    });

    let animationId: number;
    let time = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (logoMesh) {
        logoMesh.rotation.y += 0.02;
        scene.environmentRotation.y -= 0.02; // Rotate the wordmark reflection around logo
      }
      
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
    <div className="relative flex items-center pr-0">
      <div 
        ref={containerRef} 
        className="w-16 h-16 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group translate-x-[17px]"
      />
    </div>
  );
}
