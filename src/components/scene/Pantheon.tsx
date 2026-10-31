import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { usePortfolio, type Achievement } from "@/content/portfolio";
import { FUTURA_FONT } from "@/config/theme";

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    name: "NVIDIA Jetson AI Specialist",
    issuer: "NVIDIA DLI",
    year: "2024",
    icon: "◆",
    color: "#76ff7a",
    accent: "#0a3b1f",
    description: "Edge AI deployment on Jetson hardware.",
  },
  {
    name: "ROS 2 Developer",
    issuer: "The Construct",
    year: "2023",
    icon: "✦",
    color: "#7fd1ff",
    accent: "#0b2a4a",
    description: "Multi-robot navigation & behavior trees.",
  },
  {
    name: "Deep Learning Specialization",
    issuer: "DeepLearning.AI",
    year: "2022",
    icon: "⬢",
    color: "#c89bff",
    accent: "#2a0a4a",
    description: "Five-course CNN, RNN & sequence models track.",
  },
  {
    name: "AWS IoT Core",
    issuer: "Amazon Web Services",
    year: "2022",
    icon: "▲",
    color: "#ffd27a",
    accent: "#5a3a00",
    description: "Industrial MQTT pipelines at cloud scale.",
  },
  {
    name: "Embedded C++ Mastery",
    issuer: "ARM Education",
    year: "2021",
    icon: "✺",
    color: "#ff7ac6",
    accent: "#4a0a2a",
    description: "Bare-metal & RTOS firmware engineering.",
  },
  {
    name: "Hackathon Champion",
    issuer: "RoboCup Junior",
    year: "2020",
    icon: "★",
    color: "#ff8a3c",
    accent: "#5a1a00",
    description: "1st place — autonomous rescue rover.",
  },
];

export function CentralShrine({
  trophyCount = 6,
  radius = 8.8,
}: {
  trophyCount?: number;
  radius?: number;
}) {
  const relicRef = useRef<THREE.Group>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (relicRef.current) {
      relicRef.current.rotation.y = t * 0.35;
      relicRef.current.position.y = 2.4 + Math.sin(t * 1.4) * 0.12;
    }
    if (ringRef1.current) ringRef1.current.rotation.z += dt * 0.25;
    if (ringRef2.current) ringRef2.current.rotation.x -= dt * 0.2;
    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 1.8) * 0.08;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Grand Amphitheater Exhibition Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
        <circleGeometry args={[radius + 3.8, 64]} />
        <meshStandardMaterial color="#06030e" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Concentric etched cosmic rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.78, 0]}>
        <ringGeometry args={[radius + 2.8, radius + 2.92, 96]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.78, 0]}>
        <ringGeometry args={[radius - 0.2, radius - 0.08, 96]} />
        <meshBasicMaterial color="#c89bff" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.78, 0]}>
        <ringGeometry args={[3.8, 3.9, 96]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.35} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Radial Runway Lightpaths extending from center to each exhibit */}
      {Array.from({ length: trophyCount }).map((_, i) => {
        const a = (i / trophyCount) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, -a + Math.PI / 2, 0]}>
            <mesh position={[0, -1.77, radius * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.08, radius - 1.2]} />
              <meshBasicMaterial color="#ffd27a" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        );
      })}

      {/* 2. Starlight Colonnade Pillars surrounding the amphitheater */}
      {Array.from({ length: trophyCount }).map((_, i) => {
        const a = ((i + 0.5) / trophyCount) * Math.PI * 2;
        const px = Math.cos(a) * (radius + 2.2);
        const pz = Math.sin(a) * (radius + 2.2);
        return (
          <group key={`col-${i}`} position={[px, 0, pz]}>
            <mesh position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.18, 0.24, 6.0, 12]} />
              <meshStandardMaterial color="#0f0b1e" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, -1.6, 0]}>
              <cylinderGeometry args={[0.35, 0.45, 0.4, 12]} />
              <meshStandardMaterial color="#211738" metalness={0.9} roughness={0.2} emissive="#ffd27a" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
              <cylinderGeometry args={[0.35, 0.22, 0.35, 12]} />
              <meshStandardMaterial color="#211738" metalness={0.9} roughness={0.2} emissive="#c89bff" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 4.45, 0]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshBasicMaterial color="#c89bff" />
            </mesh>
            <mesh position={[0, 12, 0]}>
              <cylinderGeometry args={[0.02, 0.25, 15, 12, 1, true]} />
              <meshBasicMaterial color="#c89bff" transparent opacity={0.12} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {/* 3. 3-Tiered Imperial Dais at Center */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[2.8, 3.2, 0.5, 16]} />
        <meshStandardMaterial color="#0e0a1a" metalness={0.85} roughness={0.3} emissive="#2a1244" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[2.0, 2.3, 0.4, 16]} />
        <meshStandardMaterial color="#171128" metalness={0.88} roughness={0.25} emissive="#ffd27a" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[1.3, 1.5, 0.35, 16]} />
        <meshStandardMaterial color="#23183d" metalness={0.92} roughness={0.2} emissive="#c89bff" emissiveIntensity={0.45} />
      </mesh>

      {/* Central Monument Pedestal Column */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.36, 0.58, 2.3, 8]} />
        <meshStandardMaterial color="#1a1230" metalness={0.95} roughness={0.15} emissive="#7c3aed" emissiveIntensity={0.4} />
      </mesh>

      {/* Levitating Grand Astrolabe Monument */}
      <group ref={relicRef} position={[0, 2.4, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial color="#ffd27a" emissive="#ffb84a" emissiveIntensity={2.8} metalness={1} roughness={0.05} />
        </mesh>
        <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.82, 0.03, 12, 48]} />
          <meshStandardMaterial color="#ffd27a" metalness={0.9} roughness={0.1} emissive="#ffb84a" emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={ringRef2} rotation={[-Math.PI / 4, 0.3, 0]}>
          <torusGeometry args={[0.98, 0.025, 12, 48]} />
          <meshStandardMaterial color="#c89bff" metalness={0.9} roughness={0.1} emissive="#9b6bff" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Ascending Beacon Beam to Infinity */}
      <mesh ref={beaconRef} position={[0, 14, 0]}>
        <cylinderGeometry args={[0.08, 0.8, 28, 16, 1, true]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.22} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} color="#ffd27a" intensity={2.6} distance={16} />
    </group>
  );
}

