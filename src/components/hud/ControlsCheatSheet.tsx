import React, { useState } from "react";

export function ControlsCheatSheet({ freeRoam }: { freeRoam: boolean }) {
  const [open, setOpen] = useState(false);
  const Key = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded border border-cyan-400/30 bg-cyan-950/40 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200 shadow-inner">
      {children}
    </kbd>
  );
  return (
    <div className="pointer-events-auto absolute bottom-6 right-6 z-10 w-[260px] max-w-[80vw]">
      <button
        id="tips-toggle-btn"
        aria-label={open ? "Hide controls tips" : "Show controls tips"}
        onClick={() => setOpen((v) => !v)}
        className="ml-auto mb-2 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/80 backdrop-blur hover:border-cyan-400 transition-colors shadow-lg"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${freeRoam ? "bg-emerald-400" : "bg-cyan-400"} animate-pulse`} />
        {open ? "Hide flight tips" : "Flight tips"}
      </button>
      {open && (
        <div
          className="rounded-xl border border-cyan-500/30 bg-slate-950/85 p-4 text-white/85 backdrop-blur-xl shadow-2xl font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-2 font-bold">
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
              <li className="mt-2.5 border-t border-cyan-500/20 pt-2 text-[10px] text-cyan-200/80">
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
              <li className="mt-2.5 border-t border-cyan-500/20 pt-2 text-[10px] text-emerald-300">
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

