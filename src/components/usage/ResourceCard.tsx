/**
 * ResourceCard — per-resource usage card.
 * Shows icon, label, used/limit, progress bar, remaining count, and status badge.
 * Color scheme derived from usage percentage via theme helpers.
 */

import type { Resource } from "../../config/usage-config";
import { getStatusColor } from "../../config/theme";
import type { ThemeMode } from "../../config/theme";
import { ProgressBar } from "../ui/ProgressBar";
import { StatusBadge } from "../ui/Badge";

interface ResourceCardProps {
  resource:   Resource;
  mode:       ThemeMode;
  simulating: boolean;
}

export function ResourceCard({ resource, mode, simulating }: ResourceCardProps) {
  const pct       = Math.min((resource.used / resource.limit) * 100, 100);
  const status    = getStatusColor(pct, mode);
  const remaining = Math.max(resource.limit - resource.used, 0);
  const isCritical = pct >= 90;

  return (
    <section
      aria-label={`${resource.label} usage`}
      className={[
        "relative overflow-hidden rounded-lg p-5",
        "transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Border: accent-tinted when critical, subtle otherwise
        isCritical ? "border" : "border border-pplx-border",
      ].join(" ")}
      style={{
        background:  mode === "dark" ? "#242424" : "#FFFFFF",
        borderColor: isCritical ? `${status.color}40` : undefined,
        boxShadow:   isCritical ? `0 0 20px ${status.glow}` : (mode === "dark" ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.06)"),
      }}
    >
      {/* Critical top glow bar */}
      {isCritical && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${status.color}, transparent)`,
            animation:  simulating ? "pulseGlow 2s ease-in-out infinite" : "none",
          }}
        />
      )}

      {/* Header: icon + label + status badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" role="img" aria-label={resource.label}>
            {resource.icon}
          </span>
          <div>
            <p className="text-sm font-semibold leading-none" style={{ color: mode === "dark" ? "#FFFFFF" : "#1A1A1A" }}>
              {resource.label}
            </p>
            <p className="text-[11px] font-mono mt-1" style={{ color: mode === "dark" ? "#808080" : "#999999" }}>
              Resets in {resource.resetDays}d
            </p>
          </div>
        </div>
        <StatusBadge pct={pct} />
      </div>

      {/* Counter: used / limit */}
      <div className="flex items-baseline gap-1.5 mb-2.5">
        <span
          className="text-[28px] font-bold font-mono leading-none tracking-[-1px]"
          style={{ color: mode === "dark" ? "#FFFFFF" : "#1A1A1A" }}
        >
          {resource.used}
        </span>
        <span className="text-sm font-mono" style={{ color: mode === "dark" ? "#808080" : "#999999" }}>
          / {resource.limit}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={pct}
        color={status.color}
        glow={status.glow}
        pulse={simulating && isCritical}
        className="mb-2.5"
      />

      {/* Footer: remaining + percentage */}
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: mode === "dark" ? "#B8B8B8" : "#6B6B6B" }}>
          <strong style={{ color: remaining <= 5 ? status.color : (mode === "dark" ? "#FFFFFF" : "#1A1A1A") }}>
            {remaining}
          </strong>{" "}
          remaining
        </span>
        <span className="text-xs font-mono" style={{ color: mode === "dark" ? "#808080" : "#999999" }}>
          {pct.toFixed(0)}%
        </span>
      </div>
    </section>
  );
}
