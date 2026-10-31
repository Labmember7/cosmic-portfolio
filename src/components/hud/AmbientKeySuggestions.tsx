import { useMemo, useState, useEffect } from "react";

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
      { key: "🖱️ Right-Drag", desc: "Grab & rotate the cosmic scene" },
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
      className={`pointer-events-none fixed top-14 sm:top-16 left-6 z-30 max-w-[min(380px,calc(100vw-48px))] transition-all duration-500 ${
        visible && !isIdle
          ? "opacity-55 translate-y-0"
          : "opacity-0 -translate-y-1.5"
      } ${isIntro ? "hidden" : "block"}`}
    >
      <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-1 backdrop-blur-md text-[10px] font-mono tracking-wider text-white/55">
        <span className="font-semibold text-cyan-300/80">{current.key}:</span>
        <span className="text-white/50 truncate">{current.desc}</span>
      </div>
    </div>
  );
}

export default AmbientKeySuggestions;
