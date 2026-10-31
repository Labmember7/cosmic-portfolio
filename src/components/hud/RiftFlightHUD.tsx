export function RiftFlightHUD() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none overflow-hidden animate-in fade-in duration-500">
      {/* 1. Center Horizon Lock Reticle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-52 w-52 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-400/35 shadow-[0_0_20px_rgba(56,189,248,0.2)]" />
          <div className="absolute inset-3 rounded-full border border-dashed border-cyan-300/20" />
          <div className="absolute inset-10 rounded-full border border-cyan-400/20" />

          {/* Cardinal Crosshairs */}
          <div className="absolute top-0 h-3.5 w-0.5 bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
          <div className="absolute bottom-0 h-3.5 w-0.5 bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
          <div className="absolute left-0 h-0.5 w-3.5 bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
          <div className="absolute right-0 h-0.5 w-3.5 bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />

          {/* Central Laser Point */}
          <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#38bdf8,0_0_20px_#38bdf8]" />

          <span className="absolute -bottom-7 font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/80 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]">
            HORIZON LOCK // 0.00°
          </span>
        </div>
      </div>

      {/* 2. Top Header Telemetry & Transit Corridor Progress Cluster */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 rounded-full border border-cyan-400/40 neo-pill px-5 py-2 backdrop-blur-xl">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_#38bdf8]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              EINSTEIN-ROSEN TRANSIT // METRIC FLUX: 0.038 G
            </span>
            <span className="h-3 w-px bg-cyan-400/30" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              STABLE 99.8%
            </span>
          </div>

          {/* Transit Corridor Progress Meter */}
            <div className="flex w-[340px] max-w-[85vw] flex-col items-center gap-1.5 rounded-2xl border border-cyan-400/25 neo-inset px-4 py-2 backdrop-blur-md">
              <div className="flex w-full justify-between font-mono text-[8px] uppercase tracking-[0.22em] text-cyan-300/80">
                <span>ENTRANCE LENS</span>
                <span className="font-bold text-white drop-shadow-[0_0_8px_#38bdf8] animate-pulse">
                  SLIPSTREAM TRANSIT
                </span>
                <span>THE FORGE</span>
              </div>
                <div className="h-2 w-full rounded-full border border-cyan-400/30 neo-inset p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-300 shadow-[0_0_8px_#38bdf8] animate-pulse"
                    style={{ width: "68%" }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Left Avionics Bracket */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 rounded-2xl border border-cyan-400/25 neo-surface-cyan p-4 font-mono text-[10px] text-cyan-200/80 backdrop-blur-xl">
                <div className="border-b border-cyan-400/20 pb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-cyan-400">
                  SPACETIME METRIC // FLIGHT READOUT
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-white/60">CURVATURE κ:</span>
                  <span className="text-cyan-300 font-semibold">-0.984 G</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-white/60">TENSOR DILATION:</span>
                  <span className="text-cyan-300 font-semibold">1.042 τ</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-white/60">INERTIAL DAMPENERS:</span>
                  <span className="text-emerald-400 font-semibold">ACTIVE [100%]</span>
                </div>
                <div className="flex justify-between gap-6 pt-1 border-t border-cyan-400/15">
                  <span className="text-white/60">SLIPSTREAM COHERENCE:</span>
                  <span className="text-cyan-400 font-bold">OPTIMAL</span>
                </div>
              </div>

              {/* 4. Right Avionics Bracket */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 rounded-2xl border border-purple-400/25 neo-surface-purple p-4 font-mono text-[10px] text-purple-200/80 backdrop-blur-xl">
                  <div className="border-b border-purple-400/20 pb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400">
                    QUANTUM DEFLECTOR // AVIONICS
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-white/60">TRAVEL VECTOR:</span>
                    <span className="text-purple-300 font-semibold">[0.00, 0.00, -1.00]</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-white/60">RELATIVISTIC γ:</span>
                    <span className="text-purple-300 font-semibold">14.8 C</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-white/60">DEFLECTOR SHIELD:</span>
                    <span className="text-cyan-300 font-semibold">ENGAGED [MAX]</span>
                  </div>
                  <div className="flex justify-between gap-6 pt-1 border-t border-purple-400/15">
                    <span className="text-white/60">DESTINATION:</span>
                    <span className="text-amber-300 font-bold">THE FORGE GALAXY</span>
                  </div>
                </div>
              </div>
              );
}

              export default RiftFlightHUD;
