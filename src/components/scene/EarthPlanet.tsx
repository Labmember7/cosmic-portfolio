import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { RealisticAtmosphereShell } from "./Environment";

export interface EarthTextures {
  dayMap: THREE.Texture;
  cloudsMap: THREE.Texture;
  specularMap: THREE.Texture;
  normalMap: THREE.Texture;
  lightsMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

let cachedEarthTextures: EarthTextures | null = null;

/**
 * Cached singleton loader for Earth texture assets.
 * Loaded once from public static assets, shared across all instances (zero memory waste).
 */
export function getEarthTextures(): EarthTextures | null {
  if (typeof window === "undefined") return null;
  if (cachedEarthTextures) return cachedEarthTextures;

  const loader = new THREE.TextureLoader();

  const dayMap = loader.load("/textures/earth/earth_day_2k.jpg");
  dayMap.colorSpace = THREE.SRGBColorSpace;
  dayMap.anisotropy = 8;

  const cloudsMap = loader.load("/textures/earth/earth_clouds_1k.png");
  cloudsMap.colorSpace = THREE.SRGBColorSpace;
  cloudsMap.anisotropy = 8;

  const specularMap = loader.load("/textures/earth/earth_specular_2k.jpg");
  specularMap.anisotropy = 8;

  const normalMap = loader.load("/textures/earth/earth_normal_2k.jpg");
  normalMap.anisotropy = 8;

  const lightsMap = loader.load("/textures/earth/earth_lights_2k.png");
  lightsMap.colorSpace = THREE.SRGBColorSpace;
  lightsMap.anisotropy = 8;

  // Optimized inverted roughness texture: specular image has white oceans, black land.
  // Invert on an in-memory canvas once: oceans become smooth (roughness ~0.15), land becomes matte (~0.85).
  const roughnessCanvas = document.createElement("canvas");
  roughnessCanvas.width = 1024;
  roughnessCanvas.height = 512;
  const roughnessTex = new THREE.CanvasTexture(roughnessCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.ClampToEdgeWrapping;

  const buildRoughness = (img: HTMLImageElement) => {
    try {
      const ctx = roughnessCanvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, roughnessCanvas.width, roughnessCanvas.height);
      const idata = ctx.getImageData(0, 0, roughnessCanvas.width, roughnessCanvas.height);
      const d = idata.data;
      for (let i = 0; i < d.length; i += 4) {
        const spec = d[i] / 255.0; // 1.0 = ocean, 0.0 = land
        // High specularity -> low roughness (0.12). Low specularity -> high roughness (0.88).
        const rough = Math.round((1.0 - spec) * 195 + 30);
        d[i] = rough;
        d[i + 1] = rough;
        d[i + 2] = rough;
      }
      ctx.putImageData(idata, 0, 0);
      roughnessTex.needsUpdate = true;
    } catch {
      // Graceful fallback if security/tainted
    }
  };

  loader.load("/textures/earth/earth_specular_2k.jpg", (tex) => {
    if (tex.image) buildRoughness(tex.image);
  });

  cachedEarthTextures = {
    dayMap,
    cloudsMap,
    specularMap,
    normalMap,
    lightsMap,
    roughnessMap: roughnessTex,
  };

  return cachedEarthTextures;
}

export interface EarthPlanetProps {
  radius?: number;
  rotationSpeed?: number;
  cloudDriftSpeed?: number;
  axialTilt?: number;
  atmosphereIntensity?: number;
  atmosphereScale?: number;
  atmosphereColor?: string;
  sunsetLimbColor?: string;
  atmospherePower?: number;
  showAtmosphere?: boolean;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  emissiveBoost?: number;
  children?: React.ReactNode;
}

/**
 * Exact, photorealistic, highly optimized 3D Earth replica:
 * 1. Authentic Blue Marble day topography map (exact real continents & oceans).
 * 2. Real topographic elevation normal bump map (mountain ranges & trenches).
 * 3. Water specular reflection gloss mask (smooth glistening oceans vs matte continents).
 * 4. Realistic nighttime city illumination on the unlit hemisphere.
 * 5. Realistic independently rotating translucent cloud sphere with physical parallax.
 * 6. True 23.44° axial obliquity tilt.
 * 7. Authentic real-world Rayleigh blue atmospheric scattering shell & limb haze.
 */
export function EarthPlanet({
  radius = 2,
  rotationSpeed = 0.08,
  cloudDriftSpeed = 0.035,
  axialTilt = 0.4091, // 23.44 degrees in radians
  atmosphereIntensity = 0.85,
  atmosphereScale = 1.055,
  atmosphereColor = "#4a9fe0", // Realistic, subtle natural atmospheric blue
  sunsetLimbColor = "#2b6cb0", // Subtle deep marine limb fade
  atmospherePower = 4.2,
  showAtmosphere = true,
  onPointerOver,
  onPointerOut,
  emissiveBoost = 0,
  children,
}: EarthPlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const textures = useMemo(() => getEarthTextures(), []);

  // Silky smooth continuous rotation on tilted rotational axis
  useFrame((_, dt) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += dt * rotationSpeed;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += dt * (rotationSpeed + cloudDriftSpeed);
    }
  });

  if (!textures) return null;

  return (
    <group>
      {/* Rotational Axis Tilt (Earth's authentic 23.44° axial obliquity) */}
      <group rotation={[0.12, 0, axialTilt]}>
        {/* Main Earth Planetary Sphere with Subtle Natural Grazing Sheen */}
        <mesh
          ref={planetRef}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <sphereGeometry args={[radius, 64, 64]} />
          <meshPhysicalMaterial
            map={textures.dayMap}
            normalMap={textures.normalMap}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            roughnessMap={textures.roughnessMap}
            roughness={0.65}
            metalness={0.08}
            clearcoat={0.3}
            clearcoatRoughness={0.2}
            sheen={0.35}
            sheenColor={new THREE.Color("#4a9fe0")}
            sheenRoughness={0.4}
            emissiveMap={textures.lightsMap}
            emissive="#ffdfa0"
            emissiveIntensity={0.35 + emissiveBoost}
          />
        </mesh>

        {/* Real Dynamic Translucent Cloud Sphere with Weather Parallax */}
        <mesh ref={cloudRef} scale={1.018} raycast={() => null}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshStandardMaterial
            map={textures.cloudsMap}
            transparent
            opacity={0.86}
            depthWrite={false}
            roughness={0.92}
            color="#ffffff"
          />
        </mesh>
      </group>

      {/* Subtle Natural Blue Rayleigh Atmospheric Scattering Veil */}
      {showAtmosphere && (
        <RealisticAtmosphereShell
          radius={radius}
          atmosphereColor={atmosphereColor}
          sunsetLimbColor={sunsetLimbColor}
          power={atmospherePower}
          intensity={atmosphereIntensity}
          scale={atmosphereScale}
        />
      )}

      {children}
    </group>
  );
}

export default EarthPlanet;