export function TrophySculpture({
  type,
  color,
  accent,
  isHovered,
}: {
  type: number;
  color: string;
  accent: string;
  isHovered: boolean;
}) {
  const trophyRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (trophyRef.current) {
      trophyRef.current.rotation.y += dt * (isHovered ? 1.0 : 0.4);
      trophyRef.current.position.y = 0.5 + Math.sin(t * 1.6 + type) * 0.07;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z += dt * (isHovered ? 1.4 : 0.6);
    if (ring2Ref.current) ring2Ref.current.rotation.x -= dt * (isHovered ? 1.2 : 0.5);
  });

  // Type 0: Sovereign Championship Cup
  if (type === 0) {
    return (
      <group ref={trophyRef}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.3, 0.42, 0.12, 24]} />
          <meshStandardMaterial color="#ffd27a" metalness={0.95} roughness={0.15} emissive="#d97706" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.28, 20]} />
          <meshStandardMaterial color="#ffd27a" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.48, 0.16, 0.52, 24, 1, false]} />
          <meshStandardMaterial color="#ffd27a" metalness={0.95} roughness={0.12} emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.03, 12, 32]} />
          <meshStandardMaterial color="#fff" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.46, 0.22, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.18, 0.03, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#ffd27a" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0.46, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.18, 0.03, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#ffd27a" metalness={1} roughness={0.1} />
        </mesh>
        <mesh ref={ring1Ref} position={[0, 0.72, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[0.62, 0.02, 8, 36]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#ffd27a" emissive="#ffd27a" emissiveIntensity={2.5} metalness={1} roughness={0.05} />
        </mesh>
      </group>
    );
  }

  // Type 1: Quantum Neural Core
  if (type === 1) {
    return (
      <group ref={trophyRef}>
        <mesh>
          <dodecahedronGeometry args={[0.36, 0]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isHovered ? 2.5 : 1.2}
            metalness={0.7}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.2, 0]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.62, 0.028, 12, 48]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        <mesh ref={ring2Ref} rotation={[-Math.PI / 4, 0.4, 0]}>
          <torusGeometry args={[0.76, 0.022, 12, 48]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.1} emissive={color} emissiveIntensity={0.4} />
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[Math.cos((k * Math.PI) / 2) * 0.9, 0, Math.sin((k * Math.PI) / 2) * 0.9]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>
    );
  }

  // Type 2: Cybernetic Navigation Armillary
  if (type === 2) {
    return (
      <group ref={trophyRef}>
        <mesh ref={ring1Ref} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.74, 0.035, 12, 48]} />
          <meshStandardMaterial color={color} metalness={0.92} roughness={0.15} emissive={color} emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.028, 12, 48]} />
          <meshStandardMaterial color="#e0f2fe" metalness={0.9} roughness={0.2} emissive="#38bdf8" emissiveIntensity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0.2, 0]}>
          <torusGeometry args={[0.46, 0.022, 12, 36]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={2.6} metalness={1} roughness={0.08} />
        </mesh>
      </group>
    );
  }

  // Type 3: Deep Learning Crystalline Obelisk
  if (type === 3) {
    return (
      <group ref={trophyRef}>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.26, 0.38, 0.65, 6]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isHovered ? 2.2 : 1.0}
            metalness={0.8}
            roughness={0.15}
            clearcoat={1.0}
          />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <coneGeometry args={[0.26, 0.45, 6]} />
          <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={2.8} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh ref={ring1Ref} position={[0, 0.28, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[0.54, 0.018, 8, 36]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh ref={ring2Ref} position={[0, 0.34, 0]} rotation={[Math.PI / 1.9, 0.3, 0]}>
          <torusGeometry args={[0.68, 0.014, 8, 36]} />
          <meshBasicMaterial color="#fff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    );
  }

  // Type 4: Celestial Cloud Nexus Spire
  if (type === 4) {
    return (
      <group ref={trophyRef}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.07, 0.2, 0.95, 8]} />
          <meshStandardMaterial color="#1e1828" metalness={0.9} roughness={0.2} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.025, 24]} />
          <meshStandardMaterial color={color} metalness={0.95} roughness={0.1} emissive={color} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.025, 24]} />
          <meshStandardMaterial color="#fff" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={3.0} />
        </mesh>
        <group ref={ring1Ref}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[Math.cos((k * Math.PI * 2) / 3) * 0.72, 0.05, Math.sin((k * Math.PI * 2) / 3) * 0.72]}>
              <boxGeometry args={[0.09, 0.09, 0.09]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  // Type 5: Micro-Architecture Silicon Keystone
  return (
    <group ref={trophyRef}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.28, 6]} />
        <meshStandardMaterial color="#130d22" metalness={0.92} roughness={0.2} emissive={accent} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.04, 6]} />
        <meshStandardMaterial color={color} metalness={1.0} roughness={0.1} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={isHovered ? 3.0 : 1.8} metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.66, 0.016, 8, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2.3, 0.2, 0]}>
        <torusGeometry args={[0.8, 0.012, 8, 36]} />
        <meshBasicMaterial color="#fff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function TrophyExhibit({
  achievement,
  angle,
  radius,
  index,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  achievement: Achievement;
  angle: number;
  radius: number;
  index: number;
  isHovered: boolean;
  onHover: (i: number) => void;
  onLeave: () => void;
  onClick: (i: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const spotlightRef = useRef<THREE.Mesh>(null);
  const spotlightMat = useRef<THREE.MeshBasicMaterial>(null);
  const scaleRef = useRef(1);

  const color = achievement.color ?? "#ffd27a";
  const accent = achievement.accent ?? "#3a1500";

  useFrame((_, dt) => {
    if (group.current) {
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      group.current.position.set(x, 0, z);

      const targetScale = isHovered ? 1.15 : 1.0;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, Math.min(1, dt * 7));
      group.current.scale.setScalar(scaleRef.current);
    }

    if (spotlightRef.current && spotlightMat.current) {
      const targetOp = isHovered ? 0.65 : 0.12;
      spotlightMat.current.opacity = THREE.MathUtils.lerp(spotlightMat.current.opacity, targetOp, Math.min(1, dt * 8));
    }
  });

  const titleText = achievement.name.toUpperCase();
  const subText = isHovered
    ? "▶ CLICK TO INSPECT TROPHY"
    : [achievement.issuer, achievement.year].filter(Boolean).join(" · ").toUpperCase();
  const exhibitTag = `EXHIBIT 0${index + 1} // HONORS ARTIFACT`;

  const titleFontSize = Math.min(0.155, Math.max(0.115, 2.7 / (titleText.length * 0.72)));
  const cardWidth = Math.max(2.6, titleText.length * titleFontSize * 0.78 + 0.65);
  const cardHeight = 0.58;

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(index);
      }}
      onPointerOut={() => onLeave()}
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
    >
      {/* 1. Holographic Beaming Light Pillar */}
      <mesh ref={spotlightRef} position={[0, 1.6, 0]}>
        <cylinderGeometry args={[1.05, 0.74, 3.4, 32, 1, true]} />
        <meshBasicMaterial
          ref={spotlightMat}
          color={color}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 3.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.02, 12, 48]} />
        <meshBasicMaterial color={color} transparent opacity={isHovered ? 0.85 : 0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* 2. Exhibition Plinth */}
      <mesh position={[0, -1.6, 0]}>
        <cylinderGeometry args={[1.05, 1.25, 0.35, 8]} />
        <meshStandardMaterial color="#0c0818" metalness={0.8} roughness={0.35} emissive="#1f0e35" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.62, 0.78, 1.25, 16]} />
        <meshStandardMaterial color="#150f26" metalness={0.88} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.76, 0.025, 12, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.1, 32]} />
        <meshPhysicalMaterial color="#211738" metalness={0.9} roughness={0.15} clearcoat={1.0} emissive={accent} emissiveIntensity={0.4} />
      </mesh>

      {/* 3. The 3D Sculpted Trophy Artwork */}
      <group position={[0, 0.25, 0]}>
        <TrophySculpture type={index % 6} color={color} accent={accent} isHovered={isHovered} />
      </group>

      {/* 4. Billboard Info Plaque */}
      <group position={[0, 3.48, 0]}>
        <Billboard follow={true}>
          <mesh position={[0, 0, -0.015]}>
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshBasicMaterial color="#050312" transparent opacity={0.88} depthWrite={false} />
          </mesh>
          <mesh position={[0, cardHeight / 2 - 0.015, 0.002]}>
            <planeGeometry args={[cardWidth, 0.025]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <Text
            font={FUTURA_FONT}
            position={[0, 0.16, 0.02]}
            fontSize={0.09}
            color={color}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.16}
            renderOrder={100}
          >
            {exhibitTag}
          </Text>
          <Text
            font={FUTURA_FONT}
            position={[0, 0.01, 0.02]}
            fontSize={titleFontSize}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            outlineWidth={0.012}
            outlineColor="#000"
            renderOrder={101}
          >
            {titleText}
          </Text>
          <Text
            font={FUTURA_FONT}
            position={[0, -0.15, 0.02]}
            fontSize={0.095}
            color={isHovered ? "#00f5ff" : color}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            letterSpacing={0.08}
            outlineWidth={0.008}
            outlineColor="#000"
            renderOrder={102}
          >
            {subText}
          </Text>
        </Billboard>
      </group>

      <pointLight position={[0, 1.2, 0]} color={color} intensity={isHovered ? 2.2 : 0.8} distance={6} />
    </group>
  );
}

