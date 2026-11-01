import { useState } from "react";
import type { PortfolioContent } from "@/content/portfolio";

export function MissionBriefing({
  brand,
  caption,
  bootReady,
}: {
  brand: PortfolioContent["brand"];
  caption?: string;
  bootReady: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      id="initial-mission-briefing"
      aria-label="Starport Flight Log & Mission Briefing"
      className={`fixed left-3 right-3 sm:left-6 md:left-10 sm:right-auto bottom-[max(4.25rem,calc(env(safe-area-inset-bottom,0px)+3.5rem))] sm:bottom-12 landscape:bottom-3 landscape:left-3 landscape:right-auto z-20 w-auto sm:w-[360px] sm:max-w-[380px] landscape:w-[320px] landscape:max-w-[44vw] transition-all duration-700 pointer-events-auto ${
        bootReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="rounded-2xl border border-cyan-400/30 neo-surface-cyan px-3.5 py-3 sm:px-6 sm:py-5 backdrop-blur-2xl ring-1 ring-cyan-300/20 max-h-[50vh] sm:max-h-none landscape:max-h-[82vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 font-mono text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.28em] text-cyan-300 uppercase">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="truncate">01 · LUNAR STARPORT ALPHA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 hidden xs:inline">// BRIEFING</span>
            {/* Collapse toggle for mobile / landscape */}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="md:hidden text-[9px] font-mono uppercase tracking-wider text-cyan-300/80 hover:text-white px-2 py-0.5 rounded-full border border-cyan-400/30 neo-btn flex-shrink-0 cursor-pointer"
              aria-label={collapsed ? "Expand mission briefing" : "Collapse mission briefing"}
            >
              {collapsed ? "▲ Expand" : "▼ Hide"}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-2 sm:mt-3 animate-in fade-in duration-200">
            <h1 className="font-display text-lg sm:text-2xl font-black uppercase tracking-[0.14em] sm:tracking-[0.18em] text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.6)]">
              {brand.name}
            </h1>

            <p className="mt-1 font-mono text-[10px] sm:text-[11px] leading-relaxed tracking-[0.08em] sm:tracking-[0.12em] text-cyan-200/90">
              {brand.tagline.toUpperCase().split(" · ").join(" // ")}
            </p>

            {caption && (
              <div className="mt-2.5 sm:mt-3 rounded-xl neo-inset p-2.5 sm:p-3 border border-white/5">
                <p className="text-[11px] sm:text-xs leading-relaxed text-white/85">{caption}</p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between rounded-lg neo-inset px-2.5 py-1.5 sm:px-3 sm:py-2 border border-cyan-400/15 text-[8px] sm:text-[9px] font-mono text-white/60">
              <span>
                AVIONICS: <strong className="text-emerald-300 font-semibold">NOMINAL</strong>
              </span>
              <span className="text-white/20">·</span>
              <span>
                SECTORS: <strong className="text-cyan-300 font-semibold">6 WAYPOINTS</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default MissionBriefing;
