import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Stars,
  useGLTF,
  Float,
  Html,
  Sparkles,
  Text,
  Trail,
  Points,
  PointMaterial,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";
import { useSpaceMusic } from "@/hooks/useSpaceMusic";
import orbitronFontUrl from "@fontsource/orbitron/files/orbitron-latin-700-normal.woff?url";

// Shared futuristic font for all in-scene 3D text (troika-three-text).
const FUTURA_FONT = orbitronFontUrl;
import {
  PortfolioContext,
  usePortfolio,
  fetchPortfolio,
  PORTFOLIO_MD_URL,
  type ProjectPattern,
  type PortfolioContent,
  type Experience,
  type Achievement,
} from "@/content/portfolio";

export const Route = createFileRoute("/")({
  component: Portfolio,
  head: () => ({
    meta: [
      { title: "A Cosmic Journey" },
      {
        name: "description",
        content:
          "A scripted 3D space journey: board the ship, travel past your experiences, dive through a wormhole, and reach a new galaxy of projects.",
      },
    ],
  }),
});

/* ================================================================== */
/* STORY                                                               */
/* ================================================================== */

type ChapterId =
  | "intro"
  | "experience-1"
  | "experience-2"
  | "experience-3"
  | "wormhole"
  | "galaxy"
  | "skills"
  | "pantheon"
  | "finale";

interface Chapter {
  id: ChapterId;
  title: string;
  caption: string;
  camera: [number, number, number];
  lookAt: [number, number, number];
  /** Optional intermediate waypoint the camera reaches first before lerping to final pose. */
  via?: { camera: [number, number, number]; lookAt: [number, number, number] };
}

/* ================================================================== */
/* DYNAMIC LAYOUT                                                      */
/* ================================================================== */

const EXP_SPACING = 30;
// Boarding scene sits around z≈0. Push the first experience far enough that
// the moon ground, dust and intro text never bleed into later chapters.
const EXP_FIRST_Z = -90;

interface SceneLayout {
  experienceZs: number[];
  wormholeZ: number;
  galaxyZ: number;
  skillsZ: number;
  pantheonZ: number;
  finaleZ: number;
  blackholeZ: number;
}

function computeLayout(experiences: Experience[]): SceneLayout {
  const experienceZs = experiences.map((e, i) => (typeof e.z === "number" ? e.z! : EXP_FIRST_Z - i * EXP_SPACING));
  const minZ = experienceZs.length ? Math.min(...experienceZs) : EXP_FIRST_Z;
  const wormholeZ = minZ - 40;
  const galaxyZ = wormholeZ - 50;
  const skillsZ = galaxyZ - 25;
  const pantheonZ = skillsZ - 30;
  const finaleZ = pantheonZ - 30;
  const blackholeZ = finaleZ - 15;
  return { experienceZs, wormholeZ, galaxyZ, skillsZ, pantheonZ, finaleZ, blackholeZ };
}

function buildChapters(experiences: Experience[], layout: SceneLayout, brandDescription?: string): Chapter[] {
  const chapters: Chapter[] = [
    {
      id: "intro",
      title: "01 · Boarding",
      caption:
        brandDescription ??
        "Meet Bacem — engineer of embedded systems, robotics and computer vision. He suits up and climbs aboard.",
      camera: [0, 2.4, 7],
      lookAt: [0, 1.6, -2],
    },
  ];
  experiences.forEach((e, i) => {
    const z = layout.experienceZs[i];
    const num = String(i + 2).padStart(2, "0");
    const heading = e.place ? `${e.place} — ${e.name}` : e.name;
    const isArsenal = /arsenal/i.test(heading);
    chapters.push({
      id: `experience-${i + 1}` as ChapterId,
      title: `${num} · ${e.year} — ${heading}`,
      caption: e.description ?? `Waypoint ${i + 1}: ${heading}.`,
      // Stand further back from the planet so the floating texts are fully readable;
      // move a tad closer for Arsenal so its text is crisp.
      camera: [0, 2.2, z + (isArsenal ? 10 : 14)],
      lookAt: [0, 0.5, z],
      // For the FIRST experience, ease out of the boarding scene with a
      // single on-path waypoint so the camera glides forward rather than
      // snapping between two distant points.
      ...(i === 0
        ? {
            via: {
              camera: [0, 3.6, (7 + z + 14) / 2],
              lookAt: [0, 1, z + 20],
            },
          }
        : {}),
    });
  });
  const base = experiences.length + 1;
  chapters.push(
    {
      id: "wormhole",
      title: `${String(base + 1).padStart(2, "0")} · The Wormhole`,
      caption: "Reality bends. We fold spacetime into a new galaxy.",
      camera: [0, 0, layout.wormholeZ + 5],
      lookAt: [0, 0, layout.wormholeZ - 20],
    },
    {
      id: "galaxy",
      title: `${String(base + 2).padStart(2, "0")} · The New Galaxy — Projects`,
      caption: "A spiral of ideas built into things. Click any planet to open its story.",
      camera: [0, 18, layout.galaxyZ + 30],
      lookAt: [0, 0, layout.galaxyZ - 5],
      via: {
        camera: [0, 0, layout.galaxyZ + 22],
        lookAt: [0, 0, layout.galaxyZ - 5],
      },
    },
    {
      id: "skills",
      title: `${String(base + 3).padStart(2, "0")} · The Skill Constellation`,
      caption: "Above the galaxy, a constellation of tools and languages currently in orbit.",
      camera: [0, 14, layout.skillsZ + 22],
      lookAt: [0, 8, layout.skillsZ - 10],
    },
    {
      id: "pantheon",
      title: `${String(base + 4).padStart(2, "0")} · The Pantheon — Honors`,
      caption:
        "An orbiting hall of medals: certifications and achievements earned along the journey. Each glowing badge marks a milestone in the cosmos.",
      camera: [9, 7.5, layout.pantheonZ + 18],
      lookAt: [0, 0.4, layout.pantheonZ],
    },
    {
      id: "finale",
      title: `${String(base + 5).padStart(2, "0")} · The Singularity`,
      caption: "Every journey ends here. Look back at where you've been or jump straight to any chapter.",
      camera: [0, 1.2, layout.finaleZ + 7],
      lookAt: [0, 0, layout.finaleZ - 5],
    },
  );
  return chapters;
}

/* ================================================================== */
/* ASSETS                                                              */
/* ================================================================== */

const ASTRONAUT_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

function AstronautModel(props: any) {
  const { scene } = useGLTF(ASTRONAUT_URL);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} {...props} />;
}
useGLTF.preload(ASTRONAUT_URL);

/* ================================================================== */
/* CAMERA RIG                                                          */
/* ================================================================== */

function CameraRig({ chapter }: { chapter: Chapter }) {
  const { camera } = useThree();
  const finalPos = useMemo(() => new THREE.Vector3(...chapter.camera), [chapter]);
  const finalLook = useMemo(() => new THREE.Vector3(...chapter.lookAt), [chapter]);
  const viaPos = useMemo(() => (chapter.via ? new THREE.Vector3(...chapter.via.camera) : null), [chapter]);
  const viaLook = useMemo(() => (chapter.via ? new THREE.Vector3(...chapter.via.lookAt) : null), [chapter]);
  const lookHelper = useMemo(() => new THREE.Object3D(), []);
  const currentLook = useRef(new THREE.Vector3(...chapter.lookAt));
  const phase = useRef<"via" | "final">("final");

  // When chapter changes, reset phase
  useEffect(() => {
    phase.current = chapter.via ? "via" : "final";
  }, [chapter]);

  useFrame((_, dt) => {
    // Faster, consistent cinematic easing
    const k = Math.min(1, dt * 1.1);
    let tgtPos = finalPos;
    let tgtLook = finalLook;
    if (phase.current === "via" && viaPos && viaLook) {
      tgtPos = viaPos;
      tgtLook = viaLook;
      // Switch earlier so we don't decelerate twice on the same path
      if (camera.position.distanceTo(viaPos) < 8) {
        phase.current = "final";
      }
    }
    camera.position.lerp(tgtPos, k);
    currentLook.current.lerp(tgtLook, k);
    lookHelper.position.copy(currentLook.current);
    camera.lookAt(lookHelper.position);
  });
  return null;
}

/* Wheel/pinch zoom by adjusting camera FOV — keeps camera position fixed,
   no quality loss (true optical zoom, not a CSS scale). Double-click resets. */
function ZoomControls({
  baseFov = 55,
  minFov = 18,
  maxFov = 70,
}: {
  baseFov?: number;
  minFov?: number;
  maxFov?: number;
}) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const el = gl.domElement;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const next = THREE.MathUtils.clamp(cam.fov + e.deltaY * 0.05, minFov, maxFov);
      if (next !== cam.fov) {
        cam.fov = next;
        cam.updateProjectionMatrix();
      }
    };
    const reset = () => {
      cam.fov = baseFov;
      cam.updateProjectionMatrix();
    };
    // pinch
    let pinchStart = 0;
    let pinchFov = baseFov;
    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart = dist(e.touches);
        pinchFov = cam.fov;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStart > 0) {
        e.preventDefault();
        const ratio = dist(e.touches) / pinchStart;
        cam.fov = THREE.MathUtils.clamp(pinchFov / ratio, minFov, maxFov);
        cam.updateProjectionMatrix();
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    el.addEventListener("dblclick", reset);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", handler);
      el.removeEventListener("dblclick", reset);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [camera, gl, baseFov, minFov, maxFov]);
  return null;
}

/* WASD + mouse-look free roam. Pointer-lock for mouse, Shift to boost,
   Space/Ctrl for up/down. Disabled while CameraRig is active. */
