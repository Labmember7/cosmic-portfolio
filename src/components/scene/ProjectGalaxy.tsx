import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text, Points, PointMaterial, Billboard } from "@react-three/drei";
import { usePortfolio, type ProjectPattern } from "@/content/portfolio";
import {
  generateAtmosphereTelemetry,
  getBiomeTexture,
  getPlanetCloudTexture,
} from "@/lib/planetGenerator";
import { FierySun } from "./CelestialBodies";
import { RealisticAtmosphereShell } from "./Environment";
import { FUTURA_FONT } from "@/config/theme";

export function ProjectPlanet({
  angle,
  radius,
  speed,
  size,
  color,
  accent,
  name,
  pattern,
  centerZ,
  onSelect,
}: {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
  accent: string;
  name: string;
  pattern: ProjectPattern;
  centerZ: number;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const telemetry = useMemo(
    () => generateAtmosphereTelemetry(name, pattern, color, accent),
    [name, pattern, color, accent],
  );

  const tex = useMemo(
    () => getBiomeTexture(telemetry.biomeType, color, accent, name),
    [telemetry.biomeType, color, accent, name],
  );

  const cloudTex = useMemo(
    () => (telemetry.hasClouds ? getPlanetCloudTexture(telemetry.biomeType) : null),
    [telemetry.hasClouds, telemetry.biomeType],
  );

  useFrame((state, dt) => {
    if (ref.current) {
      const progradeSpeed = Math.abs(speed);
      const orbitRadius = Math.abs(radius);
      const a = angle + state.clock.elapsedTime * progradeSpeed;
      ref.current.position.x = Math.cos(a) * orbitRadius;
      ref.current.position.z = centerZ - Math.sin(a) * orbitRadius;
      ref.current.position.y = Math.sin(a * 1.3) * 0.6;
    }
    if (planetRef.current) planetRef.current.rotation.y += dt * 0.22;
    if (cloudRef.current) cloudRef.current.rotation.y += dt * (0.22 + telemetry.cloudSpeed);
  });

  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
  }, [hovered]);

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <mesh ref={planetRef} scale={hovered ? size * 1.15 : size}>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshPhysicalMaterial
          map={tex}
          emissive={color}
          emissiveIntensity={hovered ? 0.35 : 0.08}
          roughness={telemetry.biomeType === "oceanic" ? 0.25 : 0.52}
          metalness={0.1}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
          sheen={0.45}
          sheenColor={new THREE.Color(telemetry.sunsetLimbColor)}
          sheenRoughness={0.5}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Rotating clouds for project planets */}
      {telemetry.hasClouds && cloudTex && (
        <mesh ref={cloudRef} scale={hovered ? size * 1.15 * 1.02 : size * 1.02}>
          <sphereGeometry args={[0.9, 36, 36]} />
          <meshStandardMaterial
            map={cloudTex}
            transparent
            opacity={telemetry.cloudOpacity * 0.9}
            depthWrite={false}
            roughness={0.9}
            color="#ffffff"
          />
        </mesh>
      )}

      <group scale={hovered ? size * 1.15 : size}>
        <RealisticAtmosphereShell
          radius={0.9}
          atmosphereColor={telemetry.atmosphereColor}
          sunsetLimbColor={telemetry.sunsetLimbColor}
          power={3.2}
          intensity={hovered ? 1.7 : 1.15}
          scale={1.12}
        />
      </group>

      {/* Always-visible small name label facing camera so planets are identifiable from afar */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          font={FUTURA_FONT}
          position={[0, 1.1 * size + 0.38, 0]}
          fontSize={hovered ? 0.38 : 0.32}
          color={hovered ? "#ffffff" : color}
          outlineWidth={hovered ? 0.02 : 0.012}
          outlineColor="#000"
          anchorY="bottom"
          letterSpacing={0.06}
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
}

export function Galaxy({
  onSelectProject,
  centerZ,
}: {
  onSelectProject: (i: number) => void;
  centerZ: number;
}) {
  const { projects: PROJECTS } = usePortfolio();
  const particles = useMemo(() => {
    const N = 3000;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = Math.pow(Math.random(), 0.6) * 22;
      const arm = Math.floor(Math.random() * 3);
      const angle = (i / N) * Math.PI * 6 + arm * ((Math.PI * 2) / 3);
      arr[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 2;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      arr[i * 3 + 2] = centerZ + Math.sin(angle) * r + (Math.random() - 0.5) * 2;
    }
    return arr;
  }, [centerZ]);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.04;
  });

  return (
    <group>
        <Points ref={ref} positions={particles} stride={3}>
          <PointMaterial
            transparent
            color="#bcaaff"
            size={0.08}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Points>

        <FierySun position={[0, 0, centerZ]} />

        {/* orbit guide rings (static) */}
        {PROJECTS.map((p) => (
          <mesh key={"o" + p.name} position={[0, 0, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[p.radius - 0.015, p.radius + 0.015, 128]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}

        {PROJECTS.map((p, i) => (
          <ProjectPlanet
            key={p.name}
            angle={(i / PROJECTS.length) * Math.PI * 2}
            radius={p.radius}
            speed={p.speed}
            size={p.size}
            color={p.color}
            accent={p.accent}
            name={p.name}
            pattern={p.pattern}
            centerZ={centerZ}
            onSelect={() => onSelectProject(i)}
          />
        ))}
    </group>
  );
}

export default Galaxy;
