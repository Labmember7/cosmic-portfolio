import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";

export function BlackHole({
  position,
  scale = 1,
  onClick,
}: {
  position: [number, number, number];
  scale?: number;
  onClick?: () => void;
}) {
  const disk1 = useRef<THREE.Mesh>(null);
  const disk2 = useRef<THREE.Mesh>(null);
  const disk3 = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    if (disk1.current) disk1.current.rotation.z += dt * 0.35;
    if (disk2.current) disk2.current.rotation.z -= dt * 0.22;
    if (disk3.current) disk3.current.rotation.z += dt * 0.12;
    if (halo.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
      halo.current.scale.setScalar(s);
    }
  });

  // gradient texture for the accretion disk (orange → white → purple)
  const diskTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, "rgba(255,120,40,0)");
    grad.addColorStop(0.15, "rgba(255,140,60,1)");
    grad.addColorStop(0.45, "rgba(255,230,180,1)");
    grad.addColorStop(0.55, "rgba(255,230,180,1)");
    grad.addColorStop(0.85, "rgba(180,80,255,1)");
    grad.addColorStop(1, "rgba(120,40,200,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 64);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }, []);

  return (
    <group position={position} scale={scale} onClick={onClick}>
      {/* event horizon */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* lensing halo (back-side glow ring around horizon) */}
      <mesh ref={halo} scale={1.08}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#ffb86b" transparent opacity={0.25} side={THREE.BackSide} />
      </mesh>

      {/* inner photon ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.12, 256]} />
        <meshBasicMaterial color="#fff2cc" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* accretion disks — tilted, layered */}
      <mesh ref={disk1} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[1.25, 2.6, 256]} />
        <meshBasicMaterial
          map={diskTex}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={disk2} rotation={[Math.PI / 2.05, 0.25, 0]}>
        <ringGeometry args={[2.4, 3.4, 256]} />
        <meshBasicMaterial
          map={diskTex}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={disk3} rotation={[Math.PI / 1.95, -0.2, 0]}>
        <ringGeometry args={[3.2, 4.1, 256]} />
        <meshBasicMaterial
          map={diskTex}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Sparkles count={140} scale={9} size={3.5} speed={0.3} color="#ffd9a3" />
    </group>
  );
}

export function FierySun({ position }: { position: [number, number, number] }) {
  const surfRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Sprite>(null);

  const surfaceTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ff6a00";
    g.fillRect(0, 0, 512, 256);
    // turbulent blobs
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * 512,
        y = Math.random() * 256;
      const r = 8 + Math.random() * 40;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      const hot = Math.random() > 0.5;
      grad.addColorStop(0, hot ? "rgba(255,250,210,0.95)" : "rgba(255,150,40,0.9)");
      grad.addColorStop(1, "rgba(180,40,0,0)");
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // dark sunspots
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 512,
        y = Math.random() * 256;
      const r = 4 + Math.random() * 10;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(30,0,0,0.9)");
      grad.addColorStop(1, "rgba(30,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const coronaTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 50, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,200,80,0.6)");
    grad.addColorStop(0.4, "rgba(255,120,40,0.35)");
    grad.addColorStop(1, "rgba(255,80,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, dt) => {
    surfaceTex.offset.x += dt * 0.04;
    surfaceTex.offset.y += dt * 0.015;
    if (surfRef.current) surfRef.current.rotation.y += dt * 0.05;
    if (coronaRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
      coronaRef.current.scale.setScalar(s * 10);
    }
  });

  return (
    <group position={position}>
      <mesh ref={surfRef}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshBasicMaterial map={surfaceTex} />
      </mesh>
      {/* hot bloom layer */}
      <mesh scale={1.05}>
        <sphereGeometry args={[1.8, 48, 48]} />
        <meshBasicMaterial
          color="#ffb04a"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* corona billboard */}
      <sprite ref={coronaRef} scale={[10, 10, 1]}>
        <spriteMaterial
          map={coronaTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight intensity={3} color="#ffb86b" distance={80} />
      <Sparkles count={80} scale={6} size={3} speed={0.6} color="#ffd9a3" />
    </group>
  );
}

export default BlackHole;
