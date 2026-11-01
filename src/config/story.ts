import type { Experience } from "@/content/portfolio";

export type ChapterId =
  | "intro"
  | "experience-1"
  | "experience-2"
  | "experience-3"
  | "wormhole"
  | "galaxy"
  | "skills"
  | "pantheon"
  | "finale";

export interface Chapter {
  id: ChapterId;
  title: string;
  caption: string;
  camera: [number, number, number];
  lookAt: [number, number, number];
  /** Optional intermediate waypoint the camera reaches first before lerping to final pose. */
  via?: { camera: [number, number, number]; lookAt: [number, number, number] };
}

export interface SceneLayout {
  experienceZs: number[];
  wormholeZ: number;
  galaxyZ: number;
  skillsZ: number;
  pantheonZ: number;
  finaleZ: number;
  blackholeZ: number;
}

export const EXP_SPACING = 30;
export const EXP_FIRST_Z = -90;

/**
 * Linear radius progression with a moderate slope:
 * R(i) = R_base + slope * i
 * i = 0: R = 1.85 (not too small, solid presence)
 * i = 1: R = 2.40 (visibly larger with moderate growth)
 * i = 2: R = 2.95 (commanding, but not excessively huge)
 */
export function getExperienceRadius(index: number): number {
  return 1.85 + 0.55 * index;
}

export function computeLayout(experiences: Experience[]): SceneLayout {
  const experienceZs = experiences.map((e, i) =>
    typeof e.z === "number" ? e.z! : EXP_FIRST_Z - i * EXP_SPACING,
  );
  const minZ = experienceZs.length ? Math.min(...experienceZs) : EXP_FIRST_Z;
  const wormholeZ = minZ - 50;
  const galaxyZ = wormholeZ - 75;
  const skillsZ = galaxyZ - 45;
  const pantheonZ = skillsZ - 50;
  const finaleZ = pantheonZ - 65;
  const blackholeZ = finaleZ - 25;
  return { experienceZs, wormholeZ, galaxyZ, skillsZ, pantheonZ, finaleZ, blackholeZ };
}

export function buildChapters(
  experiences: Experience[],
  layout: SceneLayout,
  brandDescription?: string,
): Chapter[] {
  const chapters: Chapter[] = [
    {
      id: "intro",
      title: "01 · Boarding",
      caption:
        brandDescription ??
        "Meet Bacem — engineer of embedded systems, robotics and computer vision. He suits up and climbs aboard.",
      camera: [0, 2.4, 7],
      lookAt: [0, 1.6, -2],
    },
  ];
  experiences.forEach((e, i) => {
    const z = layout.experienceZs[i];
    const num = String(i + 2).padStart(2, "0");
    const heading = e.place ? `${e.place} — ${e.name}` : e.name;
    const isArsenal = /arsenal/i.test(heading);
    const r = getExperienceRadius(i);
    const side = i % 2 === 0 ? -1 : 1;
    chapters.push({
      id: `experience-${i + 1}` as ChapterId,
      title: `${num} · ${e.year} — ${heading}`,
      caption: e.description ?? `Waypoint ${i + 1}: ${heading}.`,
      camera: [0, 2.2 + (r - 2) * 0.15, z + (isArsenal ? 10 : 14)],
      lookAt: [side * 0.8, 0.5 + (r - 2) * 0.1, z],
      ...(i === 0
        ? {
            via: {
              camera: [0, 3.6, (7 + z + 14) / 2],
              lookAt: [0, 1, z + 20],
            },
          }
        : {}),
    });
  });
  const base = experiences.length + 1;
  chapters.push(
    {
      id: "wormhole",
      title: `${String(base + 1).padStart(2, "0")} · The Rift — Interstellar Wormhole`,
      caption:
        "Spacetime folds into an Einstein-Rosen bridge. Traversing the interdimensional corridor into a new galaxy.",
      camera: [0, 0, layout.wormholeZ - 16],
      lookAt: [0, 0, layout.wormholeZ - 50],
      via: {
        camera: [0, 0, layout.wormholeZ + 27],
        lookAt: [0, 0, layout.wormholeZ - 30],
      },
    },
    {
      id: "galaxy",
      title: `${String(base + 2).padStart(2, "0")} · The Forge — Projects Galaxy`,
      caption:
        "A luminous spiral of systems, firmware, and autonomous perception. Click any planet to open its story.",
      camera: [0, 18, layout.galaxyZ + 32],
      lookAt: [0, 0, layout.galaxyZ - 5],
      via: {
        camera: [0, 0, layout.galaxyZ + 22],
        lookAt: [0, 0, layout.galaxyZ - 5],
      },
    },
    {
      id: "skills",
      title: `${String(base + 3).padStart(2, "0")} · The Skill Constellation`,
      caption:
        "Above the galaxy, a constellation of tools, frameworks, and languages currently in orbit.",
      camera: [0, 14, layout.skillsZ + 22],
      lookAt: [0, 8, layout.skillsZ - 10],
    },
    {
      id: "pantheon",
      title: `${String(base + 4).padStart(2, "0")} · The Pantheon — Hall of Honors`,
      caption:
        "The celestial hall of honors: verified certifications and engineering milestones. Click any floating crest to inspect its dossier.",
      camera: [0, 9.5, layout.pantheonZ + 22],
      lookAt: [0, 1.0, layout.pantheonZ],
    },
    {
      id: "finale",
      title: `${String(base + 5).padStart(2, "0")} · The Singularity`,
      caption:
        "Every cosmic journey arrives at the event horizon. Look back at where you've been, transmit a signal, or explore in free roam.",
      camera: [0, 1.2, layout.finaleZ + 7],
      lookAt: [0, 0, layout.finaleZ - 5],
    },
  );
  return chapters;
}