export function Pantheon({
  centerZ,
  onSelectAchievement,
}: {
  centerZ: number;
  onSelectAchievement: (i: number) => void;
}) {
  const { achievements } = usePortfolio();
  const list = achievements && achievements.length > 0 ? achievements : DEFAULT_ACHIEVEMENTS;
  const [hoveredIdx, setHoveredIdx] = useState<number>(-1);
  const orbitGroup = useRef<THREE.Group>(null);
  const orbitAngle = useRef<number>(0);

  useEffect(() => {
    document.body.style.cursor = hoveredIdx !== -1 ? "pointer" : "";
  }, [hoveredIdx]);

  useFrame((_, dt) => {
    if (hoveredIdx === -1 && orbitGroup.current) {
      orbitAngle.current += dt * 0.04;
      orbitGroup.current.rotation.y = orbitAngle.current;
    }
  });

  const radius = Math.max(8.5, 5.5 + list.length * 0.55);

  return (
    <group position={[0, 1.2, centerZ]}>
      <CentralShrine trophyCount={list.length} radius={radius} />
      <group ref={orbitGroup}>
        {list.map((a, i) => (
          <TrophyExhibit
            key={`${a.name}-${i}`}
            achievement={a}
            angle={(i / list.length) * Math.PI * 2}
            radius={radius}
            index={i}
            isHovered={hoveredIdx === i}
            onHover={(idx) => setHoveredIdx(idx)}
            onLeave={() => setHoveredIdx(-1)}
            onClick={(idx) => onSelectAchievement(idx)}
          />
        ))}
      </group>
    </group>
  );
}

export default Pantheon;

