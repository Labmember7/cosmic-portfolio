import React, { useRef, useState, useEffect } from "react";

interface SpacetimeRipple {
  id: number;
  x: number;
  y: number;
}

export function CosmicMouseReticle() {
  const followerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ripples, setRipples] = useState<SpacetimeRipple[]>([]);
  const [visible, setVisible] = useState(false);

  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;

    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      const targetEl = e.target as HTMLElement | null;
      const isInteractive =
        document.body.style.cursor === "pointer" ||
        targetEl?.closest(
          "button, a, [role='button'], input, select, textarea, .cursor-pointer",
        ) !== null;
      setHovered(isInteractive);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        setDragging(true);
      } else if (e.button === 0) {
        // Trigger a small, subtle water droplet ripple on space-time
        const id = Date.now() + Math.random();
        setRipples((prev) => [...prev.slice(-3), { id, x: e.clientX, y: e.clientY }]);
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 550);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        setDragging(false);
      }
    };

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.24;
      pos.current.y += (target.current.y - pos.current.y) * 0.24;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(animId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none hidden md:block">
      {/* 1. Precision Center Tracking Dot */}
      <div
        ref={dotRef}
        className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee,0_0_14px_#38bdf8]"
        style={{ willChange: "transform" }}
      />

      {/* 2. Fluid Lagging Concentric Tactical HUD Reticle */}
      <div
        ref={followerRef}
        className="absolute -left-5 -top-5 flex h-10 w-10 items-center justify-center"
        style={{ willChange: "transform" }}
      >
        <div
          className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
            dragging
              ? "h-12 w-12 border-2 border-purple-400 bg-purple-950/25 shadow-[0_0_20px_rgba(192,132,252,0.65)] rotate-45"
              : hovered
                ? "h-12 w-12 border border-cyan-300 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.55)] scale-110"
                : "h-8 w-8 border border-cyan-400/40 bg-transparent shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          }`}
        >
          {/* Tactical Corner Brackets */}
          <span
            className={`absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 transition-colors duration-200 ${
              dragging ? "border-purple-300" : hovered ? "border-cyan-200" : "border-cyan-400/60"
            }`}
          />
          <span
            className={`absolute -top-1 -right-1 h-2 w-2 border-t-2 border-r-2 transition-colors duration-200 ${
              dragging ? "border-purple-300" : hovered ? "border-cyan-200" : "border-cyan-400/60"
            }`}
          />
          <span
            className={`absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 transition-colors duration-200 ${
              dragging ? "border-purple-300" : hovered ? "border-cyan-200" : "border-cyan-400/60"
            }`}
          />
          <span
            className={`absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 transition-colors duration-200 ${
              dragging ? "border-purple-300" : hovered ? "border-cyan-200" : "border-cyan-400/60"
            }`}
          />

          {/* Compass Axis Crosshair when dragging */}
          {dragging && (
            <>
              <div className="absolute h-full w-px bg-purple-400/60 shadow-[0_0_6px_#c084fc]" />
              <div className="absolute w-full h-px bg-purple-400/60 shadow-[0_0_6px_#c084fc]" />
            </>
          )}

          {/* Locked-on rotating reticle when hovered */}
          {hovered && !dragging && (
            <div className="absolute inset-1 rounded-full border border-dashed border-cyan-300/40 animate-[spin_6s_linear_infinite]" />
          )}
        </div>
      </div>

      {/* 3. Small Subtle Water Droplet Space-Time Ripple */}
      {ripples.map((r) => (
        <div key={r.id} className="pointer-events-none absolute" style={{ left: r.x, top: r.y }}>
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300 pointer-events-none"
            style={{
              animation: "water-droplet-ripple 0.5s cubic-bezier(0.12, 0.65, 0.35, 1) forwards",
            }}
          />
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 pointer-events-none"
            style={{
              animation: "water-droplet-echo 0.42s ease-out 0.08s forwards",
            }}
          />
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 pointer-events-none"
            style={{
              animation: "water-droplet-core 0.22s ease-out forwards",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default CosmicMouseReticle;
