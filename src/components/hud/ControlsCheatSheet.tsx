import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function ControlsCheatSheet({
  freeRoam,
  isIntro = false,
  mobileOpen = false,
  onMobileClose,
}: {
  freeRoam: boolean;
  isIntro?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const Key = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded-md border border-cyan-400/40 neo-key px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
      {children}
    </kbd>
  );

  return (
    <>
      {/* Desktop Floating Button & Flyout Panel (strictly hidden on mobile/landscape to eliminate UI collisions) */}
      {!isMobile && (
        <div
          className={`pointer-events-auto hidden lg:block absolute right-3 sm:right-6 z-40 w-[260px] max-w-[calc(100vw-1.5rem)] transition-all duration-500 ${
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
            <span
              className={`h-1.5 w-1.5 rounded-full ${freeRoam ? "bg-emerald-400/80" : "bg-cyan-400/80"} animate-pulse`}
            />
            {open ? "Hide flight tips" : "Flight tips"}
          </button>
          {open && (
            <div className="rounded-2xl border border-cyan-500/30 neo-surface-cyan p-3.5 sm:p-4 text-white/85 backdrop-blur-xl font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200 ring-1 ring-cyan-400/20 max-h-[55vh] overflow-y-auto overflow-x-hidden">
              <p className="text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-cyan-400 mb-2 font-bold">
                {freeRoam ? "// FREE ROAM PILOT AVIONICS" : "// ORBITAL NAVIGATION CONTROLS"}
              </p>

              {!freeRoam ? (
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
      )}

      {/* Mobile Dedicated Modal Dialog */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Touch Avionics Gestures"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 pointer-events-auto"
          onClick={onMobileClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-cyan-400/40 neo-surface-cyan p-4 sm:p-5 text-white/90 backdrop-blur-2xl ring-1 ring-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.25)] font-mono animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto overflow-x-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Touch Avionics
                </h3>
              </div>
              <button
                onClick={onMobileClose}
                aria-label="Close Touch Avionics Guide"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/15 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Gestures List */}
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/80">Next / Prev sector</span>
                <Key>Swipe ⟵ / ⟶</Key>
              </li>
              <li className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/80">Orbit camera view</span>
                <Key>Drag 1-finger</Key>
              </li>
              <li className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/80">Telescopic zoom</span>
                <Key>Pinch 2-finger</Key>
              </li>
              <li className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black/30 border border-white/5">
                <span className="text-white/80">Inspect target / ship</span>
                <Key>Tap</Key>
              </li>
            </ul>

            {/* Panoramic Tip */}
            <div className="mt-3 rounded-xl neo-inset p-2.5 border border-cyan-500/25 text-[11px] text-cyan-200/90 leading-relaxed">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                <span>🔄</span>
                <span>Panoramic Cosmic Flight:</span>
              </div>
              Rotate your phone horizontally (landscape) for a panoramic view of the interstellar journey.
            </div>

            {/* Action button */}
            <button
              onClick={onMobileClose}
              className="mt-4 w-full py-2 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold uppercase tracking-widest transition cursor-pointer"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ControlsCheatSheet;
