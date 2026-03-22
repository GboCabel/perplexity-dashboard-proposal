/**
 * AlertBanner — shown when one or more resources are at ≥90% usage.
 * Lists the affected resource labels and prompts the user to upgrade or pace usage.
 */

import type { Resource } from "../../config/usage-config";
import type { ThemeMode } from "../../config/theme";
import { t, type Lang } from "../../config/i18n";

interface AlertBannerProps {
  criticalResources: Resource[];
  mode: ThemeMode;
  lang: Lang;
}

export function AlertBanner({ criticalResources, mode, lang }: AlertBannerProps) {
  if (criticalResources.length === 0) return null;

  const isDark      = mode === "dark";
  const tr          = t(lang);
  const dangerColor = "#EF4444";
  const dangerGlow  = isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)";
  const textColor   = isDark ? "#B8B8B8" : "#6B6B6B";
  const labelList   = criticalResources.map((r) => r.label).join(", ");

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg px-4 py-3.5 mb-6 border"
      style={{ background: dangerGlow, borderColor: `${dangerColor}30` }}
    >
      <span className="text-lg mt-px" aria-hidden="true">⚠️</span>
      <div>
        <p className="text-sm font-semibold leading-none mb-1" style={{ color: dangerColor }}>
          {tr.alertTitle}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: textColor }}>
          {tr.alertBody(labelList)}
        </p>
      </div>
    </div>
  );
}
