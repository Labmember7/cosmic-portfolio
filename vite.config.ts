import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Polyfill ProgressEvent in Node.js SSR environments for Three.js FileLoader / GLTFLoader
if (typeof globalThis.ProgressEvent === "undefined" && typeof globalThis.Event !== "undefined") {
  class ProgressEventPolyfill<T extends EventTarget = EventTarget> extends Event {
    readonly lengthComputable: boolean;
    readonly loaded: number;
    readonly total: number;
    constructor(
      type: string,
      eventInitDict?: { lengthComputable?: boolean; loaded?: number; total?: number },
    ) {
      super(type);
      this.lengthComputable = Boolean(eventInitDict?.lengthComputable);
      this.loaded = Number(eventInitDict?.loaded ?? 0);
      this.total = Number(eventInitDict?.total ?? 0);
    }
  }
  (globalThis as unknown as { ProgressEvent: typeof ProgressEventPolyfill }).ProgressEvent =
    ProgressEventPolyfill;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    react(),
    command === "build" && cloudflare({ viteEnvironment: { name: "ssr" } }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
}));
