/**
 * App.tsx — root shell.
 * Header simulates Perplexity's top nav: logo + wordmark + Settings breadcrumb.
 * Controls: lang toggle, theme toggle, plan badge.
 */

import { useState } from "react";
import type { ThemeMode } from "./config/theme";
import { colors } from "./config/theme";
import { t } from "./config/i18n";
import { PrototypeBadge } from "./components/ui/Badge";
import { UsageDashboard } from "./components/usage/UsageDashboard";
import { useLanguage } from "./hooks/useLanguage";

export default function App() {
  const [mode, setMode]      = useState<ThemeMode>("dark");
  const { lang, toggleLang } = useLanguage();

  const isDark  = mode === "dark";
  const tr      = t(lang);
  const c       = colors[mode];

  const toggleTheme = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <div
      className={mode}
      style={{
        minHeight:  "100vh",
        background: c.level0,
        color:      c.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        transition: "background 300ms ease, color 300ms ease",
      }}
    >
      {/* ── Sticky Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex justify-between items-center
                   px-4 py-2.5 sm:px-6 sm:py-3"
        style={{
          borderBottom:   `1px solid ${c.border}`,
          backdropFilter: "blur(12px)",
          background:     isDark ? "rgba(12,12,12,0.88)" : "rgba(255,255,255,0.92)",
        }}
      >
        {/* ── Left: Perplexity logo + breadcrumb ─────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Perplexity logo (real SVG from /public/favicon.svg) */}
          <img
            src="/favicon.svg"
            alt="Perplexity"
            className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0"
            style={{ filter: isDark ? "none" : "none" }}
          />

          {/* Wordmark + breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* "Perplexity" wordmark — hidden on xs to save space */}
            <span
              className="hidden xs:inline text-sm sm:text-[15px] font-semibold tracking-[-0.3px] whitespace-nowrap"
              style={{ color: c.text }}
            >
              Perplexity
            </span>

            {/* Separator */}
            <span
              className="hidden xs:inline text-sm font-light"
              style={{ color: c.textMuted }}
              aria-hidden="true"
            >
              /
            </span>

            {/* Settings label */}
            <span
              className="hidden sm:inline text-sm font-normal whitespace-nowrap"
              style={{ color: c.textMuted }}
            >
              Settings
            </span>

            <span
              className="hidden sm:inline text-sm font-light"
              style={{ color: c.textMuted }}
              aria-hidden="true"
            >
              /
            </span>

            {/* Current page — always visible */}
            <span
              className="text-sm sm:text-[15px] font-semibold whitespace-nowrap"
              style={{ color: c.text }}
            >
              {lang === "en" ? "Usage" : "Uso"}
            </span>

            {/* PROTOTYPE badge */}
            <span className="hidden sm:inline-flex ml-1">
              <PrototypeBadge />
            </span>
          </div>
        </div>

        {/* ── Right: controls ────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            aria-label={`Switch language to ${lang === "en" ? "Spanish" : "English"}`}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono
                       transition-all duration-150 border"
            style={{
              borderColor: c.border,
              background:  c.level2,
              color:       c.cyan,
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
              borderColor: c.border,
              background:  c.level2,
              color:       c.textSecondary,
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
              color:      c.cyan,
            }}
          >
            <span className="sm:hidden">Pro</span>
            <span className="hidden sm:inline">{tr.planBadge}</span>
          </div>
        </div>
      </header>

      {/* ── Page title (simulates the Settings page heading) ───────── */}
      <div
        className="max-w-[860px] mx-auto px-3 pt-6 pb-0 sm:px-5 sm:pt-8"
        style={{ borderBottom: `1px solid ${c.borderSubtle}` }}
      >
        <div className="flex items-end justify-between pb-4">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold tracking-[-0.5px] mb-1"
              style={{ color: c.text }}
            >
              {lang === "en" ? "Usage" : "Uso"}
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: c.textMuted }}>
              {lang === "en"
                ? "Track your resource consumption across the current billing period."
                : "Seguí tu consumo de recursos durante el período de facturación actual."}
            </p>
          </div>
        </div>

        {/* Info banner — mimics the Perplexity help center note */}
        <div
          className="flex items-center gap-2 py-2.5 px-3 rounded-lg mb-4 text-xs"
          style={{
            background:  isDark ? "rgba(32,184,205,0.08)" : "rgba(32,184,205,0.06)",
            borderLeft:  `2px solid ${c.cyan}`,
            color:        c.textSecondary,
          }}
        >
          <span style={{ color: c.cyan }}>ℹ</span>
          {lang === "en"
            ? "Usage data is approximate and limits may change without notice."
            : "Los datos de uso son aproximados y los límites pueden cambiar sin previo aviso."}
        </div>
      </div>

      {/* ── Dashboard ─────────────────────────────────────────────── */}
      <main>
        <UsageDashboard mode={mode} lang={lang} />
      </main>
    </div>
  );
}