function FreeRoam({ enabled, speed = 6 }: { enabled: boolean; speed?: number }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled) {
      initialized.current = false;
      keys.current = {};
      return;
    }
    // seed yaw/pitch from current camera orientation
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    yaw.current = e.y;
    pitch.current = e.x;
    initialized.current = true;

    const el = gl.domElement;
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    const onClick = () => {
      if (document.pointerLockElement !== el) el.requestPointerLock?.();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      yaw.current -= e.movementX * 0.0025;
      pitch.current -= e.movementY * 0.0025;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    el.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", onMouseMove);
      if (document.pointerLockElement === el) document.exitPointerLock?.();
    };
  }, [enabled, camera, gl]);

  useFrame((_, dt) => {
    if (!enabled || !initialized.current) return;
    const k = keys.current;
    const boost = k["ShiftLeft"] || k["ShiftRight"] ? 3 : 1;
    const v = speed * boost * dt;
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(euler);
    if (k["KeyW"] || k["ArrowUp"]) camera.position.addScaledVector(forward, v);
    if (k["KeyS"] || k["ArrowDown"]) camera.position.addScaledVector(forward, -v);
    if (k["KeyD"] || k["ArrowRight"]) camera.position.addScaledVector(right, v);
    if (k["KeyA"] || k["ArrowLeft"]) camera.position.addScaledVector(right, -v);
    if (k["Space"]) camera.position.y += v;
    if (k["ControlLeft"] || k["ControlRight"]) camera.position.y -= v;
  });

  return null;
}

/* ================================================================== */
/* ELEGANT BLACK HOLE                                                  */
/* ================================================================== */

function BlackHole({
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

/* ================================================================== */
/* WORMHOLE — true tunnel the camera flies through                    */
/* ================================================================== */

function Wormhole({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  // Smooth seamless "speed-streaks" texture — vertical streaks along the tube length.
  const tunnelTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#04031a";
    g.fillRect(0, 0, 512, 512);
    // soft blue base wash
    const wash = g.createLinearGradient(0, 0, 512, 0);
    wash.addColorStop(0, "rgba(60,40,140,0.0)");
    wash.addColorStop(0.5, "rgba(80,60,180,0.35)");
    wash.addColorStop(1, "rgba(60,40,140,0.0)");
    g.fillStyle = wash;
    g.fillRect(0, 0, 512, 512);
    // streaks running along Y (tube length) — seamless because they span full height
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * 512;
      const w = 0.8 + Math.random() * 2.2;
      const hue = 200 + Math.random() * 120; // blues -> purples -> pinks
      const alpha = 0.35 + Math.random() * 0.55;
      const grad = g.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, `hsla(${hue},95%,70%,${alpha * 0.0})`);
      grad.addColorStop(0.5, `hsla(${hue},95%,75%,${alpha})`);
      grad.addColorStop(1, `hsla(${hue},95%,70%,${alpha * 0.0})`);
      g.fillStyle = grad;
      g.fillRect(x, 0, w, 512);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.anisotropy = 8;
    return t;
  }, []);

  useFrame((_, dt) => {
    // forward flow — scroll along the tube length only (no flicker)
    tunnelTex.offset.y -= dt * 0.45;
    if (innerRef.current) innerRef.current.rotation.y += dt * 0.05;
  });

  return (
    <group position={position} ref={groupRef}>
      {/* main tunnel — open cylinder along Z */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[4, 4, 40, 64, 1, true]} />
        <meshBasicMaterial
          map={tunnelTex}
          side={THREE.BackSide}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* inner soft glow tube — gives depth, rotates slowly */}
      <mesh ref={innerRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.6, 2.6, 40, 48, 1, true]} />
        <meshBasicMaterial
          color="#9aa8ff"
          side={THREE.BackSide}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* light rings along the length — evenly spaced, subtle */}
      {Array.from({ length: 14 }).map((_, i) => {
        const z = -19 + i * 2.85;
        const hue = 220 + (i / 14) * 100;
        return (
          <mesh key={i} position={[0, 0, z]}>
            <torusGeometry args={[3.95, 0.04, 12, 96]} />
            <meshBasicMaterial
              color={new THREE.Color(`hsl(${hue}, 90%, 70%)`)}
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      <Sparkles count={220} scale={[5, 5, 40]} size={2} speed={1.2} color="#cdd6ff" />
    </group>
  );
}

/* ================================================================== */
/* EXPERIENCE PLANETS                                                  */
/* ================================================================== */

/**
 * FresnelRim — additive back-side shell that fakes a soft atmospheric rim
 * glow using a view-dependent fresnel term. Cheap, no lights required.
 */
function FresnelRim({
  radius,
  color,
  power = 2.6,
  intensity = 1.0,
  scale = 1.06,
}: {
  radius: number;
  color: string;
  power?: number;
  intensity?: number;
  scale?: number;
}) {
  const material = useMemo(() => {
    const c = new THREE.Color(color);
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: c },
        uPower: { value: power },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uPower;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float f = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
          f = pow(f, uPower) * uIntensity;
          gl_FragColor = vec4(uColor * f, f);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
  }, [color, power, intensity]);

  return (
    <mesh scale={scale}>
      <sphereGeometry args={[radius, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function ExperiencePlanet({
  z,
  color,
  accent,
  name,
  year,
  place,
  side,
  pattern,
}: {
  z: number;
  color: string;
  accent: string;
  name: string;
  year: string;
  place?: string;
  side: number;
  pattern: ProjectPattern;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => makePlanetTexture(pattern, color, accent), [pattern, color, accent]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.2;
  });
  const x = side * 5;
  const displayPlace = place ?? name;
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhysicalMaterial
          map={tex.map}
          roughness={0.55}
          metalness={0.08}
          clearcoat={0.65}
          clearcoatRoughness={0.25}
          sheen={0.4}
          sheenColor={new THREE.Color(accent)}
          sheenRoughness={0.6}
          envMapIntensity={1.1}
          emissive={color}
          emissiveIntensity={0.06}
        />
      </mesh>
      <FresnelRim radius={2} color={accent} power={2.4} intensity={1.15} scale={1.045} />

      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <ringGeometry args={[2.6, 3.3, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 0, 2]} intensity={0.6} color={color} distance={10} />
      {/* Big stylized PLACE — the cool headline above the planet */}
      <Text font={FUTURA_FONT}
        position={[0, 4.1, 0]}
        fontSize={0.95}
        color={color}
        outlineWidth={0.03}
        outlineColor="#000"
        letterSpacing={0.18}
        anchorY="bottom"
      >
        {displayPlace.toUpperCase()}
      </Text>
      {place && (
        <Text font={FUTURA_FONT}
          position={[0, 3.35, 0]}
          fontSize={0.32}
          color="#fff"
          outlineWidth={0.01}
          outlineColor="#000"
          letterSpacing={0.05}
        >
          {name}
        </Text>
      )}
      <Text font={FUTURA_FONT} position={[0, 2.9, 0]} fontSize={0.22} color="#ffffffaa">
        {year}
      </Text>
    </group>
  );
}

/* ================================================================== */
/* GALAXY (spiral of projects + central sun)                          */
/* ================================================================== */

/* ---------- procedural noise utilities (value-noise fbm) ---------- */
function hash2(x: number, y: number, seed: number) {
  let h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y);
  const xf = x - xi,
    yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf),
    v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct: number, seed: number) {
  let v = 0,
    amp = 0.5,
    freq = 1;
  for (let i = 0; i < oct; i++) {
    v += amp * valueNoise(x * freq, y * freq, seed + i * 13);
    freq *= 2;
    amp *= 0.5;
  }
  return v;
}
// Ridged fbm (good for mountains / cracks / cloud bands)
function ridged(x: number, y: number, oct: number, seed: number) {
  let v = 0,
    amp = 0.5,
    freq = 1;
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(valueNoise(x * freq, y * freq, seed + i * 7) * 2 - 1);
    v += amp * n * n;
    freq *= 2;
    amp *= 0.5;
  }
  return v;
}

function hexToRgb(h: string) {
  const s = h.replace("#", "");
  const v = parseInt(
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s,
    16,
  );
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255] as [number, number, number];
}
function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function mix3(a: [number, number, number], b: [number, number, number], c: [number, number, number], t: number) {
  if (t < 0.5) return mix(a, b, t * 2);
  return mix(b, c, (t - 0.5) * 2);
}

/* Lightweight procedural texture: low-res color map only (no bump map).
   Cached per (pattern, color, accent) so repeated planets reuse textures.
   Lightweight canvas-2D approach: gradients + stamped blobs (no per-pixel fbm). */
