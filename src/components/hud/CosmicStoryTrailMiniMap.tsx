import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import type { Chapter } from "@/config/story";
import { useIsLandscape } from "@/hooks/use-mobile";

export interface MapWaypoint {
  index: number;
  id: string;
  numberStr: string;
  name: string;
  shortLabel: string;
  role: string;
  era: string;
  location: string;
  isMain: boolean;
  color: string;
  accent: string;
  icon: string;
  pos3D: [number, number, number];
}

interface CosmicStoryTrailMiniMapProps {
  chapters: Chapter[];
  visited: Set<string>;
  currentIndex: number;
  onSelectChapter: (index: number) => void;
  onClose?: () => void;
}

export function CosmicStoryTrailMiniMap({
  chapters,
  visited,
  currentIndex,
  onSelectChapter,
  onClose,
}: CosmicStoryTrailMiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Camera Controls State
  const yawRef = useRef<number>(0.4);
  const pitchRef = useRef<number>(0.3);
  const zoomRef = useRef<number>(1.0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoveredIndexRef = useRef<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MapWaypoint | null>(null);

  // Definition of the Abstracted Cosmic Course with Main Scenes Highlighted
  const waypoints: MapWaypoint[] = useMemo(() => [
    {
      index: 0,
      id: "intro",
      numberStr: "01",
      name: "Starport Alpha",
      shortLabel: "01 STARPORT",
      role: "Genesis & Launch Telemetry",
      era: "2020",
      location: "Earth Orbital Alpha",
      isMain: true,
      color: "#38bdf8",
      accent: "#67e8f9",
      icon: "🚀",
      pos3D: [-160, -45, -70],
    },
    {
      index: 1,
      id: "experience-1",
      numberStr: "02",
      name: "Freelance Dev",
      shortLabel: "02 FREELANCE",
      role: "Custom Software & Core Algorithms",
      era: "2020",
      location: "Home Base",
      isMain: false,
      color: "#f59e0b",
      accent: "#fbbf24",
      icon: "💻",
      pos3D: [-120, -30, -35],
    },
    {
      index: 2,
      id: "experience-2",
      numberStr: "03",
      name: "Tunisia 1.0",
      shortLabel: "03 VR LAB",
      role: "Virtual Reality & Computer Vision",
      era: "2020",
      location: "Tunisia",
      isMain: true,
      color: "#a855f7",
      accent: "#c084fc",
      icon: "🥽",
      pos3D: [-80, -15, 10],
    },
    {
      index: 3,
      id: "experience-3",
      numberStr: "04",
      name: "Tunisia 2.0",
      shortLabel: "04 FULL-STACK",
      role: "Distributed Microservices & APIs",
      era: "2021",
      location: "Tunisia",
      isMain: false,
      color: "#06b6d4",
      accent: "#22d3ee",
      icon: "🌐",
      pos3D: [-40, -5, 45],
    },
    {
      index: 4,
      id: "experience-4",
      numberStr: "05",
      name: "Canada R&D",
      shortLabel: "05 5G/6G V2X",
      role: "Autonomous Systems & Wireless Perception",
      era: "2022",
      location: "Canada",
      isMain: true,
      color: "#10b981",
      accent: "#34d399",
      icon: "📡",
      pos3D: [5, 10, 65],
    },
    {
      index: 5,
      id: "experience-5",
      numberStr: "06",
      name: "France 1.0",
      shortLabel: "06 ROBOTICS",
      role: "Embedded Firmware & Sensor Fusion",
      era: "2023 → 2026",
      location: "France",
      isMain: false,
      color: "#f97316",
      accent: "#fb923c",
      icon: "⚙️",
      pos3D: [50, 25, 45],
    },
    {
      index: 6,
      id: "experience-6",
      numberStr: "07",
      name: "France 2.0",
      shortLabel: "07 TECH LEAD",
      role: "Software Architect & Tech Lead",
      era: "2026 → PRESENT",
      location: "France",
      isMain: true,
      color: "#eab308",
      accent: "#fde047",
      icon: "⚡",
      pos3D: [95, 35, 10],
    },
    {
      index: 7,
      id: "wormhole",
      numberStr: "08",
      name: "The Rift",
      shortLabel: "08 THE RIFT",
      role: "Interstellar Wormhole Transit",
      era: "Cosmic Bridge",
      location: "Einstein-Rosen Bridge",
      isMain: true,
      color: "#c084fc",
      accent: "#e879f9",
      icon: "🌀",
      pos3D: [120, 20, -40],
    },
    {
      index: 8,
      id: "galaxy",
      numberStr: "09",
      name: "The Forge",
      shortLabel: "09 THE FORGE",
      role: "Autonomous Systems Galaxy",
      era: "Production Systems",
      location: "Projects Spiral",
      isMain: true,
      color: "#fbbf24",
      accent: "#f59e0b",
      icon: "🪐",
      pos3D: [85, -15, -95],
    },
    {
      index: 9,
      id: "skills",
      numberStr: "10",
      name: "The Arsenal",
      shortLabel: "10 SKILLS",
      role: "Constellation of Core Competencies",
      era: "Mastery Orbit",
      location: "Zenith Space",
      isMain: false,
      color: "#38bdf8",
      accent: "#0ea5e9",
      icon: "✦",
      pos3D: [35, -35, -115],
    },
    {
      index: 10,
      id: "pantheon",
      numberStr: "11",
      name: "The Pantheon",
      shortLabel: "11 PANTHEON",
      role: "Hall of Curated Honors & Credentials",
      era: "Verified Milestones",
      location: "Celestial Citadel",
      isMain: true,
      color: "#ffd27a",
      accent: "#fbbf24",
      icon: "🏆",
      pos3D: [-35, -15, -80],
    },
    {
      index: 11,
      id: "finale",
      numberStr: "12",
      name: "The Singularity",
      shortLabel: "12 SINGULARITY",
      role: "Cosmic Event Horizon & Convergence",
      era: "Infinity",
      location: "Deep Cosmos",
      isMain: true,
      color: "#f43f5e",
      accent: "#fb7185",
      icon: "🌌",
      pos3D: [0, 15, 0],
    },
  ], []);

  // 3D Projection Calculation Helper
  const projectPoint = useCallback(
    (
      pos: [number, number, number],
      yaw: number,
      pitch: number,
      zoom: number,
      w: number,
      h: number,
    ) => {
      const [X, Y, Z] = pos;

      // Rotate around Y axis (yaw)
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x1 = X * cosY - Z * sinY;
      const z1 = X * sinY + Z * cosY;

      // Rotate around X axis (pitch)
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y2 = Y * cosP - z1 * sinP;
      const z2 = Y * sinP + z1 * cosP;

      // Perspective Projection
      const cameraDistance = 340;
      const perspective = cameraDistance / (cameraDistance + z2 * zoom * 0.9);
      const screenX = w / 2 + x1 * zoom * perspective;
      const screenY = h / 2 + y2 * zoom * perspective;

      return {
        screenX,
        screenY,
        depth: z2,
        scale: perspective * zoom,
      };
    },
    [],
  );

  // Cubic Catmull-Rom interpolation for smooth trajectory spline
  const getSplinePoint = useCallback(
    (pts: [number, number, number][], t: number): [number, number, number] => {
      const n = pts.length - 1;
      const p = t * n;
      const i = Math.floor(p);
      const weight = p - i;

      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[Math.min(n, i + 1)];
      const p3 = pts[Math.min(n, i + 2)];

      const t2 = weight * weight;
      const t3 = t2 * weight;

      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * weight +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * weight +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      const z =
        0.5 *
        (2 * p1[2] +
          (-p0[2] + p2[2]) * weight +
          (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 +
          (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3);

      return [x, y, z];
    },
    [],
  );

  // Background Cosmic Stars for 3D depth field
  const backgroundStars = useMemo(() => {
    const list: [number, number, number, number][] = [];
    for (let i = 0; i < 48; i++) {
      const rx = (Math.random() - 0.5) * 360;
      const ry = (Math.random() - 0.5) * 220;
      const rz = (Math.random() - 0.5) * 320;
      const rsize = 0.8 + Math.random() * 1.5;
      list.push([rx, ry, rz, rsize]);
    }
    return list;
  }, []);

  // Main 3D Animation & Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let pulseProgress = 0;
    const trajectoryPoints = waypoints.map((w) => w.pos3D);

    const render = () => {
      // Handle high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Gentle, subtle auto-rotation when user is not actively dragging
      if (!isDraggingRef.current) {
        yawRef.current += 0.0008;
      }

      pulseProgress = (pulseProgress + 0.0012) % 1;

      const yaw = yawRef.current;
      const pitch = pitchRef.current;
      const zoom = zoomRef.current;

      // 1. Render Background Parallax Stars
      backgroundStars.forEach(([sx, sy, sz, size]) => {
        const star = projectPoint([sx, sy, sz], yaw, pitch, zoom, w, h);
        const alpha = Math.max(0.1, Math.min(0.5, 0.35 + star.depth * 0.001));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.screenX, star.screenY, Math.max(0.5, size * star.scale), 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Render Smooth 3D Trajectory Curve
      const steps = 90;
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const pt = getSplinePoint(trajectoryPoints, t);
        const projected = projectPoint(pt, yaw, pitch, zoom, w, h);
        if (s === 0) {
          ctx.moveTo(projected.screenX, projected.screenY);
        } else {
          ctx.lineTo(projected.screenX, projected.screenY);
        }
      }

      // Outer Trajectory Glow — Subtle & Faint
      ctx.strokeStyle = "rgba(56, 189, 248, 0.16)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner Core Trajectory Line
      ctx.strokeStyle = "rgba(103, 232, 249, 0.45)";
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // 3. Render Subtle Traveling Photon Pulse along the Trail (Toned Down)
      const photonPt = getSplinePoint(trajectoryPoints, pulseProgress);
      const projectedPhoton = projectPoint(photonPt, yaw, pitch, zoom, w, h);

      const rad = ctx.createRadialGradient(
        projectedPhoton.screenX,
        projectedPhoton.screenY,
        0,
        projectedPhoton.screenX,
        projectedPhoton.screenY,
        5 * projectedPhoton.scale,
      );
      rad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      rad.addColorStop(0.5, "rgba(56, 189, 248, 0.4)");
      rad.addColorStop(1, "rgba(56, 189, 248, 0)");

      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(projectedPhoton.screenX, projectedPhoton.screenY, 5 * projectedPhoton.scale, 0, Math.PI * 2);
      ctx.fill();

      // 4. Project and Depth-Sort All Waypoints
      const projectedNodes = waypoints.map((wp) => {
        const proj = projectPoint(wp.pos3D, yaw, pitch, zoom, w, h);
        return {
          ...wp,
          ...proj,
        };
      });

      // Sort by depth (far to near)
      projectedNodes.sort((a, b) => b.depth - a.depth);

      // 5. Render Waypoint Celestial Nodes
      projectedNodes.forEach((node) => {
        const isSelected = node.index === currentIndex;
        const isHovered = node.index === hoveredIndexRef.current;
        const isVisited = visited.has(node.id) || node.index <= currentIndex;

        const baseRadius = node.isMain ? 7.5 : 4.5;
        const radius = (isHovered ? baseRadius * 1.3 : baseRadius) * node.scale;

        // Subtle Active Radar Wave (Toned Down)
        if (isSelected) {
          const waveRadius = radius * (1.5 + Math.sin(Date.now() * 0.002) * 0.25);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Outer Aura Ring for Main Scenes
        if (node.isMain) {
          ctx.strokeStyle = isHovered ? "#ffffff" : node.accent;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, radius * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Core Celestial Orb
        const grad = ctx.createRadialGradient(
          node.screenX - radius * 0.3,
          node.screenY - radius * 0.3,
          radius * 0.1,
          node.screenX,
          node.screenY,
          radius,
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.5, node.color);
        grad.addColorStop(1, "rgba(5, 10, 20, 0.95)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Visited Dot
        if (isVisited && !node.isMain) {
          ctx.fillStyle = "rgba(52, 211, 153, 0.75)";
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, 1.5 * node.scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Clean Single-Line Layered Landmark Labels — only render active node and hovered node to prevent messy collisions
        const shouldShowLabel = isHovered || node.index === currentIndex;
        if (shouldShowLabel) {
          ctx.font = `bold ${Math.max(8, Math.round(8 * node.scale))}px 'Orbitron', 'Rajdhani', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          const labelY = node.screenY - radius * 1.6 - 4;

          // Legibility Underlay pill with glowing border
          const textMetrics = ctx.measureText(node.shortLabel);
          const badgeW = textMetrics.width + 10;
          const badgeH = 14;
          ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
          ctx.fillRect(node.screenX - badgeW / 2, labelY - badgeH + 2, badgeW, badgeH);
          ctx.strokeStyle = isHovered ? "#ffffff" : node.accent;
          ctx.lineWidth = 1;
          ctx.strokeRect(node.screenX - badgeW / 2, labelY - badgeH + 2, badgeW, badgeH);

          ctx.fillStyle = isHovered ? "#ffffff" : node.accent;
          ctx.fillText(node.shortLabel, node.screenX, labelY);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [waypoints, backgroundStars, currentIndex, visited, projectPoint, getSplinePoint]);

  // Mouse & Touch Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      yawRef.current += dx * 0.007;
      pitchRef.current = Math.max(-1.1, Math.min(1.1, pitchRef.current + dy * 0.007));
    }

    // Hit-testing for Hover Detection
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const zoom = zoomRef.current;

    let closestNode: MapWaypoint | null = null;
    let closestDist = 24; // Pixel hit threshold

    waypoints.forEach((wp) => {
      const proj = projectPoint(wp.pos3D, yaw, pitch, zoom, w, h);
      const dist = Math.hypot(mouseX - proj.screenX, mouseY - proj.screenY);
      if (dist < closestDist) {
        closestDist = dist;
        closestNode = wp;
      }
    });

    if (closestNode) {
      hoveredIndexRef.current = (closestNode as MapWaypoint).index;
      setHoveredNode(closestNode);
      canvas.style.cursor = "pointer";
    } else {
      hoveredIndexRef.current = null;
      setHoveredNode(null);
      canvas.style.cursor = isDraggingRef.current ? "grabbing" : "grab";
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleClick = () => {
    if (hoveredNode) {
      onSelectChapter(hoveredNode.index);
    }
  };

  // Non-passive wheel listener for smooth zooming without browser scroll collision
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.0012;
      zoomRef.current = Math.max(0.65, Math.min(1.9, zoomRef.current + delta));
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  const isLandscape = useIsLandscape();

  const handleResetOrientation = () => {
    yawRef.current = 0.4;
    pitchRef.current = 0.3;
    zoomRef.current = 1.0;
  };

  return (
    <div
      role="region"
      aria-label="Interactive 3D Cosmic Course Mini Map"
      className="relative flex flex-col w-full rounded-2xl border border-cyan-400/30 bg-black/80 backdrop-blur-xl shadow-[0_0_35px_rgba(0,0,0,0.85),0_0_20px_rgba(34,211,238,0.15)] overflow-hidden max-h-[85vh]"
    >
      {/* Top Header — Clean Single-Line */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-1 sm:py-2 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse flex-shrink-0" />
          <h3 className="text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.15em] sm:tracking-[0.25em] text-cyan-300 font-bold whitespace-nowrap">
            <span className="hidden sm:inline">3D </span>COSMIC TRAIL
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetOrientation}
            title="Reset 3D Camera"
            className="text-[7px] sm:text-[9px] font-mono text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-full transition whitespace-nowrap cursor-pointer"
          >
            ↺ Reset
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Map View"
              className="text-[8px] sm:text-[10px] font-mono text-white/50 hover:text-white bg-white/5 hover:bg-white/15 px-1.5 py-0.5 rounded-full transition whitespace-nowrap cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive 3D Canvas — Pure 3D Viewport */}
      <div
        className={`relative w-full ${
          isLandscape
            ? "h-[125px]"
            : "h-[180px] xs:h-[220px] sm:h-[280px] md:h-[320px]"
        } bg-gradient-to-b from-transparent to-[#02050f]/80`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          className="w-full h-full touch-none select-none"
          style={{ cursor: "grab" }}
        />

        {/* Intuitive 3D Flight Controls Hint — Clean Single-Line */}
        <div className="pointer-events-none absolute bottom-1.5 left-2.5 sm:bottom-2 sm:left-3 flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-mono tracking-wider sm:tracking-widest text-white/40 uppercase whitespace-nowrap">
          <span>DRAG TO ORBIT</span>
          <span>·</span>
          <span>SCROLL TO ZOOM</span>
          <span className="hidden xs:inline">·</span>
          <span className="text-cyan-300 hidden xs:inline">CLICK TO WARP</span>
        </div>

        {/* Hover Inspection HUD Pill — Single-Line Layered */}
        {hoveredNode && (
          <div className="pointer-events-none absolute top-3 right-3 max-w-[260px] rounded-xl border border-cyan-400/40 bg-black/90 px-3 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.25)] animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300 whitespace-nowrap gap-2">
              <span>{hoveredNode.icon} SECTOR {hoveredNode.numberStr}</span>
              <span className="text-white/40">{hoveredNode.era}</span>
            </div>
            <div className="text-xs font-display font-bold uppercase text-white mt-0.5 truncate whitespace-nowrap">
              {hoveredNode.name}
            </div>
            <div className="text-[10px] font-mono text-cyan-200/80 truncate whitespace-nowrap">
              {hoveredNode.role}
            </div>
            <div className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest mt-1 whitespace-nowrap">
              ✦ CLICK TO WARP
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CosmicStoryTrailMiniMap;
