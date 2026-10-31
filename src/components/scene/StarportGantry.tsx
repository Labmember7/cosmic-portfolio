import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { MoonDust, CelestialHorizonGiant } from "./Environment";

export const ASTRONAUT_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

export function AstronautModel(props: any) {
  const { scene } = useGLTF(ASTRONAUT_URL);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} {...props} />;
}
useGLTF.preload(ASTRONAUT_URL);

export function AnimatedAstronaut() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(ASTRONAUT_URL);
  const cloned = useMemo(() => scene.clone(), [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Slow, clean, dignified low-gravity astronaut kinematics:
    // 1. Subtle respiratory & buoyancy micro-bobbing:
    const bob = Math.sin(t * 0.85) * 0.022 + Math.sin(t * 1.7) * 0.008;
    groupRef.current.position.y = -0.48 + bob;

    // 2. Slow majestic horizon surveying yaw:
    const surveyYaw = Math.sin(t * 0.28) * 0.14 + Math.sin(t * 0.12) * 0.06;
    groupRef.current.rotation.y = Math.PI + surveyYaw;

    // 3. Subtle spacesuit weight-shift pitch & roll:
    groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.02; // breathing chest pitch
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.015; // low-gravity boot weight shift
  });

  return (
    <group ref={groupRef} scale={1.35} position={[0, -0.48, 0]} rotation={[0, Math.PI, 0]}>
      <primitive object={cloned} />
      {/* Subtle telemetry status beacon on suit chest */}
      <pointLight position={[0, 1.15, 0.35]} color="#38bdf8" intensity={0.65} distance={1.8} />
    </group>
  );
}