const TEX_CACHE = new Map<string, { map: THREE.CanvasTexture }>();
function makePlanetTexture(pattern: ProjectPattern, color: string, accent: string) {
  const key = `${pattern}|${color}|${accent}`;
  const cached = TEX_CACHE.get(key);
  if (cached) return cached;

  // Moderate resolution — canvas drawing is GPU-accelerated, much cheaper than per-pixel loops.
  const W = 512,
    H = 256;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;

  // Deterministic PRNG seeded by colors so the same planet always looks the same
  const seedNum = (color.charCodeAt(1) || 1) * 131 + (accent.charCodeAt(1) || 1) * 977 + pattern.length * 53;
  let s = seedNum >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };

  const cMain = hexToRgb(color);
  const cAcc = hexToRgb(accent);
  const rgb = (c: [number, number, number], a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const lerp = (c: [number, number, number], d: [number, number, number], t: number): [number, number, number] => [
    c[0] + (d[0] - c[0]) * t,
    c[1] + (d[1] - c[1]) * t,
    c[2] + (d[2] - c[2]) * t,
  ];
  const bright = lerp(cMain, [255, 255, 255], 0.35) as [number, number, number];
  const deep = lerp(cAcc, [0, 0, 0], 0.55) as [number, number, number];

  // Base fill
  g.fillStyle = rgb(cAcc);
  g.fillRect(0, 0, W, H);

  // Helper: stamp a soft radial blob
  const blob = (x: number, y: number, r: number, col: string, alpha = 1) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, col.replace(/[\d.]+\)$/, `${alpha})`));
    grd.addColorStop(1, col.replace(/[\d.]+\)$/, "0)"));
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };

  if (pattern === "gas") {
    // Banded gas giant: horizontal stripes with subtle wobble + storms
    const bands = 9 + Math.floor(rnd() * 4);
    for (let i = 0; i < bands; i++) {
      const y0 = (i / bands) * H;
      const h = H / bands + 2;
      const t = i / bands;
      const polar = Math.pow(Math.abs(t - 0.5) * 2, 1.4);
      const col = lerp(lerp(cMain, cAcc, (i % 2) * 0.7), bright, polar * 0.5) as [number, number, number];
      g.fillStyle = rgb(col, 1);
      g.fillRect(0, y0, W, h);
    }
    // Turbulence — soft horizontal smears
    g.globalCompositeOperation = "overlay";
    for (let i = 0; i < 40; i++) {
      const y = rnd() * H;
      const x = rnd() * W;
      const r = 20 + rnd() * 60;
      blob(x, y, r * 2, rgb(bright, 1), 0.15);
    }
    g.globalCompositeOperation = "source-over";
    // Storm vortex
    blob(W * (0.3 + rnd() * 0.4), H * (0.4 + rnd() * 0.2), 35, rgb(bright, 1), 0.7);
  } else if (pattern === "lava") {
    // Molten: dark crust with glowing cracks
    g.fillStyle = rgb(deep);
    g.fillRect(0, 0, W, H);
    // Cracks via thin random lines
    g.lineCap = "round";
    for (let i = 0; i < 90; i++) {
      const x = rnd() * W,
        y = rnd() * H;
      const len = 20 + rnd() * 80;
      const ang = rnd() * Math.PI * 2;
      g.strokeStyle = rgb(lerp(cMain, [255, 200, 60], rnd() * 0.7) as [number, number, number], 0.85);
      g.lineWidth = 1 + rnd() * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      g.stroke();
    }
    // Hot pools
    for (let i = 0; i < 25; i++) {
      blob(rnd() * W, rnd() * H, 15 + rnd() * 30, rgb([255, 140, 40], 1), 0.5);
    }
  } else if (pattern === "ice") {
    // Icy world: white-blue with subtle fractures and polar brightening
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, rgb([245, 250, 255], 1));
    grad.addColorStop(0.5, rgb(cMain, 1));
    grad.addColorStop(1, rgb([240, 248, 255], 1));
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    // Patchy variation
    for (let i = 0; i < 50; i++) {
      blob(rnd() * W, rnd() * H, 25 + rnd() * 60, rgb(cAcc, 1), 0.18);
    }
    // Fractures
    for (let i = 0; i < 35; i++) {
      const x = rnd() * W,
        y = rnd() * H;
      const len = 30 + rnd() * 90;
      const ang = rnd() * Math.PI * 2;
      g.strokeStyle = rgb([180, 210, 240], 0.4);
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      g.stroke();
    }
  } else if (pattern === "grid") {
    // Techno world: dark with glowing continents and faint grid
    g.fillStyle = rgb(deep);
    g.fillRect(0, 0, W, H);
    // Continents
    for (let i = 0; i < 18; i++) {
      blob(rnd() * W, rnd() * H, 30 + rnd() * 60, rgb(cMain, 1), 0.85);
    }
    for (let i = 0; i < 30; i++) {
      blob(rnd() * W, rnd() * H, 8 + rnd() * 20, rgb(bright, 1), 0.6);
    }
    // Glow grid lines
    g.strokeStyle = rgb(bright, 0.18);
    g.lineWidth = 0.6;
    for (let i = 0; i < W; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, H);
      g.stroke();
    }
    for (let i = 0; i < H; i += 32) {
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(W, i);
      g.stroke();
    }
  } else {
    // Earth-like: ocean base + scattered continents + polar caps + clouds
    const ocean = g.createLinearGradient(0, 0, 0, H);
    ocean.addColorStop(0, rgb(lerp(cAcc, [255, 255, 255], 0.3) as [number, number, number]));
    ocean.addColorStop(0.5, rgb(cAcc));
    ocean.addColorStop(1, rgb(lerp(cAcc, [255, 255, 255], 0.3) as [number, number, number]));
    g.fillStyle = ocean;
    g.fillRect(0, 0, W, H);
    // Continents
    for (let i = 0; i < 14; i++) {
      const cx = rnd() * W;
      const cy = H * (0.2 + rnd() * 0.6);
      const r = 25 + rnd() * 55;
      blob(cx, cy, r, rgb(cMain, 1), 0.95);
      // texture inside
      for (let j = 0; j < 6; j++) {
        blob(cx + (rnd() - 0.5) * r, cy + (rnd() - 0.5) * r, r * 0.3, rgb(bright, 1), 0.4);
      }
    }
    // Polar caps
    const polarTop = g.createLinearGradient(0, 0, 0, H * 0.18);
    polarTop.addColorStop(0, rgb([245, 250, 255], 1));
    polarTop.addColorStop(1, rgb([245, 250, 255], 0));
    g.fillStyle = polarTop;
    g.fillRect(0, 0, W, H * 0.18);
    const polarBot = g.createLinearGradient(0, H * 0.82, 0, H);
    polarBot.addColorStop(0, rgb([245, 250, 255], 0));
    polarBot.addColorStop(1, rgb([245, 250, 255], 1));
    g.fillStyle = polarBot;
    g.fillRect(0, H * 0.82, W, H * 0.18);
    // Clouds
    for (let i = 0; i < 30; i++) {
      blob(rnd() * W, rnd() * H, 18 + rnd() * 40, rgb([255, 255, 255], 1), 0.25);
    }
  }

  const map = new THREE.CanvasTexture(cv);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  map.colorSpace = THREE.SRGBColorSpace;

  const result = { map };
  TEX_CACHE.set(key, result);
  return result;
}

