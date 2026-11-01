// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

// Polyfill ProgressEvent in Node.js SSR environments (required by Three.js FileLoader / GLTFLoader)
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

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
