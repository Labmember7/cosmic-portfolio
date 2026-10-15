import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Interstellar-inspired ambient organ pad, fully synthesized in the browser.
 * Uses the WebAudio API — no asset, no network, no license issue.
 *
 * Signature chord progression (Hans Zimmer / "Stay" / "Cornfield Chase" vibe):
 *   Am  -  F  -  C  -  G   (8 bars each, very slow)
 */

const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

const CHORDS: number[][] = [
  [N(57), N(60), N(64)], // Am
  [N(53), N(57), N(60)], // F
  [N(60), N(64), N(67)], // C
  [N(55), N(59), N(62)], // G
];

const CHORD_DURATION = 8;

export function useSpaceMusic() {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState(0.4);

  // Persistent across the component's life — never torn down by StrictMode.
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const scheduleChord = useCallback(
    (freqs: number[], at: number, duration: number) => {
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (!ctx || !master) return;

      const chordGain = ctx.createGain();
      chordGain.gain.setValueAtTime(0, at);
      chordGain.gain.linearRampToValueAtTime(0.9, at + 2.0);
      chordGain.gain.linearRampToValueAtTime(0.7, at + duration - 1.5);
      chordGain.gain.linearRampToValueAtTime(0, at + duration);
      chordGain.connect(master);

      freqs.forEach((f, i) => {
        [1, 2].forEach((mult, j) => {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.setValueAtTime(f * mult, at);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.18 / (j + 1) / freqs.length, at);
          o.connect(g).connect(chordGain);
          o.start(at);
          o.stop(at + duration + 0.2);
        });
        const saw = ctx.createOscillator();
        saw.type = "sawtooth";
        saw.frequency.setValueAtTime(f * 0.5, at);
        saw.detune.setValueAtTime(i * 4 - 4, at);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.04 / freqs.length, at);
        saw.connect(sg).connect(chordGain);
        saw.start(at);
        saw.stop(at + duration + 0.2);
      });
    },
    [],
  );

  // Synchronous bootstrap so the AudioContext is created inside the user-gesture
  // microtask (otherwise some browsers leave it suspended forever).
  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0; // silent until enabled
    masterRef.current = master;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    lp.Q.value = 0.7;

    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.45;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.5;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;

    master.connect(lp);
    lp.connect(ctx.destination);
    lp.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);

    return ctx;
  }, []);

  const startScheduler = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (timerRef.current !== null) return; // already running

    let chordIndex = 0;
    let nextTime = ctx.currentTime + 0.15;
    const tick = () => {
      if (!ctxRef.current) return;
      const lookahead = ctxRef.current.currentTime + 12;
      while (nextTime < lookahead) {
        scheduleChord(CHORDS[chordIndex % CHORDS.length], nextTime, CHORD_DURATION);
        nextTime += CHORD_DURATION;
        chordIndex++;
      }
    };
    tick();
    timerRef.current = window.setInterval(tick, 4000);
  }, [scheduleChord]);

  const stopScheduler = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggle = useCallback(async () => {
    const ctx = ensureContext();
    if (!ctx || !masterRef.current) return;

    if (enabled) {
      // Fade out and pause the scheduler. Keep ctx alive for instant resume.
      const now = ctx.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
      masterRef.current.gain.linearRampToValueAtTime(0, now + 1.0);
      window.setTimeout(stopScheduler, 1100);
      setEnabled(false);
    } else {
      // CRITICAL: resume inside the user-gesture microtask, before any await,
      // so autoplay policies don't leave us suspended.
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch (e) {
          console.error("[useSpaceMusic] resume failed", e);
        }
      }
      const now = ctx.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(0, now);
      masterRef.current.gain.linearRampToValueAtTime(volumeRef.current, now + 2.0);
      startScheduler();
      setEnabled(true);
    }
  }, [enabled, ensureContext, startScheduler, stopScheduler]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (masterRef.current && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.linearRampToValueAtTime(v, now + 0.15);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScheduler();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
        masterRef.current = null;
      }
    };
  }, [stopScheduler]);

  return { enabled, toggle, volume, setVolume };
}
