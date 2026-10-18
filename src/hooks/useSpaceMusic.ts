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

  const warpGainRef = useRef<GainNode | null>(null);
  const warpOscsRef = useRef<OscillatorNode[]>([]);

  const setRiftActive = useCallback((active: boolean) => {
    const ctx = ensureContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (active) {
      if (!warpGainRef.current) {
        const wg = ctx.createGain();
        wg.gain.setValueAtTime(0, now);

        if (masterRef.current) {
          wg.connect(masterRef.current);
        } else {
          wg.connect(ctx.destination);
        }
        warpGainRef.current = wg;

        // Sub-bass resonance (deep warp core hum: 52Hz + 55.5Hz gentle binaural thrum)
        const sub1 = ctx.createOscillator();
        sub1.type = "sine";
        sub1.frequency.setValueAtTime(52, now);

        const sub2 = ctx.createOscillator();
        sub2.type = "sine";
        sub2.frequency.setValueAtTime(55.5, now);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.32, now);
        sub1.connect(subGain);
        sub2.connect(subGain);
        subGain.connect(wg);

        // Harmonic shimmer (slipstream atmosphere)
        const saw = ctx.createOscillator();
        saw.type = "triangle";
        saw.frequency.setValueAtTime(104, now);

        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(880, now);
        bp.Q.setValueAtTime(2.8, now);

        const sawGain = ctx.createGain();
        sawGain.gain.setValueAtTime(0.06, now);
        saw.connect(bp).connect(sawGain).connect(wg);

        sub1.start(now);
        sub2.start(now);
        saw.start(now);
        warpOscsRef.current = [sub1, sub2, saw];
      }

      if (warpGainRef.current) {
        warpGainRef.current.gain.cancelScheduledValues(now);
        warpGainRef.current.gain.setValueAtTime(warpGainRef.current.gain.value, now);
        warpGainRef.current.gain.linearRampToValueAtTime(0.42 * (volumeRef.current || 0.4), now + 1.6);
      }

      // Celestial entry chime (D-maj9 / celestial open harmony)
      const chord = [N(62), N(66), N(69), N(73), N(76)];
      chord.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.07);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.07 / chord.length, now + 0.2 + idx * 0.07);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
        osc.connect(g);
        if (masterRef.current) g.connect(masterRef.current);
        else g.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + 4.0);
      });
    } else {
      if (warpGainRef.current) {
        warpGainRef.current.gain.cancelScheduledValues(now);
        warpGainRef.current.gain.setValueAtTime(warpGainRef.current.gain.value, now);
        warpGainRef.current.gain.linearRampToValueAtTime(0, now + 1.4);
      }
    }
  }, [ensureContext]);

  const playLaunchSound = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Sub-bass engine ignition rumble (38Hz -> 75Hz sweep)
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(38, now);
    sub.frequency.exponentialRampToValueAtTime(75, now + 1.2);
    sub.frequency.exponentialRampToValueAtTime(45, now + 2.8);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.45 * (volumeRef.current || 0.4), now + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 3.2);

    // Thruster roar: filtered noise approximation with multiple detuned saws
    [110, 165, 220].forEach((baseFreq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.detune.setValueAtTime((i - 1) * 15, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.6);
      filter.frequency.exponentialRampToValueAtTime(200, now + 2.5);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.08 * (volumeRef.current || 0.4), now + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(filter).connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
    });

    // High shimmer / celestial warp flash
    [N(67), N(71), N(74), N(79)].forEach((f, idx) => {
      const chime = ctx.createOscillator();
      chime.type = "sine";
      chime.frequency.setValueAtTime(f, now + 0.2 + idx * 0.08);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0, now + 0.2 + idx * 0.08);
      cg.gain.linearRampToValueAtTime(0.06, now + 0.35 + idx * 0.08);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      chime.connect(cg).connect(ctx.destination);
      chime.start(now + 0.2 + idx * 0.08);
      chime.stop(now + 2.5);
    });
  }, [ensureContext]);

  const playBootChime = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    [N(60), N(64), N(67), N(72)].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, now + i * 0.06);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.06);
      g.gain.linearRampToValueAtTime(0.05, now + i * 0.06 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.8);
      o.connect(g).connect(ctx.destination);
      o.start(now + i * 0.06);
      o.stop(now + i * 0.06 + 0.9);
    });
  }, [ensureContext]);

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
      warpOscsRef.current.forEach((o) => {
        try {
          o.stop();
        } catch {}
      });
      warpOscsRef.current = [];
      warpGainRef.current = null;
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
        masterRef.current = null;
      }
    };
  }, [stopScheduler]);

  return {
    enabled,
    toggle,
    volume,
    setVolume,
    setRiftActive,
    playLaunchSound,
    playBootChime,
  };
}
