import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeDieProps {
  value: number; 
  selected?: boolean;
}


const faceValues = [3, 4, 5, 6, 1, 2]; 









function createFaceTexture(value: number, bgColor: string, dotColor: string, isBump: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  if (isBump) {
    ctx.fillStyle = "#ffffff"; 
  } else {
    ctx.fillStyle = bgColor;
  }
  ctx.fillRect(0, 0, 128, 128);

  const dots: Record<number, [number, number][]> = {
    1: [[64, 64]],
    2: [[36, 36], [92, 92]],
    3: [[36, 36], [64, 64], [92, 92]],
    4: [[36, 36], [92, 36], [36, 92], [92, 92]],
    5: [[36, 36], [92, 36], [64, 64], [36, 92], [92, 92]],
    6: [[36, 32], [92, 32], [36, 64], [92, 64], [36, 96], [92, 96]],
  };

  const currentDots = dots[value] || [];

  currentDots.forEach(([x, y]) => {
    if (isBump) {
      
      const r = 13;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "#000000");   
      grad.addColorStop(0.5, "#444444");
      grad.addColorStop(0.85, "#cccccc");
      grad.addColorStop(1, "#ffffff");   
      
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


function createRoundedBoxGeometry(size: number, radius: number, segments: number) {
  const geometry = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  
  const tempPos = new THREE.Vector3();
  const half = size / 2;
  const r = Math.min(radius, half);

  for (let i = 0; i < position.count; i++) {
    tempPos.fromBufferAttribute(position, i);
    
    const sx = Math.sign(tempPos.x) || 1;
    const sy = Math.sign(tempPos.y) || 1;
    const sz = Math.sign(tempPos.z) || 1;
    
    const ax = Math.abs(tempPos.x);
    const ay = Math.abs(tempPos.y);
    const az = Math.abs(tempPos.z);
    
    const dx = Math.max(ax - (half - r), 0);
    const dy = Math.max(ay - (half - r), 0);
    const dz = Math.max(az - (half - r), 0);
    
    
    const count = (dx > 0 ? 1 : 0) + (dy > 0 ? 1 : 0) + (dz > 0 ? 1 : 0);
    
    if (count >= 2) {
      
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len > 0) {
        const newDx = (dx / len) * r;
        const newDy = (dy / len) * r;
        const newDz = (dz / len) * r;
        
        if (dx > 0) tempPos.x = sx * (half - r + newDx);
        if (dy > 0) tempPos.y = sy * (half - r + newDy);
        if (dz > 0) tempPos.z = sz * (half - r + newDz);
        
        position.setXYZ(i, tempPos.x, tempPos.y, tempPos.z);
        
        
        const newNorm = new THREE.Vector3(
          dx > 0 ? sx * newDx : 0,
          dy > 0 ? sy * newDy : 0,
          dz > 0 ? sz * newDz : 0
        ).normalize();
        normal.setXYZ(i, newNorm.x, newNorm.y, newNorm.z);
      }
    }
  }
  
  geometry.computeVertexNormals();
  return geometry;
}


function getTargetQuaternion(val: number): THREE.Quaternion {
  const euler = new THREE.Euler(0, 0, 0);
  if (val === 1) euler.set(0, 0, 0);
  else if (val === 2) euler.set(0, Math.PI, 0);
  else if (val === 3) euler.set(0, -Math.PI / 2, 0);
  else if (val === 4) euler.set(0, Math.PI / 2, 0);
  else if (val === 5) euler.set(Math.PI / 2, 0, 0);
  else if (val === 6) euler.set(-Math.PI / 2, 0, 0);
  return new THREE.Quaternion().setFromEuler(euler);
}


const FALLBACK_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
};

export function ThreeDie({ value, selected = false }: ThreeDieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlFailed, setWebGlFailed] = useState(false);
  
  
  const stateRef = useRef({
    value,
    selected,
    targetQuat: getTargetQuaternion(value),
    currentQuat: getTargetQuaternion(value),
    isRolling: false,
    rollTime: 0,
    rollDuration: 800, 
    randAxis: new THREE.Vector3(1, 1, 1).normalize(),
    randSpeed: 15,
  });

  
  useEffect(() => {
    const s = stateRef.current;
    
    
    if (s.value !== value) {
      s.value = value;
      s.targetQuat = getTargetQuaternion(value);
      s.isRolling = true;
      s.rollTime = 0;
      s.randAxis.set(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      s.randSpeed = 12 + Math.random() * 8;
    }
    s.selected = selected;
  }, [value, selected]);

  useEffect(() => {
    if (webGlFailed || !containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let geometry: THREE.BoxGeometry;
    let mesh: THREE.Mesh;
    let animationFrameId: number;
    const container = containerRef.current;

    try {
      const width = 56;
      const height = 56;

      
      scene = new THREE.Scene();

      
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 10);
      camera.position.set(0, 0, 2.3);

      
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);

      
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(1.5, 3, 2.5);
      scene.add(keyLight);

      
      const fillLight = new THREE.DirectionalLight(0xffecd9, 0.6);
      fillLight.position.set(-2, -1.5, -1);
      scene.add(fillLight);

      
      geometry = createRoundedBoxGeometry(1.0, 0.12, 12);

      
      const getMaterials = (isSelected: boolean) => {
        const bgColor = isSelected ? "#FBF3DB" : "#FCFBFA";
        const dotColor = isSelected ? "#956400" : "#111111";

        return faceValues.map((val) => {
          const map = createFaceTexture(val, bgColor, dotColor, false);
          const bumpMap = createFaceTexture(val, bgColor, dotColor, true);

          return new THREE.MeshStandardMaterial({
            map,
            bumpMap,
            bumpScale: -0.04, 
            roughness: 0.12,  
            metalness: 0.02,
          });
        });
      };

      let activeMaterials = getMaterials(stateRef.current.selected);
      mesh = new THREE.Mesh(geometry, activeMaterials);
      mesh.quaternion.copy(stateRef.current.currentQuat);
      scene.add(mesh);

      
      let lastTime = performance.now();
      let currentSelectedState = stateRef.current.selected;

      const animate = (time: number) => {
        const delta = Math.min(time - lastTime, 50); 
        lastTime = time;

        const s = stateRef.current;

        
        if (s.selected !== currentSelectedState) {
          currentSelectedState = s.selected;
          
          
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: THREE.Material) => {
              const standardMaterial = mat as THREE.MeshStandardMaterial;
              standardMaterial.map?.dispose();
              standardMaterial.bumpMap?.dispose();
              mat.dispose();
            });
          }

          activeMaterials = getMaterials(s.selected);
          mesh.material = activeMaterials;
        }

        if (s.isRolling) {
          s.rollTime += delta;
          const progress = Math.min(s.rollTime / s.rollDuration, 1.0);

          if (progress < 1.0) {
            const rollAngle = (1 - progress) * s.randSpeed * (delta / 1000);
            const rollQuat = new THREE.Quaternion().setFromAxisAngle(s.randAxis, rollAngle);
            
            s.currentQuat.premultiply(rollQuat);
            mesh.quaternion.copy(s.currentQuat).slerp(s.targetQuat, progress);
          } else {
            s.isRolling = false;
            s.currentQuat.copy(s.targetQuat);
            mesh.quaternion.copy(s.targetQuat);
          }
        } else {
          mesh.quaternion.slerp(s.targetQuat, 0.15);
          s.currentQuat.copy(mesh.quaternion);
        }

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
    } catch (err) {
      console.warn("Ошибка инициализации WebGL (Three.js). Переключаемся на 2D-кубики:", err);
      queueMicrotask(() => setWebGlFailed(true));
    }

    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      if (renderer) {
        if (renderer.domElement.parentElement === container)
          container.removeChild(renderer.domElement);
        renderer.dispose();
      }
      
      if (geometry) geometry.dispose();
      
      if (mesh && Array.isArray(mesh.material)) {
        mesh.material.forEach((mat: THREE.Material) => {
          const standardMaterial = mat as THREE.MeshStandardMaterial;
          standardMaterial.map?.dispose();
          standardMaterial.bumpMap?.dispose();
          mat.dispose();
        });
      }
    };
  }, [webGlFailed]);

  
  if (webGlFailed) {
    const dots = FALLBACK_DOTS[value] ?? [];
    return (
      <div 
        style={{
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selected ? "var(--yellow-text)" : "var(--text-primary)",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 100 100"
          aria-label={`Кубик: ${value}`}
        >
          {dots.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="9" fill="currentColor" />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: 56,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    />
  );
}
