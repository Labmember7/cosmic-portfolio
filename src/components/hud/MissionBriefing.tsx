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
  return (
    <aside
      id="initial-mission-briefing"
      aria-label="Starport Flight Log & Mission Briefing"
      className={`fixed left-6 bottom-10 sm:left-10 sm:bottom-12 z-20 w-[360px] max-w-[min(360px,calc(50vw-160px))] transition-all duration-700 pointer-events-auto ${
        bootReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="rounded-2xl border border-cyan-400/30 neo-surface-cyan px-6 py-5 backdrop-blur-2xl ring-1 ring-cyan-300/20">
        <div className="flex items-center justify-between gap-2 font-mono text-[9px] tracking-[0.28em] text-cyan-300 uppercase">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span>01 · LUNAR STARPORT ALPHA</span>
          </div>
          <span className="text-white/40">// MISSION BRIEFING</span>
        </div>

        <h1 className="font-display mt-3 text-2xl font-black uppercase tracking-[0.18em] text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.6)]">
          {brand.name}
        </h1>

        <p className="mt-1.5 font-mono text-[11px] leading-relaxed tracking-[0.12em] text-cyan-200/90">
          {brand.tagline.toUpperCase().split(" · ").join(" // ")}
        </p>

        {caption && (
          <div className="mt-3 rounded-xl neo-inset p-3 border border-white/5">
            <p className="text-xs leading-relaxed text-white/85">{caption}</p>
          </div>
        )}

        <div className="mt-3.5 flex items-center justify-between rounded-lg neo-inset px-3 py-2 border border-cyan-400/15 text-[9px] font-mono text-white/60">
          <span>
            AVIONICS: <strong className="text-emerald-300 font-semibold">NOMINAL</strong>
          </span>
          <span className="text-white/20">·</span>
          <span>
            SECTORS: <strong className="text-cyan-300 font-semibold">6 WAYPOINTS</strong>
          </span>
        </div>
      </div>
    </aside>
  );
}

export default MissionBriefing;
