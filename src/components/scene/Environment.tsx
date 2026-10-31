import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import type { SceneLayout } from "@/config/story";
import { getBiomeTexture, getPlanetCloudTexture } from "@/lib/planetGenerator";

export function RealisticAtmosphereShell({
  radius,
  atmosphereColor,
  sunsetLimbColor,
  power = 3.2,
  intensity = 1.35,
  scale = 1.12,
}: {
  radius: number;
  atmosphereColor: string;
  sunsetLimbColor?: string;
  power?: number;
  intensity?: number;
  scale?: number;
}) {
  const material = useMemo(() => {
    const cAtm = new THREE.Color(atmosphereColor);
    const cSunset = new THREE.Color(sunsetLimbColor || atmosphereColor);
    const outerRadius = radius * scale;
    const planetRatio = 1.0 / scale;
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: cAtm },
        uSunsetColor: { value: cSunset },
        uPower: { value: power },
        uIntensity: { value: intensity },
        uOuterRadius: { value: outerRadius },
        uPlanetRatio: { value: planetRatio },
      },
      vertexShader: `
        varying vec3 vViewPosition;
        varying vec3 vCenter;
        varying vec3 vNormal;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = mv.xyz;
          vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uSunsetColor;
        uniform float uPower;
        uniform float uIntensity;
        uniform float uOuterRadius;
        uniform float uPlanetRatio;
        varying vec3 vViewPosition;
        varying vec3 vCenter;
        varying vec3 vNormal;
        void main() {
          vec3 viewToCenter = normalize(vCenter);
          vec3 viewToPix = normalize(vViewPosition);
          float cosAngle = clamp(dot(viewToCenter, viewToPix), -1.0, 1.0);
          float sinAngle = sqrt(max(0.0, 1.0 - cosAngle * cosAngle));
          float centerDist = length(vCenter);
          float impact = centerDist * sinAngle;
          float b = clamp(impact / uOuterRadius, 0.0, 1.0);

          float glow = 0.0;
          if (b < uPlanetRatio) {
            glow = pow(b / uPlanetRatio, uPower);
          } else {
            float t = (b - uPlanetRatio) / max(0.001, 1.0 - uPlanetRatio);
            glow = pow(max(0.0, 1.0 - t), 2.2);
          }

          // Subtle sun lighting on the atmosphere
          vec3 sunDir = normalize(vec3(-0.8, 0.6, 0.7));
          float sunFactor = smoothstep(-0.3, 0.4, dot(vNormal, sunDir));
          glow *= (0.35 + 0.65 * sunFactor);

          vec3 finalColor = mix(uColor, uSunsetColor, pow(b, 2.0));
          float alpha = glow * uIntensity;
          gl_FragColor = vec4(finalColor * alpha, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, [atmosphereColor, sunsetLimbColor, power, intensity, radius, scale]);

  return (
    <mesh scale={scale}>
      <sphereGeometry args={[radius, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export function MoonDust() {
  const ref = useRef<THREE.Points>(null);
  const { positions, velocities } = useMemo(() => {
    const N = 60;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = Math.random() * 6.5;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = -0.3 + Math.random() * 1.5;
      positions[i * 3 + 2] = Math.sin(a) * r;
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 1] = (Math.random() - 0.3) * 0.04;
      velocities[i * 3 + 2] = -0.1 - Math.random() * 0.15;
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
      if (arr[i + 2] < -6 || arr[i + 1] > 1.4 || Math.abs(arr[i]) > 6) {
        const r = Math.random() * 2.5 + 1.2;
        const a = Math.random() * Math.PI * 2;
        arr[i + 0] = Math.cos(a) * r;
        arr[i + 1] = -0.3 + Math.random() * 0.3;
        arr[i + 2] = Math.sin(a) * r + 1.5;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#d8c8b0"
        transparent
        opacity={0.3}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export function CelestialHorizonGiant() {
  const planetRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Gaia/Earth-like exoplanet texture
  const tex = useMemo(() => getBiomeTexture("oceanic", "#38bdf8", "#0369a1", "HorizonGiant"), []);
  const cloudTex = useMemo(() => getPlanetCloudTexture("oceanic", "#ffffff"), []);

  useFrame((_, dt) => {
    if (planetRef.current) planetRef.current.rotation.y += dt * 0.04;
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.06;
  });

  return (
    <group position={[15, 12, -50]}>
      {/* Massive celestial body */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[8.5, 64, 64]} />
        <meshPhysicalMaterial
          map={tex}
          roughness={0.3}
          metalness={0.08}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
          sheen={0.5}
          sheenColor={new THREE.Color("#67e8f9")}
          emissive="#0284c7"
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Swirling celestial cloud layer */}
      <mesh ref={cloudRef} scale={1.018}>
        <sphereGeometry args={[8.5, 48, 48]} />
        <meshStandardMaterial
          map={cloudTex}
          transparent
          opacity={0.65}
          depthWrite={false}
          roughness={0.9}
          color="#ffffff"
        />
      </mesh>

      {/* Ethereal Rayleigh limb scattering glow */}
      <RealisticAtmosphereShell
        radius={8.5}
        atmosphereColor="#38bdf8"
        sunsetLimbColor="#f59e0b"
        power={3.2}
        intensity={1.7}
        scale={1.12}
      />
    </group>
  );
}

const SHOOTING_PALETTE = ["#ffffff", "#bcdcff", "#ffd6a3", "#d9b8ff"];

export function ShootingStar({ layout, seed }: { layout: SceneLayout; seed: number }) {
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
      <Trail
        width={0.55}
        length={6}
        color={"#ffffff"}
        attenuation={(t: number) => t * t * t}
        decay={1.4}
      >
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

export function ShootingStars({ layout }: { layout: SceneLayout }) {
  const COUNT = 4;
  return (
    <>
      {Array.from({ length: COUNT }).map((_, i) => (
        <ShootingStar key={i} layout={layout} seed={i} />
      ))}
    </>
  );
}