function ProjectPlanet({
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
  const tex = useMemo(() => makePlanetTexture(pattern, color, accent), [pattern, color, accent]);

  useFrame((state, dt) => {
    if (ref.current) {
      const progradeSpeed = Math.abs(speed);
      const orbitRadius = Math.abs(radius);
      const a = angle + state.clock.elapsedTime * progradeSpeed;
      ref.current.position.x = Math.cos(a) * orbitRadius;
      ref.current.position.z = centerZ - Math.sin(a) * orbitRadius;
      ref.current.position.y = Math.sin(a * 1.3) * 0.6;
    }
    if (planetRef.current) planetRef.current.rotation.y += dt * 0.25;
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
          map={tex.map}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.08}
          roughness={0.5}
          metalness={0.1}
          clearcoat={0.7}
          clearcoatRoughness={0.22}
          sheen={0.45}
          sheenColor={new THREE.Color(accent)}
          sheenRoughness={0.55}
          envMapIntensity={1.15}
        />
      </mesh>
      <group scale={hovered ? size * 1.15 : size}>
        <FresnelRim radius={0.9} color={accent} power={2.2} intensity={hovered ? 1.6 : 1.1} scale={1.05} />
      </group>

      {/* Always-visible small name label so planets are identifiable from afar */}
      <Text font={FUTURA_FONT}
        position={[0, 1.1 * size + 0.35, 0]}
        fontSize={hovered ? 0.55 : 0.32}
        color={color}
        outlineWidth={0.012}
        outlineColor="#000"
        anchorY="bottom"
      >
        {name}
      </Text>
      {hovered && (
        <Html distanceFactor={8} position={[0, 1.4 * size + 0.9, 0]} center>
          <div className="pointer-events-none rounded-lg border border-white/25 bg-black/90 px-4 py-2 text-base font-semibold shadow-2xl whitespace-nowrap">
            <span style={{ color }}>{name}</span>
            <div className="text-white/60 text-xs font-normal mt-0.5">click to open</div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* Animated fiery sun — multi-layered: hot core, noisy surface, corona, sparks */
function FierySun({ position }: { position: [number, number, number] }) {
  const surfRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

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
      coronaRef.current.scale.setScalar(s);
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
      <sprite ref={coronaRef as any} scale={[10, 10, 1]}>
        <spriteMaterial map={coronaTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight intensity={3} color="#ffb86b" distance={80} />
      <Sparkles count={80} scale={6} size={3} speed={0.6} color="#ffd9a3" />
    </group>
  );
}

function Galaxy({ onSelectProject, centerZ }: { onSelectProject: (i: number) => void; centerZ: number }) {
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
      <Points ref={ref as any} positions={particles} stride={3}>
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
          <meshBasicMaterial color={p.color} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
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

/* ================================================================== */
/* SKILL CONSTELLATION                                                 */
/* ================================================================== */

/**
 * Two named star-shapes, side by side, so each skill group reads as a
 * distinct constellation rather than a generic ring of dots.
 *
 *   ORION  (technical) — recognizable tall shape with the famous belt.
 *   URSA MAJOR (soft) — the Big Dipper.
 *
 * Templates are normalized 2D (x, y) in roughly [-1, 1]. We pad/truncate
 * the user's skills to match each template length so labels always land
 * on a star.
 */
const ORION_TEMPLATE: { x: number; y: number }[] = [
  { x: 0.0, y: 1.0 }, // 0  Head
  { x: 0.75, y: 0.45 }, // 1  Betelgeuse
  { x: -0.75, y: 0.45 }, // 2  Bellatrix
  { x: -0.32, y: 0.0 }, // 3  Mintaka (belt L)
  { x: 0.0, y: 0.0 }, // 4  Alnilam (belt C)
  { x: 0.32, y: 0.0 }, // 5  Alnitak (belt R)
  { x: 0.05, y: -0.35 }, // 6  Sword top
  { x: 0.05, y: -0.6 }, // 7  Sword tip
  { x: 0.7, y: -0.85 }, // 8  Saiph
  { x: -0.7, y: -0.85 }, // 9  Rigel
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

// Ursa Major / The Big Dipper — 7 stars, bowl on the left, handle sweeping up-right.
const URSA_TEMPLATE: { x: number; y: number }[] = [
  { x: -0.95, y: 0.55 }, // 0 Dubhe   (bowl top-left)
  { x: -0.95, y: -0.2 }, // 1 Merak   (bowl bottom-left)
  { x: -0.3, y: -0.3 }, // 2 Phecda  (bowl bottom-right)
  { x: -0.3, y: 0.45 }, // 3 Megrez  (bowl top-right / handle joint)
  { x: 0.25, y: 0.65 }, // 4 Alioth  (handle 1)
  { x: 0.7, y: 0.85 }, // 5 Mizar   (handle 2)
  { x: 1.1, y: 1.05 }, // 6 Alkaid  (handle tip)
];
const URSA_LINES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0], // bowl
  [3, 4],
  [4, 5],
  [5, 6], // handle
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
        return new THREE.Vector3(origin[0] + p.x * scale, origin[1] + p.y * scale, origin[2] + jitterZ);
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
          <Text font={FUTURA_FONT} position={[0, 0.5, 0]} fontSize={0.26} color="#fff" outlineWidth={0.008} outlineColor="#000">
            {labels[i]}
          </Text>
        </group>
      ))}

      {/* constellation name */}
      <Text font={FUTURA_FONT}
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

function SkillConstellation({ centerZ }: { centerZ: number }) {
  const { skills: SKILLS } = usePortfolio();

  // Chapter camera sits at (0, 14, centerZ + 10) looking at (0, 8, centerZ - 10),
  // so anything around y≈8 and x in [-12, 12] reads dead-center on screen.
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

/* ================================================================== */
/* SHIP + ASTRONAUT (always visible — locked to camera)                */
/* ================================================================== */

function CompanionShip({ onContact }: { onContact: () => void }) {
  const { camera, scene } = useThree();
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Attach the group to the camera so it always renders in front, regardless of where the camera flies.
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    camera.add(g);
    // Ensure scene contains the camera so camera-children render
    if (!scene.children.includes(camera)) scene.add(camera);
    const hasSkipAncestor = (o: THREE.Object3D | null) => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (cur.userData?.skipDepthOverride) return true;
        cur = cur.parent;
      }
      return false;
    };
    g.traverse((obj) => {
      obj.frustumCulled = false;
      if (!(obj as THREE.Mesh).isMesh) return;
      if (hasSkipAncestor(obj)) return;
      (obj as THREE.Mesh).renderOrder = 1000;
      const m = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (m) {
        const list = Array.isArray(m) ? m : [m];
        list.forEach((mat) => {
          (mat as any).fog = false;
          (mat as any).depthTest = false;
          (mat as any).depthWrite = false;
          (mat as any).transparent = true;
        });
      }
    });
    return () => {
      camera.remove(g);
    };
  }, [camera, scene]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.set(4.5, -2.8 + Math.sin(t) * 0.05, -7.0);
    group.current.rotation.set(
      Math.sin(t * 0.5) * 0.04,
      Math.PI + 0.4 + Math.sin(t * 0.3) * 0.03,
      Math.sin(t * 0.7) * 0.04,
    );
  });

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
  }, [hovered]);

  return (
    <group
      ref={group}
      renderOrder={999}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onContact();
      }}
    >
      {/* hull */}
      <mesh>
        <capsuleGeometry args={[0.32, 0.9, 16, 32]} />
        <meshStandardMaterial
          color="#e2e6ee"
          metalness={0.85}
          roughness={0.18}
          emissive="#222"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* cockpit */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial
          color="#7fd1ff"
          transparent
          opacity={0.7}
          metalness={0.6}
          roughness={0.05}
          emissive="#1e88ff"
          emissiveIntensity={1.0}
        />
      </mesh>
      {/* tiny pilot silhouette inside cockpit */}
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* wings */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.04, 1.2, 0.24]} />
        <meshStandardMaterial color="#ff7a18" metalness={0.5} emissive="#ff7a18" emissiveIntensity={0.3} />
      </mesh>
      {/* engine glow with trail */}
      <Trail width={0.4} length={4} color={"#ff8a3c"} attenuation={(t) => t * t}>
        <mesh position={[0, -0.7, 0]}>
          <coneGeometry args={[0.2, 0.5, 16]} />
          <meshBasicMaterial color="#ff5a3c" />
        </mesh>
      </Trail>
      {/* antenna + pinging tip */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.6, 8]} />
        <meshStandardMaterial color="#cccccc" emissive="#888" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>
      <SignalRings />
      {/* tiny self-light so the ship is never dark */}
      <pointLight position={[0, 0.5, 0.5]} intensity={0.6} color="#bcd6ff" distance={3} />

      <ProbeBillboardLabel hovered={hovered} />
    </group>
  );
}

function ProbeBillboardLabel({ hovered }: { hovered: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const cam = state.camera.position;
    group.current.lookAt(cam.x, cam.y, cam.z);
    const t = state.clock.elapsedTime;
    const pulse = 0.9 + Math.sin(t * 2.5) * 0.1;
    group.current.scale.setScalar((hovered ? 1.15 : 1) * pulse);
  });
  return (
    <group ref={group} position={[0, 1.7, 0]} userData={{ skipDepthOverride: true }}>
      <Html center distanceFactor={6} zIndexRange={[10, 0]} transform sprite>
        <div
          className="pointer-events-none select-none flex flex-col items-center"
          style={{ fontFamily: "'Orbitron','Rajdhani',monospace" }}
        >
          <div
            className="whitespace-nowrap font-black tracking-[0.22em]"
            style={{
              fontSize: 9,
              color: hovered ? "#c8ffc8" : "#b6ffb6",
              textShadow: "0 0 2px rgba(0,20,0,0.9), 0 1px 0 #001a00",
              WebkitTextStroke: "0.4px #001a00",
            }}
          >
            CONTACT GROUND CONTROL
          </div>
          <div
            className="whitespace-nowrap mt-1"
            style={{
              fontSize: 6,
              letterSpacing: "0.55em",
              color: hovered ? "#d8ffd8" : "#b6ffb6",
              textShadow: "0 0 2px rgba(0,20,0,0.9)",
            }}
          >
            CH.7 · OPEN COMMS
          </div>
        </div>
      </Html>
    </group>
  );
}

