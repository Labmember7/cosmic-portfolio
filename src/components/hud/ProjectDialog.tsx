import React, { useEffect } from "react";
import type { Project } from "../../content/portfolio";

interface ProjectDialogProps {
  project: Project | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  project,
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

  if (!project) return null;

  const color = project.color || "#00f3ff";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.name}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border neo-surface-cyan p-6 md:p-8 backdrop-blur-xl transition-all"
        style={{
          borderColor: `${color}44`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle accent corner highlight */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-20"
          style={{ background: color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full animate-pulse shadow-sm"
              style={{ background: color, boxShadow: `0 0 10px ${color}` }}
            />
            <p className="text-[11px] font-mono uppercase tracking-[0.25em]" style={{ color }}>
              PROJECT DOSSIER // DEPLOYED
            </p>
          </div>
          <button
            id="close-project-modal-btn"
            onClick={onClose}
            className="rounded-xl neo-btn p-2 text-white/50 hover:text-white transition cursor-pointer"
            aria-label="Close project modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mt-5">
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">
            {project.name}
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: `${color}cc` }}>
            {project.desc}
          </p>
            <div className="mt-4 rounded-xl neo-inset border border-white/10 p-4.5">
              <p className="text-[14px] leading-relaxed text-white/80 whitespace-pre-line font-sans">
                {project.details}
              </p>
            </div>
          </div>

          {/* Tech Stack Badges */}
          <div className="mt-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
              TECHNOLOGY STACK
            </p>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg neo-inset border px-3 py-1 text-[11px] font-mono tracking-wide"
                  style={{
                    borderColor: `${color}44`,
                    color: color,
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Footer controls if prev/next present */}
          {(onPrev || onNext) && (
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex gap-2">
                {onPrev && (
                  <button
                    onClick={onPrev}
                    className="rounded-xl neo-btn border border-white/20 px-3.5 py-1.5 text-xs text-white/70 hover:text-white transition cursor-pointer font-mono"
                  >
                    ← Previous
                  </button>
                )}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="rounded-xl neo-btn border border-white/20 px-3.5 py-1.5 text-xs text-white/70 hover:text-white transition cursor-pointer font-mono"
                  >
                    Next →
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl neo-btn-cyan px-5 py-2 text-xs font-semibold text-black transition hover:opacity-95 cursor-pointer font-mono shadow-md"
                style={{ background: color }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
      );
};
