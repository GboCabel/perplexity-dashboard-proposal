/**
 * Perplexity Design System — TypeScript Design Tokens
 * Single source of truth for all design values used in components.
 * Colors must be consumed through Tailwind classes; these constants
 * are only for SVG/canvas elements that can't use class-based styling.
 */

// ─── Color Palette ─────────────────────────────────────────────────────────

export const colors = {
  dark: {
    // Layered surfaces (subway escalandivant depth)
    level0:        "#0C0C0C",
    level1:        "#1A1A1A",
    level2:        "#242424",
    level3:        "#2A2A2A",
    level4:        "#3A3A3A",
    level5:        "#404040",

    // Borders
    border:        "#3A3A3A",
    borderSubtle:  "#2E2E2E",

    // Text scale
    text:          "#FFFFFF",
    textSecondary: "#B8B8B8",
    textMuted:     "#808080",
    textHint:      "#666666",

    // Accent
    cyan:          "#20B8CD",
    cyanHover:     "#1AA3B5",
    cyanGlow:      "rgba(32, 184, 205, 0.15)",
    peach:         "#F5C1A9",
    peachGlow:     "rgba(245, 193, 169, 0.2)",

    // Semantic
    danger:        "#EF4444",
    dangerGlow:    "rgba(239, 68, 68, 0.15)",
    warning:       "#F59E0B",
    warningGlow:   "rgba(245, 158, 11, 0.15)",
    success:       "#10B981",
    successGlow:   "rgba(16, 185, 129, 0.15)",

    // Chart lines (maps to resource order)
    chart: ["#20B8CD", "#7C6AFF", "#EF4444", "#F59E0B"] as const,

    // Shadows
    cardShadow:    "0 1px 3px rgba(0,0,0,0.4)",
  },

  light: {
    level0:        "#FFFFFF",
    level1:        "#F7F7F8",
    level2:        "#ECECED",
    level3:        "#E5E5E5",
    level4:        "#D5D5D5",
    level5:        "#C5C5C5",

    border:        "#E5E5E5",
    borderSubtle:  "#F0F0F0",

    text:          "#1A1A1A",
    textSecondary: "#6B6B6B",
    textMuted:     "#999999",
    textHint:      "#BBBBBB",

    cyan:          "#20B8CD",
    cyanHover:     "#1AA3B5",
    cyanGlow:      "rgba(32, 184, 205, 0.10)",
    peach:         "#F5C1A9",
    peachGlow:     "rgba(245, 193, 169, 0.2)",

    danger:        "#EF4444",
    dangerGlow:    "rgba(239, 68, 68, 0.10)",
    warning:       "#F59E0B",
    warningGlow:   "rgba(245, 158, 11, 0.10)",
    success:       "#10B981",
    successGlow:   "rgba(16, 185, 129, 0.10)",

    chart: ["#20B8CD", "#7C6AFF", "#EF4444", "#F59E0B"] as const,

    cardShadow:    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  },
} as const;

export type ThemeMode = "dark" | "light";
export type ThemeColors = typeof colors.dark | typeof colors.light;

// ─── Typography ────────────────────────────────────────────────────────────

export const typography = {
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace",
  baseSize:  "16px",
} as const;

// ─── Spacing & Sizing ──────────────────────────────────────────────────────

export const sizing = {
  searchBarHeight: "48px",
  searchBtnSize:   "50px",
  buttonHeight:    "40px",
  sidebarWidth:    "260px",
  contentMaxWidth: "42rem",
  cardPadding:     "20px",
  cardRadius:      "8px",
  inputRadius:     "5px",
} as const;

// ─── Animation ─────────────────────────────────────────────────────────────

export const animation = {
  duration:   "150ms",
  durationMd: "300ms",
  easing:     "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// ─── Helper: get theme colors by mode ──────────────────────────────────────

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return colors[mode];
}

/** Returns the status color + glow for a given usage percentage */
export function getStatusColor(pct: number, mode: ThemeMode) {
  const t = colors[mode];
  if (pct >= 90) return { color: t.danger,  glow: t.dangerGlow,  label: "Critical" } as const;
  if (pct >= 70) return { color: t.warning, glow: t.warningGlow, label: "High"     } as const;
  return           { color: t.cyan,    glow: t.cyanGlow,    label: "Normal"   } as const;
}
