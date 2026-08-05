---
target: dashboard (OWNER view + shell)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
p2_count: 1
timestamp: 2026-08-05T04-11-40Z
slug: apps-web-src-app-dashboard-dashboard-page-tsx
---
# Critique — LGA Dashboard (OWNER view, shell + header + sidebar)

Method: dual-agent (A: a25c98685fe4813e6 · B: abd1c67f6c65ca37d)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Notification bell carries a permanent red dot with no count and no click handler — a status signal that never changes (`Header.tsx:183-184`). |
| 2 | Match System / Real World | 3 | "Principle Counsel" misspelled (→ Principal) on the owner's own nameplate (`ProfileDropdown.tsx:110,208`); check-in time formatted `en-US` 12-hour in a Pakistan product (`Header.tsx:97`). |
| 3 | User Control and Freedom | 2 | Check Out persists an end-of-shift record on one click with no confirm and no undo (`Header.tsx:153-159`); global search and bell are inert, so nothing responds. |
| 4 | Consistency and Standards | 2 | `skeuo-card` utility (legacy) is re-applied on top of the shadcn `Card` (`page.tsx:214,258`) — two card systems coexisting; check-in/out use solid green/red action fills, conflicting with the One-Accent rule (blue = action). |
| 5 | Error Prevention | 2 | No idempotency/debounce on check-in (double-tap duplicates a record) and no confirmation on accidental check-out (`Header.tsx:46-91`). |
| 6 | Recognition Rather Than Recall | 3 | Donut legend shows only percentages, never rupee amounts — category cost unreadable without memory or tooltip (`DashboardAnalytics.tsx:260-283`). |
| 7 | Flexibility and Efficiency | 2 | Ctrl+B collapse exists, but the global search — the natural power-user accelerator — is a static `<Input>` with no handler (`Header.tsx:137-141`). |
| 8 | Aesthetic and Minimalist Design | 2 | Calm layout, but ~60% of the owner's landing viewport is expense finance; the firm's legal work and its pending decisions are entirely absent (`page.tsx:207-305`). |
| 9 | Error Recovery | 2 | If `/attendance/firm` fails while `/associates` succeeds, `todayRecords` is empty so `absent = totalAssociates` — the board silently reports the whole firm absent, no error state (`page.tsx:119-125`). |
| 10 | Help and Documentation | 2 | Help & Support is a bare link to `/help`; no contextual guidance anywhere on the operating surface (`ProfileDropdown.tsx:150-158`). |
| **Total** | | **22/40** | **Acceptable — significant improvements needed** |

## Design Specificity Verdict

**LLM assessment:** The owner's primary screen is category-interchangeable. Two KPI cards, four attendance counts, a bar chart and a donut in neutral blue could ship for any HR-and-expenses SaaS. The product's actual moat — CPC/CrPC stage modeling, Urdu legal terminology, Tareekh, hearings, benches, CNR/FIR — exists only in the data model and the `/matters` module. The surface the owner stares at most shows none of it, and none of the decisions that carry stakes for an owner (pending leave/expense approvals) surface here. PKR is the only localized element.

**Deterministic scan:** `detect.mjs --json` over the 5 dashboard targets returned 6 findings, all the `design-system-font-size` rule, all real, 0 false positives: `text-[11px]` literals below the 12px floor at `page.tsx:166,280,291`, `Sidebar.tsx:262`, `AdminDashboard.tsx:99,110`. The 11px "micro-label" style is a de-facto pattern (5 of 6 share the same uppercase+tracking recipe) that DESIGN.md does not codify — either add an 11px step as a token or use `text-xs`.

**Tooling note (not a product issue):** the `design-system-font-size` rule declares `severity: "advisory"` but never sets the `advisory: true` flag (`detector/registry/antipatterns.mjs:494-504`), so the CLI exit code counts advisory findings as failures (exit 2 for what should be exit 0). Detector bug worth fixing upstream.

**Visual overlays:** No browser tool is exposed in this session, so no browser overlay was produced; deterministic static scan ran instead.

## Overall Impression

The chrome and the bones are genuinely good — calm slate-and-blue system, strong type split, a real status anchor in the amber clock pill, readable metric tiles. But the surface under-delivers on its core promise: the owner's first screen is generic HR+finance KPIs with every tile a dead end, the global search is a fake, and one silent fetch failure can paint the entire firm absent. The single biggest opportunity is to make this screen say "Pakistani law firm" and "here's what needs your decision today."

## What's Working

