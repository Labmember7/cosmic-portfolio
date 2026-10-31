import React, { useEffect } from "react";
import type { Achievement } from "../../content/portfolio";

interface AchievementDialogProps {
  achievement: Achievement | null;
  currentIndex: number | null;
  totalCount: number;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const AchievementDialog: React.FC<AchievementDialogProps> = ({
  achievement,
  currentIndex,
  totalCount,
  onClose,
  onNext,
  onPrev,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (!achievement) return null;

  const color = achievement.color ?? "#ffd27a";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={achievement.name}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border bg-[#0b081c]/95 p-6 md:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all"
        style={{
          borderColor: `${color}44`,
          boxShadow: `0 0 50px ${color}15, 0 25px 60px rgba(0,0,0,0.85)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle accent glow */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-20"
          style={{ background: color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold shadow-inner"
              style={{
                borderColor: `${color}88`,
                color,
                background: `${color}15`,
              }}
            >
              {achievement.icon ?? "✦"}
            </span>
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-[0.25em]"
                style={{ color }}
              >
                PANTHEON // VERIFIED HONORS
              </p>
              <p className="text-[11px] font-mono text-white/50 tracking-wider">
                STATUS: CONFIRMED CREDENTIAL
              </p>
            </div>
          </div>
          <button
            id="close-achievement-modal-btn"
            aria-label="Close honors dossier modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title & Metadata */}
        <div className="mt-5">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white leading-tight">
            {achievement.name}
          </h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            {achievement.issuer && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white/80 font-mono">
                ISSUER: <strong className="text-white font-semibold">{achievement.issuer}</strong>
              </span>
            )}
            {achievement.year && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white/80 font-mono">
                YEAR: <strong style={{ color }}>{achievement.year}</strong>
              </span>
            )}
            {currentIndex !== null && totalCount > 0 && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white/50 font-mono ml-auto">
                {currentIndex + 1} / {totalCount}
              </span>
            )}
          </div>
        </div>

        {/* Description / Dossier */}
        <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2 font-mono">
            // MILESTONE SUMMARY
          </p>
          <p className="text-[14px] leading-relaxed text-white/85 whitespace-pre-line font-sans">
            {achievement.description ??
              `Official credential recognized in ${achievement.year ?? "the archives"} by ${
                achievement.issuer ?? "accrediting body"
              }. Demonstrates advanced applied engineering mastery and autonomous systems execution.`}
          </p>
        </div>

        {/* Navigation & Done Button */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <div className="flex gap-2">
            {onPrev && (
              <button
                onClick={onPrev}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-white/70 hover:border-white/50 hover:text-white transition font-mono"
              >
                ← Prev Honor
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-white/70 hover:border-white/50 hover:text-white transition font-mono"
              >
                Next Honor →
              </button>
            )}
          </div>

          <button
            id="achievement-done-btn"
            aria-label="Done inspecting honor"
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 font-semibold text-black transition hover:opacity-90 font-mono"
            style={{
              background: color,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

