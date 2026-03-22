/**
 * UsageDashboard — main container with Overview / History / Plans tabs.
 * Framer Motion: AnimatePresence (directional tab slide) + stagger on cards.
 */

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ThemeMode } from "../../config/theme";
import { colors } from "../../config/theme";
import { t as getTranslations, type Lang } from "../../config/i18n";
import {
  INITIAL_RESOURCES,
  HISTORY_DATA,
  PLAN_COMPARE,
  PLANS,
  CHART_SERIES,
  type Resource,
} from "../../config/usage-config";
import { ResourceCard } from "./ResourceCard";
import { UsageSummary } from "./UsageSummary";
import { AlertBanner } from "./AlertBanner";

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId = "overview" | "history" | "plans";

interface Tab { id: TabId; label: string; }

const TAB_ORDER: Record<TabId, number> = { overview: 0, history: 1, plans: 2 };

// ─── Animation variants ──────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;

/** Tab panel: slides in the direction of navigation */
const tabVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 28 : -28,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: EASE },
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -28 : 28,
    opacity: 0,
    transition: { duration: 0.16, ease: EASE },
  }),
};

/** Grid container: triggers stagger on children */
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Individual card: fades up */
const cardVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

/** Proposal panel accordion */
const proposalVariants = {
  hidden:  { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: "auto", marginTop: 12, transition: { duration: 0.25, ease: EASE } },
  exit:    { opacity: 0, height: 0, marginTop: 0,        transition: { duration: 0.18, ease: EASE } },
};

// ─── SVG Chart sub-components ────────────────────────────────────────────────

interface MiniChartProps {
  dataKey: keyof typeof HISTORY_DATA[0] extends "week" ? never : keyof typeof HISTORY_DATA[0];
  color:   string;
  width?:  number;
  height?: number;
}

function MiniChart({ dataKey, color, width = 180, height = 48 }: MiniChartProps) {
  const values = HISTORY_DATA.map((d) => (d as unknown as Record<string, number>)[dataKey as string]);
  const max    = Math.max(...values) * 1.1;
  const min    = Math.min(...values) * 0.9;
  const range  = max - min || 1;
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 8) - 4,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaD = `${pathD} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ display: "block" }} aria-hidden="true">
      <defs>
        <linearGradient id={`grad-${String(dataKey)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${String(dataKey)})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3 : 0} fill={color} />
      ))}
    </svg>
  );
}

interface HistoryChartProps { mode: ThemeMode; }

