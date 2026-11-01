import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard, Text } from "@react-three/drei";
import type { ProjectPattern } from "@/content/portfolio";
import {
  generateAtmosphereTelemetry,
  getBiomeTexture,
  getPlanetCloudTexture,
  getPlanetRingTexture,
} from "@/lib/planetGenerator";
import { RealisticAtmosphereShell } from "./Environment";
import { FUTURA_FONT } from "@/config/theme";

export function ExperiencePlanet({
  z,
  color,
  accent,
  name,
  year,
  place,
  side,
  pattern,
  isIntroActive = false,
  isActiveWaypoint = false,
  radius = 2,
  index = 0,
}: {
  z: number;
  color: string;
  accent: string;
  name: string;
  year: string;
  place?: string;
  side: number;
  pattern: ProjectPattern;
  isIntroActive?: boolean;
  isActiveWaypoint?: boolean;
  radius?: number;
  index?: number;
}) {
  const planetRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const scanRingRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Experience planet hover is strictly restricted to its active waypoint scene: not before, not after
  useEffect(() => {
    if (!isActiveWaypoint) {
      setHovered(false);
    }
  }, [isActiveWaypoint]);

  // Dynamic cursor pointer feedback when hovering the active waypoint planet
  useEffect(() => {
    if (isActiveWaypoint && hovered) {
      document.body.style.cursor = "pointer";
      return () => {
        document.body.style.cursor = "";
      };
    }
  }, [isActiveWaypoint, hovered]);

  const displayPlace = place ?? name;

  // Procedural biome & scientific atmosphere telemetry
  const telemetry = useMemo(
    () => generateAtmosphereTelemetry(displayPlace, pattern, color, accent),
    [displayPlace, pattern, color, accent],
  );

  // High-fidelity procedural textures (cached)
  const tex = useMemo(
    () => getBiomeTexture(telemetry.biomeType, color, accent, displayPlace),
    [telemetry.biomeType, color, accent, displayPlace],
  );

  const cloudTex = useMemo(
    () => (telemetry.hasClouds ? getPlanetCloudTexture(telemetry.biomeType) : null),
    [telemetry.hasClouds, telemetry.biomeType],
  );

  const ringTex = useMemo(
    () => (telemetry.hasRings ? getPlanetRingTexture(telemetry.ringColor || color, accent) : null),
    [telemetry.hasRings, telemetry.ringColor, color, accent],
  );

  // Smooth rotation with differential cloud speed for realistic parallax
  useFrame((_, dt) => {
    if (planetRef.current) planetRef.current.rotation.y += dt * 0.16;
    if (cloudRef.current) cloudRef.current.rotation.y += dt * (0.16 + telemetry.cloudSpeed);
    if (scanRingRef.current) {
      scanRingRef.current.rotation.z += dt * 0.4;
      scanRingRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
    }
  });

  const x = side * (5.0 + (radius - 2.0) * 0.6);
  const isLeft = side === -1;

  return (
    <group position={[x, 0, z]}>
      {/* Invisible Hover Hit Sphere (2.5 radius) — mounted EXCLUSIVELY when on this planet's scene */}
      {isActiveWaypoint && (
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
        >
          <sphereGeometry args={[radius * 1.25, 24, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Main planetary sphere with physical biome material */}
      <mesh
        ref={planetRef}
        onPointerOver={
          isActiveWaypoint
            ? (e) => {
                e.stopPropagation();
                setHovered(true);
              }
            : undefined
        }
        onPointerOut={
          isActiveWaypoint
            ? (e) => {
                e.stopPropagation();
                setHovered(false);
              }
            : undefined
        }
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          map={tex}
          roughness={
            telemetry.biomeType === "oceanic" ? 0.28 : telemetry.biomeType === "ice" ? 0.35 : 0.58
          }
          metalness={telemetry.biomeType === "cyber" ? 0.35 : 0.08}
          clearcoat={telemetry.biomeType === "oceanic" || telemetry.biomeType === "ice" ? 0.8 : 0.4}
          clearcoatRoughness={0.2}
          sheen={0.4}
          sheenColor={new THREE.Color(telemetry.sunsetLimbColor)}
          sheenRoughness={0.5}
          envMapIntensity={1.2}
          emissive={color}
          emissiveIntensity={isActiveWaypoint && hovered ? 0.18 : 0.06}
        />
      </mesh>

      {/* Rotating spherical cloud deck with real parallax depth */}
      {telemetry.hasClouds && cloudTex && (
        <mesh ref={cloudRef} scale={1.018} raycast={() => null}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshStandardMaterial
            map={cloudTex}
            transparent
            opacity={telemetry.cloudOpacity}
            depthWrite={false}
            roughness={0.9}
            color="#ffffff"
          />
        </mesh>
      )}

      {/* Luminous Rayleigh atmospheric scattering limb shell */}
      <RealisticAtmosphereShell
        radius={radius}
        atmosphereColor={telemetry.atmosphereColor}
        sunsetLimbColor={telemetry.sunsetLimbColor}
        power={3.2}
        intensity={isActiveWaypoint && hovered ? 1.7 : 1.3}
        scale={1.12}
      />

      {/* Realistic planetary rings with dust gaps */}
      {telemetry.hasRings && ringTex && (
        <mesh rotation={[Math.PI / 2.3, 0.18, 0]} raycast={() => null}>
          <ringGeometry args={[telemetry.ringInner ? (telemetry.ringInner / 2) * radius : radius * 1.25, telemetry.ringOuter ? (telemetry.ringOuter / 2) * radius : radius * 1.75, 96]} />
          <meshBasicMaterial
            map={ringTex}
            transparent
            opacity={telemetry.ringOpacity ?? 0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Subtle planetary local illumination */}
      <pointLight
        position={[0, 0, radius * 1.25]}
        intensity={0.7}
        color={telemetry.atmosphereColor}
        distance={12 + radius * 2}
      />

      {/* Orbiting holographic telemetry scan rings when hovered */}
      {isActiveWaypoint && hovered && (
        <group ref={scanRingRef} raycast={() => null}>
          <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[radius * 1.15, radius * 1.17, 64]} />
            <meshBasicMaterial
              color={telemetry.atmosphereColor}
              transparent
              opacity={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} raycast={() => null}>
            <ringGeometry args={[radius * 1.175, radius * 1.195, 48]} />
            <meshBasicMaterial
              color={telemetry.sunsetLimbColor}
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Sci-Fi Target Reticle & 3D Glowing Leader Line extending towards Left / Right */}
      {isActiveWaypoint && hovered && (
        <group>
          {/* Target Reticle on Planet Limb */}
          <group position={[isLeft ? -(radius * 1.075) : radius * 1.075, 0.15, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <ringGeometry args={[0.07, 0.12, 24]} />
              <meshBasicMaterial
                color={telemetry.atmosphereColor}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <circleGeometry args={[0.035, 16]} />
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* 3D Glowing Neon Vector Leader Line connecting limb to HUD card */}
          {(() => {
            const startX = isLeft ? -(radius * 1.075) : radius * 1.075;
            const elbowX = isLeft ? -(radius + 0.75) : radius + 0.75;
            const endX = isLeft ? -(radius + 1.25) : radius + 1.25;
            const start = new THREE.Vector3(startX, 0.15, 0);
            const elbow = new THREE.Vector3(elbowX, 0.45, 0);
            const end = new THREE.Vector3(endX, 0.45, 0);
            const geom = new THREE.BufferGeometry().setFromPoints([start, elbow, end]);
            return (
              <primitive
                object={
                  new THREE.Line(
                    geom,
                    new THREE.LineBasicMaterial({
                      color: telemetry.atmosphereColor,
                      transparent: true,
                      opacity: 0.85,
                    }),
                  )
                }
              />
            );
          })()}
        </group>
      )}

      {/* Floating Exoplanet Telemetry HUD Card on left side (for left planets) or right side (for right planets) */}
      {isActiveWaypoint && hovered && (
        <Html
          distanceFactor={13}
          position={[isLeft ? -(radius + 2.45) : radius + 2.45, 0.45, 0]}
          center
          pointerEvents="none"
        >
          <div
            className={`w-[340px] rounded-xl border border-cyan-400/40 bg-slate-950/95 p-4 backdrop-blur-2xl shadow-[0_0_35px_rgba(34,211,238,0.3)] text-left select-none font-sans relative ${
              isLeft ? "mr-2" : "ml-2"
            }`}
          >
            {/* Callout Arrow Tick linking to leader line */}
            <div
              className={`absolute top-4 w-2 h-2 rotate-45 bg-slate-950 ${
                isLeft
                  ? "-right-1 border-t border-r border-cyan-400/50"
                  : "-left-1 border-b border-l border-cyan-400/50"
              }`}
            />

            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full animate-ping"
                  style={{ backgroundColor: telemetry.atmosphereColor }}
                />
                <span className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase">
                  ◈ TELEMETRY LOCK // {telemetry.classification.toUpperCase()}
                </span>
              </div>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                style={{
                  borderColor: telemetry.atmosphereColor,
                  color: telemetry.atmosphereColor,
                  background: `${telemetry.atmosphereColor}15`,
                }}
              >
                {telemetry.biomeType.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-white/80">
              <div>
                <span className="text-white/40">ATMOSPHERE: </span>
                <span className="text-cyan-200 font-semibold">{telemetry.composition}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  <span className="text-white/40">PRESSURE: </span>
                  <span className="text-white/90">{telemetry.pressure}</span>
                </span>
                <span>
                  <span className="text-white/40">TEMP: </span>
                  <span className="text-white/90">{telemetry.surfaceTemp}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  <span className="text-white/40">HYDROSPHERE: </span>
                  <span className="text-white/90">{telemetry.hydrosphere}</span>
                </span>
                <span>
                  <span className="text-white/40">GRAVITY: </span>
                  <span className="text-white/90">{telemetry.gravity}</span>
                </span>
              </div>
              <div className="pt-1.5 border-t border-white/5 text-[10px] text-amber-300/85">
                <span className="text-white/40">HAZARDS: </span>
                {telemetry.hazards.join(" · ")}
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* Floating Milestone Titles with Clean Holographic Animations */}
      {!isIntroActive && isActiveWaypoint && (
        <AnimatedPlanetTitle
          displayPlace={displayPlace}
          name={name}
          year={year}
          color={color}
          accent={accent}
          hasPlace={Boolean(place)}
          isHovered={hovered}
          radius={radius}
        />
      )}
    </group>
  );
}

/**
 * AnimatedPlanetTitle:
 * Delivers clean, fluid 3D animations for the active planet's billboard text:
 * 1. Critically damped spring entrance (blooming scale & ascending glide into focus).
 * 2. Harmonic zero-G microgravity floating (subtle vertical bobbing and gentle sway).
 * 3. Holographic laser underline that expands into place with glowing end caps.
 * 4. Interactive pointer hover reaction (elevated scale and intensified laser luminance).
 */
function AnimatedPlanetTitle({
  displayPlace,
  name,
  year,
  color,
  accent,
  hasPlace,
  isHovered = false,
  radius = 2,
}: {
  displayPlace: string;
  name: string;
  year: string;
  color: string;
  accent: string;
  hasPlace: boolean;
  isHovered?: boolean;
  radius?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Mesh>(null);
  const dotLeftRef = useRef<THREE.Mesh>(null);
  const dotRightRef = useRef<THREE.Mesh>(null);

  // Smooth entrance interpolation progress (0 -> 1)
  const animProgressRef = useRef(0);
  const hoverFactorRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Critically damped entrance spring (fast, fluid, no overshoot oscillation)
    animProgressRef.current = THREE.MathUtils.damp(animProgressRef.current, 1, 5.5, delta);
    const p = animProgressRef.current;

    // Smooth hover factor damping
    hoverFactorRef.current = THREE.MathUtils.damp(
      hoverFactorRef.current,
      isHovered ? 1 : 0,
      8,
      delta
    );
    const h = hoverFactorRef.current;

    const t = state.clock.getElapsedTime();

    // Idle microgravity harmonic floating
    const floatY = Math.sin(t * 1.5) * 0.08 + h * 0.15;
    const floatRotZ = Math.sin(t * 0.9) * (0.012 - h * 0.006);

    // Vertical position: smoothly rises into final orbital altitude
    const entryY = (1 - p) * -0.6;
    const yOffset = radius - 2;
    groupRef.current.position.y = entryY + floatY + yOffset;
    groupRef.current.rotation.z = floatRotZ;

    // Scale: springs up from 0.82 to 1.0 with subtle rhythmic breathing + hover magnification
    const breath = 1 + Math.sin(t * 1.2) * 0.012;
    const hoverScale = 1 + h * 0.07;
    const targetScale = THREE.MathUtils.lerp(0.82, 1.0, p) * breath * hoverScale;
    groupRef.current.scale.set(targetScale, targetScale, targetScale);

    // Expanding holographic laser divider line
    if (lineRef.current) {
      lineRef.current.scale.x = p * (0.96 + Math.sin(t * 2.2) * 0.04 + h * 0.1);
      const lineMat = lineRef.current.material as THREE.MeshBasicMaterial;
      if (lineMat) {
        lineMat.opacity = THREE.MathUtils.lerp(p * 0.7, 0.95, h);
      }
    }

    // Holographic corner dots
    if (dotLeftRef.current && dotRightRef.current) {
      const leftMat = dotLeftRef.current.material as THREE.MeshBasicMaterial;
      const rightMat = dotRightRef.current.material as THREE.MeshBasicMaterial;
      const dotOpacity = THREE.MathUtils.lerp(p * 0.95, 1.0, h);
      if (leftMat) leftMat.opacity = dotOpacity;
      if (rightMat) rightMat.opacity = dotOpacity;
    }
  });

  return (
    <Billboard follow lockX={false} lockY={false} lockZ={false}>
      <group ref={groupRef}>
        {/* Main Planet Title */}
        <Text
          font={FUTURA_FONT}
          position={[0, 4.15, 0]}
          fontSize={0.95}
          color={color}
          outlineWidth={0.035}
          outlineColor="#000"
          letterSpacing={0.18}
          anchorY="bottom"
        >
          {displayPlace.toUpperCase()}
        </Text>

        {/* Holographic Glowing Laser Divider with End Beacons */}
        <group position={[0, 3.82, 0]}>
          <mesh ref={lineRef}>
            <planeGeometry args={[2.2, 0.02]} />
            <meshBasicMaterial
              color={accent || color}
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={dotLeftRef} position={[-1.1, 0, 0]}>
            <circleGeometry args={[0.03, 16]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={dotRightRef} position={[1.1, 0, 0]}>
            <circleGeometry args={[0.03, 16]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Subtitle / Role */}
        {hasPlace && (
          <Text
            font={FUTURA_FONT}
            position={[0, 3.42, 0]}
            fontSize={0.32}
            color="#fff"
            outlineWidth={0.015}
            outlineColor="#000"
            letterSpacing={0.06}
          >
            {name}
          </Text>
        )}

        {/* Era / Year Telemetry Tag */}
        <Text
          font={FUTURA_FONT}
          position={[0, hasPlace ? 2.95 : 3.42, 0]}
          fontSize={0.22}
          color="#ffffffbb"
          outlineWidth={0.01}
          outlineColor="#000"
          letterSpacing={0.08}
        >
          {year}
        </Text>
      </group>
    </Billboard>
  );
}
