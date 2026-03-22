import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark mode surfaces
        "pplx-bg":           "#0C0C0C",
        "pplx-surface-1":   "#1A1A1A",
        "pplx-surface-2":   "#242424",
        "pplx-surface-3":   "#2A2A2A",
        "pplx-surface-4":   "#3A3A3A",
        "pplx-surface-5":   "#404040",

        // Dark mode borders
        "pplx-border":       "#3A3A3A",
        "pplx-border-subtle":"#2E2E2E",

        // Dark mode text
        "pplx-text":         "#FFFFFF",
        "pplx-text-2":       "#B8B8B8",
        "pplx-text-muted":   "#808080",
        "pplx-text-hint":    "#666666",

        // Light mode surfaces
        "pplx-light-bg":     "#FFFFFF",
        "pplx-light-s1":     "#F7F7F8",
        "pplx-light-s2":     "#ECECED",
        "pplx-light-border": "#E5E5E5",
        "pplx-light-border-subtle": "#F0F0F0",

        // Light mode text
        "pplx-light-text":   "#1A1A1A",
        "pplx-light-text-2": "#6B6B6B",
        "pplx-light-text-muted": "#999999",

        // Accent
        "pplx-cyan":         "#20B8CD",
        "pplx-cyan-hover":   "#1AA3B5",
        "pplx-peach":        "#F5C1A9",

        // Semantic
        "pplx-danger":       "#EF4444",
        "pplx-warning":      "#F59E0B",
        "pplx-success":      "#10B981",
      },
      fontFamily: {
        sans:  ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono:  ['"SF Mono"', "SFMono-Regular", "ui-monospace", "Menlo", "monospace"],
      },
      fontSize: {
        xs:   ["0.75rem",  { lineHeight: "1rem" }],
        sm:   ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem",     { lineHeight: "1.5rem" }],
        lg:   ["1.125rem", { lineHeight: "1.75rem" }],
        xl:   ["1.25rem",  { lineHeight: "1.75rem" }],
        "2xl":["1.5rem",   { lineHeight: "2rem" }],
        "3xl":["1.875rem", { lineHeight: "2.25rem" }],
        "4xl":["2.25rem",  { lineHeight: "2.5rem" }],
        "5xl":["3rem",     { lineHeight: "1" }],
      },
      borderRadius: {
        sm:  "4px",
        DEFAULT: "5px",
        md:  "8px",
        lg:  "12px",
        xl:  "16px",
        full:"9999px",
      },
      spacing: {
        "sidebar": "260px",
        "content": "42rem",
      },
      maxWidth: {
        content: "42rem",
      },
      height: {
        "search-bar": "48px",
        "btn": "40px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      boxShadow: {
        "pplx-focus":  "0 0 0 2px rgba(245, 193, 169, 0.2)",
        "pplx-card-dark": "0 1px 3px rgba(0,0,0,0.4)",
        "pplx-card-light": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease",
        "pulse-slow": "pulse 2s ease-in-out infinite",
        "count-up": "countUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        countUp: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [],
};

export default config;
