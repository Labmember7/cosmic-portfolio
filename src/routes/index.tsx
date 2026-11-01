import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";

import { useSpaceMusic } from "@/hooks/useSpaceMusic";
import { useIsMobile, useIsLandscape } from "@/hooks/use-mobile";
import {
  PortfolioContext,
  fetchPortfolio,
  getInitialPortfolioContent,
  type PortfolioContent,
  type Experience,
  type Achievement,
} from "@/content/portfolio";
import {
  computeLayout,
  buildChapters,
  type Chapter,
  type ChapterId,
  type SceneLayout,
} from "@/config/story";

// 3D Scene Components
import { CosmicWorld } from "@/components/scene/CosmicWorld";
import { CompanionShip } from "@/components/scene/CompanionShip";
import { CameraRig } from "@/components/scene/CameraRig";
import { ZoomControls } from "@/components/scene/ZoomControls";
import { FreeRoam } from "@/components/scene/FreeRoam";
import { DEFAULT_ACHIEVEMENTS } from "@/components/scene/Pantheon";

// 2D HUD & Overlay Components
import { CosmicMouseReticle } from "@/components/hud/CosmicMouseReticle";
import { BootSequence } from "@/components/hud/BootSequence";
import { MissionBriefing } from "@/components/hud/MissionBriefing";
import { RiftFlightHUD } from "@/components/hud/RiftFlightHUD";
import { ControlsCheatSheet } from "@/components/hud/ControlsCheatSheet";
import { AmbientKeySuggestions } from "@/components/hud/AmbientKeySuggestions";
import { SceneTitleTransition } from "@/components/hud/SceneTitleTransition";
import { CosmicStoryTrailMiniMap } from "@/components/hud/CosmicStoryTrailMiniMap";
import { TerminalContact } from "@/components/hud/TerminalContact";
import { ProjectDialog } from "@/components/hud/ProjectDialog";
import { AchievementDialog } from "@/components/hud/AchievementDialog";

export const Route = createFileRoute("/")({
  component: Portfolio,
  head: () => ({
    meta: [
      { title: "Bacem Zarai Cosmic's Journey" },
      {
        name: "description",
        content:
          "Explore the interactive 3D cosmic journey of Bacem Zarai - Web design UI/UX for embedded systems. Board the ship, traverse the interstellar rift, and discover autonomous perception projects.",
      },
      {
        name: "keywords",
        content:
          "Bacem Zarai,  Web Engineer, 3D Space Portfolio, Interactive Portfolio, WebGL",
      },
      { name: "author", content: "Bacem Zarai" },
      {
        name: "robots",
        content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      {
        property: "og:title",
        content: "Bacem Zarai - A Cosmic Journey | Robotics & Embedded Systems Engineer",
      },
      {
        property: "og:description",
        content:
          "An interactive 3D space odyssey showcasing robotics engineering milestones, autonomous perception, and embedded systems projects.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Bacem Zarai Portfolio" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Bacem Zarai - A Cosmic Journey | Robotics & Embedded Systems Engineer",
      },
      {
        name: "twitter:description",
        content:
          "An interactive 3D space odyssey showcasing robotics engineering milestones, autonomous perception, and embedded systems projects.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: "Bacem Zarai - Interactive 3D Cosmic Portfolio",
          description:
            "Interactive 3D space journey showcasing robotics, embedded systems, and computer vision projects.",
          mainEntity: {
            "@type": "Person",
            name: "Bacem Zarai",
            jobTitle: "Embedded Systems, Robotics & Computer Vision Engineer",
            description:
              "Engineer specializing in robotics, embedded systems, firmware, autonomous perception, ROS 2, and embedded C++.",
            knowsAbout: [
              "Robotics",
              "Embedded Systems",
              "Computer Vision",
              "ROS 2",
              "C++",
              "Autonomous Vehicles",
              "Deep Learning",
              "IoT",
              "Control Systems",
            ],
          },
        }),
      },
    ],
  }),
});