function HistoryChart({ mode }: HistoryChartProps) {
  const t     = colors[mode];
  const W     = 600; const H = 200;
  const PAD   = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const allValues = CHART_SERIES.flatMap(({ key }) =>
    HISTORY_DATA.map((d) => (d as unknown as Record<string, number>)[key as string])
  );
  const maxVal = Math.max(...allValues);
  const getX = (i: number) => PAD.left + (i / (HISTORY_DATA.length - 1)) * plotW;
  const getY = (v: number) => PAD.top + plotH - (v / maxVal) * plotH;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block" }}
        role="img" aria-label="Usage history line chart — last 7 weeks">
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1={PAD.left} y1={getY(maxVal * pct)} x2={W - PAD.right} y2={getY(maxVal * pct)}
              stroke={t.border} strokeWidth="1" strokeDasharray={pct === 0 ? "0" : "4 4"} />
            <text x={PAD.left - 8} y={getY(maxVal * pct) + 4} textAnchor="end" fill={t.textMuted} fontSize="10">
              {Math.round(maxVal * pct)}
            </text>
          </g>
        ))}
        {HISTORY_DATA.map((d, i) => (
          <text key={i} x={getX(i)} y={H - 10} textAnchor="middle" fill={t.textMuted} fontSize="10">
            {d.week}
          </text>
        ))}
        {CHART_SERIES.map(({ key }, ki) => {
          const pathD = HISTORY_DATA
            .map((d, i) => `${i === 0 ? "M" : "L"}${getX(i).toFixed(2)},${getY((d as unknown as Record<string, number>)[key as string]).toFixed(2)}`)
            .join(" ");
          return (
            <g key={key}>
              <path d={pathD} fill="none" stroke={t.chart[ki]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
              {HISTORY_DATA.map((d, i) => (
                <circle key={i} cx={getX(i)} cy={getY((d as unknown as Record<string, number>)[key as string])}
                  r={i === HISTORY_DATA.length - 1 ? 4 : 2.5}
                  fill={t.chart[ki]} stroke={t.level2} strokeWidth="1.5" />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-4 justify-center mt-2">
        {CHART_SERIES.map(({ label }, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[mode].chart[i] }} aria-hidden="true" />
            <span className="text-[11px]" style={{ color: colors[mode].textSecondary }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface UsageDashboardProps { mode: ThemeMode; lang: Lang; }

export function UsageDashboard({ mode, lang }: UsageDashboardProps) {
  const [resources,    setResources]    = useState<Resource[]>(INITIAL_RESOURCES);
  const [simulating,   setSimulating]   = useState(false);
  const [tab,          setTab]          = useState<TabId>("overview");
  const [showProposal, setShowProposal] = useState(false);

  // Track slide direction: positive = moving right (overview→plans), negative = left
  const directionRef = useRef(0);

  const isDark = mode === "dark";
  const t      = colors[mode];
  const tr     = getTranslations(lang);

  const TABS: Tab[] = [
    { id: "overview", label: tr.tabOverview },
    { id: "history",  label: tr.tabHistory  },
    { id: "plans",    label: tr.tabPlans    },
  ];

  const handleTabChange = (next: TabId) => {
    directionRef.current = TAB_ORDER[next] - TAB_ORDER[tab];
    setTab(next);
  };

  // ─── Simulation ────────────────────────────────────────────────────────
  const simulate = useCallback(() => {
    if (simulating) return;
    setSimulating(true);
    const interval = setInterval(() => {
      setResources((prev) =>
        prev.map((r) => ({ ...r, used: Math.min(r.used + Math.floor(Math.random() * 3) + 1, r.limit) }))
      );
    }, 1200);
    setTimeout(() => { clearInterval(interval); setSimulating(false); }, 10000);
  }, [simulating]);

  const resetData = useCallback(() => {
    setResources(INITIAL_RESOURCES);
    setSimulating(false);
  }, []);

  const criticalResources = resources.filter((r) => r.used / r.limit >= 0.9);

  const cardStyle = {
    background:  t.level2,
    borderColor: t.border,
    boxShadow:   t.cardShadow,
  } as const;

  // ─── Tab content ────────────────────────────────────────────────────────

  const overviewContent = (
    <motion.div key="overview" custom={directionRef.current}
      variants={tabVariants} initial="enter" animate="center" exit="exit">
      <UsageSummary mode={mode} lang={lang} simulating={simulating} onSimulate={simulate} onReset={resetData} />

      {/* Resource cards — staggered grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6"
        variants={gridVariants} initial="hidden" animate="visible"
      >
        {resources.map((r) => (
          <motion.div key={r.id} variants={cardVariants}>
            <ResourceCard resource={r} mode={mode} simulating={simulating} />
          </motion.div>
        ))}
      </motion.div>

      <AlertBanner criticalResources={criticalResources} mode={mode} lang={lang} />

      {/* 7-week sparklines */}
      <section aria-label="7-week usage trend" className="rounded-lg p-4 sm:p-5 border" style={cardStyle}>
        <p className="text-[13px] font-semibold mb-4" style={{ color: t.text }}>{tr.trendTitle}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CHART_SERIES.map(({ key, label }, i) => (
            <div key={key}>
              <p className="text-[11px] font-mono mb-1.5" style={{ color: t.textMuted }}>{label}</p>
              <MiniChart dataKey={key as keyof typeof HISTORY_DATA[0]} color={t.chart[i]} />
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );

  const historyContent = (
    <motion.div key="history" custom={directionRef.current}
      variants={tabVariants} initial="enter" animate="center" exit="exit"
      className="space-y-5">
      <section aria-label="Usage history chart" className="rounded-lg p-4 sm:p-6 border" style={cardStyle}>
        <p className="text-[15px] font-semibold mb-1" style={{ color: t.text }}>{tr.historyTitle}</p>
        <p className="text-xs mb-4 sm:mb-5" style={{ color: t.textMuted }}>{tr.historySubtitle}</p>
        <HistoryChart mode={mode} />
      </section>

      <section aria-label="Detailed usage breakdown" className="rounded-lg overflow-hidden border" style={{ ...cardStyle, padding: 0 }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: t.borderSubtle }}>
          <p className="text-sm font-semibold" style={{ color: t.text }}>{tr.breakdownTitle}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b" style={{ borderColor: t.borderSubtle }}>
                {[tr.colWeek, tr.colProSearch, tr.colResearch, tr.colBrowserAgent, tr.colFiles].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium" style={{ color: t.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY_DATA.map((row, ri) => (
                <tr key={ri} className="border-b last:border-b-0" style={{ borderColor: t.borderSubtle }}>
                  <td className="px-4 py-2.5 font-sans text-xs" style={{ color: t.textSecondary }}>{row.week}</td>
                  {CHART_SERIES.map(({ key }) => {
                    const limit       = INITIAL_RESOURCES.find((r) => r.id === key)!.limit;
                    const val         = (row as unknown as Record<string, number>)[key as string];
                    const pct         = (val / limit) * 100;
                    const statusColor = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : t.cyan;
                    return (
                      <td key={key} className="px-4 py-2.5">
                        <span style={{ color: statusColor, fontWeight: 500 }}>{val}</span>
                        <span style={{ color: t.textMuted }}> / {limit}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );

  const plansContent = (
    <motion.div key="plans" custom={directionRef.current}
      variants={tabVariants} initial="enter" animate="center" exit="exit"
      className="space-y-5">
      <section aria-label="Plan comparison" className="rounded-lg overflow-hidden border" style={{ ...cardStyle, padding: 0 }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: t.borderSubtle }}>
          <p className="text-[15px] font-semibold mb-1" style={{ color: t.text }}>{tr.plansTitle}</p>
          <p className="text-xs" style={{ color: t.textMuted }}>{tr.plansSubtitle}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b" style={{ borderColor: t.borderSubtle }}>
                <th className="px-5 py-3 text-left text-[11px] font-medium font-mono" style={{ color: t.textMuted }}>{tr.colFeature}</th>
                <th className="px-5 py-3 text-center text-[11px] font-medium font-mono" style={{ color: t.textMuted }}>{tr.colFree}</th>
                <th className="px-5 py-3 text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold font-mono"
                    style={{ color: PLANS.pro.color, background: `${PLANS.pro.color}18` }}>PRO $20/mo</span>
                </th>
                <th className="px-5 py-3 text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold font-mono"
                    style={{ color: PLANS.enterprise.color, background: `${PLANS.enterprise.color}18` }}>ENTERPRISE $40/mo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARE.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0" style={{ borderColor: t.borderSubtle }}>
                  <td className="px-5 py-3 font-medium font-sans" style={{ color: t.text }}>{row.feature}</td>
                  <td className="px-5 py-3 text-center font-mono text-xs"
                    style={{ color: row.free === "—" ? t.textMuted : t.textSecondary }}>{row.free}</td>
                  <td className="px-5 py-3 text-center font-mono text-xs font-medium" style={{ color: t.text }}>{row.pro}</td>
                  <td className="px-5 py-3 text-center font-mono text-xs font-semibold"
                    style={{ color: PLANS.enterprise.color }}>{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upgrade CTA */}
      <div className="rounded-lg p-6 text-center border"
        style={{ background: `linear-gradient(135deg, ${PLANS.enterprise.color}12, ${t.cyan}08)`, borderColor: `${PLANS.enterprise.color}30` }}>
        <p className="text-base font-bold mb-2" style={{ color: t.text }}>{tr.ctaTitle}</p>
        <p className="text-[13px] mb-4 mx-auto max-w-[380px]" style={{ color: t.textSecondary }}>
          {tr.ctaBody}
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block px-6 py-2.5 rounded-lg text-white text-[13px] font-semibold"
          style={{ background: PLANS.enterprise.color, boxShadow: `0 4px 16px ${PLANS.enterprise.color}40` }}
        >
          {tr.ctaButton}
        </motion.button>
      </div>
    </motion.div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[860px] mx-auto px-3 py-4 pb-20 sm:px-5 sm:py-6 sm:pb-16">

      {/* Tab nav */}
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto pb-1 sm:pb-0 mb-5 sm:mb-6">
        <nav aria-label={tr.tabsAriaLabel}
          className="flex gap-1 rounded-xl p-1 border min-w-max sm:min-w-0"
          style={{ background: t.level2, borderColor: t.borderSubtle }}>
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => handleTabChange(tb.id)}
              role="tab"
              aria-selected={tab === tb.id}
              className="flex-none sm:flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg
                         text-xs sm:text-[13px] font-medium whitespace-nowrap
                         transition-all duration-150"
              style={{
                background: tab === tb.id ? (isDark ? t.level3 : t.level0) : "transparent",
                color:      tab === tb.id ? t.text : t.textMuted,
                fontWeight: tab === tb.id ? 600 : 500,
                boxShadow:  tab === tb.id ? t.cardShadow : "none",
              }}
            >
              {tb.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panels — AnimatePresence handles enter/exit */}
      <div style={{ overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={directionRef.current}>
          {tab === "overview" && overviewContent}
          {tab === "history"  && historyContent}
          {tab === "plans"    && plansContent}
        </AnimatePresence>
      </div>

      {/* Feature Proposal accordion */}
      <div className="mt-8 pt-6 border-t" style={{ borderColor: t.border }}>
        <motion.button
          onClick={() => setShowProposal(!showProposal)}
          aria-expanded={showProposal}
          whileTap={{ scale: 0.995 }}
          className="w-full flex justify-between items-center px-5 py-3.5 rounded-xl border text-sm font-semibold"
          style={{ background: t.level2, borderColor: t.border, color: t.text, boxShadow: t.cardShadow }}
        >
          <span className="truncate mr-2">📋 {tr.proposalToggle}</span>
          <motion.span
            aria-hidden="true"
            animate={{ rotate: showProposal ? 180 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            ▼
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {showProposal && (
            <motion.div
              variants={proposalVariants}
              initial="hidden" animate="visible" exit="exit"
              style={{ overflow: "hidden" }}
              className="rounded-xl border text-[13px] leading-relaxed px-4 sm:px-6 py-5"
              // Using style override since padding is inside the animated div
            >
              <div style={{ color: t.textSecondary }}>
                <h3 className="text-base font-bold mb-3" style={{ color: t.text }}>
                  {tr.proposalTitle}
                </h3>
                {tr.proposalItems.map(([title, body]) => (
                  <p key={title} className="mb-3 last:mb-0">
                    <strong style={{ color: t.text }}>{title}:</strong> {body}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-[11px] font-mono" style={{ color: t.textMuted }}>
        {tr.footer(new Date().getFullYear())}
      </footer>
    </div>
  );
}