function SignalRings() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const t = (state.clock.elapsedTime * 0.55 + i * 0.33) % 1;
      c.scale.setScalar(0.2 + t * 1.6);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1 - t;
    });
  });
  return (
    <group ref={ref} position={[0, 1.3, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.21, 32]} />
          <meshBasicMaterial color="#ff3366" transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================== */
/* INTRO SCENE: astronaut + docked ship                                */
/* ================================================================== */

/* ---------------- Moon surface ---------------- */

function MoonDust() {
  const ref = useRef<THREE.Points>(null);
  const { positions, velocities } = useMemo(() => {
    const N = 220;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = Math.random() * 5.5;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = -0.3 + Math.random() * 1.6;
      positions[i * 3 + 2] = Math.sin(a) * r;
      // wind blowing in the direction of travel (-Z) with a soft swirl
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.15;
      velocities[i * 3 + 1] = (Math.random() - 0.3) * 0.05;
      velocities[i * 3 + 2] = -0.25 - Math.random() * 0.35;
    }
    return { positions, velocities };
  }, []);

  useFrame((_, dt) => {
    const geom = ref.current?.geometry as THREE.BufferGeometry | undefined;
    if (!geom) return;
    const attr = geom.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 0] += velocities[i + 0] * dt;
      arr[i + 1] += velocities[i + 1] * dt;
      arr[i + 2] += velocities[i + 2] * dt;
      // recycle particles that drift away
      if (arr[i + 2] < -6 || arr[i + 1] > 1.6 || Math.abs(arr[i]) > 6) {
        const r = Math.random() * 2 + 1.5;
        const a = Math.random() * Math.PI * 0.6 + Math.PI * 0.2; // behind astronaut
        arr[i + 0] = Math.cos(a) * r;
        arr[i + 1] = -0.2 + Math.random() * 0.4;
        arr[i + 2] = Math.sin(a) * r + 2;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#d8c8b0" transparent opacity={0.55} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function MoonGround() {
  // A circular patch of moon ground with scattered rocks.
  const rocks = useMemo(() => {
    const items: { p: [number, number, number]; s: number; r: number }[] = [];
    const rand = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 22; i++) {
      const a = rand(i + 1) * Math.PI * 2;
      const r = 1.6 + rand(i + 7) * 4.2;
      const s = 0.08 + rand(i + 13) * 0.35;
      items.push({
        p: [Math.cos(a) * r, -0.42 + s * 0.5, Math.sin(a) * r],
        s,
        r: rand(i + 21) * Math.PI * 2,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {/* main disc */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6.5, 64]} />
        <meshStandardMaterial color="#7a7468" roughness={1} metalness={0} emissive="#1a1814" emissiveIntensity={0.2} />
      </mesh>
      {/* subtle rim glow disc beneath */}
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.2, 7.2, 64]} />
        <meshBasicMaterial color="#7fd1ff" transparent opacity={0.12} />
      </mesh>
      {/* craters as flat darker discs */}
      {[
        [1.2, 0.6, -0.4],
        [-2.1, -0.49, 1.3],
        [2.4, -0.49, 1.8],
        [-1.6, -0.49, -2.2],
        [3.4, -0.49, -1.1],
      ].map((c, i) => (
        <mesh key={i} position={[c[0], -0.48, c[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.45 + (i % 3) * 0.2, 24]} />
          <meshStandardMaterial color="#56524a" roughness={1} />
        </mesh>
      ))}
      {/* scattered rocks */}
      {rocks.map((rk, i) => (
        <mesh key={i} position={rk.p} rotation={[0, rk.r, 0]} castShadow>
          <dodecahedronGeometry args={[rk.s, 0]} />
          <meshStandardMaterial color="#8a8275" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function IntroAstronaut() {
  const { brand: BRAND } = usePortfolio();
  // Journey heads in -Z. Astronaut faces -Z (forward).
  // Camera starts behind him at +Z, then sweeps away into the scripted flow.
  return (
    <group position={[0, 0, 0]}>
      {/* Cool moonlight key from above-front, warm rim from behind */}
      <directionalLight position={[-2, 6, -4]} intensity={1.4} color="#cfe6ff" />
      <pointLight position={[0, 2, 4]} intensity={0.8} color="#ffd9a0" distance={8} decay={2} />
      <pointLight position={[0, 1.2, -3]} intensity={0.6} color="#7fd1ff" distance={6} decay={2} />

      <MoonGround />
      <MoonDust />

      {/* Astronaut standing on the moon, facing the journey (-Z) */}
      <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.12}>
        <Suspense fallback={null}>
          <AstronautModel scale={1.3} position={[0, -0.5, 0]} rotation={[0, Math.PI, 0]} />
        </Suspense>
      </Float>

      {/* Title floats above the astronaut, always facing the camera */}
      <Billboard position={[0, 2.6, 2.2]} follow lockX={false} lockY={false} lockZ={false}>
        <Text font={FUTURA_FONT} position={[0, 0.4, 0]} fontSize={0.5} color="#fff" outlineWidth={0.012} outlineColor="#000">
          {BRAND.name}
        </Text>
        <Text font={FUTURA_FONT} position={[0, -0.2, 0]} fontSize={0.25} color="#7fd1ff">
          {BRAND.tagline}
        </Text>
      </Billboard>
    </group>
  );
}

/* ================================================================== */
/* SHOOTING STARS — sparse, glowing meteors with tapered trails        */
/* ================================================================== */

const SHOOTING_PALETTE = ["#ffffff", "#bcdcff", "#ffd6a3", "#d9b8ff"];

function ShootingStar({ layout, seed }: { layout: SceneLayout; seed: number }) {
  const head = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const state = useRef({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 1,
    cooldown: 1 + Math.random() * 3 + seed * 0.7,
    color: new THREE.Color("#ffffff"),
    visible: false,
  });

  const respawn = () => {
    const s = state.current;
    const z = THREE.MathUtils.lerp(layout.finaleZ - 5, 10, Math.random());
    const side = Math.random() < 0.5 ? -1 : 1;
    s.pos.set(side * (35 + Math.random() * 25), 14 + Math.random() * 18, z);
    const dir = new THREE.Vector3(
      -side * (0.5 + Math.random() * 0.6),
      -(0.45 + Math.random() * 0.4),
      (Math.random() - 0.5) * 0.25,
    )
      .normalize()
      .multiplyScalar(8 + Math.random() * 7);
    s.vel.copy(dir);
    s.maxLife = 3.5 + Math.random() * 2.2;
    s.life = s.maxLife;
    s.color.set(SHOOTING_PALETTE[Math.floor(Math.random() * SHOOTING_PALETTE.length)]);
    s.visible = true;
  };

  useFrame((_, dt) => {
    const s = state.current;
    if (!s.visible) {
      s.cooldown -= dt;
      if (s.cooldown <= 0) respawn();
      if (head.current) head.current.visible = false;
      if (halo.current) halo.current.visible = false;
      return;
    }
    s.life -= dt;
    s.pos.addScaledVector(s.vel, dt);
    if (s.life <= 0) {
      s.visible = false;
      s.cooldown = 2 + Math.random() * 5;
      return;
    }
    const fade = Math.sin((1 - s.life / s.maxLife) * Math.PI);
    if (head.current) {
      head.current.visible = true;
      head.current.position.copy(s.pos);
      const mat = head.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(s.color);
      mat.opacity = 0.95 * fade;
    }
    if (halo.current) {
      halo.current.visible = true;
      halo.current.position.copy(s.pos);
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(s.color);
      mat.opacity = 0.4 * fade;
    }
  });

  return (
    <group>
      <Trail width={0.55} length={6} color={"#ffffff"} attenuation={(t) => t * t * t} decay={1.4}>
        <mesh ref={head}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      </Trail>
      <mesh ref={halo}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function ShootingStars({ layout }: { layout: SceneLayout }) {
  const COUNT = 4;
  return (
    <>
      {Array.from({ length: COUNT }).map((_, i) => (
        <ShootingStar key={i} layout={layout} seed={i} />
      ))}
    </>
  );
}

/* ================================================================== */
/* PANTHEON — Certifications & Achievements                            */
/* ================================================================== */

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
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

function Medal({
  achievement,
  angle,
  radius,
  yOffset,
  speed,
  index,
  hoveredRef,
}: {
  achievement: Achievement;
  angle: number;
  radius: number;
  yOffset: number;
  speed: number;
  index: number;
  hoveredRef: React.MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const haloMesh = useRef<THREE.Mesh>(null);
  const discMat = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const spotlightRef = useRef<THREE.Mesh>(null);
  const spotlightMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const shimmerRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const frozenAngle = useRef(angle);
  const scaleRef = useRef(1);
  const color = achievement.color ?? "#ffd27a";
  const accent = achievement.accent ?? "#3a1500";

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const isHovered = hoveredRef.current === index;
    const anyHovered = hoveredRef.current !== -1;

    // Freeze angle when anything is hovered; resume from frozen position
    if (!anyHovered) {
      frozenAngle.current = angle + t * speed;
    }
    const a = frozenAngle.current;

    if (group.current) {
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const y = yOffset + Math.sin(a) * 0.6 + Math.sin(t * 0.6 + angle) * 0.15;
      group.current.position.set(x, y, z);
      group.current.rotation.y = -a + Math.PI / 2;

      // Smooth scale transition
      const targetScale = isHovered ? 1.8 : 1.0;
      scaleRef.current += (targetScale - scaleRef.current) * 0.1;
      group.current.scale.setScalar(scaleRef.current);
    }

    // Ring spin — also freezes when hovered
    if (ring.current) {
      if (!anyHovered) ring.current.rotation.z = t * 0.4 + angle;
    }

    // Boost halo glow on hover
    if (haloMesh.current) {
      const mat = haloMesh.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isHovered ? 0.7 : 0.18;
      mat.opacity += (targetOpacity - mat.opacity) * 0.1;
    }

    // Boost disc emissive on hover
    if (discMat.current) {
      const targetEmissive = isHovered ? 2.5 : 0.55;
      discMat.current.emissiveIntensity += (targetEmissive - discMat.current.emissiveIntensity) * 0.1;
    }

    // Boost ring emissive on hover
    if (ringMat.current) {
      const targetEmissive = isHovered ? 4.0 : 1.2;
      ringMat.current.emissiveIntensity += (targetEmissive - ringMat.current.emissiveIntensity) * 0.1;
    }

    // Spotlight beam — visible only when hovered
    if (spotlightRef.current && spotlightMatRef.current) {
      const targetOpacity = isHovered ? 0.55 : 0.0;
      spotlightMatRef.current.opacity += (targetOpacity - spotlightMatRef.current.opacity) * 0.1;
      spotlightRef.current.visible = spotlightMatRef.current.opacity > 0.005;
      if (isHovered) {
        // Gentle pulse on beam
        spotlightMatRef.current.opacity = targetOpacity + Math.sin(t * 3) * 0.05;
      }
    }

    // Shimmer ring — pulsing halo ring on hover
    if (shimmerRef.current) {
      const mat = shimmerRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isHovered ? 0.7 + Math.sin(t * 5) * 0.2 : 0.0;
      mat.opacity += (targetOpacity - mat.opacity) * 0.12;
      shimmerRef.current.visible = mat.opacity > 0.005;
      if (isHovered) {
        // Pulsing scale on shimmer
        const pulse = 1 + Math.sin(t * 4) * 0.08;
        shimmerRef.current.scale.setScalar(pulse);
      }
    }

    // Outer decorative ring — appears on hover
    if (outerRingRef.current) {
      const mat = outerRingRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isHovered ? 0.9 : 0.55;
      mat.opacity += (targetOpacity - mat.opacity) * 0.1;
    }
  });

  return (
    <group
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        hoveredRef.current = index;
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        hoveredRef.current = -1;
      }}
    >
      {/* glowing back-halo */}
      <mesh ref={haloMesh}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* SPOTLIGHT BEAM — cone descending from above, only visible on hover */}
      <mesh ref={spotlightRef} position={[0, 5.5, 0]} rotation={[Math.PI, 0, 0]} visible={false}>
        <coneGeometry args={[1.6, 11, 32, 1, true]} />
        <meshBasicMaterial
          ref={spotlightMatRef}
          color={color}
          transparent
          opacity={0.0}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* SHIMMER RING — pulsing ring on hover */}
      <mesh ref={shimmerRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[1.1, 0.04, 12, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* medal disc */}
      <mesh>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 32]} />
        <meshStandardMaterial
          ref={discMat}
          color={accent}
          emissive={color}
          emissiveIntensity={0.55}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      {/* rotating laurel ring */}
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.04, 12, 64]} />
        <meshStandardMaterial
          ref={ringMat}
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          metalness={1}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.018, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* point light per medal for sparkle */}
      <pointLight color={color} intensity={0.6} distance={3} />
      {/* label card */}
      {/* 3D card backdrop — depth-sorts naturally so back medals stay behind front ones */}
      <group position={[0, -1.45, 0]}>
        <Billboard>
          {/* outer glow halo */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[3.6, 1.7]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.16}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* card body */}
          <mesh>
            <planeGeometry args={[3.1, 1.4]} />
            <meshBasicMaterial color="#06031a" transparent opacity={0.95} />
          </mesh>
          {/* top/bottom accent bars */}
          <mesh position={[0, 0.68, 0.002]}>
            <planeGeometry args={[3.1, 0.035]} />
            <meshBasicMaterial color={color} transparent opacity={0.95} />
          </mesh>
          <mesh position={[0, -0.68, 0.002]}>
            <planeGeometry args={[3.1, 0.035]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
          {/* side accent ticks */}
          <mesh position={[-1.5, 0, 0.002]}>
            <planeGeometry args={[0.04, 1.4]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
          <mesh position={[1.5, 0, 0.002]}>
            <planeGeometry args={[0.04, 1.4]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>

          <Text font={FUTURA_FONT}
            position={[0, 0.44, 0.003]}
            fontSize={0.28}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.006}
            outlineColor="#000"
          >
            {achievement.icon ?? "✦"}
          </Text>
          <Text font={FUTURA_FONT}
            position={[0, 0.02, 0.003]}
            fontSize={0.18}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.85}
            textAlign="center"
            letterSpacing={0.04}
            lineHeight={1.15}
            outlineWidth={0.015}
            outlineColor="#000"
          >
            {achievement.name.toUpperCase()}
          </Text>
          {(achievement.issuer || achievement.year) && (
            <Text font={FUTURA_FONT}
              position={[0, -0.42, 0.003]}
              fontSize={0.11}
              color={color}
              anchorX="center"
              anchorY="middle"
              maxWidth={2.85}
              textAlign="center"
              letterSpacing={0.16}
              lineHeight={1.2}
              outlineWidth={0.005}
              outlineColor="#000"
            >
              {[achievement.issuer, achievement.year].filter(Boolean).join("  ·  ").toUpperCase()}
            </Text>
          )}
        </Billboard>
      </group>
    </group>
  );
}

