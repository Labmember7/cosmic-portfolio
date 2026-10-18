import * as THREE from "three";
import { type ProjectPattern } from "@/content/portfolio";

/* ================================================================== */
/* EXOPLANETARY BIOME & ATMOSPHERE PROCEDURAL ENGINE                   */
/* ================================================================== */

export type BiomeType =
  | "oceanic"
  | "continental"
  | "lava"
  | "gas"
  | "ice"
  | "desert"
  | "toxic"
  | "crystal"
  | "cyber";

export interface AtmosphereTelemetry {
  biomeType: BiomeType;
  biomeName: string;
  classification: string;
  primaryGas: string;
  composition: string;
  pressure: string;
  surfaceTemp: string;
  gravity: string;
  hydrosphere: string;
  hazards: string[];
  atmosphereColor: string;
  sunsetLimbColor: string;
  exosphereGlow: string;
  hasClouds: boolean;
  cloudOpacity: number;
  cloudSpeed: number;
  hasRings: boolean;
  ringInner?: number;
  ringOuter?: number;
  ringColor?: string;
  ringOpacity?: number;
}

/* ---------- Deterministic PRNG and Color Utilities ---------- */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function hexToRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  const v = parseInt(
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s,
    16,
  );
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function rgbString(c: [number, number, number], a = 1): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

export function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): [number, number, number] {
  const clampT = Math.max(0, Math.min(1, t));
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * clampT),
    Math.round(c1[1] + (c2[1] - c1[1]) * clampT),
    Math.round(c1[2] + (c2[2] - c1[2]) * clampT),
  ];
}

/* Map input pattern string to extended BiomeType with fallback */
export function resolveBiomeType(
  pattern: string | undefined,
  seedStr: string,
): BiomeType {
  if (pattern === "lava") return "lava";
  if (pattern === "ice") return "ice";
  if (pattern === "gas") return "gas";
  if (pattern === "grid") return "cyber";
  if (pattern === "stripes") return "desert";
  if (pattern === "oceanic") return "oceanic";
  if (pattern === "continental") return "continental";
  if (pattern === "desert") return "desert";
  if (pattern === "toxic") return "toxic";
  if (pattern === "crystal") return "crystal";
  if (pattern === "cyber") return "cyber";

  // Deterministic variety based on seed if pattern is default/generic
  const biomes: BiomeType[] = [
    "oceanic",
    "continental",
    "lava",
    "gas",
    "ice",
    "desert",
    "toxic",
    "crystal",
    "cyber",
  ];
  const h = hashString(seedStr);
  return biomes[h % biomes.length];
}

