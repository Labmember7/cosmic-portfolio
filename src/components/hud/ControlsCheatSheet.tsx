import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function ControlsCheatSheet({
  freeRoam,
  isIntro = false,
}: {
  freeRoam: boolean;
  isIntro?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const Key = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded-md border border-cyan-400/40 neo-key px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
      {children}
    </kbd>
  );

  return (
    <div
      className={`pointer-events-auto absolute right-3 sm:right-6 z-40 w-[260px] max-w-[calc(100vw-1.5rem)] transition-all duration-500 ${
        isIntro
          ? "bottom-[max(4.25rem,calc(env(safe-area-inset-bottom,0px)+3.5rem))] sm:bottom-12"
          : "bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:bottom-6"
      }`}
    >
      <button
        id="tips-toggle-btn"
        aria-label={open ? "Hide controls tips" : "Show controls tips"}
        onClick={() => setOpen((v) => !v)}
        className="ml-auto mb-2 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/35 hover:border-cyan-400/30 hover:bg-black/50 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.2em] text-white/55 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${freeRoam ? "bg-emerald-400/80" : "bg-cyan-400/80"} animate-pulse`} />
        {open ? (isMobile ? "Hide hints" : "Hide flight tips") : (isMobile ? "Touch hints" : "Flight tips")}
      </button>
      {open && (
        <div
          className="rounded-2xl border border-cyan-500/30 neo-surface-cyan p-3.5 sm:p-4 text-white/85 backdrop-blur-xl font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200 ring-1 ring-cyan-400/20 max-h-[55vh] overflow-y-auto"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-cyan-400 mb-2 font-bold">
            {isMobile
              ? "// TOUCH AVIONICS GESTURES"
              : freeRoam
                ? "// FREE ROAM PILOT AVIONICS"
                : "// ORBITAL NAVIGATION CONTROLS"}
          </p>

          {isMobile ? (
            <ul className="space-y-1.5 text-[11px] leading-snug">
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Next / Prev waypoint</span>
                <span className="flex gap-1 text-[10px] text-cyan-300 font-bold">
                  <Key>Swipe ⟵ / ⟶</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Orbit perspective</span>
                <span className="flex gap-1 text-[10px] text-cyan-300 font-bold">
                  <Key>Drag 1-finger</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Telescopic zoom</span>
                <span className="flex gap-1 text-[10px] text-cyan-300 font-bold">
                  <Key>Pinch 2-finger</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Inspect element</span>
                <span className="flex gap-1 text-[10px] text-cyan-300 font-bold">
                  <Key>Tap</Key>
                </span>
              </li>
              <li className="mt-2.5 rounded-lg neo-inset p-2 border border-cyan-500/20 text-[10px] text-cyan-200/90 leading-relaxed">
                Tip: Swipe left/right across the cosmos or tap the bottom controls to journey between engineering waypoints.
              </li>
            </ul>
          ) : !freeRoam ? (
            <ul className="space-y-1.5 text-[11px] leading-snug">
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Grab & rotate</span>
                <span className="flex gap-1">
                  <Key>Right-Drag</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Advance waypoint</span>
                <span className="flex gap-1">
                  <Key>Space</Key>
                  <Key>→</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Previous sector</span>
                <span className="flex gap-1">
                  <Key>←</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Telescopic zoom</span>
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
              <li className="mt-2.5 rounded-lg neo-inset p-2 border border-cyan-500/20 text-[10px] text-cyan-200/90 leading-relaxed">
                Tip: Right-click & drag anywhere to look around; the viewing angle smoothly persists until the wormhole rift.
              </li>
            </ul>
          ) : (
            <ul className="space-y-1.5 text-[11px] leading-snug">
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Thrust vectors</span>
                <span className="flex gap-1">
                  <Key>W</Key>
                  <Key>A</Key>
                  <Key>S</Key>
                  <Key>D</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Avionics look</span>
                <span className="flex gap-1">
                  <Key>mouse</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Elevation +/-</span>
                <span className="flex gap-1">
                  <Key>Space</Key>
                  <Key>Ctrl</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Afterburner boost</span>
                <span className="flex gap-1">
                  <Key>Shift</Key>
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/70">Disengage flight lock</span>
                <span className="flex gap-1">
                  <Key>Esc</Key>
                </span>
              </li>
              <li className="mt-2.5 rounded-lg neo-inset p-2 border border-cyan-500/20 text-[10px] text-emerald-300 leading-relaxed">
                Click canvas to engage pointer-lock flight. Press <span className="font-bold">Esc</span> to release.
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ControlsCheatSheet;

