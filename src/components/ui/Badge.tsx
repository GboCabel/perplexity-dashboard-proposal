/**
 * Badge — small label chip used for status, plan tier, and "PROTOTYPE" tag.
 * Perplexity style: mono font, uppercase, subtle background tint.
 */

interface BadgeProps {
  label: string;
  /** Color of text + border + background tint. */
  color?: string;
  /** Explicit background (rgba). Defaults to color + 15% opacity. */
  background?: string;
  className?: string;
}

export function Badge({ label, color = "#20B8CD", background, className = "" }: BadgeProps) {
  const bg = background ?? hexToRgba(color, 0.12);

  return (
    <span
      className={[
        "inline-flex items-center",
        "px-2 py-0.5 rounded",
        "text-[10px] font-semibold font-mono uppercase tracking-[0.5px]",
        "leading-none",
        className,
      ].join(" ")}
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

// ─── Semantic presets ───────────────────────────────────────────────────────

interface StatusBadgeProps {
  /** 0–100 usage percentage */
  pct: number;
  className?: string;
}

/** Badge that derives color and label automatically from usage percentage. */
export function StatusBadge({ pct, className }: StatusBadgeProps) {
  if (pct >= 90) return <Badge label="Critical" color="#EF4444" className={className} />;
  if (pct >= 70) return <Badge label="High"     color="#F59E0B" className={className} />;
  return               <Badge label="Normal"   color="#20B8CD" className={className} />;
}

/** "PROTOTYPE" badge shown in the header. */
export function PrototypeBadge() {
  return <Badge label="PROTOTYPE" color="#20B8CD" />;
}

// ─── Helper ────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
