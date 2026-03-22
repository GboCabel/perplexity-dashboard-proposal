/**
 * i18n — translations for EN / ES.
 * Flat key-value structure; no nested objects to keep lookups simple.
 * All UI strings live here. Data labels (resource names, plan names) are
 * kept in usage-config.ts and are intentionally not translated (proper nouns).
 */

export type Lang = "en" | "es";

export type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    // ── Header ──────────────────────────────────────────────────────
    headerTitle:       "Usage Dashboard",
    headerBadge:       "PROTOTYPE",
    planBadge:         "Pro Plan",
    themeLight:        "Light",
    themeDark:         "Dark",
    langToggle:        "ES",

    // ── Tabs ────────────────────────────────────────────────────────
    tabOverview:       "Usage Overview",
    tabHistory:        "History",
    tabPlans:          "Plans",
    tabsAriaLabel:     "Dashboard sections",

    // ── Usage Summary ────────────────────────────────────────────────
    billingPeriod:     "Billing Period",
    nextReset:         "Next Reset",
    nextResetValue:    (days: number) => `${days} days`,
    btnSimulate:       "Simulate Usage",
    btnSimulating:     "Simulating…",
    btnReset:          "Reset",

    // ── Resource Card ────────────────────────────────────────────────
    resetsIn:          (days: number) => `Resets in ${days}d`,
    remaining:         "remaining",
    statusNormal:      "Normal",
    statusHigh:        "High",
    statusCritical:    "Critical",

    // ── Alert Banner ─────────────────────────────────────────────────
    alertTitle:        "Approaching limits",
    alertBody:         (labels: string) =>
      `${labels} — consider upgrading or adjusting usage before reset.`,

    // ── Overview ─────────────────────────────────────────────────────
    trendTitle:        "7-Week Trend",

    // ── History ──────────────────────────────────────────────────────
    historyTitle:      "Usage History",
    historySubtitle:   "Weekly consumption across all resource types",
    breakdownTitle:    "Detailed Breakdown",
    colWeek:           "Week",
    colProSearch:      "Pro Search",
    colResearch:       "Research",
    colBrowserAgent:   "Browser Agent",
    colFiles:          "Files",

    // ── Plans ────────────────────────────────────────────────────────
    plansTitle:        "Plan Comparison",
    plansSubtitle:     "See what you'd unlock with an upgrade",
    colFeature:        "Feature",
    colFree:           "Free",
    ctaTitle:          "Need more capacity?",
    ctaBody:           "Based on your usage patterns, you're consistently hitting 85%+ on Browser Agent and Research limits.",
    ctaButton:         "Explore Enterprise →",

    // ── Proposal ─────────────────────────────────────────────────────
    proposalToggle:    "Feature Proposal — Why This Dashboard Matters",
    proposalTitle:     "Usage Transparency Dashboard — Feature Proposal",
    proposalItems: [
      ["The Problem",    "Pro and Enterprise users have no visibility into their resource consumption. The only feedback is a blocking 'limit reached' message — no counters, no history, no reset dates. This creates frustration, reduces trust, and makes it harder for professional users to justify their subscription ROI."],
      ["The Impact",     "Power users who integrate Perplexity into professional workflows (research, automation, content) can't plan their work around resource availability. Competitors like Claude already provide real-time usage indicators, setting user expectations higher."],
      ["The Solution",   "A Usage Dashboard (this prototype) showing per-resource counters (used/limit), historical trends, reset dates, and plan comparison — enabling informed decisions about usage pacing and plan selection."],
      ["Business Case",  "Usage transparency directly drives upsells. When users can see they consistently hit 85%+ on specific resources, the upgrade path becomes self-evident (as demonstrated in the Plans tab). This reduces churn from frustration and increases upgrade conversion."],
      ["This Prototype", "Built as an interactive demo with dual themes (dark/light), real-time simulation, usage history with trends, and plan comparison. Ready for design review and implementation scoping."],
    ] as [string, string][],

    // ── Footer ───────────────────────────────────────────────────────
    footer:            (year: number) =>
      `Prototype by Gabriel Cabello Arteaga · ${year} · Built for Perplexity Product Team`,
  },

  es: {
    // ── Header ──────────────────────────────────────────────────────
    headerTitle:       "Panel de Uso",
    headerBadge:       "PROTOTIPO",
    planBadge:         "Plan Pro",
    themeLight:        "Claro",
    themeDark:         "Oscuro",
    langToggle:        "EN",

    // ── Tabs ────────────────────────────────────────────────────────
    tabOverview:       "Resumen de Uso",
    tabHistory:        "Historial",
    tabPlans:          "Planes",
    tabsAriaLabel:     "Secciones del panel",

    // ── Usage Summary ────────────────────────────────────────────────
    billingPeriod:     "Período de Facturación",
    nextReset:         "Próximo Reset",
    nextResetValue:    (days: number) => `${days} días`,
    btnSimulate:       "Simular Uso",
    btnSimulating:     "Simulando…",
    btnReset:          "Reiniciar",

    // ── Resource Card ────────────────────────────────────────────────
    resetsIn:          (days: number) => `Resetea en ${days}d`,
    remaining:         "restantes",
    statusNormal:      "Normal",
    statusHigh:        "Alto",
    statusCritical:    "Crítico",

    // ── Alert Banner ─────────────────────────────────────────────────
    alertTitle:        "Acercándose al límite",
    alertBody:         (labels: string) =>
      `${labels} — considera actualizar tu plan o ajustar el uso antes del reset.`,

    // ── Overview ─────────────────────────────────────────────────────
    trendTitle:        "Tendencia (7 semanas)",

    // ── History ──────────────────────────────────────────────────────
    historyTitle:      "Historial de Uso",
    historySubtitle:   "Consumo semanal por tipo de recurso",
    breakdownTitle:    "Desglose Detallado",
    colWeek:           "Semana",
    colProSearch:      "Pro Search",
    colResearch:       "Investigación",
    colBrowserAgent:   "Agente Browser",
    colFiles:          "Archivos",

    // ── Plans ────────────────────────────────────────────────────────
    plansTitle:        "Comparación de Planes",
    plansSubtitle:     "Descubrí qué desbloqueás con una actualización",
    colFeature:        "Característica",
    colFree:           "Gratis",
    ctaTitle:          "¿Necesitás más capacidad?",
    ctaBody:           "Según tus patrones de uso, estás llegando consistentemente al 85%+ en Browser Agent e Investigación.",
    ctaButton:         "Ver Enterprise →",

    // ── Proposal ─────────────────────────────────────────────────────
    proposalToggle:    "Propuesta de Feature — Por qué este Panel Importa",
    proposalTitle:     "Panel de Transparencia de Uso — Propuesta de Feature",
    proposalItems: [
      ["El Problema",   "Los usuarios Pro y Enterprise no tienen visibilidad de su consumo de recursos. El único feedback es un mensaje de 'límite alcanzado' — sin contadores, sin historial, sin fechas de reset. Esto genera frustración, erosiona la confianza y dificulta justificar el ROI de la suscripción."],
      ["El Impacto",    "Los usuarios que integran Perplexity en flujos de trabajo profesionales (investigación, automatización, contenido) no pueden planificar su trabajo en torno a la disponibilidad de recursos. Competidores como Claude ya ofrecen indicadores en tiempo real."],
      ["La Solución",   "Un Panel de Uso (este prototipo) con contadores por recurso (usado/límite), tendencias históricas, fechas de reset y comparación de planes — para tomar decisiones informadas sobre el uso y la selección de plan."],
      ["Caso de Negocio", "La transparencia de uso impulsa directamente los upgrades. Cuando los usuarios ven que consistentemente llegan al 85%+ en recursos específicos, la decisión de actualizar se hace evidente (como muestra la pestaña Planes). Reduce el churn por frustración y aumenta la conversión."],
      ["Este Prototipo", "Demo interactivo con modo dual (oscuro/claro), simulación en tiempo real, historial con tendencias y comparación de planes. Listo para revisión de diseño y estimación de implementación."],
    ] as [string, string][],

    // ── Footer ───────────────────────────────────────────────────────
    footer:            (year: number) =>
      `Prototipo por Gabriel Cabello Arteaga · ${year} · Desarrollado para el equipo de producto de Perplexity`,
  },
} as const;

export default translations;

/** Convenience: get all strings for a given language */
export function t(lang: Lang) {
  return translations[lang];
}