/* ---------- Procedural Atmosphere & Telemetry Generator ---------- */
export function generateAtmosphereTelemetry(
  planetName: string,
  rawPattern: string | undefined,
  baseColor: string,
  accentColor: string,
): AtmosphereTelemetry {
  const seed = hashString(`${planetName}|${rawPattern}|${baseColor}`);
  const rng = createRng(seed);
  const biome = resolveBiomeType(rawPattern, planetName);

  const cBase = hexToRgb(baseColor);
  const cAcc = hexToRgb(accentColor);

  switch (biome) {
    case "oceanic": {
      const p = (0.95 + rng() * 0.2).toFixed(2);
      const t = Math.round(14 + rng() * 12);
      const n2 = (74 + rng() * 5).toFixed(1);
      const o2 = (21 + rng() * 4).toFixed(1);
      const g = (0.94 + rng() * 0.15).toFixed(2);
      return {
        biomeType: "oceanic",
        biomeName: "Aquaworld / Pelagic Deep",
        classification: "Class-O Super-Oceanic",
        primaryGas: "Nitrogen-Oxygen (Marine)",
        composition: `${n2}% N₂ · ${o2}% O₂ · 2.1% H₂O(v) · 0.9% Ar`,
        pressure: `${p} atm (Temperate)`,
        surfaceTemp: `+${t}°C (Maritime Stability)`,
        gravity: `${g} G`,
        hydrosphere: `${Math.round(88 + rng() * 11)}% Global Ocean`,
        hazards: ["High Humidity", "Equatorial Cyclones", "Tidal Surges"],
        atmosphereColor: "#38bdf8",
        sunsetLimbColor: "#f59e0b",
        exosphereGlow: "#0284c7",
        hasClouds: true,
        cloudOpacity: 0.65,
        cloudSpeed: 0.08,
        hasRings: rng() > 0.65,
        ringInner: 2.3,
        ringOuter: 3.1,
        ringColor: "#7dd3fc",
        ringOpacity: 0.45,
      };
    }

    case "continental": {
      const p = (0.98 + rng() * 0.12).toFixed(2);
      const t = Math.round(15 + rng() * 10);
      const g = (0.97 + rng() * 0.08).toFixed(2);
      return {
        biomeType: "continental",
        biomeName: "Terrestrial Gaia Biosphere",
        classification: "Class-M Habitable Core",
        primaryGas: "Nitrogen-Oxygen Core",
        composition: `78.1% N₂ · 20.9% O₂ · 0.93% Ar · 420ppm CO₂`,
        pressure: `${p} atm (Optimal)`,
        surfaceTemp: `+${t}°C (Temperate Habitable)`,
        gravity: `${g} G`,
        hydrosphere: `${Math.round(68 + rng() * 8)}% Liquid H₂O`,
        hazards: ["Geological Active", "Seasonal Storms", "Bio-Rich"],
        atmosphereColor: "#60a5fa",
        sunsetLimbColor: "#fb923c",
        exosphereGlow: "#3b82f6",
        hasClouds: true,
        cloudOpacity: 0.7,
        cloudSpeed: 0.06,
        hasRings: rng() > 0.75,
        ringInner: 2.4,
        ringOuter: 3.2,
        ringColor: "#93c5fd",
        ringOpacity: 0.35,
      };
    }

    case "lava": {
      const p = (2.4 + rng() * 6.5).toFixed(1);
      const t = Math.round(580 + rng() * 320);
      const so2 = (48 + rng() * 12).toFixed(1);
      const co2 = (32 + rng() * 10).toFixed(1);
      const g = (1.1 + rng() * 0.4).toFixed(2);
      return {
        biomeType: "lava",
        biomeName: "Pyroclastic Magma World",
        classification: "Class-Y Hyper-Volcanic",
        primaryGas: "Sulfur Dioxide Superheated",
        composition: `${so2}% SO₂ · ${co2}% CO₂ · 11.2% H₂S · 6.5% HCl`,
        pressure: `${p} atm (Dense Choking)`,
        surfaceTemp: `+${t}°C (Incandescent Molten)`,
        gravity: `${g} G`,
        hydrosphere: "0% H₂O (24% Active Magma Seas)",
        hazards: ["Pyroclastic Lightning", "Acid Rain", "Molten Caldrons"],
        atmosphereColor: "#f97316",
        sunsetLimbColor: "#dc2626",
        exosphereGlow: "#ea580c",
        hasClouds: true,
        cloudOpacity: 0.45,
        cloudSpeed: 0.12,
        hasRings: rng() > 0.5,
        ringInner: 2.2,
        ringOuter: 3.3,
        ringColor: "#fdba74",
        ringOpacity: 0.55,
      };
    }

    case "gas": {
      const p = `${Math.round(80 + rng() * 60)} atm (Crushing Core)`;
      const t = Math.round(-140 + rng() * 40);
      const h2 = (88 + rng() * 5).toFixed(1);
      const he = (10 + rng() * 3).toFixed(1);
      const g = (2.2 + rng() * 0.8).toFixed(2);
      return {
        biomeType: "gas",
        biomeName: "Jovian Multi-Banded Giant",
        classification: "Class-J Jovian Gas Giant",
        primaryGas: "Hydrogen-Helium Supercritical",
        composition: `${h2}% H₂ · ${he}% He · 0.8% CH₄ · 0.3% NH₃`,
        pressure: p,
        surfaceTemp: `${t}°C (Upper Cloud Deck)`,
        gravity: `${g} G`,
        hydrosphere: "No Solid Surface (Metallic H Core)",
        hazards: ["Supersonic Jet Streams", "Radiation Belts", "Vortex Storms"],
        atmosphereColor: baseColor,
        sunsetLimbColor: accentColor,
        exosphereGlow: baseColor,
        hasClouds: false, // Clouds are embedded in the banded texture
        cloudOpacity: 0,
        cloudSpeed: 0,
        hasRings: true,
        ringInner: 2.5,
        ringOuter: 3.8,
        ringColor: baseColor,
        ringOpacity: 0.65,
      };
    }

    case "ice": {
      const p = (0.05 + rng() * 0.25).toFixed(2);
      const t = Math.round(-185 + rng() * 35);
      const n2 = (92 + rng() * 4).toFixed(1);
      const ch4 = (5 + rng() * 3).toFixed(1);
      const g = (0.7 + rng() * 0.3).toFixed(2);
      return {
        biomeType: "ice",
        biomeName: "Cryogenic Glacial World",
        classification: "Class-P Cryo-Oceanic",
        primaryGas: "Sublimated Nitrogen-Methane",
        composition: `${n2}% N₂ · ${ch4}% CH₄ · 1.2% Ar · 0.4% CO`,
        pressure: `${p} atm (Thin Sublimation)`,
        surfaceTemp: `${t}°C (Deep Cryo Freeze)`,
        gravity: `${g} G`,
        hydrosphere: "100% Solid Ice Crust (Sub-Ocean Active)",
        hazards: ["Cryo-Geysers", "Thermal Frigid", "Crevasse Fractures"],
        atmosphereColor: "#a5f3fc",
        sunsetLimbColor: "#c084fc",
        exosphereGlow: "#38bdf8",
        hasClouds: true,
        cloudOpacity: 0.4,
        cloudSpeed: 0.05,
        hasRings: rng() > 0.45,
        ringInner: 2.3,
        ringOuter: 3.4,
        ringColor: "#bae6fd",
        ringOpacity: 0.5,
      };
    }

    case "desert": {
      const p = (0.15 + rng() * 0.4).toFixed(2);
      const t = Math.round(38 + rng() * 28);
      const co2 = (94 + rng() * 3).toFixed(1);
      const n2 = (3 + rng() * 2).toFixed(1);
      const g = (0.55 + rng() * 0.35).toFixed(2);
      return {
        biomeType: "desert",
        biomeName: "Arrakis-Class Dune Biosphere",
        classification: "Class-D Hyper-Arid",
        primaryGas: "Carbon Dioxide Dust Haze",
        composition: `${co2}% CO₂ · ${n2}% N₂ · 1.8% Ar · Trace O₂`,
        pressure: `${p} atm (Arid Low Pressure)`,
        surfaceTemp: `+${t}°C (Thermal Highs)`,
        gravity: `${g} G`,
        hydrosphere: "0% Surface Water (Trace Polar Permafrost)",
        hazards: ["Planetary Dust Devils", "Thermal Shock", "Silicon Storms"],
        atmosphereColor: "#fbbf24",
        sunsetLimbColor: "#b45309",
        exosphereGlow: "#d97706",
        hasClouds: true,
        cloudOpacity: 0.35,
        cloudSpeed: 0.14,
        hasRings: rng() > 0.6,
        ringInner: 2.4,
        ringOuter: 3.2,
        ringColor: "#fde68a",
        ringOpacity: 0.4,
      };
    }

    case "toxic": {
      const p = `${Math.round(85 + rng() * 30)} atm (Venusian Pressure)`;
      const t = Math.round(440 + rng() * 60);
      const co2 = (96 + rng() * 2).toFixed(1);
      const n2 = (3 + rng() * 1).toFixed(1);
      const g = (0.92 + rng() * 0.1).toFixed(2);
      return {
        biomeType: "toxic",
        biomeName: "Acidic Greenhouse Biosphere",
        classification: "Class-N Venusian Hyper-Dense",
        primaryGas: "Supercritical CO₂ + Sulfuric Aerosol",
        composition: `${co2}% CO₂ · ${n2}% N₂ · 180ppm SO₂ · 0.1% H₂O`,
        pressure: p,
        surfaceTemp: `+${t}°C (Runaway Greenhouse)`,
        gravity: `${g} G`,
        hydrosphere: "0% Surface Water (Atmospheric H₂SO₄ Decks)",
        hazards: ["Corrosive Acid Rain", "Supercritical Gale", "High Pressure"],
        atmosphereColor: "#a3e635",
        sunsetLimbColor: "#eab308",
        exosphereGlow: "#84cc16",
        hasClouds: true,
        cloudOpacity: 0.85,
        cloudSpeed: 0.1,
        hasRings: rng() > 0.5,
        ringInner: 2.4,
        ringOuter: 3.3,
        ringColor: "#bef264",
        ringOpacity: 0.45,
      };
    }

    case "crystal": {
      const p = (0.4 + rng() * 0.8).toFixed(2);
      const t = Math.round(-30 + rng() * 50);
      const g = (1.05 + rng() * 0.25).toFixed(2);
      return {
        biomeType: "crystal",
        biomeName: "Prismatic Crystalline Mineral World",
        classification: "Class-X Exotic Lithosphere",
        primaryGas: "Noble Gas Ionized Atmosphere",
        composition: `64.2% Ne · 28.5% Ar · 5.8% Kr · 1.5% Xe`,
        pressure: `${p} atm (Noble Haze)`,
        surfaceTemp: `${t}°C (Piezoelectric Stable)`,
        gravity: `${g} G`,
        hydrosphere: "Liquid Xenon Pools (8%)",
        hazards: ["Prismatic Refractions", "Piezo Spikes", "Sharp Geodes"],
        atmosphereColor: "#c084fc",
        sunsetLimbColor: "#38bdf8",
        exosphereGlow: "#a855f7",
        hasClouds: true,
        cloudOpacity: 0.4,
        cloudSpeed: 0.07,
        hasRings: true,
        ringInner: 2.3,
        ringOuter: 3.5,
        ringColor: "#e879f9",
        ringOpacity: 0.6,
      };
    }

    case "cyber":
    default: {
      const p = (1.02 + rng() * 0.15).toFixed(2);
      const t = Math.round(20 + rng() * 8);
      const g = (1.0 + rng() * 0.1).toFixed(2);
      return {
        biomeType: "cyber",
        biomeName: "Synthetic Ecumenopolis Network",
        classification: "Class-S Synthetic Megastructure",
        primaryGas: "Industrial Filtered Air",
        composition: `75.2% N₂ · 20.1% O₂ · 3.8% CO₂ · 0.9% Micro-Aerosols`,
        pressure: `${p} atm (Controlled HVAC)`,
        surfaceTemp: `+${t}°C (Metropolitan Equilibrium)`,
        gravity: `${g} G`,
        hydrosphere: "Sub-surface Aqueduct Conduits (100% Recycled)",
        hazards: ["Electromagnetic Surges", "Orbital Grid Interference"],
        atmosphereColor: "#38bdf8",
        sunsetLimbColor: "#f43f5e",
        exosphereGlow: "#06b6d4",
        hasClouds: true,
        cloudOpacity: 0.35,
        cloudSpeed: 0.05,
        hasRings: rng() > 0.4,
        ringInner: 2.4,
        ringOuter: 3.4,
        ringColor: "#67e8f9",
        ringOpacity: 0.5,
      };
    }
  }
}

