# ⟡ Perplexity Usage Dashboard — Feature Proposal

> A high-fidelity interactive prototype proposing a **Usage Dashboard** as a missing feature in Perplexity Pro/Enterprise. Built to show the Perplexity product team exactly what this would look like and why it matters.

**[→ Live Demo](https://perplexity-dashboard-proposal.vercel.app)**

---

## The Problem

Pro and Enterprise users have zero visibility into their resource consumption. The only signal is a hard "limit reached" block — no counters, no history, no reset dates. This creates frustration, erodes trust, and makes it impossible for power users to plan around their subscription.

## The Solution

A transparent Usage Dashboard embedded in account Settings, showing:

- **Per-resource counters** (used / limit, progress bar with color-coded status)
- **Reset countdown** per billing cycle
- **7-week trend charts** per resource type
- **Alert banners** when approaching limits
- **Plan comparison** table to contextualize limits and drive informed upgrades

## Business Case

Usage transparency directly drives upsells. When users can see they're hitting 85%+ on Browser Agent and Research consistently, the upgrade decision becomes self-evident — no sales motion needed. This also reduces churn from users who hit limits unexpectedly and attribute it to a bad product experience.

---

## Demo Features

| Feature | Detail |
|---|---|
| Dark / Light theme | Persistent toggle, smooth transition |
| EN / ES i18n | Full bilingual UI, persisted in localStorage |
| Live simulation | "Simulate Usage" button fills resources in real time |
| Animated tabs | Directional slide with Framer Motion AnimatePresence |
| Stagger cards | Resource cards animate in with staggered delay |
| Spring progress bars | Framer Motion spring physics on bar fill |
| Responsive | Mobile-first: scrollable pill tabs, compact header |
| Accessible | `role="progressbar"`, `aria-live`, `role="alert"`, focus rings |

---

## Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v3 (extended with Perplexity tokens) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Fonts | Inter (Google Fonts) |
| Deploy | Vercel |

---

## Design System

This prototype faithfully implements **Perplexity's visual identity**:

- **Color palette**: `#0C0C0C` background, `#20B8CD` cyan accent, `#F5C1A9` peach focus rings, layered surfaces `#1A1A1A → #404040`
- **Typography**: Inter as FK Grotesk fallback, SF Mono for data labels
- **Motion**: 150ms default duration, `cubic-bezier(0.4, 0, 0.2, 1)` easing
- **Philosophy**: "subway escandinavo" — clean, considered, invisible. The design is a vehicle for information, not the protagonist.

Design system reference: [Esk3nder/perplexity-design-system](https://github.com/Esk3nder/perplexity-design-system)
Branding article: [Smith & Diction — Branding Perplexity AI](https://medium.com/smith-diction/branding-perplexity-ai-70eb2cb2ef48)

---

## Project Structure

```
src/
├── components/
│   ├── usage/           # UsageDashboard, ResourceCard, UsageSummary, AlertBanner
│   └── ui/              # ProgressBar, Badge
├── config/
│   ├── theme.ts         # Design tokens as TypeScript constants
│   ├── usage-config.ts  # Types, mock data, plan definitions
│   └── i18n.ts          # EN/ES translations (~50 strings)
├── hooks/
│   └── useLanguage.ts   # Lang state + localStorage persistence
└── App.tsx
```

---

## Run Locally

```bash
git clone https://github.com/GboCabel/perplexity-dashboard-proposal
cd perplexity-dashboard-proposal
npm install
npm run dev
```

---

## About This Proposal

Built by **Gabriel Cabello Arteaga** as an unsolicited feature proposal for the Perplexity product team.

The goal: demonstrate that a Usage Dashboard is both feasible (single settings page, no new infrastructure) and high-value (drives upgrades, reduces frustration, differentiates from competitors). The prototype is intentionally over-engineered — typed, animated, bilingual, responsive, accessible — to show that this feature deserves serious consideration.

If you're from the Perplexity team and want to talk: open an issue or reach out directly.

---

*Built with Claude Code · Vite · React · Tailwind · Framer Motion*