1. **Metric-tile construction** (`page.tsx:232-253`) — text-3xl black headline numbers, 4-subtile status grouping with semantic icon colors. Fast to scan, respects the status-only rule.
2. **Live clock pill** (`Header.tsx:149-152`) — the amber mono pill with the pulsing dot is a strong, persistent status anchor carried across every screen.
3. **Empty chart state** (`DashboardAnalytics.tsx:98-108`) — icon + title + explanation that teaches what will appear; rare and well done.

## Priority Issues

1. **[P1] Inert global search** (`Header.tsx:137-141`). The search field renders and does nothing on typing. It is the single most-expected efficiency gesture on a terminal; discovering it is fake erodes trust in the whole surface. **Fix:** wire it to a routed search / command palette now, or remove it and its aria-label until it works.

2. **[P1] Silent data failure renders "everyone absent"** (`page.tsx:80-148`). Each fetch is `.catch(() => null)`; if `/attendance/firm` fails, `todayRecords` is empty and `absent = totalAssociates` — the board presents 100% absence as fact. An ops board feeding HR decisions must not fabricate a metric. **Fix:** per-source error state ("Unavailable" + retry); only compute `absent` when all three sub-fetches succeeded.

3. **[P1] Check-out is one unconfirmed click; check-in has no idempotency guard** (`Header.tsx:46-91`). A stray tap ends a shift; a double-tap submits two records. Attendance feeds payroll and leave balances. **Fix:** confirmation dialog (or 2-second undo toast) on Check Out; disable the button while in flight; add an idempotency key on check-in.

4. **[P1] The owner landing omits the product's moat and its decisions** (`page.tsx:207-305`). No matters, hearings, Tareekh, or pending-approvals queue on the primary screen — the differentiator and the decision-maker's job are both invisible. **Fix:** replace one expense block (or add a section) with an "Upcoming Hearings / Tareekh" list and a "Pending Approvals" queue with inline approve, deep-linking to `/matters` and `/leave`.

5. **[P2] Off-canvas sidebar stays focusable while closed** (`Sidebar.tsx:177-182`). `-translate-x-full` hides it visually but its links remain in the tab order on mobile. **Fix:** add `inert` (or `visibility:hidden` + `aria-hidden`) when `!mobileOpen` on mobile. *(Suggested command: /impeccable audit)*

## Persona Red Flags

**Alex (power user):** the inert global search (no response to input); seven flat ungrouped nav items with no court-vs-office split to exploit; every KPI and chart a dead end (no drill-down, no deep-link); an always-lit bell with no actionable count; no keyboard path beyond Ctrl+B.

**Sam (accessibility):** the translated-away drawer still focusable on mobile (`Sidebar.tsx:177`); an `aria-hidden` backdrop that is a click target with no keyboard activation; 11px labels (`page.tsx:166,280`, `Sidebar.tsx:262`); white-on-#059669 check-in button at ~3.8:1, below 4.5:1 AA for 12px bold (`Header.tsx:164`); hover-only profile menu (`ProfileDropdown.tsx:81-83`); no `prefers-reduced-motion` handling for the springs and pulsing dot; Badge rendered as a plain `<div>`, so status meaning is not announced.

## Minor Observations

- "Principle Counsel" → "Principal" (`ProfileDropdown.tsx:110,208`).
- `en-US` 12-hour time in a Pakistan product (`Header.tsx:97`).
- "2026 Fiscal" uses calendar-year while Pakistan's FY runs Jul–Jun (`DashboardAnalytics.tsx:152`).
- `remote` counts records, not distinct associates, and can double-count someone with a biometric PRESENT record — skewing `absent` (`page.tsx:119-121`).
- Decorative gradient top-bar on every metric card conflicts with DESIGN.md's "no gradients outside the primary button" rule — a doc drift; either codify the accent bar or remove it (`page.tsx:215,259`).
- "Manual Expenses" uses the destructive-red icon, implying the category is an error (`page.tsx:290`).
- The 11px micro-labels are a real pattern; codify as a token if kept (5 of 6 detector findings share it).
- Detector bug: `design-system-font-size` advisory findings count as failures in the exit code.

## Questions to Consider

- If the moat is court-stage specificity, why is the owner's first screen 100% generic HR-and-expense KPIs and 0% matters, hearings, or Tareekh — what is this dashboard actually selling?
- Is the inert global search a placeholder or a silent product decision — and which is it while the bell sits next to it doing nothing?
- Green Check In / red Check Out use semantic colors as action fills while the design system reserves blue for action — which rule wins, and what does a red "end your day" button do to the closing emotional beat?
- The code has already committed to PKR while PRODUCT.md insists currency is undecided — who is right, and what breaks the day a second tenant needs a different currency?