function Pantheon({ centerZ }: { centerZ: number }) {
  const { achievements } = usePortfolio();
  const list = achievements && achievements.length > 0 ? achievements : DEFAULT_ACHIEVEMENTS;

  // Shared ref: -1 = nothing hovered, N = index of hovered medal
  const hoveredRef = useRef<number>(-1);

  const pedestal = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const orbitRingMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const anyHovered = hoveredRef.current !== -1;

    // Pedestal slow rotation — stops when something is hovered
    if (pedestal.current && !anyHovered) {
      pedestal.current.rotation.y = t * 0.1;
    }
    // Beam pulse — dims slightly on hover to shift focus to medal spotlight
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = anyHovered ? 0.07 : 0.18 + Math.sin(t * 1.6) * 0.05;
      m.opacity += (targetOpacity - m.opacity) * 0.08;
    }
    // Orbit ring dims on hover
    if (orbitRingMat.current) {
      const targetOpacity = anyHovered ? 0.08 : 0.35;
      orbitRingMat.current.opacity += (targetOpacity - orbitRingMat.current.opacity) * 0.08;
    }
  });

  // Distribute medals along a wider orbit ring so labels don't crowd the obelisk
  const radius = Math.max(6.5, 3 + list.length * 0.75);

  return (
    <group position={[0, 1.2, centerZ]}>
      {/* central altar / pedestal */}
      <group ref={pedestal}>
        <mesh position={[0, -1.4, 0]}>
          <cylinderGeometry args={[1.6, 2.0, 0.4, 8]} />
          <meshStandardMaterial
            color="#1a1428"
            emissive="#3a1f5a"
            emissiveIntensity={0.4}
            metalness={0.6}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, -1.0, 0]}>
          <cylinderGeometry args={[1.2, 1.4, 0.3, 8]} />
          <meshStandardMaterial
            color="#2a1a3f"
            emissive="#9b6bff"
            emissiveIntensity={0.5}
            metalness={0.7}
            roughness={0.4}
          />
        </mesh>
        {/* obelisk */}
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.45, 2.4, 4]} />
          <meshStandardMaterial
            color="#3a1a5f"
            emissive="#c89bff"
            emissiveIntensity={0.7}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
        {/* glowing crown */}
        <mesh position={[0, 1.85, 0]}>
          <icosahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color="#ffd27a"
            emissive="#ffb24a"
            emissiveIntensity={2.2}
            metalness={1}
            roughness={0.1}
          />
        </mesh>
        <pointLight position={[0, 1.85, 0]} color="#ffd27a" intensity={2.5} distance={10} />
      </group>

      {/* upward light beam */}
      <mesh ref={beam} position={[0, 6, 0]}>
        <cylinderGeometry args={[0.06, 0.5, 14, 16, 1, true]} />
        <meshBasicMaterial
          color="#ffd27a"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* faint orbit ring on the floor */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <ringGeometry args={[radius - 0.04, radius + 0.04, 96]} />
        <meshBasicMaterial
          ref={orbitRingMat}
          color="#c89bff"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* the medals */}
      {list.map((a, i) => (
        <Medal
          key={`${a.name}-${i}`}
          achievement={a}
          angle={(i / list.length) * Math.PI * 2}
          radius={radius}
          yOffset={0.2}
          speed={0.14}
          index={i}
          hoveredRef={hoveredRef}
        />
      ))}
    </group>
  );
}

/* ================================================================== */
/* WORLD                                                               */
/* ================================================================== */

function World({
  onSelectProject,
  luminosity,
  layout,
}: {
  onSelectProject: (i: number) => void;
  luminosity: number;
  layout: SceneLayout;
}) {
  const { experiences: EXPERIENCES } = usePortfolio();
  return (
    <>
      <ambientLight intensity={0.35 * luminosity} />
      <pointLight position={[20, 10, 20]} intensity={1.1 * luminosity} color="#ffffff" />
      <pointLight position={[-15, -5, layout.wormholeZ + 10]} intensity={0.9 * luminosity} color="#7a3cff" />
      <Stars radius={250} depth={120} count={9000} factor={5} fade speed={1} />
      <ShootingStars layout={layout} />

      <IntroAstronaut />

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
        />
      ))}

      <Wormhole position={[0, 0, layout.wormholeZ]} />
      <Galaxy onSelectProject={onSelectProject} centerZ={layout.galaxyZ} />
      <SkillConstellation centerZ={layout.skillsZ} />
      <Pantheon centerZ={layout.pantheonZ} />
      <BlackHole position={[0, 0, layout.blackholeZ]} scale={3} />

      {/* ====== CENTRAL SECTION TITLES ====== */}
      <SectionTitle
        position={[0, 2.2, layout.wormholeZ - 6]}
        primary="THE RIFT"
        secondary="// FOLDING SPACETIME"
        color="#c89bff"
        glow="rgba(200,155,255,0.9)"
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
        position={[0, 5.8, layout.pantheonZ + 1]}
        primary="THE PANTHEON"
        secondary="// HALL OF HONORS"
        color="#ffd27a"
        glow="rgba(255,210,122,0.95)"
        distance={12}
      />
      <SectionTitle
        position={[0, 4.5, layout.blackholeZ + 3]}
        primary="THE SINGULARITY"
        secondary="// END OF TRANSMISSION"
        color="#ff7a8a"
        glow="rgba(255,122,138,0.9)"
        distance={10}
      />
    </>
  );
}

