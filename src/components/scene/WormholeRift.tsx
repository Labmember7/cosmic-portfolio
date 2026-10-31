import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export function TachyonStream({ count = 380 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions, colors, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    const cCyan = new THREE.Color("#38bdf8");
    const cViolet = new THREE.Color("#c084fc");
    const cGold = new THREE.Color("#ffd27a");

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.6 + Math.random() * 2.8;
      const z = -26 + Math.random() * 52;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = z;

      spd[i] = 14 + Math.random() * 18;

      const p = (z + 26) / 52;
      const color =
        p > 0.5
          ? cCyan.clone().lerp(cViolet, (1 - p) * 2)
          : cViolet.clone().lerp(cGold, (0.5 - p) * 2);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return [pos, cols, spd];
  }, [count]);

  useFrame((_, dt) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 2] += speeds[i] * dt;
      if (pos[i * 3 + 2] > 26) {
        pos[i * 3 + 2] = -26;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function GravitationalRipples({ z = 24 }: { z?: number }) {
  const ripple1 = useRef<THREE.Mesh>(null);
  const ripple2 = useRef<THREE.Mesh>(null);
  const ripple3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const update = (mesh: THREE.Mesh | null, offset: number) => {
      if (!mesh) return;
      const phase = (t * 0.45 + offset) % 1;
      const s = 1.0 + phase * 0.75;
      mesh.scale.set(s, s, 1);
      const m = mesh.material as THREE.MeshBasicMaterial;
      if (m) m.opacity = (1 - phase) * 0.38;
    };
    update(ripple1.current, 0);
    update(ripple2.current, 0.33);
    update(ripple3.current, 0.66);
  });

  return (
    <group position={[0, 0, z]}>
      <mesh ref={ripple1}>
        <ringGeometry args={[6.8, 7.05, 96]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ripple2}>
        <ringGeometry args={[6.8, 7.05, 96]} />
        <meshBasicMaterial
          color="#818cf8"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ripple3}>
        <ringGeometry args={[6.8, 7.05, 96]} />
        <meshBasicMaterial
          color="#c084fc"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Wormhole({
  position,
  isWormhole = false,
}: {
  position: [number, number, number];
  isWormhole?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const entranceDiscRef = useRef<THREE.Group>(null);
  const exitDiscRef = useRef<THREE.Group>(null);
  const portalDiscRef = useRef<THREE.Mesh>(null);

  // Hyperboloid funnel geometry (narrower throat at center, flared wide mouth at both ends)
  const throatGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(5.2, 5.2, 56, 64, 32, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const ny = y / 28; // -1 to +1
      const flare = 1.0 + 0.62 * (ny * ny);
      pos.setX(i, pos.getX(i) * flare);
      pos.setZ(i, pos.getZ(i) * flare);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const innerThroatGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(3.6, 3.6, 56, 48, 24, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const ny = y / 28;
      const flare = 1.0 + 0.52 * (ny * ny);
      pos.setX(i, pos.getX(i) * flare);
      pos.setZ(i, pos.getZ(i) * flare);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Seamless, high-resolution relativistic slipstream texture
  const slipstreamTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const g = c.getContext("2d")!;
    g.fillStyle = "#02010e";
    g.fillRect(0, 0, 1024, 1024);

    // Deep cosmic blue-purple ambient wash
    const wash = g.createLinearGradient(0, 0, 1024, 0);
    wash.addColorStop(0, "rgba(20, 10, 60, 0.0)");
    wash.addColorStop(0.25, "rgba(30, 15, 90, 0.45)");
    wash.addColorStop(0.5, "rgba(70, 35, 170, 0.6)");
    wash.addColorStop(0.75, "rgba(30, 15, 90, 0.45)");
    wash.addColorStop(1, "rgba(20, 10, 60, 0.0)");
    g.fillStyle = wash;
    g.fillRect(0, 0, 1024, 1024);

    // Flowing luminous nebula waves
    for (let i = 0; i < 8; i++) {
      const x = (i / 8) * 1024 + 64;
      const radGrad = g.createRadialGradient(x, 512, 40, x, 512, 280);
      const hue = 210 + i * 16;
      radGrad.addColorStop(0, `hsla(${hue}, 92%, 68%, 0.25)`);
      radGrad.addColorStop(0.6, `hsla(${hue + 35}, 85%, 58%, 0.12)`);
      radGrad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = radGrad;
      g.fillRect(x - 280, 0, 560, 1024);
    }

    // 240 relativistic speed streaks running along Y (length of tube)
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * 1024;
      const w = 1.0 + Math.random() * 2.8;
      const hue = 195 + Math.random() * 125;
      const alpha = 0.22 + Math.random() * 0.45;
      const grad = g.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, `hsla(${hue}, 95%, 75%, 0.0)`);
      grad.addColorStop(0.15, `hsla(${hue}, 95%, 75%, ${alpha * 0.7})`);
      grad.addColorStop(0.5, `hsla(${hue}, 95%, 82%, ${alpha})`);
      grad.addColorStop(0.85, `hsla(${hue}, 95%, 75%, ${alpha * 0.7})`);
      grad.addColorStop(1, `hsla(${hue}, 95%, 75%, 0.0)`);
      g.fillStyle = grad;
      g.fillRect(x, 0, w, 1024);
    }

    // Subtle quantum metric grid
    g.strokeStyle = "rgba(120, 200, 255, 0.09)";
    g.lineWidth = 1;
    for (let y = 0; y < 1024; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(1024, y);
      g.stroke();
    }

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.anisotropy = 16;
    return t;
  }, []);

  // Destination galaxy portal aperture preview (anchoring visual target)
  const destinationGalaxyTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#000000";
    g.fillRect(0, 0, 512, 512);

    const coreGrad = g.createRadialGradient(256, 256, 0, 256, 256, 240);
    coreGrad.addColorStop(0, "rgba(255, 250, 230, 1.0)");
    coreGrad.addColorStop(0.12, "rgba(255, 210, 120, 0.95)");
    coreGrad.addColorStop(0.35, "rgba(255, 140, 60, 0.65)");
    coreGrad.addColorStop(0.65, "rgba(180, 70, 240, 0.35)");
    coreGrad.addColorStop(0.85, "rgba(50, 20, 120, 0.15)");
    coreGrad.addColorStop(1, "rgba(0, 0, 0, 0.0)");
    g.fillStyle = coreGrad;
    g.beginPath();
    g.arc(256, 256, 240, 0, Math.PI * 2);
    g.fill();

    g.save();
    g.translate(256, 256);
    for (let arm = 0; arm < 3; arm++) {
      const armAngleOffset = (arm * Math.PI * 2) / 3;
      for (let i = 0; i < 220; i++) {
        const r = Math.pow(i / 220, 0.75) * 210;
        const theta = armAngleOffset + (i / 220) * 4.2;
        const x = Math.cos(theta) * r + (Math.random() - 0.5) * 16;
        const y = Math.sin(theta) * r + (Math.random() - 0.5) * 16;
        const dotSize = Math.max(0.5, (1 - r / 220) * 3.5 + Math.random() * 2);
        const alpha = (1 - r / 240) * 0.85;
        g.fillStyle =
          i % 2 === 0 ? `rgba(255, 220, 140, ${alpha})` : `rgba(200, 150, 255, ${alpha})`;
        g.beginPath();
        g.arc(x, y, dotSize, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();

    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, dt) => {
    // Silky, smooth forward slipstream flow
    slipstreamTex.offset.y -= dt * 0.22;

    if (innerRef.current) {
      innerRef.current.rotation.y += dt * 0.03;
    }
    if (entranceDiscRef.current) {
      entranceDiscRef.current.rotation.z += dt * 0.08;
    }
    if (exitDiscRef.current) {
      exitDiscRef.current.rotation.z -= dt * 0.06;
    }
    if (portalDiscRef.current) {
      portalDiscRef.current.rotation.z += dt * 0.05;
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {/* 1. Spacetime Gravitational Shockwave Ripples at Entrance */}
      <GravitationalRipples z={25.5} />

      {/* 2. Entrance Event Horizon Accretion Ring Complex (z = +25.5) */}
      <group position={[0, 0, 25.5]} ref={entranceDiscRef}>
        {/* Outer Accretion Disc */}
        <mesh>
          <ringGeometry args={[6.8, 9.6, 96]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Tilted Counter-Rotating Chromatic Disc */}
        <mesh rotation={[Math.PI / 2.3, 0.16, 0]}>
          <ringGeometry args={[7.2, 8.4, 80]} />
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Razor-thin Photon Sphere */}
        <mesh>
          <ringGeometry args={[6.72, 6.86, 128]} />
          <meshBasicMaterial
            color="#e0f2fe"
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <pointLight color="#38bdf8" intensity={1.5} distance={22} />
      </group>

      {/* 3. Main Hyperboloid Throat Cylinder (Outer Dimension Slipstream) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={throatGeo}>
        <meshBasicMaterial
          map={slipstreamTex}
          side={THREE.BackSide}
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 4. Secondary Concentric Parallax Sheath (Atmospheric Depth) */}
      <mesh ref={innerRef} rotation={[Math.PI / 2, 0, 0]} geometry={innerThroatGeo}>
        <meshBasicMaterial
          color="#9aa8ff"
          side={THREE.BackSide}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 5. 16 Quantum Chrono-Gate Harmonic Rings Along Corridor */}
      {Array.from({ length: 16 }).map((_, i) => {
        const z = -22 + i * 2.93;
        const ny = z / 28;
        const r = 3.6 + 2.2 * (ny * ny);

        const p = i / 15;
        const hue = p > 0.5 ? 200 + (1 - p) * 140 : 40 + p * 120;
        const ringColor = new THREE.Color(`hsl(${hue}, 92%, 70%)`);

        return (
          <group key={i} position={[0, 0, z]}>
            {/* Main Luminous Gate Ring */}
            <mesh>
              <torusGeometry args={[r, 0.04, 16, 96]} />
              <meshBasicMaterial
                color={ringColor}
                transparent
                opacity={0.5}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            {/* Secondary Thin Halo */}
            <mesh>
              <torusGeometry args={[r * 1.05, 0.015, 12, 64]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.25}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            {/* 4 Orbiting Quantum Node Beacons */}
            {[0, 1, 2, 3].map((nodeIdx) => {
              const nodeAngle = (nodeIdx * Math.PI) / 2 + (i % 2 === 0 ? 0.3 : -0.3);
              return (
                <mesh
                  key={nodeIdx}
                  position={[Math.cos(nodeAngle) * r, Math.sin(nodeAngle) * r, 0]}
                >
                  <octahedronGeometry args={[0.08, 0]} />
                  <meshBasicMaterial
                    color={ringColor}
                    transparent
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* 6. Volumetric Relativistic Tachyon Particle Field */}
      <TachyonStream count={420} />

      {/* 7. Destination Galaxy Horizon Portal (Crucial Visual Anchor) */}
      <group position={[0, 0, -25.5]}>
        <mesh ref={portalDiscRef}>
          <circleGeometry args={[3.8, 64]} />
          <meshBasicMaterial
            map={destinationGalaxyTex}
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[3.75, 4.0, 96]} />
          <meshBasicMaterial
            color="#ffd27a"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 8. Exit Gravitational Lensing Solar Corona (z = -25.5) */}
      <group position={[0, 0, -25.5]} ref={exitDiscRef}>
        <mesh>
          <ringGeometry args={[6.8, 9.6, 96]} />
          <meshBasicMaterial
            color="#ffd27a"
            transparent
            opacity={0.48}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, -0.15, 0]}>
          <ringGeometry args={[7.2, 8.4, 80]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <pointLight color="#ffd27a" intensity={1.6} distance={24} />
      </group>
    </group>
  );
}

export default Wormhole;
