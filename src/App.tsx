/**
 * App.tsx — root shell.
 * Manages theme + language state.
 * Header: responsive (mobile compact), theme toggle, lang toggle, plan badge.
 */

import { useState } from "react";
import type { ThemeMode } from "./config/theme";
import { colors } from "./config/theme";
import { t } from "./config/i18n";
import { PrototypeBadge } from "./components/ui/Badge";
import { UsageDashboard } from "./components/usage/UsageDashboard";
import { useLanguage } from "./hooks/useLanguage";

export default function App() {
  const [mode, setMode]     = useState<ThemeMode>("dark");
  const { lang, toggleLang } = useLanguage();

  const isDark = mode === "dark";
  const tr     = t(lang);
  const colors_ = colors[mode];

  const toggleTheme = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <div
      className={mode}
      style={{
        minHeight:  "100vh",
        background: colors_.level0,
        color:      colors_.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        transition: "background 300ms ease, color 300ms ease",
      }}
    >
      {/* ── Sticky Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex justify-between items-center
                   px-4 py-3 sm:px-7 sm:py-4"
        style={{
          borderBottom:   `1px solid ${colors_.border}`,
          backdropFilter: "blur(12px)",
          background:     isDark ? "rgba(12,12,12,0.85)" : "rgba(255,255,255,0.90)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="text-base sm:text-[22px] font-bold tracking-[-0.5px] whitespace-nowrap"
            style={{ color: colors_.text }}
          >
            <span style={{ color: colors_.cyan }}>⟡</span>
            <span className="hidden xs:inline"> {tr.headerTitle}</span>
            <span className="inline xs:hidden"> Usage</span>
          </div>
          <span className="hidden sm:inline-flex">
            <PrototypeBadge />
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            aria-label={`Switch language to ${lang === "en" ? "Spanish" : "English"}`}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono
                       transition-all duration-150 border"
            style={{
              borderColor: colors_.border,
              background:  colors_.level2,
              color:       colors_.cyan,
            }}
          >
            {tr.langToggle}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 rounded-lg
                       text-xs font-medium transition-all duration-150 border"
            style={{
              borderColor: colors_.border,
              background:  colors_.level2,
              color:       colors_.textSecondary,
            }}
          >
            <span>{isDark ? "☀" : "●"}</span>
            <span className="hidden sm:inline">
              {isDark ? tr.themeLight : tr.themeDark}
            </span>
          </button>

          {/* Plan badge */}
          <div
            className="px-2.5 py-1.5 sm:px-3.5 rounded-lg text-xs font-semibold font-mono whitespace-nowrap"
            style={{
              background: isDark ? "rgba(32,184,205,0.15)" : "rgba(32,184,205,0.10)",
              color:      colors_.cyan,
            }}
          >
            <span className="sm:hidden">Pro</span>
            <span className="hidden sm:inline">{tr.planBadge}</span>
          </div>
        </div>
      </header>

      {/* ── Dashboard ─────────────────────────────────────────────── */}
      <main>
        <UsageDashboard mode={mode} lang={lang} />
      </main>
    </div>
  );
}
