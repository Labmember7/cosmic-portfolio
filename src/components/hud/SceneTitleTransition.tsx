import { useEffect, useState, useRef } from "react";
import type { Chapter } from "@/config/story";
import { useIsLandscape, useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();
  const [activeChapter, setActiveChapter] = useState<Chapter | undefined>(chapter);
  const [activeNumber, setActiveNumber] = useState<number>(chapterIndex + 1);
  const [phase, setPhase] = useState<"enter" | "visible" | "exit" | "hidden">("hidden");

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
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
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      return;
    }

    // Trigger transition when chapter ID changes
    if (chapter.id !== prevChapterIdRef.current) {
      prevChapterIdRef.current = chapter.id;
      setActiveChapter(chapter);
      setActiveNumber(chapterIndex + 1);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);

      // 1. Initial Enter State (hidden, primed for animation)
      setPhase("enter");

      // 2. Fluid Entrance (glide into focus)
      enterTimerRef.current = setTimeout(() => {
        setPhase("visible");
      }, 50);

      // 3. Cinematic Exit (dissolve upward after 3.2s)
      exitTimerRef.current = setTimeout(() => {
        setPhase("exit");
        hideTimerRef.current = setTimeout(() => {
          setPhase("hidden");
        }, 700);
      }, 3400);

      return () => {
        if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    }
  }, [chapter, chapterIndex, bootReady]);

  if (phase === "hidden" || !activeChapter || !bootReady) return null;

  // Extract clean number and title
  const rawTitle = activeChapter.title;
  const sectorLabel = `SECTOR ${String(activeNumber).padStart(2, "0")}`;
  const cleanTitle = rawTitle.includes("·")
    ? rawTitle.substring(rawTitle.indexOf("·") + 1).trim()
    : rawTitle;

  const isVisible = phase === "visible";
  const isEnter = phase === "enter";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 right-0 z-30 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 ease-out select-none ${
        isLandscape
          ? "top-14"
          : isMobile
            ? "top-28"
            : "top-44 md:top-48 lg:top-52"
      } ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100 filter blur-none"
          : isEnter
            ? "opacity-0 translate-y-4 scale-95 filter blur-md"
            : "opacity-0 -translate-y-4 scale-95 filter blur-sm"
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center max-w-[92vw]">
        {/* Aerospace Waypoint Telemetry Tag */}
        <div
          className={`flex items-center justify-center gap-2 text-[8px] sm:text-[9px] md:text-[11px] font-mono tracking-[0.2em] sm:tracking-[0.35em] text-cyan-300 uppercase transition-all duration-700 ${
            isVisible ? "opacity-90 translate-y-0" : "opacity-0 -translate-y-1.5"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
          <span className="truncate">// {sectorLabel} · WAYPOINT ACQUIRED</span>
        </div>

        {/* Cinematic Main Scene Title */}
        <h2
          className={`mt-1.5 sm:mt-2 text-center font-display text-sm sm:text-lg md:text-2xl lg:text-3xl font-black uppercase text-white drop-shadow-[0_0_24px_rgba(34,211,238,0.9)] max-w-[90vw] transition-all duration-700 ${
            isVisible
              ? "opacity-100 scale-100 tracking-[0.2em] sm:tracking-[0.3em]"
              : "opacity-0 scale-90 tracking-[0.1em]"
          }`}
        >
          {cleanTitle}
        </h2>

        {/* Animated Expanding Glow Divider */}
        <div className="relative mt-2.5 sm:mt-3 flex items-center justify-center w-48 sm:w-64 md:w-96 h-3">
          <div
            className={`h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-700 ease-out ${
              isVisible
                ? "w-full opacity-90 shadow-[0_0_14px_rgba(34,211,238,0.95)]"
                : "w-0 opacity-0"
            }`}
          />
          <div
            className={`absolute h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9,0_0_20px_#22d3ee] transition-all duration-500 delay-150 ${
              isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default SceneTitleTransition;
