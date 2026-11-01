import { useEffect, useState, useRef } from "react";
import type { Chapter } from "@/config/story";

interface SceneTitleTransitionProps {
  chapter?: Chapter;
  chapterIndex: number;
  bootReady: boolean;
}

export function SceneTitleTransition({
  chapter,
  chapterIndex,
  bootReady,
}: SceneTitleTransitionProps) {
  const [activeChapter, setActiveChapter] = useState<Chapter | undefined>(chapter);
  const [activeNumber, setActiveNumber] = useState<number>(chapterIndex + 1);
  const [phase, setPhase] = useState<"enter" | "visible" | "exit" | "hidden">("hidden");

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevChapterIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!bootReady || !chapter) return;

    // Only display the cinematic overlay for the initial Boarding scene;
    // for subsequent checkpoints it is omitted to avoid visual redundancy with the caption card and 3D titles.
    if (chapter.id !== "intro") {
      setPhase("hidden");
      prevChapterIdRef.current = chapter.id;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      return;
    }

    // Trigger transition when chapter ID changes
    if (chapter.id !== prevChapterIdRef.current) {
      prevChapterIdRef.current = chapter.id;
      setActiveChapter(chapter);
      setActiveNumber(chapterIndex + 1);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      setPhase("enter");

      // Transition to visible hold
      const visibleTimer = setTimeout(() => {
        setPhase("visible");
      }, 450);

      // Begin clean exit transition after 2.3s
      exitTimerRef.current = setTimeout(() => {
        setPhase("exit");
        hideTimerRef.current = setTimeout(() => {
          setPhase("hidden");
        }, 500);
      }, 2300);

      return () => {
        clearTimeout(visibleTimer);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    }
  }, [chapter, chapterIndex, bootReady]);

  if (phase === "hidden" || !activeChapter || !bootReady) return null;

  // Extract clean number and title
  const rawTitle = activeChapter.title;
  // e.g. "03 · 2020 — Tunisia 1.0 — VR Engineer" -> parts
  const sectorLabel = `SECTOR ${String(activeNumber).padStart(2, "0")}`;
  const cleanTitle = rawTitle.includes("·")
    ? rawTitle.substring(rawTitle.indexOf("·") + 1).trim()
    : rawTitle;

  const isExit = phase === "exit";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-35 flex flex-col items-center transition-all duration-500 ease-out ${
        isExit
          ? "opacity-0 -translate-y-2.5 scale-98 blur-sm"
          : "opacity-100 translate-y-0 scale-100 blur-none"
      }`}
    >
      <div className="flex flex-col items-center px-6 py-2">
        {/* Aerospace Waypoint Telemetry Tag */}
        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono tracking-[0.35em] text-cyan-300/80 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>// {sectorLabel} · WAYPOINT ACQUIRED</span>
        </div>

        {/* Cinematic Main Scene Title */}
        <h2 className="mt-1 text-center font-display text-xs sm:text-base md:text-lg font-black uppercase tracking-[0.18em] sm:tracking-[0.25em] text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] max-w-[88vw]">
          {cleanTitle}
        </h2>

        {/* Animated Expanding Glow Divider */}
        <div className="relative mt-2 flex items-center justify-center w-full max-w-[240px]">
          <div
            className={`h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-700 ${
              isExit ? "w-0 opacity-0" : "w-full opacity-80"
            }`}
            style={{
              boxShadow: "0 0 8px rgba(34, 211, 238, 0.8)",
            }}
          />
          <div
            className={`absolute h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] transition-transform duration-500 ${
              isExit ? "scale-0" : "scale-100"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default SceneTitleTransition;

