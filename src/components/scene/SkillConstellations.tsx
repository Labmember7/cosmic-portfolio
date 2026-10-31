import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { usePortfolio } from "@/content/portfolio";
import { FUTURA_FONT } from "@/config/theme";

const ORION_TEMPLATE: { x: number; y: number }[] = [
  { x: 0.0, y: 1.0 }, // 0 Head
  { x: 0.75, y: 0.45 }, // 1 Betelgeuse
  { x: -0.75, y: 0.45 }, // 2 Bellatrix
  { x: -0.32, y: 0.0 }, // 3 Mintaka (belt L)
  { x: 0.0, y: 0.0 }, // 4 Alnilam (belt C)
  { x: 0.32, y: 0.0 }, // 5 Alnitak (belt R)
  { x: 0.05, y: -0.35 }, // 6 Sword top
  { x: 0.05, y: -0.6 }, // 7 Sword tip
  { x: 0.7, y: -0.85 }, // 8 Saiph
  { x: -0.7, y: -0.85 }, // 9 Rigel
];

const ORION_LINES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 5],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 8],
  [3, 9],
  [4, 6],
  [6, 7],
];

const URSA_TEMPLATE: { x: number; y: number }[] = [
  { x: -0.95, y: 0.55 }, // 0 Dubhe
  { x: -0.95, y: -0.2 }, // 1 Merak
  { x: -0.3, y: -0.3 }, // 2 Phecda
  { x: -0.3, y: 0.45 }, // 3 Megrez
  { x: 0.25, y: 0.65 }, // 4 Alioth
  { x: 0.7, y: 0.85 }, // 5 Mizar
  { x: 1.1, y: 1.05 }, // 6 Alkaid
];

const URSA_LINES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [3, 4],
  [4, 5],
  [5, 6],
];

function fitSkills(skills: string[], n: number): string[] {
  if (skills.length === 0) return Array.from({ length: n }, () => "·");
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(skills[i % skills.length]);
  return out;
}

function ConstellationGroup({
  template,
  lines,
  skills,
  origin,
  scale,
  starColor,
  lineColor,
  label,
  labelColor,
}: {
  template: { x: number; y: number }[];
  lines: [number, number][];
  skills: string[];
  origin: [number, number, number];
  scale: number;
  starColor: string;
  lineColor: string;
  label: string;
  labelColor: string;
}) {
  const labels = useMemo(() => fitSkills(skills, template.length), [skills, template.length]);
  const positions = useMemo(
    () =>
      template.map((p, i) => {
        const jitterZ = Math.sin(i * 2.1) * 0.4;
        return new THREE.Vector3(
          origin[0] + p.x * scale,
          origin[1] + p.y * scale,
          origin[2] + jitterZ,
        );
      }),
    [template, origin, scale],
  );

  return (
    <group>
      {/* connective lines forming the figure */}
      {lines.map(([a, b], i) => {
        const geom = new THREE.BufferGeometry().setFromPoints([positions[a], positions[b]]);
        return (
          <line key={`l-${i}`}>
            <primitive object={geom} attach="geometry" />
            <lineBasicMaterial color={lineColor} transparent opacity={0.55} />
          </line>
        );
      })}

      {/* stars + labels */}
      {positions.map((p, i) => (
        <group key={`s-${i}`} position={p.toArray() as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshBasicMaterial color={starColor} />
          </mesh>
          {/* soft glow */}
          <mesh>
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshBasicMaterial color={starColor} transparent opacity={0.18} />
          </mesh>
          <Text
            font={FUTURA_FONT}
            position={[0, 0.5, 0]}
            fontSize={0.26}
            color="#fff"
            outlineWidth={0.008}
            outlineColor="#000"
          >
            {labels[i]}
          </Text>
        </group>
      ))}

      {/* constellation name */}
      <Text
        font={FUTURA_FONT}
        position={[origin[0], origin[1] + scale * 1.35, origin[2]]}
        fontSize={0.55}
        color={labelColor}
        outlineWidth={0.012}
        outlineColor="#000"
      >
        {label}
      </Text>
    </group>
  );
}

export function SkillConstellation({ centerZ }: { centerZ: number }) {
  const { skills: SKILLS } = usePortfolio();

  const baseY = 8;
  const scale = 3.2;
  const xOffset = 6.5;

  return (
    <group>
      <ConstellationGroup
        template={ORION_TEMPLATE}
        lines={ORION_LINES}
        skills={SKILLS.technical}
        origin={[-xOffset, baseY, centerZ]}
        scale={scale}
        starColor="#bfe9ff"
        lineColor="#7fd1ff"
        label="ORION · TECHNICAL"
        labelColor="#9bf0ff"
      />
      <ConstellationGroup
        template={URSA_TEMPLATE}
        lines={URSA_LINES}
        skills={SKILLS.soft}
        origin={[xOffset, baseY, centerZ]}
        scale={scale}
        starColor="#ffd9f2"
        lineColor="#ff9bd6"
        label="URSA MAJOR · SOFT"
        labelColor="#ff9bd6"
      />
    </group>
  );
}

export default SkillConstellation;