/* Reusable billboarded section title rendered as a 3D-positioned HTML sprite */
function SectionTitle({
  position,
  primary,
  secondary,
  color,
  glow,
  distance = 14,
}: {
  position: [number, number, number];
  primary: string;
  secondary: string;
  color: string;
  glow: string;
  distance?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03);
  });
  return (
    <group ref={ref} position={position}>
      <Html center distanceFactor={distance} transform sprite zIndexRange={[5, 0]}>
        <div
          className="pointer-events-none select-none flex flex-col items-center"
          style={{ fontFamily: "'Orbitron','Rajdhani',monospace" }}
        >
          <div
            className="whitespace-nowrap font-black"
            style={{
              fontSize: 22,
              letterSpacing: "0.35em",
              color,
              textShadow: `0 0 8px ${glow}, 0 0 20px ${glow}, 0 0 2px #000`,
              WebkitTextStroke: "1px rgba(0,0,0,0.6)",
            }}
          >
            {primary}
          </div>
          <div
            className="whitespace-nowrap mt-1"
            style={{
              fontSize: 8,
              letterSpacing: "0.6em",
              color,
              opacity: 0.8,
              textShadow: `0 0 6px ${glow}`,
            }}
          >
            {secondary}
          </div>
          <div
            style={{
              marginTop: 4,
              width: 120,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 6px ${glow}`,
            }}
          />
        </div>
      </Html>
    </group>
  );
}

/* Title that orbits the projects sun like a planetary ring of text */
function SunTitle({ centerZ }: { centerZ: number }) {
  const ringRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z = t * 0.25;
    if (labelRef.current) labelRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
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

      {/* floating label above the sun */}
      <group ref={labelRef} position={[0, 4.5, 2]}>
        <Html center distanceFactor={14} transform sprite zIndexRange={[5, 0]}>
          <div
            className="pointer-events-none select-none flex flex-col items-center"
            style={{ fontFamily: "'Orbitron','Rajdhani',monospace" }}
          >
            <div
              className="whitespace-nowrap font-black"
              style={{
                fontSize: 26,
                letterSpacing: "0.4em",
                color: "#ffd27a",
                textShadow: "0 0 10px rgba(255,180,80,0.95), 0 0 28px rgba(255,120,40,0.8), 0 0 2px #2a0a00",
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
    </group>
  );
}

/* ================================================================== */
/* CRT TERMINAL CONTACT                                                */
/* ================================================================== */

function CrtTerminalContact({
  email,
  linkedin,
  github,
  onClose,
}: {
  email: string;
  linkedin: string;
  github: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [booted, setBooted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [tick, setTick] = useState(0);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // Low-refresh tick (~8fps) for cursor blink & flicker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, []);

  // Boot sequence
  useEffect(() => {
    const lines = [
      "AETHER-OS v2.3.7 ........ [BOOT]",
      "MEM CHECK ............... 64K OK",
      "LOADING TRANSMITTER.DRV . OK",
      "TUNING SUBSPACE CARRIER . OK",
      "LINK TO EARTH ........... ESTABLISHED",
      "",
      "> READY. COMPOSE TRANSMISSION:",
    ];
    let i = 0;
    const id = setInterval(() => {
      setBooted((b) => [...b, lines[i]]);
      i++;
      if (i >= lines.length) {
        clearInterval(id);
        setTimeout(() => {
          setReady(true);
          titleRef.current?.focus();
        }, 200);
      }
    }, 160);
    return () => clearInterval(id);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const subject = encodeURIComponent(`[TRANSMISSION] ${title.trim()}`);
    const body = encodeURIComponent(content.trim());
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const cursor = tick % 2 === 0 ? "▊" : " ";
  const flicker = 0.92 + ((tick * 37) % 13) / 160;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      style={{ animation: "fadein .25s ease-out" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[640px] max-w-[94vw]"
        style={{
          fontFamily: "ui-monospace, 'Courier New', Menlo, monospace",
        }}
      >
        {/* CRT screen */}
        <div
          className="relative overflow-hidden rounded-[28px] border-[10px] border-[#1a1a1a] shadow-[0_0_60px_rgba(0,255,140,0.25),inset_0_0_80px_rgba(0,0,0,0.9)]"
          style={{
            background: "radial-gradient(ellipse at center, #021a0c 0%, #000600 75%, #000 100%)",
            opacity: flicker,
          }}
        >
          {/* Scanlines */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(to bottom, rgba(0,255,140,0.06) 0px, rgba(0,255,140,0.06) 1px, transparent 2px, transparent 4px)",
              mixBlendMode: "overlay",
            }}
          />
          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.8) 100%)",
            }}
          />
          {/* Horizontal sweep */}
          <div
            className="pointer-events-none absolute left-0 right-0 h-[80px]"
            style={{
              top: `${(tick * 6) % 120}%`,
              background: "linear-gradient(to bottom, transparent, rgba(0,255,140,0.06), transparent)",
            }}
          />

          {/* Top bar */}
          <div className="relative flex items-center justify-between border-b border-[#0a3a1f] bg-[#001005] px-5 py-2 text-[10px] uppercase tracking-[0.3em] text-[#00ff8c]">
            <span style={{ textShadow: "0 0 6px #00ff8c" }}>◉ AETHER-OS · CH.7</span>
            <span style={{ textShadow: "0 0 6px #00ff8c" }}>
              LINK {ready ? "●" : "○"} {new Date().toISOString().slice(11, 19)}
            </span>
            <button
              onClick={onClose}
              className="text-[#00ff8c] hover:text-white"
              style={{ textShadow: "0 0 6px #00ff8c" }}
            >
              [X] CLOSE
            </button>
          </div>

          {/* Body */}
          <div
            className="relative px-6 py-5 text-[13px] leading-[1.55] text-[#00ff8c]"
            style={{
              textShadow: "0 0 4px #00ff8c, 0 0 12px rgba(0,255,140,0.4)",
              minHeight: 420,
            }}
          >
            {/* Boot log */}
            <div className="whitespace-pre-wrap">
              {booted.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>

            {ready && !sent && (
              <form onSubmit={handleSend} className="mt-3 space-y-3">
                <div>
                  <label htmlFor="contact-title" className="block text-[11px] uppercase tracking-widest opacity-80">
                    &gt; TITLE:
                  </label>
                  <input
                    id="contact-title"
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                    maxLength={80}
                    placeholder="SUBJECT LINE..."
                    className="mt-1 w-full border border-[#0a4a25] bg-black/40 px-2 py-1.5 text-[#00ff8c] outline-none focus:border-[#00ff8c]"
                    style={{
                      fontFamily: "inherit",
                      textShadow: "0 0 4px #00ff8c",
                      caretColor: "#00ff8c",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-[11px] uppercase tracking-widest opacity-80">
                    &gt; MESSAGE:
                  </label>
                  <textarea
                    id="contact-message"
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                    maxLength={2000}
                    rows={7}
                    placeholder="TYPE YOUR TRANSMISSION..."
                    className="mt-1 w-full resize-none border border-[#0a4a25] bg-black/40 px-2 py-1.5 text-[#00ff8c] outline-none focus:border-[#00ff8c]"
                    style={{
                      fontFamily: "inherit",
                      textShadow: "0 0 4px #00ff8c",
                      caretColor: "#00ff8c",
                    }}
                  />
                  <div className="mt-1 text-right text-[10px] opacity-60">{content.length}/2000</div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] opacity-70">PRESS [TRANSMIT] TO RELAY VIA MAIL CARRIER {cursor}</div>
                  <button
                    type="submit"
                    disabled={!title.trim() || !content.trim()}
                    className="border border-[#00ff8c] bg-[#00ff8c]/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-[#00ff8c] hover:bg-[#00ff8c]/25 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ textShadow: "0 0 6px #00ff8c" }}
                  >
                    ▶ TRANSMIT
                  </button>
                </div>
              </form>
            )}

            {sent && (
              <div className="mt-4 space-y-1">
                <div>&gt; ENCODING PACKET ............. OK</div>
                <div>&gt; SIGNING WITH STARDUST KEY ... OK</div>
                <div>&gt; HANDOFF TO MAIL CARRIER ..... OK</div>
                <div className="mt-2 text-white" style={{ textShadow: "0 0 8px #fff" }}>
                  ✦ TRANSMISSION SENT. CHECK YOUR MAIL CLIENT. {cursor}
                </div>
                <button
                  onClick={onClose}
                  className="mt-3 border border-[#00ff8c] px-3 py-1 text-[11px] uppercase tracking-widest hover:bg-[#00ff8c]/20"
                >
                  [ESC] DISCONNECT
                </button>
              </div>
            )}

            {/* Alt channels */}
            <div className="mt-5 border-t border-[#0a3a1f] pt-3 text-[11px] opacity-80">
              <div className="mb-1 uppercase tracking-widest">// ALT CHANNELS</div>
              <div>
                MAIL ....{" "}
                <a href={`mailto:${email}`} className="underline hover:text-white">
                  {email}
                </a>
              </div>
              <div>
                LINKD ...{" "}
                <a href={linkedin} target="_blank" rel="noreferrer" className="underline hover:text-white">
                  {linkedin.replace(/^.*\/in\//, "").replace(/\/$/, "")}
                </a>
              </div>
              <div>
                GIT .....{" "}
                <a href={github} target="_blank" rel="noreferrer" className="underline hover:text-white">
                  {github.replace(/^.*github\.com\//, "")}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stand */}
        <div className="mx-auto mt-2 h-3 w-2/3 rounded-b-2xl bg-[#1a1a1a]" />
        <div className="mx-auto mt-1 h-2 w-1/3 rounded bg-[#0a0a0a]" />
      </div>
    </div>
  );
}

/* ================================================================== */
/* PAGE                                                                */
/* ================================================================== */

/* ================================================================== */
/* CONTROLS HINT — collapsible cheatsheet                              */
/* ================================================================== */
function ControlsHint({ freeRoam }: { freeRoam: boolean }) {
  const [open, setOpen] = useState(true);
  const Key = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded border border-white/25 bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-inner">
      {children}
    </kbd>
  );
  return (
    <div className="pointer-events-auto absolute bottom-6 right-6 z-10 w-[260px] max-w-[80vw]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-auto mb-2 flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/80 backdrop-blur hover:border-white/60"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${freeRoam ? "bg-emerald-300" : "bg-cyan-300"}`} />
        {open ? "Hide tips" : "Show tips"}
      </button>
      {open && (
        <div
          className="rounded-xl border border-white/15 bg-black/60 p-3.5 text-white/85 backdrop-blur-xl shadow-2xl"
          style={{ animation: "fadein .35s ease-out" }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 mb-2">
            {freeRoam ? "Free roam · controls" : "Camera · controls"}
          </p>

          {!freeRoam ? (
            <ul className="space-y-1.5 text-[12px] leading-snug">
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Zoom in / out</span>
                <span className="flex gap-1">
                  <Key>scroll</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Reset zoom</span>
                <span className="flex gap-1">
                  <Key>dbl-click</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Pinch zoom</span>
                <span className="flex gap-1">
                  <Key>2-finger</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Next / prev chapter</span>
                <span className="flex gap-1">
                  <Key>←</Key>
                  <Key>→</Key>
                </span>
              </li>
              <li className="mt-2 border-t border-white/10 pt-2 text-[11px] text-cyan-200/80">
                Tip: enable <span className="font-bold">Roam</span> in the top bar to fly anywhere with WASD + mouse.
              </li>
            </ul>
          ) : (
            <ul className="space-y-1.5 text-[12px] leading-snug">
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Move</span>
                <span className="flex gap-1">
                  <Key>W</Key>
                  <Key>A</Key>
                  <Key>S</Key>
                  <Key>D</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Look</span>
                <span className="flex gap-1">
                  <Key>mouse</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Up / down</span>
                <span className="flex gap-1">
                  <Key>Space</Key>
                  <Key>Ctrl</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Boost</span>
                <span className="flex gap-1">
                  <Key>Shift</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Release mouse</span>
                <span className="flex gap-1">
                  <Key>Esc</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Zoom (FOV)</span>
                <span className="flex gap-1">
                  <Key>scroll</Key>
                </span>
              </li>
              <li className="mt-2 border-t border-white/10 pt-2 text-[11px] text-emerald-200/85">
                Click the canvas to capture the mouse. Press <span className="font-bold">Esc</span> to release.
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Portfolio() {
  // ───── Fetch the portfolio markdown from GitHub ─────
  const [data, setData] = useState<PortfolioContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchPortfolio()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Set<ChapterId>>(new Set(["intro"]));
  const [contactOpen, setContactOpen] = useState(false);
  const [projectIndex, setProjectIndex] = useState<number | null>(null);
  const [luminosity, setLuminosity] = useState(1);
  const [freeRoam, setFreeRoam] = useState(false);
  const { enabled: musicOn, toggle: toggleMusic, volume, setVolume } = useSpaceMusic();
  const prevIndexRef = useRef(0);

  // Derive scene layout + chapters from the loaded markdown. Empty fallback
  // until data arrives keeps hook order stable.
  const layout = useMemo<SceneLayout>(() => computeLayout(data?.experiences ?? []), [data]);
  const CHAPTERS = useMemo<Chapter[]>(
    () => (data ? buildChapters(data.experiences, layout, data.brand.description) : []),
    [data, layout],
  );

  const baseChapter = CHAPTERS[index] ?? CHAPTERS[0];

  // Direction-aware override: when the user RETURNS to the wormhole from a later
  // chapter, fly the camera into the FAR end of the tunnel and traverse back
  // through it (mirror of the forward pass).
  const chapter = useMemo<Chapter | undefined>(() => {
    if (!baseChapter) return undefined;
    const goingBackward = index < prevIndexRef.current;
    if (baseChapter.id === "wormhole" && goingBackward) {
      const wz = layout.wormholeZ;
      return {
        ...baseChapter,
        via: { camera: [0, 0, wz - 20], lookAt: [0, 0, wz + 20] },
        camera: [0, 0, wz + 15],
        lookAt: [0, 0, wz + 40],
      };
    }
    return baseChapter;
  }, [index, baseChapter, layout]);

  useEffect(() => {
    if (chapter) setVisited((v) => new Set(v).add(chapter.id));
  }, [chapter?.id]);

  const go = (i: number) => {
    if (!CHAPTERS.length) return;
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, i));
    prevIndexRef.current = index;
    setIndex(next);
  };

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  // ───── 404: empty space view if the GitHub markdown failed to load ─────
  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black text-white/70 overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="text-[12rem] leading-none font-extralight text-white/15 select-none">404</div>
          <p className="text-sm uppercase tracking-[0.4em] text-white/40">empty space</p>
          <p className="max-w-md text-white/40 text-sm">
            The portfolio manifest could not be reached. The signal is lost in the void.
          </p>
          <p className="text-[10px] text-white/20 font-mono break-all max-w-md">{PORTFOLIO_MD_URL}</p>
        </div>
        {/* faint drifting stars so it isn't fully blank */}
        <div
          className="pointer-events-none fixed inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 12% 22%, #fff 50%, transparent), radial-gradient(1px 1px at 78% 64%, #fff 50%, transparent), radial-gradient(1px 1px at 41% 88%, #fff 50%, transparent), radial-gradient(1px 1px at 88% 14%, #fff 50%, transparent), radial-gradient(1px 1px at 26% 56%, #fff 50%, transparent)",
            backgroundSize: "100% 100%",
          }}
        />
      </div>
    );
  }

  // ───── Loading view while we fetch the markdown ─────
  if (!data) {
    return (
      <div className="fixed inset-0 bg-[#03020a] text-white/60 flex items-center justify-center">
        <span className="text-xs uppercase tracking-[0.4em] animate-pulse">entering orbit…</span>
      </div>
    );
  }

  const { brand: BRAND, projects: PROJECTS } = data;

  return (
    <PortfolioContext.Provider value={data}>
      <div className="fixed inset-0 bg-[#03020a] text-white overflow-hidden">
        <Canvas camera={{ position: [4, 2, 8], fov: 55 }} dpr={[1, 2]}>
          <color attach="background" args={["#03020a"]} />
          <fog attach="fog" args={["#03020a", 40, 220]} />
          <Suspense
            fallback={
              <Html center>
                <span className="text-sm text-white/60">entering orbit…</span>
              </Html>
            }
          >
            <World onSelectProject={(i) => setProjectIndex(i)} luminosity={luminosity} layout={layout} />
          </Suspense>
          {/* Ship lives OUTSIDE Suspense so it never disappears while assets load */}
          <CompanionShip onContact={() => setContactOpen(true)} />
          {!freeRoam && <CameraRig chapter={chapter!} />}
          <ZoomControls baseFov={55} />
          <FreeRoam enabled={freeRoam} />
        </Canvas>

        {/* TOP BAR: brand · controls · chapter progress, all on one line */}
        <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between gap-4 px-6">
          {/* brand */}
          <div className="pointer-events-none">
            <h1 className="text-xs tracking-[0.4em] text-white/70">
              ✧ {BRAND.name.toUpperCase().split(" ").join(" · ")}
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40">a cosmic journey</p>
          </div>

          {/* center controls */}
          <div className="flex items-center gap-4 rounded-full border border-white/15 bg-black/55 px-4 py-2 backdrop-blur-xl">
            <button
              onClick={toggleMusic}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/80 hover:text-white transition whitespace-nowrap"
              title={musicOn ? "Mute soundtrack" : "Play Interstellar-inspired pad"}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${musicOn ? "bg-emerald-300 shadow-[0_0_8px_#6ee7b7]" : "bg-white/30"}`}
              />
              ♪ {musicOn ? "On" : "Off"}
            </button>

            <div className="flex items-center gap-2">
              <label
                htmlFor="volume-control"
                className="text-[10px] uppercase tracking-[0.2em] text-white/60 whitespace-nowrap"
              >
                Vol
              </label>
              <input
                id="volume-control"
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={volume}
                disabled={!musicOn}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 accent-emerald-300 disabled:opacity-40"
              />
            </div>

            <span className="h-4 w-px bg-white/15" />

            <div className="flex items-center gap-2">
              <label
                htmlFor="light-control"
                className="text-[10px] uppercase tracking-[0.2em] text-white/60 whitespace-nowrap"
              >
                ☀ Light
              </label>
              <input
                id="light-control"
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={luminosity}
                onChange={(e) => setLuminosity(parseFloat(e.target.value))}
                className="w-24 accent-amber-300"
              />
              <span className="text-[10px] text-white/50 tabular-nums whitespace-nowrap w-9 text-right">
                {luminosity.toFixed(2)}
              </span>
            </div>

            <span className="h-4 w-px bg-white/15" />

            <button
              onClick={() => setFreeRoam((v) => !v)}
              className={`text-[11px] uppercase tracking-[0.2em] transition whitespace-nowrap ${freeRoam ? "text-emerald-300" : "text-white/80 hover:text-white"}`}
              title="Free roam (WASD + mouse, Shift to boost, Space/Ctrl up/down, Esc to release mouse)"
            >
              <span
                className={`inline-block h-2 w-2 rounded-full mr-2 ${freeRoam ? "bg-emerald-300 shadow-[0_0_8px_#6ee7b7]" : "bg-white/30"}`}
              />
              Roam {freeRoam ? "On" : "Off"}
            </button>
          </div>

          {/* chapter progress */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1.5">
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => go(i)}
                  aria-label={c.title}
                  title={c.title}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-white" : visited.has(c.id) ? "w-3 bg-white/70" : "w-3 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/40">
              chapter {index + 1} / {CHAPTERS.length}
            </p>
          </div>
        </div>

        {/* CAPTION PANEL — bottom-left */}
        <div className="absolute bottom-24 left-6 z-20 w-[400px] max-w-[88vw]">
          <div
            key={chapter!.id}
            className="rounded-2xl border-2 border-cyan-300/40 bg-slate-950/85 p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(34,211,238,0.25)] ring-1 ring-cyan-200/10"
            style={{ animation: "fadein .5s ease-out" }}
          >
            <p className="font-display text-xs font-bold uppercase tracking-[0.35em] text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">{chapter!.title}</p>
            <p className="mt-3 text-white leading-relaxed text-[16px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{chapter!.caption}</p>

            {/* finale: list visited */}
            {chapter!.id === "finale" && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.25em] text-orange-300 mb-2">Sections you've visited</p>
                <ul className="grid grid-cols-2 gap-1.5 text-xs">
                  {CHAPTERS.map((c, i) => (
                    <li key={c.id}>
                      <button
                        onClick={() => go(i)}
                        className={`w-full text-left rounded-md border px-2 py-1.5 transition ${
                          visited.has(c.id)
                            ? "border-orange-400/50 bg-orange-400/10 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/40"
                        }`}
                      >
                        {visited.has(c.id) ? "✓" : "○"} {c.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS TIPS — bottom-right */}
        <ControlsHint freeRoam={freeRoam} />

        {/* PREV / NEXT */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
          <button
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm backdrop-blur-md disabled:opacity-30 hover:border-white transition"
          >
            ← Previous
          </button>
          <button
            onClick={() => go(index + 1)}
            disabled={index === CHAPTERS.length - 1}
            className="rounded-full border border-white bg-white text-black px-5 py-2 text-sm font-medium backdrop-blur-md disabled:opacity-30 hover:bg-white/90 transition"
          >
            {index === CHAPTERS.length - 1 ? "Journey complete" : "Continue →"}
          </button>
        </div>

        {/* CONTACT MODAL - CRT TERMINAL */}
        {contactOpen && (
          <CrtTerminalContact
            email={BRAND.email}
            linkedin={BRAND.linkedin}
            github={BRAND.github}
            onClose={() => setContactOpen(false)}
          />
        )}

        {/* PROJECT DETAIL MODAL */}
        {projectIndex !== null &&
          (() => {
            const p = PROJECTS[projectIndex];
            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={() => setProjectIndex(null)}
              >
                <div
                  className="w-[460px] max-w-[92vw] rounded-2xl border bg-[#0a0820] p-7 shadow-2xl"
                  style={{ borderColor: p.color + "55", animation: "fadein .35s ease-out" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em]" style={{ color: p.color }}>
                      ◉ Project
                    </p>
                    <button onClick={() => setProjectIndex(null)} className="text-white/50 hover:text-white">
                      ✕
                    </button>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold">{p.name}</h2>
                  <p className="mt-1 text-sm text-white/60">{p.desc}</p>
                  <p className="mt-4 text-[14px] leading-relaxed text-white/85">{p.details}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {p.stack.map((s: string) => (
                      <span
                        key={s}
                        className="rounded-full border px-2.5 py-1 text-[11px]"
                        style={{ borderColor: p.color + "66", color: p.color }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* FILM GRAIN OVERLAY — fractal-noise SVG, animated for shimmer */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60] mix-blend-overlay opacity-[0.18]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            backgroundSize: "220px 220px",
            animation: "grain 1.1s steps(6) infinite",
          }}
        />
        {/* subtle scanline + vignette for cinematic feel */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[59]"
          style={{
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes grain {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(-6%, 4%); }
          40%  { transform: translate(5%, -3%); }
          60%  { transform: translate(-3%, -5%); }
          80%  { transform: translate(4%, 6%); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      </div>
    </PortfolioContext.Provider>
  );
}