export function StarportGantryPad() {
  const runwayChevronsRef = useRef<THREE.Group>(null);
  const radarLeftRef = useRef<THREE.Mesh>(null);
  const radarRightRef = useRef<THREE.Mesh>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);

  // Full Moon Sphere Constants:
  // Radius = 34, Apex summit at y = -0.48, center at [0, -34.48, 0]
  const MOON_R = 34;
  const MOON_CY = -MOON_R - 0.48; // -34.48

  // 190 scattered lunar boulders covering the full spherical Moon while preserving the plateau
  const rocks = useMemo(() => {
    const items: {
      p: [number, number, number];
      s: number;
      r: [number, number, number];
      type: "dodec" | "ico";
      color: string;
    }[] = [];

    const rand = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };

    // Clean neutral lunar gray rock palette matching the original disk aesthetic
    const colors = ["#8a8275", "#7a7468", "#948d80", "#736d63", "#827b70"];

    for (let i = 0; i < 190; i++) {
      const phi = 0.17 + Math.pow(rand(i * 4 + 1), 1.25) * 1.15;
      const theta = rand(i * 4 + 2) * Math.PI * 2;

      const px = MOON_R * Math.sin(phi) * Math.cos(theta);
      const pz = MOON_R * Math.sin(phi) * Math.sin(theta);
      const py = MOON_CY + MOON_R * Math.cos(phi);

      const s = 0.12 + Math.pow(rand(i * 4 + 3), 1.6) * 0.95;

      items.push({
        p: [px, py + s * 0.38, pz],
        s,
        r: [rand(i + 11) * Math.PI, rand(i + 23) * Math.PI * 2, rand(i + 37) * Math.PI],
        type: i % 3 === 0 ? "ico" : "dodec",
        color: colors[i % colors.length],
      });
    }
    return items;
  }, []);

  // Animated sequential runway pulse
  useFrame((state, dt) => {
    if (radarLeftRef.current) radarLeftRef.current.rotation.y += dt * 0.85;
    if (radarRightRef.current) radarRightRef.current.rotation.y -= dt * 0.75;
    if (beaconLightRef.current) {
      beaconLightRef.current.intensity = Math.sin(state.clock.elapsedTime * 6) > 0.4 ? 1.8 : 0.2;
    }
    if (runwayChevronsRef.current) {
      runwayChevronsRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 5 - idx * 0.6) * 0.45;
        }
      });
    }
  });

  return (
    <group>
      {/* 1. Full 3D Spherical Moon Body */}
      <mesh position={[0, MOON_CY, 0]} receiveShadow>
        <sphereGeometry args={[MOON_R, 64, 64]} />
        <meshStandardMaterial
          color="#7a7468"
          roughness={0.92}
          metalness={0.0}
          emissive="#1a1814"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 2. Starport Plateau Foundation Pedestal */}
      <mesh position={[0, -0.68, 0]} receiveShadow>
        <cylinderGeometry args={[5.25, 5.45, 0.42, 6]} />
        <meshStandardMaterial color="#1a1e27" metalness={0.85} roughness={0.35} />
      </mesh>

      {/* 3. Hexagonal Starport Launch Deck */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]} receiveShadow>
        <circleGeometry args={[5.2, 6]} />
        <meshStandardMaterial
          color="#1e222d"
          roughness={0.45}
          metalness={0.8}
          emissive="#0a0f1d"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Glowing Cyber Perimeter Rings */}
      <mesh position={[0, -0.46, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[5.1, 5.25, 6]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.3, 5.42, 64]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Concentric Landing Pad Target Circles */}
      <mesh position={[0, -0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.9, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.3, 64]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* Directional Illuminated Runway Chevrons (Heading into -Z) */}
      <group ref={runwayChevronsRef} position={[0, -0.45, 0]}>
        {[-0.5, -1.8, -3.1, -4.4].map((zPos, idx) => (
          <group key={idx} position={[0, 0, zPos]}>
            <mesh position={[-0.45, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
              <planeGeometry args={[0.65, 0.12]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.45, 0, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
              <planeGeometry args={[0.65, 0.12]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Left Gantry Communications Tower */}
      <group position={[-4.5, 0, -1]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.12, 0.22, 3.4, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh ref={radarLeftRef} position={[0, 3.0, 0]}>
          <cylinderGeometry args={[0.65, 0.1, 0.15, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 3.3, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
        <pointLight position={[0, 3.3, 0]} color="#f43f5e" intensity={1.2} distance={8} />
      </group>

      {/* Right Gantry Communications Tower */}
      <group position={[4.5, 0, -1]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.12, 0.22, 3.4, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh ref={radarRightRef} position={[0, 3.0, 0]}>
          <cylinderGeometry args={[0.65, 0.1, 0.15, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 3.3, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        <pointLight ref={beaconLightRef} position={[0, 3.3, 0]} color="#22d3ee" intensity={1.2} distance={8} />
      </group>

      {/* 4. Realistic Lunar Boulders */}
      {rocks.map((rk, i) => (
        <mesh key={i} position={rk.p} rotation={rk.r} castShadow receiveShadow>
          {rk.type === "ico" ? (
            <icosahedronGeometry args={[rk.s, 0]} />
          ) : (
            <dodecahedronGeometry args={[rk.s, 0]} />
          )}
          <meshStandardMaterial color={rk.color} roughness={0.94} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function IntroAstronaut() {
  return (
    <group position={[0, 0, 0]}>
      {/* Key atmospheric lights */}
      <directionalLight position={[-3, 8, 4]} intensity={1.6} color="#dbeafe" />
      <pointLight position={[0, 2.5, 4]} intensity={1.2} color="#fef08a" distance={10} decay={2} />
      <pointLight position={[0, 1.2, -3]} intensity={1.4} color="#38bdf8" distance={8} decay={2} />

      {/* Full 3D Spherical Moon & Starport Launch Deck */}
      <StarportGantryPad />

      {/* Subtle Ambient Lunar Dust */}
      <MoonDust />

      {/* Rising Celestial Giant on the Horizon */}
      <CelestialHorizonGiant />

      {/* Realistically Animated 3D Astronaut Persona */}
      <Suspense fallback={null}>
        <AnimatedAstronaut />
      </Suspense>
    </group>
  );
}

export default IntroAstronaut;