/* ================================================================== */
/* PROCEDURAL TEXTURE SYNTHESIS (1024x512 Canvas Textures)             */
/* ================================================================== */

const TEXTURE_CACHE = new Map<string, THREE.CanvasTexture>();
const CLOUD_CACHE = new Map<string, THREE.CanvasTexture>();
const RING_CACHE = new Map<string, THREE.CanvasTexture>();

export function getBiomeTexture(
  biome: BiomeType,
  color: string,
  accent: string,
  seedKey: string,
): THREE.CanvasTexture {
  const key = `${biome}|${color}|${accent}|${seedKey}`;
  if (TEXTURE_CACHE.has(key)) return TEXTURE_CACHE.get(key)!;

  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;

  const seed = hashString(key);
  const rng = createRng(seed);

  const cMain = hexToRgb(color);
  const cAcc = hexToRgb(accent);
  const cBright = lerpColor(cMain, [255, 255, 255], 0.4);
  const cDeep = lerpColor(cAcc, [10, 10, 20], 0.6);

  // Soft stamp helper
  const drawBlob = (
    x: number,
    y: number,
    r: number,
    rgbaStart: string,
    rgbaEnd: string,
  ) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, rgbaStart);
    grd.addColorStop(1, rgbaEnd);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };

  switch (biome) {
    case "oceanic": {
      // Authentic deep marine baseline
      const oceanGrad = g.createLinearGradient(0, 0, 0, H);
      oceanGrad.addColorStop(0, "rgba(10, 42, 78, 1)");
      oceanGrad.addColorStop(0.5, "rgba(4, 24, 48, 1)");
      oceanGrad.addColorStop(1, "rgba(10, 42, 78, 1)");
      g.fillStyle = oceanGrad;
      g.fillRect(0, 0, W, H);

      // Turquoise shallow continental shelves and coral reefs
      for (let i = 0; i < 40; i++) {
        const x = rng() * W;
        const y = H * (0.18 + rng() * 0.64);
        const r = 40 + rng() * 110;
        drawBlob(x, y, r, "rgba(34, 211, 238, 0.65)", "rgba(0,0,0,0)");
      }

      // Island chains and emerald archipelagos
      for (let i = 0; i < 80; i++) {
        const x = rng() * W;
        const y = H * (0.22 + rng() * 0.56);
        const r = 10 + rng() * 26;
        drawBlob(x, y, r, "rgba(34, 197, 94, 0.85)", "rgba(0,0,0,0)");
      }

      // Polar ice floes
      const polarN = g.createLinearGradient(0, 0, 0, H * 0.16);
      polarN.addColorStop(0, "rgba(240, 248, 255, 0.95)");
      polarN.addColorStop(1, "rgba(240, 248, 255, 0)");
      g.fillStyle = polarN;
      g.fillRect(0, 0, W, H * 0.16);

      const polarS = g.createLinearGradient(0, H * 0.84, 0, H);
      polarS.addColorStop(0, "rgba(240, 248, 255, 0)");
      polarS.addColorStop(1, "rgba(240, 248, 255, 0.95)");
      g.fillStyle = polarS;
      g.fillRect(0, H * 0.84, W, H * 0.16);
      break;
    }

    case "continental": {
      // Deep blue ocean baseline
      const oceanGrad = g.createLinearGradient(0, 0, 0, H);
      oceanGrad.addColorStop(0, "rgba(18, 52, 92, 1)");
      oceanGrad.addColorStop(0.5, "rgba(8, 28, 54, 1)");
      oceanGrad.addColorStop(1, "rgba(18, 52, 92, 1)");
      g.fillStyle = oceanGrad;
      g.fillRect(0, 0, W, H);

      // Continents with lowlands, highlands, and snow peaks
      for (let i = 0; i < 20; i++) {
        const cx = rng() * W;
        const cy = H * (0.2 + rng() * 0.6);
        const r = 65 + rng() * 125;
        // Lowland emerald vegetation
        drawBlob(cx, cy, r, "rgba(46, 125, 50, 0.95)", "rgba(0,0,0,0)");

        // Mountain highlands
        for (let j = 0; j < 6; j++) {
          const mx = cx + (rng() - 0.5) * r * 0.7;
          const my = cy + (rng() - 0.5) * r * 0.6;
          drawBlob(mx, my, r * 0.4, "rgba(141, 110, 99, 0.9)", "rgba(0,0,0,0)");
          // Snowy peak accents
          drawBlob(mx, my, r * 0.16, "rgba(255, 255, 255, 0.85)", "rgba(0,0,0,0)");
        }
      }

      // Polar ice caps
      const polGrad = g.createLinearGradient(0, 0, 0, H * 0.15);
      polGrad.addColorStop(0, "rgba(245, 250, 255, 0.98)");
      polGrad.addColorStop(1, "rgba(245, 250, 255, 0)");
      g.fillStyle = polGrad;
      g.fillRect(0, 0, W, H * 0.15);

      const polGradB = g.createLinearGradient(0, H * 0.85, 0, H);
      polGradB.addColorStop(0, "rgba(245, 250, 255, 0)");
      polGradB.addColorStop(1, "rgba(245, 250, 255, 0.98)");
      g.fillStyle = polGradB;
      g.fillRect(0, H * 0.85, W, H * 0.15);
      break;
    }

    case "lava": {
      // Dark cracked basalt crust
      g.fillStyle = "rgba(18, 14, 18, 1)";
      g.fillRect(0, 0, W, H);

      // Glowing incandescent magma fissures
      g.lineCap = "round";
      for (let i = 0; i < 150; i++) {
        let x = rng() * W;
        let y = rng() * H;
        const segs = 4 + Math.floor(rng() * 8);
        g.beginPath();
        g.moveTo(x, y);
        for (let s = 0; s < segs; s++) {
          x += (rng() - 0.5) * 60;
          y += (rng() - 0.5) * 40;
          g.lineTo(x, y);
        }
        g.strokeStyle = rng() > 0.4 ? "rgba(255, 80, 0, 0.9)" : "rgba(255, 220, 40, 0.95)";
        g.lineWidth = 1.2 + rng() * 2.8;
        g.stroke();
      }

      // Glowing magma calderas and lakes
      for (let i = 0; i < 45; i++) {
        const x = rng() * W;
        const y = rng() * H;
        const r = 20 + rng() * 50;
        drawBlob(x, y, r, "rgba(255, 230, 80, 0.95)", "rgba(255, 50, 0, 0)");
      }
      break;
    }

    case "gas": {
      // Authentic Jovian multi-banded jet streams
      const bands = 16 + Math.floor(rng() * 6);
      const palette = [
        "rgba(217, 119, 6, 1)",
        "rgba(245, 158, 11, 1)",
        "rgba(254, 243, 199, 1)",
        "rgba(180, 83, 9, 1)",
        "rgba(251, 191, 36, 1)",
      ];
      for (let i = 0; i < bands; i++) {
        const y0 = (i / bands) * H;
        const h = H / bands + 2;
        g.fillStyle = palette[i % palette.length];
        g.fillRect(0, y0, W, h);
      }

      // Turbulent storm swirls
      g.globalCompositeOperation = "overlay";
      for (let i = 0; i < 90; i++) {
        const y = rng() * H;
        const x = rng() * W;
        const rx = 35 + rng() * 95;
        const ry = 8 + rng() * 25;
        const grd = g.createRadialGradient(x, y, 0, x, y, rx);
        grd.addColorStop(0, "rgba(255, 255, 255, 0.6)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.globalCompositeOperation = "source-over";

      // Great Red Spot storm vortex
      const spotX = W * (0.35 + rng() * 0.3);
      const spotY = H * (0.45 + rng() * 0.18);
      const sGrd = g.createRadialGradient(spotX, spotY, 0, spotX, spotY, 55);
      sGrd.addColorStop(0, "rgba(255, 245, 210, 0.95)");
      sGrd.addColorStop(0.5, "rgba(220, 38, 38, 0.85)");
      sGrd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = sGrd;
      g.beginPath();
      g.ellipse(spotX, spotY, 70, 40, 0.1, 0, Math.PI * 2);
      g.fill();
      break;
    }

    case "ice": {
      // Pale icy cryogenic crust
      const iceGrad = g.createLinearGradient(0, 0, 0, H);
      iceGrad.addColorStop(0, "rgba(240, 248, 255, 1)");
      iceGrad.addColorStop(0.5, "rgba(207, 250, 254, 1)");
      iceGrad.addColorStop(1, "rgba(240, 248, 255, 1)");
      g.fillStyle = iceGrad;
      g.fillRect(0, 0, W, H);

      // Deep cyan subsurface ocean fracture rifts
      g.lineCap = "round";
      for (let i = 0; i < 110; i++) {
        let x = rng() * W;
        let y = rng() * H;
        const len = 40 + rng() * 120;
        const ang = rng() * Math.PI * 2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        g.strokeStyle = "rgba(8, 145, 178, 0.75)";
        g.lineWidth = 1.0 + rng() * 2.5;
        g.stroke();
      }

      // Frost rime textures
      for (let i = 0; i < 70; i++) {
        drawBlob(rng() * W, rng() * H, 30 + rng() * 70, "rgba(255, 255, 255, 0.45)", "rgba(0,0,0,0)");
      }
      break;
    }

    case "desert": {
      // Warm Mars / Arrakis terracotta dunes
      const duneGrad = g.createLinearGradient(0, 0, 0, H);
      duneGrad.addColorStop(0, "rgba(217, 119, 6, 1)");
      duneGrad.addColorStop(0.5, "rgba(180, 83, 9, 1)");
      duneGrad.addColorStop(1, "rgba(146, 64, 14, 1)");
      g.fillStyle = duneGrad;
      g.fillRect(0, 0, W, H);

      // Giant rift canyons (Valles Marineris-style)
      g.lineCap = "round";
      for (let i = 0; i < 18; i++) {
        let x = rng() * W;
        let y = H * (0.28 + rng() * 0.44);
        g.beginPath();
        g.moveTo(x, y);
        for (let s = 0; s < 6; s++) {
          x += 35 + rng() * 75;
          y += (rng() - 0.5) * 22;
          g.lineTo(x, y);
        }
        g.strokeStyle = "rgba(67, 20, 7, 0.85)";
        g.lineWidth = 3 + rng() * 6;
        g.stroke();
      }

      // Swirling golden sand dunes & salt flats
      for (let i = 0; i < 90; i++) {
        drawBlob(rng() * W, rng() * H, 25 + rng() * 80, "rgba(251, 191, 36, 0.45)", "rgba(0,0,0,0)");
      }
      break;
    }

    case "toxic": {
      // Swirling viridian & sulfur greenhouse decks
      const toxGrad = g.createLinearGradient(0, 0, 0, H);
      toxGrad.addColorStop(0, "rgba(163, 230, 53, 1)");
      toxGrad.addColorStop(0.5, "rgba(101, 163, 13, 1)");
      toxGrad.addColorStop(1, "rgba(77, 124, 15, 1)");
      g.fillStyle = toxGrad;
      g.fillRect(0, 0, W, H);

      for (let i = 0; i < 70; i++) {
        const x = rng() * W;
        const y = rng() * H;
        const r = 40 + rng() * 110;
        drawBlob(x, y, r, "rgba(234, 179, 8, 0.7)", "rgba(0,0,0,0)");
      }
      break;
    }

    case "crystal": {
      // Deep amethyst mineral baseline
      g.fillStyle = "rgba(30, 15, 45, 1)";
      g.fillRect(0, 0, W, H);

      for (let i = 0; i < 55; i++) {
        const x = rng() * W;
        const y = rng() * H;
        const r = 20 + rng() * 60;
        const sides = 5 + Math.floor(rng() * 3);
        g.beginPath();
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r;
          if (s === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.closePath();
        g.fillStyle = rng() > 0.5 ? "rgba(192, 132, 252, 0.65)" : "rgba(56, 189, 248, 0.65)";
        g.fill();
        g.strokeStyle = "rgba(255, 255, 255, 0.5)";
        g.lineWidth = 1;
        g.stroke();
      }
      break;
    }

    case "cyber":
    default: {
      // Dark high-tech metallic crust
      g.fillStyle = "rgba(15, 23, 42, 1)";
      g.fillRect(0, 0, W, H);

      // Glowing metropolitan continent nodes
      for (let i = 0; i < 25; i++) {
        const x = rng() * W;
        const y = rng() * H;
        const r = 40 + rng() * 95;
        drawBlob(x, y, r, "rgba(14, 165, 233, 0.85)", "rgba(0,0,0,0)");
      }

      // Cybernetic city grid lines & transport conduits
      g.strokeStyle = "rgba(56, 189, 248, 0.35)";
      g.lineWidth = 0.8;
      for (let i = 0; i < W; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, H);
        g.stroke();
      }
      for (let j = 0; j < H; j += 32) {
        g.beginPath();
        g.moveTo(0, j);
        g.lineTo(W, j);
        g.stroke();
      }

      // Intense high-tech power hubs
      for (let i = 0; i < 60; i++) {
        drawBlob(rng() * W, rng() * H, 6 + rng() * 15, "rgba(255, 255, 255, 0.95)", "rgba(0,0,0,0)");
      }
      break;
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  TEXTURE_CACHE.set(key, tex);
  return tex;
}

/* ---------- Procedural Rotating Cloud Map Texture ---------- */
export function getPlanetCloudTexture(
  biome: BiomeType,
  cloudColor = "#ffffff",
): THREE.CanvasTexture {
  const key = `cloud|${biome}|${cloudColor}`;
  if (CLOUD_CACHE.has(key)) return CLOUD_CACHE.get(key)!;

  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;

  g.clearRect(0, 0, W, H);
  const seed = hashString(key);
  const rng = createRng(seed);

  const cRgb = hexToRgb(cloudColor);

  // Soft atmospheric cloud clumps
  const count = biome === "toxic" ? 140 : 85;
  for (let i = 0; i < count; i++) {
    const x = rng() * W;
    const y = H * (0.15 + rng() * 0.7);
    const r = 25 + rng() * 85;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, rgbString(cRgb, 0.45 + rng() * 0.35));
    grd.addColorStop(0.5, rgbString(cRgb, 0.2));
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(x, y, r, r * 0.4, (rng() - 0.5) * 0.4, 0, Math.PI * 2);
    g.fill();
  }

  // Giant swirling cyclone storms
  for (let i = 0; i < 3; i++) {
    const cx = W * (0.2 + rng() * 0.6);
    const cy = H * (0.25 + rng() * 0.5);
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 4;
      const dist = 10 + a * 5;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist * 0.6;
      const r = 15 + a * 3;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, rgbString(cRgb, 0.5));
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  CLOUD_CACHE.set(key, tex);
  return tex;
}

/* ---------- Procedural Planetary Ring Texture ---------- */
export function getPlanetRingTexture(
  ringColor: string,
  ringAccent = "#ffffff",
): THREE.CanvasTexture {
  const key = `ring|${ringColor}|${ringAccent}`;
  if (RING_CACHE.has(key)) return RING_CACHE.get(key)!;

  const W = 512;
  const H = 64;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;

  const c1 = hexToRgb(ringColor);
  const c2 = hexToRgb(ringAccent);

  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.12, rgbString(c1, 0.85));
  grad.addColorStop(0.35, rgbString(c2, 0.9));
  // Cassini Division gap
  grad.addColorStop(0.5, "rgba(0,0,0,0.05)");
  grad.addColorStop(0.56, "rgba(0,0,0,0.05)");
  grad.addColorStop(0.62, rgbString(c1, 0.8));
  grad.addColorStop(0.88, rgbString(c2, 0.7));
  grad.addColorStop(1, "rgba(0,0,0,0)");

  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  // Micro-band noise
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(x, 0, 1 + Math.random() * 2, H);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  RING_CACHE.set(key, tex);
  return tex;
}