function Portfolio() {
  // Synchronous initial fallback ensures instant, lag-free canvas mounting
  const [data, setData] = useState<PortfolioContent>(() => getInitialPortfolioContent());
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio()
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch((e) => {
        console.warn("[Portfolio] Remote fetch failed, fallback active:", e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Set<ChapterId>>(new Set(["intro"]));
  const [contactOpen, setContactOpen] = useState(false);
  const [projectIndex, setProjectIndex] = useState<number | null>(null);
  const [selectedAchievementIndex, setSelectedAchievementIndex] = useState<number | null>(null);
  const [luminosity, setLuminosity] = useState(1);
  const [freeRoam, setFreeRoam] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const [captionCollapsed, setCaptionCollapsed] = useState(false);
  const [hintsModalOpen, setHintsModalOpen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showRotateBanner, setShowRotateBanner] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !sessionStorage.getItem("cosmic_rotate_dismissed");
    } catch {
      return true;
    }
  });
  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();

  // Auto-collapse caption descriptions in landscape view for widescreen immersion
  useEffect(() => {
    if (isLandscape) {
      setCaptionCollapsed(true);
    }
  }, [isLandscape]);

  // Detect portrait orientation for mobile panoramic suggestion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(orientation: portrait)");
    setIsPortrait(mql.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Mobile touch swipe gestures for chapter traversal
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (contactOpen || projectIndex !== null || selectedAchievementIndex !== null) return;

    // Fast horizontal swipe (< 450ms, |dx| > 45px, horizontal dominance)
    if (dt < 450 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) {
        if (index === 0) playLaunchSound();
        go(index + 1);
      } else {
        go(index - 1);
      }
    }
  };

  const {
    enabled: musicOn,
    toggle: toggleMusic,
    volume,
    setVolume,
    setRiftActive,
    playLaunchSound,
    playBootChime,
  } = useSpaceMusic();

  const prevIndexRef = useRef(0);

  // Derive scene layout & chapters from portfolio content
  const layout = useMemo<SceneLayout>(() => computeLayout(data?.experiences ?? []), [data]);
  const CHAPTERS = useMemo<Chapter[]>(
    () => (data ? buildChapters(data.experiences, layout, data.brand.description) : []),
    [data, layout],
  );

  // Deep-link direct chapter navigation via URL query parameter (e.g. ?ch=7 or ?chapter=wormhole)
  useEffect(() => {
    if (typeof window === "undefined" || !CHAPTERS.length) return;
    const params = new URLSearchParams(window.location.search);
    const chParam = params.get("ch") || params.get("chapter");
    if (chParam) {
      const parsed = parseInt(chParam, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < CHAPTERS.length) {
        setIndex(parsed);
      } else {
        const found = CHAPTERS.findIndex((c) => c.id === chParam);
        if (found !== -1) setIndex(found);
      }
    }
  }, [CHAPTERS]);

  const baseChapter = CHAPTERS[index] ?? CHAPTERS[0];

  const chapter = useMemo<Chapter | undefined>(() => {
    if (!baseChapter) return undefined;
    const goingBackward = index < prevIndexRef.current;
    if (goingBackward) {
      return {
        ...baseChapter,
        via: undefined,
      };
    }
    return baseChapter;
  }, [index, baseChapter]);

  // Idle tracking for subtle hints
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 4500);
  }, []);

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    resetIdleTimer();
  }, [index, resetIdleTimer]);

  useEffect(() => {
    if (chapter) setVisited((v) => new Set(v).add(chapter.id));
  }, [chapter?.id]);

  useEffect(() => {
    setRiftActive(chapter?.id === "wormhole");
  }, [chapter?.id, setRiftActive]);

  const go = (i: number) => {
    if (!CHAPTERS.length) return;
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, i));
    prevIndexRef.current = index;
    setIndex(next);
  };

  const handleLaunchMission = () => {
    playLaunchSound();
    go(1);
  };

  // Keyboard navigation & modal escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.code === "Space") {
        if (e.code === "Space") e.preventDefault();
        if (contactOpen || projectIndex !== null || selectedAchievementIndex !== null) return;
        if (index === 0) playLaunchSound();
        go(index + 1);
      }
      if (e.key === "ArrowLeft") {
        go(index - 1);
      }
      if (e.key === "Escape") {
        setProjectIndex(null);
        setSelectedAchievementIndex(null);
        setContactOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, playLaunchSound, contactOpen, projectIndex, selectedAchievementIndex]);

  const { brand: BRAND, projects: PROJECTS } = data;
  const achievementsList =
    data.achievements && data.achievements.length > 0 ? data.achievements : DEFAULT_ACHIEVEMENTS;
  const volumePct = musicOn ? Math.round(volume * 100) : 0;
  const lightPct = Math.round((luminosity / 2) * 100);

  return (
    <PortfolioContext.Provider value={data}>
      <main
        id="main-content"
        role="main"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed inset-0 bg-[#03020a] text-white overflow-hidden select-none"
      >
        {/* Precision Tracking Reticle */}
        <CosmicMouseReticle />

        {/* Cinematic Aerospace Boot Sequence */}
        {!bootReady && (
          <BootSequence onDismiss={() => setBootReady(true)} playBootChime={playBootChime} />
        )}

        {/* 3D Cosmic Canvas */}
        <Canvas camera={{ position: [4, 2, 8], fov: 55 }} dpr={[1, 2]}>
          <color attach="background" args={["#03020a"]} />
          <fog attach="fog" args={["#03020a", 40, 220]} />
          <Suspense fallback={null}>
            <CosmicWorld
              onSelectProject={(i) => setProjectIndex(i)}
              onSelectAchievement={(i) => setSelectedAchievementIndex(i)}
              luminosity={luminosity}
              layout={layout}
              isWormhole={chapter?.id === "wormhole"}
              isIntroActive={chapter?.id === "intro"}
              activeExperienceIndex={
                chapter?.id.startsWith("experience-")
                  ? parseInt(chapter.id.replace("experience-", ""), 10) - 1
                  : null
              }
              bootReady={bootReady}
              onLaunchMission={handleLaunchMission}
            />
          </Suspense>

          {/* Autonomous Satellite Relay - mounted outside Suspense */}
          <CompanionShip
            onContact={() => setContactOpen(true)}
            isWormhole={chapter?.id === "wormhole"}
          />

          {!freeRoam && chapter && <CameraRig chapter={chapter} />}
          <ZoomControls chapterId={chapter?.id} baseFov={55} />
          <FreeRoam enabled={freeRoam} />
        </Canvas>

        {/* Intro Mission Briefing Card */}
        {chapter?.id === "intro" && (
          <MissionBriefing brand={BRAND} caption={chapter?.caption} bootReady={bootReady} />
        )}

        {/* Intro Anamorphic Letterbox Telemetry Bars — Adaptive Height */}
        {chapter?.id === "intro" && (
          <div
            className={`pointer-events-none fixed inset-0 z-30 flex flex-col justify-between transition-opacity duration-700 ${
              bootReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`${
                isLandscape ? "h-6" : "h-6 sm:h-8 md:h-10"
              } w-full bg-black/85 border-b border-cyan-400/20 px-3 sm:px-6 flex items-center justify-between text-[8px] sm:text-[9px] md:text-[10px] font-mono tracking-[0.12em] sm:tracking-[0.25em] text-cyan-300 backdrop-blur-md`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                <span className="truncate">STARPORT ALPHA // SECTOR 07-B</span>
              </div>
              {!isMobile && (
                <span className="text-white/40 hidden md:inline">
                  TELEMETRY: ALL 12 CHANNELS NOMINAL
                </span>
              )}
              <span className="text-cyan-200 truncate hidden xs:inline">ORBITAL LAUNCH PAD READY</span>
            </div>
            <div
              className={`${
                isLandscape ? "h-6" : "h-6 sm:h-8 md:h-10"
              } w-full bg-black/85 border-t border-cyan-400/20 px-3 sm:px-6 flex items-center justify-between text-[8px] sm:text-[9px] md:text-[10px] font-mono tracking-[0.12em] sm:tracking-[0.25em] text-white/50 backdrop-blur-md`}
            >
              <span className="truncate">MISSION CLOCK: T-00:00:00</span>
              {!isMobile && (
                <span className="text-cyan-300 hidden md:inline">
                  COORDINATES: 28.5721° N, 80.6480° W
                </span>
              )}
              <span className="text-emerald-400 truncate">HYPERDRIVE: ARMED</span>
            </div>
          </div>
        )}

        {/* Rift Traversal Avionics Reticle */}
        {chapter?.id === "wormhole" && <RiftFlightHUD />}

        {/* Cinematic Scene Title Transitions - restricted to the Boarding scene */}
        {chapter?.id === "intro" && (
          <SceneTitleTransition
            chapter={chapter}
            chapterIndex={index}
            bootReady={bootReady}
          />
        )}

        {/* Top Control Bar — Reduced & Cleanly Aligned */}
        <header
          id="site-header"
          role="banner"
          className={`absolute left-0 right-0 z-40 flex items-center justify-between gap-1.5 sm:gap-4 px-2.5 sm:px-6 transition-all duration-700 ${
            bootReady ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${chapter?.id === "intro" ? "top-7 sm:top-9 md:top-12" : "top-1.5 sm:top-2.5 md:top-4"}`}
        >
          {/* Brand */}
          <div className="pointer-events-none max-w-[120px] xs:max-w-[160px] sm:max-w-none truncate">
            <h1 className="text-[9px] sm:text-xs tracking-[0.15em] sm:tracking-[0.4em] text-white/80 font-mono truncate">
              ✧ {BRAND.name.toUpperCase().split(" ").join(" · ")}
            </h1>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/40 font-mono hidden sm:block">
              a cosmic journey
            </p>
          </div>

          {/* Center Glass Controls — Centered, Compact Audio, Volume & Light */}
          <div className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-2 rounded-full border border-white/[0.08] bg-black/60 px-2 sm:px-3 py-0.5 sm:py-1 backdrop-blur-md opacity-95 hover:opacity-100 transition-all duration-300 max-w-[calc(100vw-7rem)] overflow-x-auto shadow-md">
            <button
              id="music-toggle-btn"
              onClick={toggleMusic}
              className="flex items-center gap-1 text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.1em] text-white/70 hover:text-white transition whitespace-nowrap cursor-pointer px-1 py-0.5 rounded-full hover:bg-white/[0.05]"
              title={musicOn ? "Mute soundtrack" : "Play space atmospheric soundtrack"}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  musicOn ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/30"
                }`}
              />
              <span>♪</span>
              <span className="hidden md:inline">{musicOn ? "Audio" : "Muted"}</span>
            </button>

            {/* Compact Volume Control — Available on Mobile & Desktop */}
            <div className="flex items-center gap-1">
              <label
                htmlFor="volume-control"
                className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-white/40 whitespace-nowrap"
              >
                Vol
              </label>
              <input
                id="volume-control"
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={volume}
                disabled={!musicOn}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-8 xs:w-10 sm:w-14 h-1 neo-slider-emerald disabled:opacity-20 cursor-pointer"
                style={{
                  background: musicOn
                    ? `linear-gradient(to right, #059669 0%, #10b981 ${Math.max(0, volumePct - 8)}%, #34d399 ${volumePct}%, rgba(4, 7, 16, 0.9) ${volumePct}%, rgba(4, 7, 16, 0.9) 100%)`
                    : "rgba(4, 7, 16, 0.9)",
                }}
              />
            </div>

            <span className="inline-block h-2.5 sm:h-3 w-px bg-white/10" />

            {/* Compact Light Control — Available on Mobile & Desktop */}
            <div className="flex items-center gap-1">
              <label
                htmlFor="light-control"
                className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-white/40 whitespace-nowrap"
              >
                ☀
              </label>
              <input
                id="light-control"
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={luminosity}
                onChange={(e) => setLuminosity(parseFloat(e.target.value))}
                className="w-8 xs:w-10 sm:w-14 h-1 neo-slider-amber cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #d97706 0%, #f59e0b ${Math.max(0, lightPct - 8)}%, #fbbf24 ${lightPct}%, rgba(4, 7, 16, 0.9) ${lightPct}%, rgba(4, 7, 16, 0.9) 100%)`,
                }}
              />
            </div>

            {/* Mobile Touch Avionics Hints Pill */}
            {isMobile && (
              <>
                <span className="inline-block h-2.5 w-px bg-white/10" />
                <button
                  id="mobile-hints-btn"
                  onClick={() => setHintsModalOpen(true)}
                  className="flex items-center gap-1 text-[7px] sm:text-[9px] font-mono uppercase tracking-[0.1em] text-cyan-200/90 hover:text-white transition whitespace-nowrap cursor-pointer px-1.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/35 hover:bg-cyan-400/25 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                  title="View touch avionics gestures"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Hints
                </button>
              </>
            )}

            {/* Desktop Free Roam Button */}
            {!isMobile && (
              <>
                <span className="inline-block h-3 w-px bg-white/10" />
                <button
                  id="roam-toggle-btn"
                  onClick={() => setFreeRoam((v) => !v)}
                  className={`inline-flex text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full transition whitespace-nowrap cursor-pointer hover:bg-white/[0.05] ${
                    freeRoam ? "text-emerald-300" : "text-white/60 hover:text-white"
                  }`}
                  title="Free roam (WASD + mouse look, Shift boost, Space/Ctrl ascend/descend, Esc release)"
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${
                      freeRoam ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/30"
                    }`}
                  />
                  Roam
                </button>
              </>
            )}
          </div>

          {/* Chapter Progress Indicators */}
          <nav
            id="chapter-nav"
            aria-label="Cosmic Journey Chapters"
            className="flex flex-col items-end gap-1"
          >
            {!isMobile ? (
              <>
                {/* Desktop 12 Dots */}
                <div
                  className="flex items-center gap-1.5 rounded-full bg-black/40 border border-white/[0.08] backdrop-blur-md p-1.5 shadow-inner"
                  role="tablist"
                  aria-label="Chapter Indicators"
                >
                  {CHAPTERS.map((c, i) => (
                    <button
                      key={c.id}
                      id={`chapter-dot-${c.id}`}
                      onClick={() => go(i)}
                      aria-label={`Jump to chapter ${i + 1}: ${c.title}`}
                      title={c.title}
                      role="tab"
                      aria-selected={i === index}
                      className={`h-2 rounded-full cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                        i === index
                          ? "w-8 bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.7),0_0_24px_rgba(14,165,233,0.35)]"
                          : visited.has(c.id)
                            ? "w-2.5 bg-sky-400/40 hover:bg-sky-300/70 shadow-[0_0_6px_rgba(56,189,248,0.25)]"
                            : "w-2 bg-white/15 hover:bg-white/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                  chapter <span className="text-cyan-300 font-bold tabular-nums">{index + 1}</span> / {CHAPTERS.length}
                </p>
              </>
            ) : (
              /* Mobile Compact Chapter Indicator */
              <div
                className="flex items-center gap-1.5 rounded-full bg-black/50 border border-white/[0.08] backdrop-blur-md px-2 py-0.5 text-[8px] sm:text-[9px] font-mono tracking-widest shadow-inner"
                role="status"
                aria-label={`Chapter ${index + 1} of ${CHAPTERS.length}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                <span className="text-cyan-300 font-bold tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-white/30">/</span>
                <span className="text-white/50 tabular-nums">
                  {String(CHAPTERS.length).padStart(2, "0")}
                </span>
              </div>
            )}
          </nav>
        </header>

        {/* Rotate Device Suggestion for Mobile Portrait Users */}
        {bootReady && isMobile && isPortrait && showRotateBanner && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-[340px] animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto ${
              chapter?.id === "intro" ? "top-20 sm:top-24" : "top-14 sm:top-16"
            }`}
          >
            <div className="flex items-center justify-between gap-2 rounded-full border border-cyan-400/35 bg-black/85 px-3 py-1.5 text-white/90 shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-200">
                <span className="text-sm animate-pulse">🔄</span>
                <span className="font-medium tracking-wide">
                  Rotate phone sideways for panoramic cosmic flight
                </span>
              </div>
              <button
                onClick={() => {
                  setShowRotateBanner(false);
                  try {
                    sessionStorage.setItem("cosmic_rotate_dismissed", "1");
                  } catch {}
                }}
                aria-label="Dismiss rotate suggestion"
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Chapter Caption Card — Adaptive, Reduced, & Click-to-Collapse */}
        {chapter?.id !== "intro" && (
          <section
            id="chapter-caption-panel"
            aria-labelledby="chapter-caption-title"
            className={`fixed left-2.5 sm:left-6 md:left-8 z-35 transition-all duration-500 pointer-events-auto ${
              bootReady ? "opacity-100" : "opacity-0 pointer-events-none"
            } ${
              isLandscape
                ? "bottom-2.5 w-[260px] max-w-[38vw]"
                : isMobile
                  ? "bottom-[max(3.8rem,calc(env(safe-area-inset-bottom,0px)+3.2rem))] left-2.5 right-2.5 w-auto max-w-[340px]"
                  : "bottom-14 md:bottom-16 w-[360px] md:w-[440px] lg:w-[480px]"
            }`}
          >
            {captionCollapsed ? (
              /* Ultra-compact collapsed chip — Click to expand */
              <button
                onClick={() => setCaptionCollapsed(false)}
                className="group flex items-center justify-between gap-2 rounded-xl border border-cyan-400/35 bg-black/80 px-2.5 py-1.5 backdrop-blur-xl ring-1 ring-cyan-400/25 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:border-cyan-400/70 transition-all cursor-pointer text-left w-full"
                aria-label="Expand chapter summary"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee] flex-shrink-0" />
                  <span className="font-display text-[9px] font-bold text-cyan-300 tracking-wider truncate uppercase">
                    {(chapter?.title ?? "").split("—")[0].split(" - ")[0].trim()}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-cyan-200/90 uppercase px-1.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 group-hover:bg-cyan-400/25 flex-shrink-0">
                  ▲ Expand
                </span>
              </button>
            ) : (
              /* Adaptive expanded card — Click header or description to collapse */
              <div
                key={chapter?.id}
                className={`rounded-2xl border border-cyan-400/30 neo-surface-cyan p-2.5 sm:p-4 backdrop-blur-2xl ring-1 ring-cyan-400/20 shadow-[0_0_25px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200 ${
                  isLandscape
                    ? "max-h-[160px] overflow-y-auto overflow-x-hidden"
                    : isMobile
                      ? "max-h-[48vh] overflow-y-auto overflow-x-hidden"
                      : "max-h-none overflow-visible"
                }`}
              >
                {/* Header (clickable to collapse) */}
                <div
                  onClick={() => setCaptionCollapsed(true)}
                  className="flex items-center justify-between gap-2 cursor-pointer pb-1.5 border-b border-cyan-400/20 hover:opacity-90 transition-opacity"
                  title="Click to collapse description"
                >
                  {(() => {
                    const rawTitle = chapter?.title ?? "";
                    const parts = rawTitle.includes("—")
                      ? rawTitle.split("—")
                      : rawTitle.includes(" - ")
                        ? rawTitle.split(" - ")
                        : [rawTitle];
                    const numDate = parts[0]?.trim() ?? "";
                    const heading = parts.slice(1).join(" — ").trim();
                    return (
                      <div className="flex flex-col truncate">
                        <span className="font-mono text-[8px] sm:text-[9px] text-cyan-300/80 tracking-wider uppercase truncate">
                          {numDate}
                        </span>
                        {heading && (
                          <span className="font-display text-[10px] sm:text-xs font-bold text-white tracking-wide truncate">
                            {heading}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCaptionCollapsed(true);
                    }}
                    className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-cyan-300/80 hover:text-white px-2 py-0.5 rounded-full border border-cyan-400/30 neo-btn flex-shrink-0 cursor-pointer"
                    aria-label="Collapse chapter summary"
                  >
                    ▼ Hide
                  </button>
                </div>

                {/* Description Body (clickable to collapse) */}
                <div
                  onClick={() => setCaptionCollapsed(true)}
                  className="mt-1.5 sm:mt-2 rounded-lg neo-inset p-2 border border-white/5 cursor-pointer hover:border-cyan-400/20 transition-all"
                  title="Click description to collapse"
                >
                  <p
                    className={`text-[10px] sm:text-[11px] md:text-xs text-white/85 leading-relaxed font-sans ${
                      isLandscape ? "line-clamp-3" : isMobile ? "line-clamp-4" : ""
                    }`}
                  >
                    {chapter?.caption}
                  </p>
                </div>

                {/* Pantheon: Curated Honors Drawer */}
                {chapter?.id === "pantheon" && (
                  <div className="mt-2 pt-1.5 border-t border-amber-400/20">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-amber-300 font-mono">
                        🏆 Credentials
                      </p>
                      <span className="text-[8px] font-mono text-white/50">
                        {achievementsList.length} items
                      </span>
                    </div>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-1 pr-1 ${
                        isLandscape || isMobile
                          ? "max-h-24 overflow-y-auto"
                          : "max-h-none overflow-visible"
                      }`}
                    >
                      {achievementsList.map((a, i) => (
                        <button
                          key={i}
                          id={`pantheon-artifact-btn-${i}`}
                          onClick={() => setSelectedAchievementIndex(i)}
                          className="group flex items-center gap-1.5 rounded-lg neo-btn-amber px-2 py-1 text-left text-[10px] text-white/90 transition border border-amber-400/25 cursor-pointer min-h-[30px]"
                        >
                          <span className="text-amber-300 font-bold text-[10px]">{a.icon ?? "✦"}</span>
                          <span className="truncate text-[10px] font-medium group-hover:text-amber-200">
                            {a.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Finale: Telemetry & Map Toggle */}
                {chapter?.id === "finale" && (
                  <div className="mt-2 pt-1.5 border-t border-cyan-400/20 flex items-center justify-between gap-2">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-cyan-300 font-mono font-bold whitespace-nowrap">
                      ✓ 12 SECTORS LOGGED
                    </span>
                    <button
                      id="toggle-course-map-btn"
                      onClick={() => setMapOpen((v) => !v)}
                      className="text-[8px] sm:text-[9px] font-mono text-cyan-300 hover:text-white bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/35 px-2 py-0.5 rounded-full transition whitespace-nowrap cursor-pointer flex items-center gap-1"
                    >
                      <span>🌐</span>
                      <span>{mapOpen ? "Hide Map" : "3D Map"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Floating Interactive 3D Cosmic Course Mini Map */}
        {chapter?.id === "finale" && mapOpen && (
          <aside
            id="floating-cosmic-mini-map"
            aria-label="Interactive 3D Cosmic Course Mini Map"
            className={`fixed z-35 transition-all duration-500 pointer-events-auto ${
              bootReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            } ${
              isLandscape
                ? "bottom-2.5 right-2.5 w-[240px] max-w-[38vw]"
                : isMobile
                  ? "bottom-[max(3.8rem,calc(env(safe-area-inset-bottom,0px)+3.2rem))] left-2.5 right-2.5 w-auto"
                  : "bottom-20 right-6 md:right-10 w-[460px] md:w-[500px]"
            }`}
          >
            <CosmicStoryTrailMiniMap
              chapters={CHAPTERS}
              visited={visited}
              currentIndex={index}
              onSelectChapter={(i) => go(i)}
              onClose={() => setMapOpen(false)}
            />
          </aside>
        )}

        {/* Controls Cheat Sheet - bottom-right on desktop, triggered modal on mobile */}
        <div
          className={`transition-opacity duration-700 ${
            bootReady ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ControlsCheatSheet
            freeRoam={freeRoam}
            isIntro={chapter?.id === "intro"}
            mobileOpen={hintsModalOpen}
            onMobileClose={() => setHintsModalOpen(false)}
          />
        </div>

        {/* Mobile Dedicated Ground Control Pill — Sleek, Compact, Docked in Bottom-Right */}
        {isMobile && bootReady && (
          <aside
            id="mobile-ground-control-dock"
            aria-label="Mobile Ground Control Comms"
            className={`fixed z-35 transition-all duration-500 pointer-events-auto ${
              chapter?.id === "intro"
                ? isLandscape
                  ? "bottom-9 sm:bottom-10 right-2.5 sm:right-6"
                  : "bottom-[max(3.8rem,calc(env(safe-area-inset-bottom,0px)+3.2rem))] right-2.5"
                : chapter?.id === "finale" && mapOpen
                  ? "top-10 sm:top-12 right-2.5"
                  : isLandscape
                    ? "bottom-2.5 right-2.5 sm:right-6"
                    : "bottom-[max(3.8rem,calc(env(safe-area-inset-bottom,0px)+3.2rem))] right-2.5"
            }`}
          >
            <button
              id="mobile-ground-control-btn"
              onClick={() => setContactOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-400/40 bg-black/80 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.8),0_0_10px_rgba(34,211,238,0.2)] hover:border-cyan-400/70 active:scale-95 transition-all cursor-pointer"
              title="Open communications terminal"
              aria-label="Contact Ground Control"
            >
              <span className="flex h-2.5 items-end gap-[1.5px]">
                <span className="w-[1.5px] h-[40%] bg-cyan-400 rounded-sm" />
                <span className="w-[1.5px] h-[75%] bg-cyan-400 rounded-sm" />
                <span className="w-[1.5px] h-[100%] bg-cyan-400 rounded-sm" />
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                Ground Control
              </span>
              <span className="text-[9px] text-cyan-400">↗</span>
            </button>
          </aside>
        )}

        {/* Ambient Key Hints — strictly desktop only to prevent mobile clutter */}
        {bootReady && !isMobile && !freeRoam && chapter?.id !== "intro" && chapter?.id !== "wormhole" && (
          <AmbientKeySuggestions isIdle={isIdle} isIntro={false} />
        )}

        {/* Spacebar Orbit Prompt when Idle — strictly desktop only */}
        {!isMobile && (
          <div
            className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 transition-all duration-700 ${
              bootReady &&
              isIdle &&
              !contactOpen &&
              projectIndex === null &&
              selectedAchievementIndex === null &&
              index < CHAPTERS.length - 1 &&
              chapter?.id !== "intro" &&
              chapter?.id !== "wormhole"
                ? "opacity-60 translate-y-0 scale-100"
                : "opacity-0 translate-y-2 scale-95 pointer-events-none"
            } bottom-15`}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/40 px-3 py-1 backdrop-blur-md shadow-md">
              <kbd className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-cyan-300 border border-cyan-400/25 bg-cyan-950/40">
                SPACE
              </kbd>
              <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-white/60">
                Advance Orbit ➔
              </span>
            </div>
          </div>
        )}

        {/* Subtle Bottom Navigation Buttons — Strictly Single-Line & Adaptive */}
        <nav
          id="chapter-step-controls"
          aria-label="Chapter step controls"
          className={`absolute left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-0.5 sm:p-1 rounded-full border border-white/[0.08] bg-black/50 backdrop-blur-md transition-all duration-500 opacity-95 hover:opacity-100 whitespace-nowrap flex-nowrap shrink-0 max-w-[calc(100vw-1.5rem)] ${
            bootReady ? "translate-y-0" : "translate-y-4 opacity-0 pointer-events-none"
          } ${
            chapter?.id === "intro"
              ? isLandscape
                ? "bottom-9 sm:bottom-10"
                : isMobile
                  ? "bottom-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+2rem))]"
                  : "bottom-10 sm:bottom-12"
              : isLandscape
                ? "bottom-2.5 sm:bottom-3"
                : isMobile
                  ? "bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
                  : "bottom-5 sm:bottom-6"
          }`}
        >
          <button
            id="prev-chapter-btn"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous chapter"
            className="rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-mono text-white/60 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center gap-1 min-h-[28px] sm:min-h-[34px] whitespace-nowrap flex-nowrap shrink-0"
          >
            <span>←</span>
            <span>Prev</span>
          </button>
          <span className="h-2.5 w-px bg-white/10" />
          <button
            id="next-chapter-btn"
            onClick={() => {
              if (index === 0) playLaunchSound();
              go(index + 1);
            }}
            disabled={index === CHAPTERS.length - 1}
            aria-label={
              index === CHAPTERS.length - 1 ? "Journey complete" : "Continue to next chapter"
            }
            className="rounded-full px-3 sm:px-3.5 py-1 text-[10px] sm:text-xs font-mono font-medium text-cyan-200/90 hover:text-cyan-100 bg-cyan-400/[0.14] hover:bg-cyan-400/[0.24] border border-cyan-400/25 hover:border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all flex items-center gap-1.5 disabled:opacity-25 disabled:pointer-events-none cursor-pointer min-h-[28px] sm:min-h-[34px] whitespace-nowrap flex-nowrap shrink-0"
          >
            <span className="whitespace-nowrap">
              {index === 0
                ? "Initiate Odyssey"
                : index === CHAPTERS.length - 1
                  ? "Singularity"
                  : "Continue"}
            </span>
            <span>→</span>
          </button>
        </nav>

        {/* Screen Reader & SEO Manifest */}
        <section
          id="accessible-portfolio-manifest"
          className="sr-only"
          aria-label="Portfolio Dossier and Experience Manifest"
        >
          <h2>About Bacem Zarai</h2>
          <p>{BRAND.description}</p>
          <h2>Engineering Waypoints & Experiences</h2>
          <ul>
            {(data.experiences ?? []).map((e: Experience, i: number) => (
              <li key={i}>
                <h3>
                  {e.name} - {e.place ?? "Engineering Milestone"} ({e.year})
                </h3>
                <p>{e.description}</p>
              </li>
            ))}
          </ul>
          <h2>Featured Systems & Projects</h2>
          <ul>
            {PROJECTS.map((p, i) => (
              <li key={i}>
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <p>{p.details}</p>
                <p>Tech Stack: {p.stack.join(", ")}</p>
              </li>
            ))}
          </ul>
          <h2>Curated Honors & Certifications</h2>
          <ul>
            {achievementsList.map((a: Achievement, i: number) => (
              <li key={i}>
                <h3>
                  {a.name} - {a.issuer} ({a.year})
                </h3>
                <p>{a.description}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Satellite Relay Transmission / Contact Modal */}
        {contactOpen && (
          <TerminalContact
            email={BRAND.email}
            linkedin={BRAND.linkedin}
            github={BRAND.github}
            onClose={() => setContactOpen(false)}
          />
        )}

        {/* Project Detail Modal */}
        {projectIndex !== null && (
          <ProjectDialog
            project={PROJECTS[projectIndex] ?? null}
            onClose={() => setProjectIndex(null)}
            onNext={() => setProjectIndex((projectIndex + 1) % PROJECTS.length)}
            onPrev={() => setProjectIndex((projectIndex - 1 + PROJECTS.length) % PROJECTS.length)}
          />
        )}

        {/* Honors & Achievement Dossier Modal */}
        {selectedAchievementIndex !== null && (
          <AchievementDialog
            achievement={achievementsList[selectedAchievementIndex] ?? null}
            currentIndex={selectedAchievementIndex}
            totalCount={achievementsList.length}
            onClose={() => setSelectedAchievementIndex(null)}
            onNext={() =>
              setSelectedAchievementIndex((selectedAchievementIndex + 1) % achievementsList.length)
            }
            onPrev={() =>
              setSelectedAchievementIndex(
                (selectedAchievementIndex - 1 + achievementsList.length) % achievementsList.length,
              )
            }
          />
        )}
      </main>
    </PortfolioContext.Provider>
  );
}
