/**
 * ProgressBar — Perplexity-styled progress bar.
 * Framer Motion spring animates the fill width on mount and value change.
 */

import { motion } from "framer-motion";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Override fill color (hex). Defaults to cyan → warning → danger by value. */
  color?: string;
  /** Glow color (rgba). Optional. */
  glow?: string;
  /** Whether to pulse the glow (used on critical resources during simulation). */
  pulse?: boolean;
  className?: string;
}

export function ProgressBar({ value, color, glow, pulse = false, className = "" }: ProgressBarProps) {
  const clamped      = Math.min(Math.max(value, 0), 100);
  const derivedColor = color ?? deriveColor(clamped);
  const derivedGlow  = glow  ?? deriveGlow(clamped);

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={["h-2 rounded-full overflow-hidden bg-[#2E2E2E]", className].join(" ")}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{
          type:      "spring",
          stiffness: 80,
          damping:   18,
          mass:      0.8,
        }}
        style={{
          background: clamped >= 90
            ? `linear-gradient(90deg, ${derivedColor}CC, ${derivedColor})`
            : `linear-gradient(90deg, ${derivedColor}99, ${derivedColor})`,
          boxShadow:  clamped >= 70 ? `0 0 8px ${derivedGlow}` : "none",
          animation:  pulse && clamped >= 90 ? "pulseGlow 2s ease-in-out infinite" : "none",
        }}
      />
    </div>
  );
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function deriveColor(pct: number): string {
  if (pct >= 90) return "#EF4444";
  if (pct >= 70) return "#F59E0B";
  return "#20B8CD";
}

function deriveGlow(pct: number): string {
  if (pct >= 90) return "rgba(239, 68, 68, 0.25)";
  if (pct >= 70) return "rgba(245, 158, 11, 0.25)";
  return "rgba(32, 184, 205, 0.25)";
}
