import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { usePortfolio, type Experience } from "@/content/portfolio";
import type { SceneLayout } from "@/config/story";
import { UniversalCosmicStars } from "./CameraRig";
import { ShootingStars } from "./Environment";
import { IntroAstronaut } from "./StarportGantry";
import { ExperiencePlanet } from "./ExperiencePlanets";
import { Wormhole } from "./WormholeRift";
import { Galaxy } from "./ProjectGalaxy";
import { SkillConstellation } from "./SkillConstellations";
import { Pantheon } from "./Pantheon";
import { BlackHole } from "./CelestialBodies";
import { UniverseTrail } from "./UniverseTrail";

export function SectionTitle({
  position,
  primary,
  secondary,
  color,
  glow,
  distance = 14,
  maxDist = 48,
}: {
  position: [number, number, number];
  primary: string;
  secondary: string;
  color: string;
  glow: string;
  distance?: number;
  maxDist?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);
  const [opacity, setOpacity] = useState(0);
  const targetPos = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state, dt) => {
    const dist = state.camera.position.distanceTo(targetPos);
    // Smooth distance fade: begins fading at maxDist, full opacity by maxDist - 14
    const fadeStart = maxDist;
    const fadeEnd = Math.max(8, maxDist - 14);
    const target =
      dist >= fadeStart
        ? 0
        : dist <= fadeEnd
          ? 1
          : 1 - (dist - fadeEnd) / (fadeStart - fadeEnd);

    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, target, Math.min(1, dt * 5.5));
    if (Math.abs(opacityRef.current - opacity) > 0.015) {
      setOpacity(opacityRef.current);
    }

    if (opacityRef.current > 0.01 && ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03);
    }
  });

  if (opacity <= 0.01) return null;

  return (
    <group ref={ref} position={position}>
      <Html center distanceFactor={distance} transform sprite zIndexRange={[5, 0]}>
        <div
          className="pointer-events-none select-none flex flex-col items-center transition-all duration-300"
          style={{
            fontFamily: "'Orbitron','Rajdhani',monospace",
            opacity,
            transform: `translateY(${(1 - opacity) * 10}px) scale(${0.95 + opacity * 0.05})`,
          }}
        >
          <div
            className="whitespace-nowrap font-black"
            style={{
              fontSize: 24,
              letterSpacing: "0.35em",
              color: "#ffffff",
              textShadow: `0 0 10px ${color}, 0 0 22px ${glow}, 0 0 45px ${glow}`,
            }}
          >
            {primary}
          </div>
          <div
            className="whitespace-nowrap mt-1 font-semibold"
            style={{
              fontSize: 8.5,
              letterSpacing: "0.55em",
              color,
              opacity: 0.95,
              textShadow: `0 0 8px ${glow}`,
            }}
          >
            {secondary}
          </div>
          <div
            style={{
              marginTop: 4,
              width: 130,
              height: 1.5,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 8px ${glow}`,
            }}
          />
        </div>
      </Html>
    </group>
  );
}

export function SunTitle({ centerZ }: { centerZ: number }) {
  const ringRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);
  const [opacity, setOpacity] = useState(0);
  const targetPos = useMemo(() => new THREE.Vector3(0, 0, centerZ), [centerZ]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z = t * 0.25;
    const dist = state.camera.position.distanceTo(targetPos);
    
    // Smooth distance fade
    const fadeStart = 50;
    const fadeEnd = 36;
    const target =
      dist >= fadeStart
        ? 0
        : dist <= fadeEnd
          ? 1
          : 1 - (dist - fadeEnd) / (fadeStart - fadeEnd);

    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, target, Math.min(1, dt * 5.5));
    if (Math.abs(opacityRef.current - opacity) > 0.015) {
      setOpacity(opacityRef.current);
    }

    if (opacityRef.current > 0.01 && labelRef.current) {
      labelRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    }
  });

  return (
    <group position={[0, 0, centerZ]}>
      {/* glowing ring around the sun */}
      <group ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
        <mesh>
          <ringGeometry args={[2.6, 2.72, 128]} />
          <meshBasicMaterial
            color="#ffd27a"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[2.9, 2.95, 128]} />
          <meshBasicMaterial
            color="#ff8a3c"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* floating label above the sun with smooth fade transition */}
      {opacity > 0.01 && (
        <group ref={labelRef} position={[0, 4.5, 2]}>
          <Html center distanceFactor={14} transform sprite zIndexRange={[5, 0]}>
            <div
              className="pointer-events-none select-none flex flex-col items-center transition-all duration-300"
              style={{
                fontFamily: "'Orbitron','Rajdhani',monospace",
                opacity,
                transform: `translateY(${(1 - opacity) * 10}px) scale(${0.95 + opacity * 0.05})`,
              }}
            >
              <div
                className="whitespace-nowrap font-black"
                style={{
                  fontSize: 26,
                  letterSpacing: "0.4em",
                  color: "#ffd27a",
                  textShadow:
                    "0 0 10px rgba(255,180,80,0.95), 0 0 28px rgba(255,120,40,0.8), 0 0 2px #2a0a00",
                  WebkitTextStroke: "1px rgba(40,10,0,0.7)",
                }}
              >
                THE FORGE
              </div>
              <div
                className="whitespace-nowrap mt-1"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.65em",
                  color: "#ffb04a",
                  textShadow: "0 0 8px rgba(255,140,60,0.9)",
                }}
              >
                // WHERE IDEAS IGNITE INTO WORLDS
              </div>
              <div
                style={{
                  marginTop: 5,
                  width: 140,
                  height: 1,
                  background: "linear-gradient(90deg, transparent, #ffb04a, transparent)",
                  boxShadow: "0 0 8px rgba(255,140,60,0.9)",
                }}
              />
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

export function CosmicWorld({
  onSelectProject,
  onSelectAchievement,
  luminosity,
  layout,
  isWormhole = false,
  isIntroActive = false,
  activeExperienceIndex = null,
  bootReady = true,
  onLaunchMission,
}: {
  onSelectProject: (i: number) => void;
  onSelectAchievement: (i: number) => void;
  luminosity: number;
  layout: SceneLayout;
  isWormhole?: boolean;
  isIntroActive?: boolean;
  activeExperienceIndex?: number | null;
  bootReady?: boolean;
  onLaunchMission?: () => void;
}) {
  const { experiences: EXPERIENCES } = usePortfolio();
  return (
    <>
      <ambientLight intensity={0.35 * luminosity} />
      <pointLight position={[20, 10, 20]} intensity={1.1 * luminosity} color="#ffffff" />
      <pointLight
        position={[-15, -5, layout.wormholeZ + 10]}
        intensity={0.9 * luminosity}
        color="#7a3cff"
      />
      <UniversalCosmicStars />
      <ShootingStars layout={layout} />

      <IntroAstronaut />

      {/* Radiant Journey Constellation Flight Trail */}
      <UniverseTrail layout={layout} experiences={EXPERIENCES} />

      {EXPERIENCES.map((e: Experience, i: number) => (
        <ExperiencePlanet
          key={`${e.name}-${i}`}
          z={layout.experienceZs[i]}
          color={e.color}
          accent={e.accent}
          name={e.name}
          year={e.year}
          place={e.place}
          pattern={e.pattern}
          side={i % 2 === 0 ? -1 : 1}
          isIntroActive={isIntroActive}
          isActiveWaypoint={activeExperienceIndex === i}
        />
      ))}

      <Wormhole position={[0, 0, layout.wormholeZ]} isWormhole={isWormhole} />
      <Galaxy onSelectProject={onSelectProject} centerZ={layout.galaxyZ} />
      <SkillConstellation centerZ={layout.skillsZ} />
      <Pantheon centerZ={layout.pantheonZ} onSelectAchievement={onSelectAchievement} />
      <BlackHole position={[0, 0, layout.blackholeZ]} scale={3} />

      {/* ====== CENTRAL SECTION TITLES ====== */}
      <SectionTitle
        position={[0, 6.2, layout.wormholeZ + 25.5]}
        primary="THE RIFT"
        secondary="// EINSTEIN-ROSEN BRIDGE"
        color="#c89bff"
        glow="rgba(200,155,255,0.95)"
        distance={15}
        maxDist={70}
      />
      <SunTitle centerZ={layout.galaxyZ} />
      <SectionTitle
        position={[0, 13, layout.skillsZ - 4]}
        primary="THE ARSENAL"
        secondary="// SKILL CONSTELLATION"
        color="#9bf0ff"
        glow="rgba(155,240,255,0.9)"
      />
      <SectionTitle
        position={[0, 6.2, layout.pantheonZ + 2]}
        primary="THE PANTHEON"
        secondary="// HALL OF HONORS"
        color="#ffd27a"
        glow="rgba(255,210,122,0.95)"
        distance={12}
        maxDist={36}
      />
      <SectionTitle
        position={[0, 3.8, layout.finaleZ - 4]}
        primary="THE SINGULARITY"
        secondary="// END OF TRANSMISSION"
        color="#ff3366"
        glow="rgba(255, 51, 102, 1)"
        distance={12}
        maxDist={65}
      />
    </>
  );
}

export default CosmicWorld;
