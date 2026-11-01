import { useState, useEffect, useRef } from "react";

export function BootSequence({
  onDismiss,
  playBootChime,
}: {
  onDismiss: () => void;
  playBootChime?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[SYS_BOOT 0.1] INITIALIZING QUANTUM AVIONICS // WEBGL2 PIPELINE ONLINE",
  ]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const finishBoot = () => {
    setProgress(100);
    try {
      playBootChime?.();
    } catch { }
    setReady(true);
    setTimeout(() => {
      setDismissed(true);
      onDismiss();
    }, 450);
  };

  useEffect(() => {
    let current = 0;
    const interval = window.setInterval(() => {
      const step = current < 30 ? 5 : current < 70 ? 4 : current < 92 ? 3 : 2;
      current = Math.min(100, current + step);
      setProgress(current);

      if (current >= 24 && current < 46) {
        setLogs((prev) =>
          prev.length === 1
            ? [...prev, "[SYS_BOOT 0.2] PRE-WARMING GPU BUFFER MATRICES & SHADERS..."]
            : prev,
        );
      } else if (current >= 48 && current < 68) {
        setLogs((prev) =>
          prev.length === 2
            ? [...prev, "[SYS_BOOT 0.3] SYNTHESIZING EXOPLANETARY BIOMES (8 CLASSIFICATIONS)..."]
            : prev,
        );
      } else if (current >= 70 && current < 88) {
        setLogs((prev) =>
          prev.length === 3
            ? [...prev, "[SYS_BOOT 0.4] COMPUTING RAYLEIGH LIMB SCATTERING & CLOUD PARALLAX..."]
            : prev,
        );
      } else if (current >= 90 && current < 99) {
        setLogs((prev) =>
          prev.length === 4
            ? [...prev, "[SYS_BOOT 0.5] DEEP-SPACE RELAY LOCKED // CALLSIGN: BACEM ZARAI..."]
            : prev,
        );
      } else if (current >= 100) {
        setLogs((prev) =>
          prev.length === 5
            ? [...prev, "[SYS_BOOT 0.6] WARP CONDUIT STABILIZED (100%) // ODYSSEY ENGAGED"]
            : prev,
        );
        window.clearInterval(interval);
        finishBoot();
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, [onDismiss, playBootChime]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#02040a] text-white overflow-hidden transition-all duration-700 ${ready
        ? "opacity-0 scale-105 pointer-events-none filter blur-md"
        : "opacity-100 scale-100"
        }`}
    >
      {/* Background Star Matrix & Aerospace Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34,211,238,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34,211,238,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(circle at center, rgba(34,211,238,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Skip Button (Top Right) */}
      <button
        onClick={finishBoot}
        className="absolute top-[max(1rem,env(safe-area-inset-top,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-cyan-300 hover:text-white border border-cyan-500/40 neo-btn px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md transition-all z-20 cursor-pointer shadow-md"
      >
        [SKIP INTRO ⏭]
      </button>

      {/* Central Counter-Rotating Quantum Singularity Rings */}
      <div className="relative flex items-center justify-center mb-4 sm:mb-8">
        {/* Outer Ring: Degree Markings & Ticks */}
        <svg className="w-36 h-36 xs:w-44 xs:h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 animate-[spin_20s_linear_infinite]" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeDasharray="40 180"
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeDasharray="60 160"
            strokeDashoffset="120"
            strokeLinecap="round"
          />
        </svg>

        {/* Middle Ring: Counter-Rotating Reticle */}
        <svg className="absolute w-28 h-28 xs:w-36 xs:h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 animate-[spin_12s_linear_infinite_reverse]" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="6 8"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="25 90"
          />
        </svg>

        {/* Inner Ring: Concentric Tech Core */}
        <svg className="absolute w-20 h-20 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 animate-[spin_6s_linear_infinite]" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="rgba(168,85,247,0.4)"
            strokeWidth="2"
            strokeDasharray="12 16"
          />
        </svg>

        {/* Center Glowing Plasma Core with Live Percentage */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
            {progress}%
          </span>
          <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-cyan-400/80 mt-0.5">
            WARP CORE
          </span>
        </div>
      </div>

      {/* Main Title Header */}
      <div className="text-center mb-4 sm:mb-6 px-4">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono text-[8px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.4em] text-cyan-300 uppercase truncate">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          QUANTUM AVIONICS // HYPERSPACE BOOT
        </div>
        <h2 className="font-display mt-1 text-sm xs:text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
          BACEM ZARAI · A COSMIC JOURNEY
        </h2>
      </div>

      {/* Segmented Glowing Progress Bar */}
      <div className="w-[360px] max-w-[85vw] mb-4 sm:mb-6">
        <div className="relative h-2.5 sm:h-3 w-full rounded-full border border-cyan-400/40 neo-inset overflow-hidden p-0.5">
          {/* Calibration marks at 25%, 50%, 75% */}
          <div className="absolute inset-0 flex justify-between px-3 pointer-events-none z-10 opacity-30">
            <span className="w-px h-full bg-cyan-200" />
            <span className="w-px h-full bg-cyan-200" />
            <span className="w-px h-full bg-cyan-200" />
          </div>
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-300 to-emerald-400 transition-all duration-150 shadow-[0_0_14px_#22d3ee,-1px_-1px_2px_rgba(255,255,255,0.7)]"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff,0_0_12px_#22d3ee]" />
          </div>
        </div>
        {/* Status badges */}
        <div className="flex items-center justify-between mt-2 sm:mt-2.5 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/50">
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full neo-inset">CORE: <strong className="text-cyan-300">ONLINE</strong></span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full neo-inset">BIOMES: <strong className="text-emerald-300">STABILIZED</strong></span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full neo-inset">AVIONICS: <strong className="text-sky-300">READY</strong></span>
        </div>
      </div>

      {/* Dynamic Telemetry Terminal Output */}
      <div className="w-[480px] max-w-[92vw] rounded-2xl border border-cyan-400/30 neo-surface-cyan p-3 sm:p-4 font-mono text-[10px] sm:text-[11px] backdrop-blur-xl ring-1 ring-cyan-400/20">
        <div className="flex items-center justify-between border-b border-cyan-400/20 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 text-[8px] sm:text-[9px] uppercase tracking-widest text-cyan-400">
          <span>◈ SYSTEM DIAGNOSTIC LOG</span>
          <span className="animate-pulse text-emerald-400">● REAL-TIME COMPILATION</span>
        </div>
        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-2 text-white/80 neo-inset rounded-xl p-3 border border-cyan-500/15">
          {logs.map((line, idx) => (
            <div key={idx} className="leading-tight">
              <span className="text-cyan-300">{line}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-emerald-300">
            <span>&gt;</span>
            <span className="animate-pulse">█</span>
          </div>
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Anamorphic Warp Flash on 100% Complete */}
      {ready && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100 to-transparent pointer-events-none animate-pulse"
          style={{ transform: "scaleY(0.06)", filter: "blur(4px)" }}
        />
      )}
    </div>
  );
}

export default BootSequence;

