import React, { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useIsMobile } from "@/hooks/use-mobile";

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function applyHudOverlay(g: THREE.Object3D) {
  g.traverse((obj) => {
    obj.frustumCulled = false;
    if (!(obj as THREE.Mesh).isMesh) return;
    (obj as THREE.Mesh).renderOrder = 1000;
    const m = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach((mat) => {
      (mat as THREE.Material & { fog?: boolean }).fog = false;
      mat.depthTest = false;
      mat.depthWrite = false;
      mat.transparent = true;
    });
  });
}

function BroadcastRings({ hoverRef }: { hoverRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  const phase = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const h = hoverRef.current;
    phase.current += dt * (0.45 + h * 0.9);
    ref.current.children.forEach((c, i) => {
      const p = (phase.current + i / 3) % 1;
      c.scale.setScalar(0.3 + p * (1.8 + h * 0.6));
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - p) * (0.35 + h * 0.5);
    });
  });
  return (
    <group ref={ref} position={[0, 0.4, 0.2]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.36, 0.385, 48]} />
          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function GroundControlLabel({
  hovered,
  transmitting,
  onHover,
  onActivate,
}: {
  hovered: boolean;
  transmitting: boolean;
  onHover: (v: boolean) => void;
  onActivate: () => void;
}) {
  const isMobileHook = useIsMobile();
  const [isShortViewport, setIsShortViewport] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      setIsShortViewport(window.innerHeight <= 560 || window.innerWidth <= 768);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const isMobile = isMobileHook || isShortViewport;

  return (
    <Html
      position={isMobile ? [0, -1.35, 0] : [1.35, -1.35, 0]}
      zIndexRange={[10, 0]}
      style={{ pointerEvents: "none" }}
    >
      <style>{`
        @keyframes gcBlink { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
        @keyframes gcSweep { 0% { transform: translateX(-120%) } 60%,100% { transform: translateX(220%) } }
        @keyframes gcFill { from { width: 0% } to { width: 100% } }
        @keyframes gcPing {
          0%, 86%, 100% { box-shadow: 0 0 18px rgba(34,211,238,.18), inset 0 0 12px rgba(34,211,238,.06) }
          90% { box-shadow: 0 0 34px rgba(34,211,238,.55), inset 0 0 18px rgba(34,211,238,.2) }
        }
        @keyframes gcIn { from { opacity: 0; transform: translate(var(--gc-tx, -100%), 6px) } to { opacity: 1; transform: translate(var(--gc-tx, -100%), 0) } }
        @keyframes gcBars { 0%,100% { transform: scaleY(.35) } 50% { transform: scaleY(1) } }
      `}</style>
      <button
        id="contact-ground-control-btn"
        type="button"
        aria-label="Contact ground control — open messaging terminal"
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onActivate();
        }}
        className="group relative block select-none overflow-hidden whitespace-nowrap rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer"
        style={{
          pointerEvents: "auto",
          transform: isMobile ? "translate(-50%, 0)" : "translate(-100%, 0)",
          animation: transmitting
            ? undefined
            : "gcIn .6s ease-out both, gcPing 6s ease-in-out 1.5s infinite",
          border: `1px solid ${hovered || transmitting ? "rgba(103,232,249,.75)" : "rgba(103,232,249,.3)"}`,
          background: "linear-gradient(135deg, rgba(8,20,38,.88), rgba(17,10,40,.82))",
          backdropFilter: "blur(14px)",
          padding: isMobile ? "3px 8px 3px 7px" : "8px 12px 9px 10px",
          minWidth: isMobile ? "auto" : 196,
          maxWidth: "none",
          width: "max-content",
          transition: "border-color .25s, box-shadow .25s",
          boxShadow: hovered
            ? "-3px -3px 10px rgba(103,232,249,.35), 6px 6px 18px rgba(0,0,0,.85), 0 0 30px rgba(34,211,238,.45), inset 1px 1px 1px rgba(255,255,255,0.25)"
            : "-3px -3px 8px rgba(255,255,255,.06), 5px 5px 14px rgba(0,0,0,.8), inset 1px 1px 1px rgba(255,255,255,0.12), inset -1px -1px 1px rgba(0,0,0,0.5)",
        }}
      >
        {/* shine sweep */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(165,243,252,.16), transparent)",
            animation: "gcSweep 3.8s ease-in-out infinite",
          }}
        />
        {/* corner brackets */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1 top-1 h-2 w-2 border-l border-t border-cyan-300/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b border-r border-cyan-300/70"
        />

        <span className="relative flex items-center gap-1.5 sm:gap-2.5">
          {/* signal meter */}
          <span aria-hidden className="flex h-3 sm:h-5 items-end gap-[2px]">
            {[0.45, 0.7, 1].map((hgt, i) => (
              <span
                key={i}
                className="w-[2px] sm:w-[3px] origin-bottom rounded-sm"
                style={{
                  height: `${hgt * 100}%`,
                  background: transmitting
                    ? "#f0abfc"
                    : hovered
                      ? "#67e8f9"
                      : "rgba(103,232,249,.7)",
                  animation: `gcBars ${transmitting ? 0.35 : hovered ? 0.6 : 1.4}s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </span>

          {isMobile ? (
            <span className="flex items-center gap-1.5 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: transmitting ? "#f0abfc" : hovered ? "#22d3ee" : "#38bdf8",
                  boxShadow: `0 0 6px ${transmitting ? "#f0abfc" : hovered ? "#22d3ee" : "#38bdf8"}`,
                  animation: "gcBlink 1.1s steps(2) infinite",
                }}
              />
              {transmitting ? "Linking…" : "Ground Control"}
            </span>
          ) : (
            <span className="flex flex-col leading-tight">
              <span
                className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.32em]"
                style={{ color: transmitting ? "#f5d0fe" : "rgba(165,243,252,.85)" }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: transmitting ? "#f0abfc" : hovered ? "#22d3ee" : "#ff3b6b",
                    boxShadow: `0 0 6px ${transmitting ? "#f0abfc" : hovered ? "#22d3ee" : "#ff3b6b"}`,
                    animation: "gcBlink 1.1s steps(2) infinite",
                  }}
                />
                {transmitting ? "Uplink · CH-07" : hovered ? "Channel open" : "Incoming signal"}
              </span>
              <span className="font-display mt-0.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white">
                {transmitting ? "Establishing link…" : "Ground Control"}
              </span>
              <span
                className="overflow-hidden font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-200/80 transition-all duration-300"
                style={{
                  maxHeight: hovered && !transmitting ? 16 : 0,
                  opacity: hovered && !transmitting ? 1 : 0,
                }}
              >
                ▸ click to transmit
              </span>
            </span>
          )}

          <span
            aria-hidden
            className="ml-auto pl-1 sm:pl-2 text-xs sm:text-sm text-cyan-200 transition-transform duration-300"
            style={{ transform: hovered ? "translate(2px,-2px)" : undefined }}
          >
            ↗
          </span>
        </span>

        {/* uplink progress (desktop only) */}
        {!isMobile && (
          <span
            aria-hidden
            className="relative mt-2 block h-[2px] w-full overflow-hidden rounded-full bg-white/10"
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: transmitting ? undefined : hovered ? "100%" : "18%",
                background: "linear-gradient(90deg,#22d3ee,#a78bfa,#f0abfc)",
                boxShadow: "0 0 8px #22d3ee",
                transition: "width .4s ease",
                animation: transmitting ? "gcFill .9s cubic-bezier(.4,0,.2,1) forwards" : undefined,
              }}
            />
          </span>
        )}
      </button>
    </Html>
  );
}

export function CompanionShip({
  onContact,
  isWormhole = false,
}: {
  onContact: () => void;
  isWormhole?: boolean;
}) {
  const isMobileHook = useIsMobile();
  const { camera, scene } = useThree();
  const root = useRef<THREE.Group>(null);
  const sat = useRef<THREE.Group>(null);
  const dish = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const packets = useRef<THREE.Group>(null);
  const shock = useRef<THREE.Mesh>(null);
  const shock2 = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const feed = useRef<THREE.Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const hoveredRef = useRef(false);
  hoveredRef.current = hovered;
  const hoverAmt = useRef(0);
  const burstAt = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  const panelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a1a3f",
        emissive: "#2563eb",
        emissiveIntensity: 0.35,
        metalness: 0.7,
        roughness: 0.25,
      }),
    [],
  );
  const beaconMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff3b6b" }), []);
  const feedMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#7dd3fc" }), []);

  // Attach to the camera so the relay is always on screen, regardless of camera flights.
  useEffect(() => {
    const g = root.current;
    if (!g) return;
    camera.add(g);
    if (!scene.children.includes(camera)) scene.add(camera);
    return () => {
      camera.remove(g);
    };
  }, [camera, scene]);

  // Re-apply overlay material flags after every render (covers conditionally mounted meshes).
  useEffect(() => {
    if (root.current) applyHudOverlay(root.current);
  });

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
  }, [hovered]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      document.body.style.cursor = "";
    },
    [],
  );

  const transmit = () => {
    if (burstAt.current !== null) return;
    burstAt.current = performance.now() / 1000;
    setTransmitting(true);
    timers.current.push(
      window.setTimeout(() => onContact(), 900),
      window.setTimeout(() => {
        burstAt.current = null;
        setTransmitting(false);
      }, 1250),
    );
  };

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const t = state.clock.elapsedTime;
    const now = performance.now() / 1000;

    // ── viewport anchoring (top-right, under the header) ──
    const D = 8;
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * D;
    const halfW = halfH * cam.aspect;
    const px = (2 * halfH) / state.size.height; // world units per CSS pixel
    const isMobileViewport = state.size.height <= 560 || state.size.width <= 768 || isMobileHook;
    const isLandscapeMobile =
      (state.size.height <= 520 && state.size.width > state.size.height) ||
      (isMobileHook && state.size.width > state.size.height);
    const compact = state.size.width < 640 || isMobileViewport;

    hoverAmt.current = THREE.MathUtils.damp(hoverAmt.current, hoveredRef.current ? 1 : 0, 7, dt);
    const h = hoverAmt.current;

    const b = burstAt.current !== null ? Math.min(1, (now - burstAt.current) / 0.9) : -1;
    const burstPulse = b >= 0 ? Math.sin(b * Math.PI) : 0;

    g.position.set(
      halfW - (isLandscapeMobile ? 60 : isMobileViewport ? 70 : 115) * px,
      halfH - (isLandscapeMobile ? 110 : isMobileViewport ? 120 : 175) * px + Math.sin(t * 1.1) * 3 * px,
      -D,
    );
    g.scale.setScalar(
      px * (isLandscapeMobile ? 16 : isMobileViewport ? 20 : 40) * (1 + h * 0.12 + burstPulse * 0.15),
    );

    // ── satellite attitude ──
    if (sat.current) {
      const spin = b >= 0 ? easeInOutCubic(b) * Math.PI * 2 : 0;
      sat.current.rotation.set(
        THREE.MathUtils.lerp(0.28 + Math.sin(t * 0.6) * 0.06, 0.12, h),
        THREE.MathUtils.lerp(-0.45 + Math.sin(t * 0.35) * 0.5, -0.15, h) + spin,
        THREE.MathUtils.lerp(Math.sin(t * 0.5) * 0.1, 0, h),
      );
    }

    // dish scans the sky when idle, locks onto the viewer on hover
    if (dish.current) {
      const idle = 1 - h;
      dish.current.rotation.set(
        -0.35 * idle + Math.sin(t * 0.7) * 0.15 * idle,
        Math.sin(t * 0.9) * 0.7 * idle,
        0,
      );
    }

    // solar wings: slow sun-tracking roll + extra unfold on hover
    const roll = Math.sin(t * 0.4) * 0.55 * (1 - h);
    const unfold = 0.82 + 0.18 * h;
    if (wingL.current) {
      wingL.current.rotation.x = roll;
      wingL.current.scale.set(unfold, 1, 1);
    }
    if (wingR.current) {
      wingR.current.rotation.x = -roll;
      wingR.current.scale.set(unfold, 1, 1);
    }
    panelMat.emissiveIntensity = 0.3 + h * 0.9 + burstPulse * 1.6 + Math.sin(t * 2) * 0.05;

    // orbiting data packets speed up on hover / transmit
    if (packets.current) packets.current.rotation.z += dt * (0.7 + h * 1.8 + burstPulse * 6);

    // status beacon: red heartbeat idle → cyan lock on hover → white flash on transmit
    if (beacon.current) {
      const beat = (t * 1.3) % 1;
      const blink = beat < 0.08 || (beat > 0.18 && beat < 0.26) ? 1.6 : 0.8;
      beacon.current.scale.setScalar(h > 0.5 || b >= 0 ? 1.3 : blink);
      beaconMat.color.set(b >= 0 ? "#ffffff" : h > 0.5 ? "#22d3ee" : "#ff3b6b");
    }
    if (feed.current) {
      feed.current.scale.setScalar(1 + Math.sin(t * 6) * 0.15 + h * 0.4 + burstPulse * 1.5);
      feedMat.color.set(b >= 0 ? "#ffffff" : "#7dd3fc");
    }

    // uplink shockwaves on click
    const waves: [THREE.Mesh | null, number][] = [
      [shock.current, b],
      [shock2.current, b >= 0 ? b - 0.18 : -1],
    ];
    waves.forEach(([m, p]) => {
      if (!m) return;
      const mat = m.material as THREE.MeshBasicMaterial;
      if (p >= 0 && p <= 1) {
        const e = 1 - Math.pow(1 - p, 3);
        m.scale.setScalar(0.4 + e * 5);
        mat.opacity = (1 - p) * 0.9;
      } else {
        mat.opacity = 0;
      }
    });
  });

  return (
    <group
      ref={root}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        transmit();
      }}
    >
      {/* generous invisible hit-area */}
      <mesh>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* deflector shield bubble during rift transit */}
      {isWormhole && (
        <group>
          <mesh>
            <sphereGeometry args={[1.85, 32, 32]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.16}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2.4, 0, 0]}>
            <torusGeometry args={[1.9, 0.03, 12, 64]} />
            <meshBasicMaterial
              color="#00f5ff"
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}

      {/* orbit path + data packets */}
      <group rotation={[1.15, 0.2, 0.35]}>
        <mesh>
          <torusGeometry args={[1.3, 0.008, 6, 96]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.28} />
        </mesh>
        <group ref={packets}>
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i * Math.PI * 2) / 3) * 1.3,
                Math.sin((i * Math.PI * 2) / 3) * 1.3,
                0,
              ]}
            >
              <sphereGeometry args={[i === 0 ? 0.06 : 0.04, 12, 12]} />
              <meshBasicMaterial color={i === 0 ? "#f0abfc" : "#67e8f9"} />
            </mesh>
          ))}
        </group>
      </group>

      {/* broadcast rings emanating from the dish */}
      <BroadcastRings hoverRef={hoverAmt} />

      {/* uplink shockwaves */}
      <mesh ref={shock}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={shock2}>
        <ringGeometry args={[0.95, 1, 64]} />
        <meshBasicMaterial
          color="#f0abfc"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── the satellite ── */}
      <group ref={sat}>
        {/* gold-foil bus */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.5, 8]} />
          <meshStandardMaterial
            color="#c9a24b"
            metalness={0.95}
            roughness={0.32}
            emissive="#3a2806"
            emissiveIntensity={0.6}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.31, 0.31, 0.08, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.18, 0.24, 0.12, 8]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* status beacon */}
        <mesh ref={beacon} position={[0, 0.05, 0.31]} material={beaconMat}>
          <sphereGeometry args={[0.045, 12, 12]} />
        </mesh>

        {/* solar wings */}
        {(
          [
            [wingR, 1],
            [wingL, -1],
          ] as const
        ).map(([ref, side]) => (
          <group
            key={side}
            position={[side * 0.3, 0, 0]}
            rotation={[0, side === 1 ? 0 : Math.PI, 0]}
          >
            <group ref={ref}>
              <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.24, 6]} />
                <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
              </mesh>
              {[0, 1, 2].map((c) => (
                <mesh key={c} position={[0.42 + c * 0.36, 0, 0]} material={panelMat}>
                  <boxGeometry args={[0.33, 0.5, 0.02]} />
                </mesh>
              ))}
              <mesh position={[0.78, 0, 0]}>
                <boxGeometry args={[1.1, 0.012, 0.03]} />
                <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          </group>
        ))}

        {/* high-gain dish */}
        <group ref={dish} position={[0, 0.38, 0.05]}>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.16, 6]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.36]}>
            <sphereGeometry args={[0.38, 32, 12, 0, Math.PI * 2, 0, 0.62]} />
            <meshStandardMaterial
              color="#f1f5f9"
              metalness={0.4}
              roughness={0.3}
              emissive="#94a3b8"
              emissiveIntensity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.24, 6]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh ref={feed} position={[0, 0, 0.25]} material={feedMat}>
            <sphereGeometry args={[0.04, 12, 12]} />
          </mesh>
        </group>

        {/* whip antenna */}
        <mesh position={[0.16, -0.5, -0.1]} rotation={[0.3, 0, 0.35]}>
          <cylinderGeometry args={[0.008, 0.008, 0.45, 4]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* self-lighting so the relay reads well anywhere in the scene */}
      <pointLight position={[1.5, 2, 3]} intensity={4} distance={4} color="#e0ecff" />
      <pointLight position={[-2, -1, 1]} intensity={2} distance={4} color="#67e8f9" />

      {!isMobileHook && (
        <GroundControlLabel
          hovered={hovered}
          transmitting={transmitting}
          onHover={setHovered}
          onActivate={transmit}
        />
      )}
    </group>
  );
}

export default CompanionShip;
