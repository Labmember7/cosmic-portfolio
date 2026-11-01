import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { type SceneLayout, getExperienceRadius } from "@/config/story";
import type { Experience } from "@/content/portfolio";

export function UniverseTrail({
  layout,
  experiences,
}: {
  layout: SceneLayout;
  experiences: Experience[];
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulsePosRef = useRef<number>(0);

  // Compute 3D waypoints with clean planetary inflection points as originally designed
  const { curve } = useMemo(() => {
    const pts: THREE.Vector3[] = [
      new THREE.Vector3(0, 1.6, 0), // Starport Launch
    ];

    // Clean, natural planetary inflection points weaving between each experience planet
    experiences.forEach((_, i) => {
      const z = layout.experienceZs[i];
      const side = i % 2 === 0 ? -1 : 1;
      const r = getExperienceRadius(i);
      pts.push(new THREE.Vector3(side * (r + 2.2), 0.35, z));
    });

    // Wormhole corridor center
    pts.push(new THREE.Vector3(0, 0, layout.wormholeZ));

    // Slingshot: Curves cleanly AROUND the Forge Sun (sun is at [0,0,layout.galaxyZ], x=6.2 clears it completely)
    pts.push(new THREE.Vector3(6.2, 1.8, layout.galaxyZ));

    // Skill Constellation
    pts.push(new THREE.Vector3(0, 4.5, layout.skillsZ));

    // Pantheon Hall of Honors
    pts.push(new THREE.Vector3(0, 1.2, layout.pantheonZ));

    // The Singularity Event Horizon
    pts.push(new THREE.Vector3(0, 0.2, layout.finaleZ));

    // Infall: Absorbed cleanly into the Black Hole center
    pts.push(new THREE.Vector3(0, 0, layout.blackholeZ));

    // Centripetal Catmull-Rom spline provides clean, natural, balanced planetary inflection curves
    const spline = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
    return { curve: spline };
  }, [layout, experiences]);

  // Seamless tube geometry with per-vertex color gradients
  const { tubeGeometry } = useMemo(() => {
    const segments = 360;
    const radialSegments = 8;
    const radius = 0.024; // Subtle, delicate filament
    const geom = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false);

    // Compute continuous vertex colors to simulate gravitational redshift and black hole absorption
    const pos = geom.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    const colorStart = new THREE.Color("#38bdf8"); // Faint celestial cyan
    const colorMid = new THREE.Color("#60a5fa");   // Soft sky blue
    const colorRift = new THREE.Color("#a855f7");  // Violet wormhole
    const colorRedshift = new THREE.Color("#e11d48"); // Gravitational redshift crimson
    const colorSingularity = new THREE.Color("#080205"); // Event horizon black absorption

    for (let i = 0; i < count; i++) {
      const z = pos.getZ(i);
      const t = THREE.MathUtils.clamp((0 - z) / (0 - layout.blackholeZ), 0, 1);

      const c = new THREE.Color();
      if (t < 0.6) {
        c.lerpColors(colorStart, colorMid, t / 0.6);
      } else if (t < 0.8) {
        c.lerpColors(colorMid, colorRift, (t - 0.6) / 0.2);
      } else if (t < 0.94) {
        c.lerpColors(colorRift, colorRedshift, (t - 0.8) / 0.14);
      } else {
        c.lerpColors(colorRedshift, colorSingularity, (t - 0.94) / 0.06);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { tubeGeometry: geom };
  }, [curve, layout]);

  // Slower, subtle animation: gentle photon bead gliding along the fluid path
  useFrame((_, delta) => {
    pulsePosRef.current = (pulsePosRef.current + delta * 0.035) % 1;
    if (pulseRef.current && curve) {
      const p = curve.getPointAt(pulsePosRef.current);
      pulseRef.current.position.copy(p);

      const t = pulsePosRef.current;
      const opacity = t > 0.88 ? Math.max(0, (1 - t) / 0.12) * 0.5 : 0.45;
      const scale = t > 0.9 ? Math.max(0.2, (1 - t) * 10) : 1;
      pulseRef.current.scale.setScalar(scale);

      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = opacity;
        if (t > 0.88) {
          mat.color.set("#fb7185");
        } else {
          mat.color.set("#7dd3fc");
        }
      }
    }
  });

  return (
    <group name="universe-cosmic-trail">
      {/* Seamless Flight Ribbon with Clean Planetary Inflection Curves */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Delicate Photon Bead absorbed across the event horizon */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default UniverseTrail;
