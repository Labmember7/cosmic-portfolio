import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";

import { useSpaceMusic } from "@/hooks/useSpaceMusic";
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
import { TerminalContact } from "@/components/hud/TerminalContact";
import { ProjectDialog } from "@/components/hud/ProjectDialog";
import { AchievementDialog } from "@/components/hud/AchievementDialog";

export const Route = createFileRoute("/")({
  component: Portfolio,
  head: () => ({
    meta: [
      { title: "Bacem Zarai — A Cosmic Journey | Robotics & Embedded Systems Engineer" },
      {
        name: "description",
        content:
          "Explore the interactive 3D cosmic journey of Bacem Zarai — robotics, embedded systems, firmware, and computer vision engineer. Board the ship, traverse the interstellar rift, and discover autonomous perception projects.",
      },
      {
        name: "keywords",
        content:
          "Bacem Zarai, Robotics Engineer, Embedded Systems, Computer Vision, Autonomous Systems, ROS 2, C++, 3D Space Portfolio, Interactive Portfolio, WebGL",
      },
      { name: "author", content: "Bacem Zarai" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:title", content: "Bacem Zarai — A Cosmic Journey | Robotics & Embedded Systems Engineer" },
      {
        property: "og:description",
        content:
          "An interactive 3D space odyssey showcasing robotics engineering milestones, autonomous perception, and embedded systems projects.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Bacem Zarai Portfolio" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Bacem Zarai — A Cosmic Journey | Robotics & Embedded Systems Engineer" },
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
          "name": "Bacem Zarai — Interactive 3D Cosmic Portfolio",
          "description":
            "Interactive 3D space journey showcasing robotics, embedded systems, and computer vision projects.",
          "mainEntity": {
            "@type": "Person",
            "name": "Bacem Zarai",
            "jobTitle": "Embedded Systems, Robotics & Computer Vision Engineer",
            "description":
              "Engineer specializing in robotics, embedded systems, firmware, autonomous perception, ROS 2, and embedded C++.",
            "knowsAbout": [
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

  return (
    <PortfolioContext.Provider value={data}>
      <main id="main-content" role="main" className="fixed inset-0 bg-[#03020a] text-white overflow-hidden select-none">
        {/* Precision Tracking Reticle */}
        <CosmicMouseReticle />

        {/* Cinematic Aerospace Boot Sequence */}
        {!bootReady && (
          <BootSequence
            onDismiss={() => setBootReady(true)}
            playBootChime={playBootChime}
          />
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
          <MissionBriefing
            brand={BRAND}
            caption={chapter?.caption}
            bootReady={bootReady}
          />
        )}

        {/* Intro Anamorphic Letterbox Telemetry Bars */}
        {chapter?.id === "intro" && (
          <div
            className={`pointer-events-none fixed inset-0 z-30 flex flex-col justify-between transition-opacity duration-700 ${
              bootReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="h-10 w-full bg-black/85 border-b border-cyan-400/20 px-6 flex items-center justify-between text-[10px] font-mono tracking-[0.25em] text-cyan-300 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>STARPORT ALPHA // SECTOR 07-B</span>
              </div>
              <span className="text-white/40 hidden sm:inline">TELEMETRY: ALL 12 CHANNELS NOMINAL</span>
              <span className="text-cyan-200">ORBITAL LAUNCH PAD READY</span>
            </div>
            <div className="h-10 w-full bg-black/85 border-t border-cyan-400/20 px-6 flex items-center justify-between text-[10px] font-mono tracking-[0.25em] text-white/50 backdrop-blur-md">
              <span>MISSION CLOCK: T-00:00:00</span>
              <span className="text-cyan-300 hidden sm:inline">COORDINATES: 28.5721° N, 80.6480° W</span>
              <span className="text-emerald-400">HYPERDRIVE: ARMED</span>
            </div>
          </div>
        )}

        {/* Rift Traversal Avionics Reticle */}
        {chapter?.id === "wormhole" && <RiftFlightHUD />}

        {/* Top Control Bar */}
        <header
          id="site-header"
          role="banner"
          className={`absolute left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 transition-all duration-700 ${
            bootReady ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${chapter?.id === "intro" ? "top-12" : "top-4"}`}
        >
          {/* Brand */}
          <div className="pointer-events-none">
            <h1 className="text-xs tracking-[0.4em] text-white/80 font-mono">
              ✧ {BRAND.name.toUpperCase().split(" ").join(" · ")}
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">a cosmic journey</p>
          </div>

          {/* Center Glass Controls */}
          <div className="flex items-center gap-4 rounded-full border border-white/10 bg-black/60 px-5 py-2 backdrop-blur-xl shadow-2xl">
            <button
              id="music-toggle-btn"
              onClick={toggleMusic}
              className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/80 hover:text-white transition whitespace-nowrap"
              title={musicOn ? "Mute soundtrack" : "Play space atmospheric soundtrack"}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${musicOn ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/30"}`}
              />
              ♪ {musicOn ? "Audio On" : "Audio Off"}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <label
                htmlFor="volume-control"
                className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 whitespace-nowrap"
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
                className="w-16 accent-emerald-400 disabled:opacity-30 cursor-pointer"
              />
            </div>

            <span className="hidden sm:inline-block h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <label
                htmlFor="light-control"
                className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 whitespace-nowrap"
              >
                ☀ Light
              </label>
              <input
                id="light-control"
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={luminosity}
                onChange={(e) => setLuminosity(parseFloat(e.target.value))}
                className="w-20 accent-amber-300 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-white/50 tabular-nums whitespace-nowrap w-8 text-right">
                {luminosity.toFixed(1)}
              </span>
            </div>

            <span className="h-4 w-px bg-white/10" />

            <button
              id="roam-toggle-btn"
              onClick={() => setFreeRoam((v) => !v)}
              className={`text-[11px] font-mono uppercase tracking-[0.2em] transition whitespace-nowrap ${freeRoam ? "text-emerald-300" : "text-white/80 hover:text-white"}`}
              title="Free roam (WASD + mouse look, Shift boost, Space/Ctrl ascend/descend, Esc release)"
            >
              <span
                className={`inline-block h-2 w-2 rounded-full mr-2 ${freeRoam ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/30"}`}
              />
              Roam {freeRoam ? "On" : "Off"}
            </button>
          </div>

          {/* Chapter Progress Indicators */}
          <nav id="chapter-nav" aria-label="Cosmic Journey Chapters" className="flex flex-col items-end gap-2">
            <div className="flex gap-1.5" role="tablist" aria-label="Chapter Indicators">
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.id}
                  id={`chapter-dot-${c.id}`}
                  onClick={() => go(i)}
                  aria-label={`Jump to chapter ${i + 1}: ${c.title}`}
                  title={c.title}
                  role="tab"
                  aria-selected={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : visited.has(c.id) ? "w-3 bg-white/70" : "w-3 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              chapter {index + 1} / {CHAPTERS.length}
            </p>
          </nav>
        </header>

        {/* Chapter Caption Card — bottom-left */}
        {chapter?.id !== "intro" && (
          <section
            id="chapter-caption-panel"
            aria-labelledby="chapter-caption-title"
            className={`absolute left-6 z-20 w-[380px] max-w-[min(380px,calc(50vw-180px))] transition-all duration-700 ${
              bootReady ? "opacity-100" : "opacity-0 pointer-events-none"
            } bottom-24`}
          >
            <div
              key={chapter?.id}
              className="rounded-2xl border border-cyan-400/30 bg-[#0a0d18]/85 p-6 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] ring-1 ring-cyan-400/10"
              style={{ animation: "fadein .4s ease-out" }}
            >
              <h2
                id="chapter-caption-title"
                className="font-display text-xs font-bold uppercase tracking-[0.3em] text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              >
                {chapter?.title}
              </h2>
              <p className="mt-3 text-white/90 leading-relaxed text-[15px] font-sans font-normal">
                {chapter?.caption}
              </p>

              {/* Pantheon: Quick Trophy Exhibition Drawer */}
              {chapter?.id === "pantheon" && (
                <div className="mt-4 pt-3 border-t border-amber-400/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300 font-mono">
                      🏆 Curated Honors & Credentials
                    </p>
                    <span className="text-[10px] font-mono text-white/50">
                      {achievementsList.length} Credentials
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {achievementsList.map((a, i) => (
                      <button
                        key={i}
                        id={`pantheon-artifact-btn-${i}`}
                        onClick={() => setSelectedAchievementIndex(i)}
                        className="group flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 px-2.5 py-1.5 text-left text-xs text-white/85 transition hover:border-amber-300 hover:bg-amber-400/20"
                      >
                        <span className="text-amber-300 font-bold text-xs">{a.icon ?? "✦"}</span>
                        <span className="truncate text-[11px] font-medium group-hover:text-amber-200">
                          {a.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Finale: Visited Checkmarks */}
              {chapter?.id === "finale" && (
                <div className="mt-4 pt-3 border-t border-orange-400/20">
                  <p className="text-xs uppercase tracking-[0.25em] text-orange-300 mb-2 font-mono">
                    SECTORS EXPLORED
                  </p>
                  <ul className="grid grid-cols-2 gap-1.5 text-xs">
                    {CHAPTERS.map((c, i) => (
                      <li key={c.id}>
                        <button
                          id={`visited-section-btn-${c.id}`}
                          onClick={() => go(i)}
                          className={`w-full text-left rounded-md border px-2 py-1.5 transition font-mono text-[11px] ${
                            visited.has(c.id)
                              ? "border-orange-400/50 bg-orange-400/10 text-white"
                              : "border-white/10 bg-white/[0.03] text-white/40"
                          }`}
                        >
                          {visited.has(c.id) ? "✓" : "○"} {c.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Controls Cheat Sheet — bottom-right */}
        <div
          className={`transition-opacity duration-700 ${
            bootReady ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ControlsCheatSheet freeRoam={freeRoam} />
        </div>

        {/* Ambient Key Hints */}
        {bootReady && !freeRoam && chapter?.id !== "intro" && chapter?.id !== "wormhole" && (
          <AmbientKeySuggestions isIdle={isIdle} isIntro={false} />
        )}

        {/* Spacebar Orbit Prompt when Idle */}
        <div
          className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-35 flex items-center gap-3 transition-all duration-700 ${
            bootReady &&
            isIdle &&
            !contactOpen &&
            projectIndex === null &&
            selectedAchievementIndex === null &&
            index < CHAPTERS.length - 1 &&
            chapter?.id !== "intro" &&
            chapter?.id !== "wormhole"
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-95 pointer-events-none"
          } bottom-18`}
        >
          <div className="flex items-center gap-2.5 rounded-full border border-cyan-400/50 bg-slate-950/90 px-5 py-2 backdrop-blur-2xl shadow-[0_0_35px_rgba(34,211,238,0.35)] ring-1 ring-cyan-300/30">
            <kbd className="rounded border border-cyan-300/70 bg-cyan-400/20 px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-widest text-cyan-200">
              SPACE
            </kbd>
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-cyan-100 font-medium">
              Advance Orbit
            </span>
            <span className="text-cyan-400 text-sm">➔</span>
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <nav
          id="chapter-step-controls"
          aria-label="Chapter step controls"
          className={`absolute left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 transition-all duration-700 ${
            bootReady ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${chapter?.id === "intro" ? "bottom-14" : "bottom-6"}`}
        >
          <button
            id="prev-chapter-btn"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous chapter"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm backdrop-blur-md font-mono disabled:opacity-25 hover:border-white transition-colors"
          >
            ← Previous
          </button>
          <button
            id="next-chapter-btn"
            onClick={() => {
              if (index === 0) playLaunchSound();
              go(index + 1);
            }}
            disabled={index === CHAPTERS.length - 1}
            aria-label={index === CHAPTERS.length - 1 ? "Journey complete" : "Continue to next chapter"}
            className="rounded-full border border-cyan-400 bg-cyan-400 text-black px-6 py-2 text-sm font-semibold font-mono backdrop-blur-md disabled:opacity-30 hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all"
          >
            {index === 0 ? "Initiate Odyssey →" : index === CHAPTERS.length - 1 ? "Journey Complete" : "Continue →"}
          </button>
        </nav>

        {/* Screen Reader & SEO Manifest */}
        <section id="accessible-portfolio-manifest" className="sr-only" aria-label="Portfolio Dossier and Experience Manifest">
          <h2>About Bacem Zarai</h2>
          <p>{BRAND.description}</p>
          <h2>Engineering Waypoints & Experiences</h2>
          <ul>
            {(data.experiences ?? []).map((e: Experience, i: number) => (
              <li key={i}>
                <h3>{e.name} — {e.place ?? "Engineering Milestone"} ({e.year})</h3>
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
                <h3>{a.name} — {a.issuer} ({a.year})</h3>
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
            onNext={() => setSelectedAchievementIndex((selectedAchievementIndex + 1) % achievementsList.length)}
            onPrev={() => setSelectedAchievementIndex((selectedAchievementIndex - 1 + achievementsList.length) % achievementsList.length)}
          />
        )}
      </main>
    </PortfolioContext.Provider>
  );
}

export default Portfolio;
