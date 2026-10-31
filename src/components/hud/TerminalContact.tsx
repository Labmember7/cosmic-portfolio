import React, { useState, useEffect, useRef } from "react";

export function TerminalContact({
  email,
  linkedin,
  github,
  onClose,
}: {
  email: string;
  linkedin: string;
  github: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [booted, setBooted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [tick, setTick] = useState(0);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // Low-refresh tick for terminal cursor blink
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  // Boot sequence
  useEffect(() => {
    const lines = [
      "DEEP-SPACE RELAY // AETHER-OS v2.4",
      "MEM CHECK ............... 128K OK",
      "TRANSMITTER.DRV ......... LOADED",
      "SUBSPACE CARRIER ........ TUNED [1420.405 MHz]",
      "GROUND CONTROL LINK ..... ESTABLISHED",
      "",
      "> READY. COMPOSE TRANSMISSION:",
    ];
    let i = 0;
    const id = setInterval(() => {
      setBooted((b) => [...b, lines[i]]);
      i++;
      if (i >= lines.length) {
        clearInterval(id);
        setTimeout(() => {
          setReady(true);
          titleRef.current?.focus();
        }, 150);
      }
    }, 120);
    return () => clearInterval(id);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const subject = encodeURIComponent(`[COSMIC TRANSMISSION] ${title.trim()}`);
    const body = encodeURIComponent(content.trim());
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const cursor = tick % 2 === 0 ? "█" : " ";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[640px] max-w-[94vw] font-mono text-cyan-300"
      >
        {/* Aerospace Terminal Bezel */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950/95 shadow-[0_0_50px_rgba(6,182,212,0.25),inset_0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {/* Subtle phosphor grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Top Aerospace Telemetry Bar */}
          <div className="relative flex items-center justify-between border-b border-cyan-500/30 bg-cyan-950/40 px-5 py-2.5 text-[11px] uppercase tracking-[0.25em]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              <span className="font-bold text-cyan-200">GROUND CONTROL · CH-07</span>
            </div>
            <div className="text-cyan-400/80 text-[10px]">
              CARRIER {ready ? "LOCKED" : "TUNING"} · {new Date().toISOString().slice(11, 19)}Z
            </div>
            <button
              id="close-contact-btn"
              onClick={onClose}
              className="text-cyan-400 hover:text-white transition-colors px-2 py-0.5 rounded border border-cyan-500/30 hover:border-cyan-400"
            >
              [ESC] DISCONNECT
            </button>
          </div>

          {/* Terminal Body */}
          <div className="relative px-6 py-5 text-[13px] leading-relaxed text-cyan-300 min-h-[380px]">
            {/* Boot log */}
            <div className="whitespace-pre-wrap space-y-0.5 text-cyan-200/90 font-mono text-xs">
              {booted.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>

            {ready && !sent && (
              <form onSubmit={handleSend} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="contact-title" className="block text-[10px] uppercase tracking-widest text-cyan-400/80 mb-1">
                    &gt; TRANSMISSION SUBJECT:
                  </label>
                  <input
                    id="contact-title"
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                    maxLength={80}
                    placeholder="ENTER MISSION / INQUIRY TOPIC..."
                    className="w-full rounded-md border border-cyan-500/40 bg-slate-900/60 px-3 py-2 text-white placeholder-cyan-700 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 font-mono text-xs shadow-inner"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-[10px] uppercase tracking-widest text-cyan-400/80 mb-1">
                    &gt; MESSAGE PAYLOAD:
                  </label>
                  <textarea
                    id="contact-message"
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                    maxLength={2000}
                    rows={6}
                    placeholder="TYPE TRANSMISSION DETAILS (ROBOTICS, HARDWARE, VISION COLLABORATION)..."
                    className="w-full resize-none rounded-md border border-cyan-500/40 bg-slate-900/60 px-3 py-2 text-white placeholder-cyan-700 outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 font-mono text-xs shadow-inner"
                  />
                  <div className="mt-1 text-right text-[10px] text-cyan-500/70">{content.length}/2000 BYTES</div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-cyan-400/70">
                    STATUS: READY TO DISPATCH {cursor}
                  </div>
                  <button
                    id="contact-transmit-btn"
                    type="submit"
                    disabled={!title.trim() || !content.trim()}
                    className="rounded-md border border-cyan-400 bg-cyan-500/20 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  >
                    ▶ TRANSMIT TO GROUND
                  </button>
                </div>
              </form>
            )}

            {sent && (
              <div className="mt-4 space-y-2 text-xs">
                <div className="text-emerald-400">&gt; PACKET ENCODED ............. OK [256-BIT ECC]</div>
                <div className="text-emerald-400">&gt; SUBSPACE BURST .............. DISPATCHED</div>
                <div className="text-emerald-400">&gt; MAIL GATEWAY HANDOFF ....... SUCCESS</div>
                <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-white font-semibold">
                  ✦ TRANSMISSION DISPATCHED. VERIFY IN YOUR LOCAL EMAIL CLIENT. {cursor}
                </div>
                <button
                  id="contact-disconnect-btn"
                  onClick={onClose}
                  className="mt-3 rounded border border-cyan-400/50 px-4 py-1.5 text-[11px] uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/20"
                >
                  [ESC] CLOSE TERMINAL
                </button>
              </div>
            )}

            {/* Direct Aerospace Channels */}
            <div className="mt-6 border-t border-cyan-500/20 pt-4 text-[11px] text-cyan-300/80">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">// DIRECT COMMS FREQUENCIES</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 rounded border border-cyan-500/20 bg-slate-900/40">
                  <div className="text-[9px] uppercase tracking-widest text-cyan-500">DIRECT EMAIL</div>
                  <a href={`mailto:${email}`} className="text-white hover:text-cyan-300 truncate block transition-colors">
                    {email}
                  </a>
                </div>
                <div className="p-2 rounded border border-cyan-500/20 bg-slate-900/40">
                  <div className="text-[9px] uppercase tracking-widest text-cyan-500">LINKEDIN NETWORK</div>
                  <a href={linkedin} target="_blank" rel="noreferrer" className="text-white hover:text-cyan-300 truncate block transition-colors">
                    in/{linkedin.replace(/^.*\/in\//, "").replace(/\/$/, "")}
                  </a>
                </div>
                <div className="p-2 rounded border border-cyan-500/20 bg-slate-900/40">
                  <div className="text-[9px] uppercase tracking-widest text-cyan-500">GITHUB REPOSITORY</div>
                  <a href={github} target="_blank" rel="noreferrer" className="text-white hover:text-cyan-300 truncate block transition-colors">
                    gh/{github.replace(/^.*github\.com\//, "")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerminalContact;

