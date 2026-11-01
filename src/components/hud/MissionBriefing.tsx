import { useState, useEffect } from "react";
import type { PortfolioContent } from "@/content/portfolio";
import { useIsMobile, useIsLandscape } from "@/hooks/use-mobile";

export function MissionBriefing({
  brand,
  caption,
  bootReady,
}: {
  brand: PortfolioContent["brand"];
  caption?: string;
  bootReady: boolean;
}) {
  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();
  // Default to collapsed in landscape mobile so the wide 3D panoramic view stays unobstructed
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isLandscape) {
      setCollapsed(true);
    }
  }, [isLandscape]);

  return (
    <aside
      id="initial-mission-briefing"
      aria-label="Starport Flight Log & Mission Briefing"
      className={`fixed left-2.5 sm:left-6 md:left-8 z-35 transition-all duration-500 pointer-events-auto ${
        bootReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      } ${
        isLandscape
          ? "bottom-9 sm:bottom-10 w-[260px] max-w-[40vw]"
          : isMobile
            ? "bottom-[max(3.8rem,calc(env(safe-area-inset-bottom,0px)+3.2rem))] left-2.5 right-2.5 w-auto max-w-[340px]"
            : "bottom-14 md:bottom-16 w-[340px] md:w-[440px] lg:w-[480px]"
      }`}
    >
      {collapsed ? (
        /* Ultra-compact collapsed chip — Click to expand */
        <button
          onClick={() => setCollapsed(false)}
          className="group flex items-center justify-between gap-2 rounded-xl border border-cyan-400/35 bg-black/80 px-2.5 py-1.5 backdrop-blur-xl ring-1 ring-cyan-400/25 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:border-cyan-400/70 transition-all cursor-pointer text-left w-full"
          aria-label="Expand mission briefing"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee] flex-shrink-0" />
            <span className="font-mono text-[9px] font-bold text-cyan-300 tracking-wider truncate uppercase">
              01 · STARPORT ALPHA
            </span>
          </div>
          <span className="text-[8px] font-mono text-cyan-200/90 uppercase px-1.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 group-hover:bg-cyan-400/25 flex-shrink-0">
            ▲ Briefing
          </span>
        </button>
      ) : (
        /* Adaptive expanded card — Click header or button to collapse */
        <div
          className={`rounded-2xl border border-cyan-400/30 neo-surface-cyan p-2.5 sm:p-4 backdrop-blur-2xl ring-1 ring-cyan-300/20 shadow-[0_0_25px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200 ${
            isLandscape
              ? "max-h-[175px] overflow-y-auto"
              : isMobile
                ? "max-h-[48vh] overflow-y-auto"
                : "max-h-none overflow-visible"
          }`}
        >
          {/* Card Header (clickable to collapse) */}
          <div
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-between gap-2 cursor-pointer pb-1.5 border-b border-cyan-400/20 hover:opacity-90 transition-opacity"
            title="Click to collapse description"
          >
            <div className="flex items-center gap-1.5 font-mono text-[8px] sm:text-[9px] tracking-[0.18em] text-cyan-300 uppercase truncate">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse flex-shrink-0" />
              <span className="truncate">01 · LUNAR STARPORT ALPHA</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(true);
              }}
              className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-cyan-300/80 hover:text-white px-2 py-0.5 rounded-full border border-cyan-400/30 neo-btn flex-shrink-0 cursor-pointer"
              aria-label="Collapse mission briefing"
            >
              ▼ Hide
            </button>
          </div>

          <div className="mt-1.5 sm:mt-2">
            <h1 className="font-display text-xs sm:text-base md:text-lg font-black uppercase tracking-[0.12em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {brand.name}
            </h1>

            <p className="mt-0.5 font-mono text-[8px] sm:text-[10px] leading-snug tracking-[0.06em] text-cyan-200/90 truncate">
              {brand.tagline.toUpperCase().split(" · ").join(" // ")}
            </p>

            {caption && (
              <div
                onClick={() => setCollapsed(true)}
                className="mt-1.5 sm:mt-2 rounded-lg neo-inset p-2 border border-white/5 cursor-pointer hover:border-cyan-400/20 transition-all"
                title="Click description to collapse"
              >
                <p
                  className={`text-[10px] sm:text-[11px] md:text-xs leading-relaxed text-white/85 ${
                    isLandscape ? "line-clamp-3" : isMobile ? "line-clamp-4" : ""
                  }`}
                >
                  {caption}
                </p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between rounded-md neo-inset px-2 py-1 border border-cyan-400/15 text-[7px] sm:text-[8px] font-mono text-white/60">
              <span>
                AVIONICS: <strong className="text-emerald-300 font-semibold">NOMINAL</strong>
              </span>
              <span className="text-white/20">·</span>
              <span>
                WAYPOINTS: <strong className="text-cyan-300 font-semibold">12 SECTORS</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default MissionBriefing;
