# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**Expense Tracker AI** — Next.js 14 App Router, TypeScript, Tailwind CSS. Fully client-side: no backend, no auth, no database. All data in `localStorage`.

---

## Commands

```bash
npm install       # install deps
npm run dev       # dev server (http://localhost:3000)
npm run build     # production build
npm run lint      # ESLint
npx tsc --noEmit  # type-check
```

### Autonomous quality gate — run before finishing any task

```bash
npm run lint && npx tsc --noEmit && npm run build
```

All three must pass with zero errors. Fix failures before stopping.

---

## Architecture

| Concern | Solution |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript 5 (`strict: true`) |
| Styling | Tailwind CSS v3 — utility classes only, no CSS modules |
| Charts | Recharts v3 |
| Dates | date-fns v4 only — no raw `Date` arithmetic |
| Persistence | `localStorage` key: `expense_tracker_data` |
| State | React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) |
| Path alias | `@/` maps to project root |

---

## Project Structure

```
app/
  layout.tsx              # Root layout: Sidebar + MobileNav
  page.tsx                # Dashboard: summary cards, charts, recent expenses
  expenses/page.tsx       # CRUD list: add, edit, delete, filter, CSV export
  insights/page.tsx       # Monthly insights: donut chart, top-3 categories, streak
  top-categories/page.tsx # Category spending breakdown
  top-vendors/page.tsx    # Top vendors breakdown

components/
  layout/   Sidebar.tsx, MobileNav.tsx
  ui/       SummaryCard, Badge, Modal, ConfirmDialog, ExpenseCard
  forms/    ExpenseForm, FilterBar
  charts/   SpendingBarChart, CategoryPieChart
  insights/ BudgetStreak

lib/
  types.ts      # All TS types + CATEGORIES + CATEGORY_COLORS + CATEGORY_ICONS
  storage.ts    # localStorage CRUD (getExpenses, addExpense, updateExpense, deleteExpense, generateId)
  analytics.ts  # computeSummary, formatCurrency (USD), exportToCSV
  hooks.ts      # useExpenses — single source of truth for expense state + filtering
```

---

## Core Rules

### Data flow
```
localStorage <--> storage.ts <--> useExpenses hook --> pages/components
```
- All expense state flows through `useExpenses` — never create a parallel `useState<Expense[]>` in pages.
- Components are presentational — they receive props, own no expense state.
- `isLoaded` flag from `useExpenses` must gate renders to prevent hydration flicker.

### Client components
- Every page file needs `"use client"` — pages use `useExpenses` which calls `localStorage`.
- `storage.ts` guards with `typeof window === "undefined"` — safe for SSR/build.
- `analytics.ts` and `types.ts` are pure — no browser APIs, safe anywhere.
- Recharts requires `"use client"`.

### Types & constants
- `Expense.date` is always `"YYYY-MM-DD"` — use `format(d, 'yyyy-MM-dd')` from date-fns.
- `Expense.amount` is a `number`; form input is `string` (parsed with `parseFloat`).
- Never redefine `Category`, `CATEGORIES`, `CATEGORY_COLORS`, or `CATEGORY_ICONS` — always import from `lib/types.ts`.

### Adding a new page
1. Create `app/<route>/page.tsx` with `"use client"`.
2. Add the route to **both** `Sidebar.tsx` and `MobileNav.tsx`.
3. Use `useExpenses` for data.
4. Run the quality gate.

### Adding a new category
Edit only `lib/types.ts`: add to the `Category` union, `CATEGORIES` array, `CATEGORY_COLORS`, and `CATEGORY_ICONS`. Nothing else needs changing.

---

## Code Quality

### Baseline standards
This project follows the **Next.js + React + TypeScript** conventional quality stack:
- **ESLint**: `next/core-web-vitals` + `next/typescript` (configured in `.eslintrc.json`) — enforces React hooks rules, accessibility hints, and Next.js-specific patterns.
- **TypeScript**: `strict: true` — no implicit `any`, strict null checks, exact optional property types.
- **React hooks rules**: `eslint-plugin-react-hooks` (included via `next/core-web-vitals`) — exhaustive deps, rules of hooks.

All code must pass `npm run lint` and `npx tsc --noEmit` cleanly. These are the authoritative standards; the rules below are project-specific additions on top.

### Project-specific additions
- `useMemo` for all derived data from `expenses` inside components.
- `useCallback` for handlers passed as props.
- No `as any`, no `!` non-null assertions without a comment explaining why.
- No `console.log` in committed code.
- Trim user input before saving (`.trim()` on description).
- No prop drilling beyond 2 levels.
- No duplicate constants — single source in `lib/types.ts`.

---

## Testing Strategy

No test runner is configured. Verification order:
1. `npx tsc --noEmit` — type errors
2. `npm run lint` — lint violations
3. `npm run build` — missing imports, compile errors
4. Manual smoke via `npm run dev`: add/edit/delete expense, filter, export CSV, check mobile layout.

---

## Known Constraints

- No pagination — all expenses filtered in memory (fine for personal scale).
- USD only — `formatCurrency` is hardcoded; changing currency means editing `analytics.ts`.
- No sync across devices — localStorage is intentionally single-device.
- No test framework — verification is TypeScript + ESLint + build.

---

## Git

- Main branch: `claude/init-project-setup-Y1qd6`
- Feature branches: `feature-<name>`
- Always pass `npm run build` before merging.
