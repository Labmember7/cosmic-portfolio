import React, { useMemo, useState, useEffect } from "react";

interface AmbientKeySuggestionsProps {
  isIdle: boolean;
  isIntro?: boolean;
}

export function AmbientKeySuggestions({
  isIdle,
  isIntro = false,
}: AmbientKeySuggestionsProps) {
  const hints = useMemo(
    () => [
      { key: "🖱️ Right-Drag", desc: "Grab & rotate the cosmic scene · holds on release" },
      { key: "⚲ Scroll", desc: "Zoom in/out · double-click to reset" },
      { key: "⌨️ Space / →", desc: "Advance to next cosmic waypoint" },
      { key: "⌨️ ←", desc: "Reverse camera travel without turning" },
    ],
    [],
  );

  const [hintIndex, setHintIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setHintIndex((prev) => (prev + 1) % hints.length);
        setVisible(true);
      }, 500);
    }, 4500);

    return () => clearInterval(interval);
  }, [hints.length]);

  const current = hints[hintIndex];

  return (
    <div
      className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-25 transition-all duration-500 ${
        visible && !isIdle ? "opacity-80 translate-y-0" : "opacity-0 translate-y-1"
      } ${isIntro ? "bottom-26" : "bottom-18"} hidden md:block`}
    >
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 backdrop-blur-xl text-[11px] font-mono tracking-wider text-white/80 shadow-2xl ring-1 ring-white/10">
        <span className="font-bold text-cyan-300">{current.key}:</span>
        <span className="text-white/70">{current.desc}</span>
      </div>
    </div>
  );
}

export default AmbientKeySuggestions;

