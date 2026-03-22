/**
 * UsageSummary — billing period info bar + simulation controls.
 * Sits above the ResourceCard grid in the Overview tab.
 */

import type { ThemeMode } from "../../config/theme";
import { t, type Lang } from "../../config/i18n";
import { BILLING } from "../../config/usage-config";

interface UsageSummaryProps {
  mode:       ThemeMode;
  lang:       Lang;
  simulating: boolean;
  onSimulate: () => void;
  onReset:    () => void;
}

export function UsageSummary({ mode, lang, simulating, onSimulate, onReset }: UsageSummaryProps) {
  const isDark = mode === "dark";
  const tr     = t(lang);

  const textPrimary  = isDark ? "#FFFFFF"  : "#1A1A1A";
  const textMuted    = isDark ? "#808080"  : "#999999";
  const accentCyan   = "#20B8CD";
  const accentGlow   = isDark ? "rgba(32,184,205,0.15)" : "rgba(32,184,205,0.10)";
  const dangerColor  = "#EF4444";
  const dangerGlow   = isDark ? "rgba(239,68,68,0.15)"  : "rgba(239,68,68,0.10)";
  const borderColor  = isDark ? "#3A3A3A"  : "#E5E5E5";
  const surfaceColor = isDark ? "#242424"  : "#FFFFFF";

  return (
    <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
      {/* Billing info */}
      <div className="flex items-center gap-3.5">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.5px] leading-none mb-1" style={{ color: textMuted }}>
            {tr.billingPeriod}
          </p>
          <p className="text-sm font-semibold" style={{ color: textPrimary }}>
            {BILLING.periodLabel}
          </p>
        </div>

        <div className="w-px h-8" style={{ background: borderColor }} aria-hidden="true" />

        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.5px] leading-none mb-1" style={{ color: textMuted }}>
            {tr.nextReset}
          </p>
          <p className="text-sm font-semibold" style={{ color: accentCyan }}>
            {tr.nextResetValue(BILLING.nextReset)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={onSimulate}
          aria-pressed={simulating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{
            border:     `1px solid ${simulating ? dangerColor + "60" : accentCyan + "60"}`,
            background: simulating ? dangerGlow : accentGlow,
            color:      simulating ? dangerColor : accentCyan,
          }}
        >
          <span aria-hidden="true">{simulating ? "⏸" : "▶"}</span>
          {simulating ? tr.btnSimulating : tr.btnSimulate}
        </button>

        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 border"
          style={{ borderColor, background: "transparent", color: isDark ? "#B8B8B8" : "#6B6B6B" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = surfaceColor; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          ↺ {tr.btnReset}
        </button>
      </div>
    </div>
  );
}
