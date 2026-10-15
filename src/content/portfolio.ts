import yaml from "js-yaml";
import { createContext, useContext } from "react";

/**
 * URL the app fetches the portfolio markdown from.
 *
 * EDIT THIS to point at YOUR GitHub raw URL once you've committed
 * `portfolio.md` to your repo. Format:
 *   https://raw.githubusercontent.com/<user>/<repo>/<branch>/<path-to-file>
 *
 * Optional override via env: VITE_PORTFOLIO_MD_URL
 */
export const PORTFOLIO_MD_URL =
  (import.meta.env.VITE_PORTFOLIO_MD_URL as string | undefined) ||
  "https://raw.githubusercontent.com/Labmember7/Labmember7/main/README.md";

export type ProjectPattern = "stripes" | "lava" | "ice" | "gas" | "grid";

export interface Brand {
  name: string;
  tagline: string;
  description?: string;
  email: string;
  linkedin: string;
  github: string;
}

export interface Experience {
  /** Optional — z is now auto-computed from the order of experiences. */
  z?: number;
  color: string;
  accent: string;
  /** Job title / role. */
  name: string;
  year: string;
  /** Company or location — rendered as the planet's big display name. */
  place?: string;
  description?: string;
  pattern: ProjectPattern;
}

export interface Project {
  name: string;
  color: string;
  accent: string;
  desc: string;
  details: string;
  stack: string[];
  pattern: ProjectPattern;
  radius: number;
  speed: number;
  size: number;
}

export interface SkillGroups {
  technical: string[];
  soft: string[];
}

export interface Achievement {
  name: string;
  issuer?: string;
  year?: string;
  icon?: string;
  color?: string;
  accent?: string;
  description?: string;
}

export interface PortfolioContent {
  brand: Brand;
  experiences: Experience[];
  projects: Project[];
  skills: SkillGroups;
  achievements?: Achievement[];
}

function normalizeSkills(raw: unknown): SkillGroups {
  if (Array.isArray(raw)) {
    return { technical: raw as string[], soft: [] };
  }
  if (raw && typeof raw === "object") {
    const r = raw as { technical?: string[]; soft?: string[] };
    return {
      technical: Array.isArray(r.technical) ? r.technical : [],
      soft: Array.isArray(r.soft) ? r.soft : [],
    };
  }
  return { technical: [], soft: [] };
}

function parseFrontmatter(raw: string): PortfolioContent {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error("portfolio.md is missing YAML frontmatter");
  const data = yaml.load(match[1]) as Partial<PortfolioContent> | null;
  if (
    !data ||
    !data.brand ||
    !Array.isArray(data.experiences) ||
    !Array.isArray(data.projects) ||
    !data.skills
  ) {
    throw new Error("portfolio.md frontmatter is missing required keys");
  }
  return {
    ...(data as PortfolioContent),
    skills: normalizeSkills(data.skills),
    achievements: Array.isArray((data as PortfolioContent).achievements)
      ? (data as PortfolioContent).achievements
      : [],
  };
}

export async function fetchPortfolio(): Promise<PortfolioContent> {
  const res = await fetch(PORTFOLIO_MD_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch portfolio markdown: HTTP ${res.status}`);
  }
  const text = await res.text();
  return parseFrontmatter(text);
}

/* ============ React context for sharing the loaded data ============ */

export const PortfolioContext = createContext<PortfolioContent | null>(null);

export function usePortfolio(): PortfolioContent {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error(
      "usePortfolio() called outside of <PortfolioContext.Provider>",
    );
  }
  return ctx;
}
