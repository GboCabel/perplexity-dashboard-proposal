/**
 * Usage Dashboard — Data types, constants, and plan definitions.
 * All mock/simulation data lives here so components stay pure.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type ResourceCategory = "search" | "research" | "agent" | "files";

export interface Resource {
  id:        string;
  label:     string;
  used:      number;
  limit:     number;
  icon:      string;
  resetDays: number;
  category:  ResourceCategory;
}

export type PlanTier = "free" | "pro" | "enterprise";

export interface Plan {
  name:  string;
  price: string;
  color: string;
}

export interface HistoryEntry {
  week:         string;
  pro_search:   number;
  research:     number;
  browser_agent:number;
  file_upload:  number;
}

export interface PlanCompareRow {
  feature:    string;
  free:       string;
  pro:        string;
  enterprise: string;
}

// ─── Resource Definitions ──────────────────────────────────────────────────

export const INITIAL_RESOURCES: Resource[] = [
  {
    id:        "pro_search",
    label:     "Pro Search",
    used:      247,
    limit:     300,
    icon:      "🔍",
    resetDays: 8,
    category:  "search",
  },
  {
    id:        "research",
    label:     "Deep Research",
    used:      18,
    limit:     25,
    icon:      "🧪",
    resetDays: 8,
    category:  "research",
  },
  {
    id:        "browser_agent",
    label:     "Browser Agent / Comet",
    used:      42,
    limit:     50,
    icon:      "🌐",
    resetDays: 8,
    category:  "agent",
  },
  {
    id:        "file_upload",
    label:     "File Analysis",
    used:      31,
    limit:     50,
    icon:      "📄",
    resetDays: 8,
    category:  "files",
  },
];

// ─── Plans ─────────────────────────────────────────────────────────────────

export const PLANS: Record<PlanTier, Plan> = {
  free: {
    name:  "Free",
    price: "$0/mo",
    color: "#808080",
  },
  pro: {
    name:  "Pro",
    price: "$20/mo",
    color: "#20B8CD",
  },
  enterprise: {
    name:  "Enterprise",
    price: "$40/mo",
    color: "#7C6AFF",
  },
};

// ─── History Data ──────────────────────────────────────────────────────────

export const HISTORY_DATA: HistoryEntry[] = [
  { week: "Feb 3",  pro_search: 210, research: 12, browser_agent: 28, file_upload: 18 },
  { week: "Feb 10", pro_search: 285, research: 22, browser_agent: 45, file_upload: 25 },
  { week: "Feb 17", pro_search: 198, research: 15, browser_agent: 38, file_upload: 30 },
  { week: "Feb 24", pro_search: 265, research: 20, browser_agent: 48, file_upload: 22 },
  { week: "Mar 3",  pro_search: 290, research: 24, browser_agent: 50, file_upload: 35 },
  { week: "Mar 10", pro_search: 240, research: 19, browser_agent: 41, file_upload: 28 },
  { week: "Mar 17", pro_search: 247, research: 18, browser_agent: 42, file_upload: 31 },
];

// ─── Plan Comparison Table ─────────────────────────────────────────────────

export const PLAN_COMPARE: PlanCompareRow[] = [
  { feature: "Pro Search",       free: "5/day",  pro: "300/mo",         enterprise: "Unlimited"           },
  { feature: "Deep Research",    free: "—",      pro: "25/mo",          enterprise: "100/mo"              },
  { feature: "Browser Agent",    free: "—",      pro: "50/mo",          enterprise: "200/mo"              },
  { feature: "File Analysis",    free: "3/day",  pro: "50/mo",          enterprise: "Unlimited"           },
  { feature: "API Access",       free: "—",      pro: "Limited",        enterprise: "Full"                },
  { feature: "Usage Dashboard",  free: "—",      pro: "Basic",          enterprise: "Advanced + Export"   },
];

// ─── Chart metadata (parallel to INITIAL_RESOURCES order) ─────────────────

export const CHART_SERIES = [
  { key: "pro_search"    as keyof Omit<HistoryEntry, "week">, label: "Pro Search"     },
  { key: "research"      as keyof Omit<HistoryEntry, "week">, label: "Research"       },
  { key: "browser_agent" as keyof Omit<HistoryEntry, "week">, label: "Browser Agent"  },
  { key: "file_upload"   as keyof Omit<HistoryEntry, "week">, label: "Files"          },
] as const;

export type ChartKey = (typeof CHART_SERIES)[number]["key"];

// ─── Billing period (mock) ─────────────────────────────────────────────────

export const BILLING = {
  periodLabel: "Mar 1 – Mar 31, 2026",
  nextReset:   8,       // days
  currentPlan: "pro" as PlanTier,
} as const;
