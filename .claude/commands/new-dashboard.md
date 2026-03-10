Create a new dashboard page or component based on a design image, following all project conventions in CLAUDE.md.

## Arguments: $ARGUMENTS

Parse the arguments as follows:
- First word: path to the design image (PNG, JPG, or screenshot). Must be a valid file path.
- Second word (optional): route segment for the new page (e.g., `budget` → `app/budget/page.tsx`, URL `/budget`). If omitted, create a standalone component instead of a full page.

If no image path is provided, ask the user before proceeding.

## Steps

### 1. Analyze the design image

Read the image file and identify:
- **Layout structure**: full page or a card/widget/section?
- **UI elements present**: cards, charts, lists, badges, tables, stats, filters
- **Data displayed**: amounts, categories, dates, percentages, trends — map each to what is available from `useExpenses` and `computeSummary` in `lib/analytics.ts`
- **Visual style**: colors, spacing, typography weight — translate to Tailwind classes using the project's palette (`slate-*` for neutrals, category colors from `CATEGORY_COLORS`)

### 2. Map to existing components

Before writing any new code, check which existing components can be reused:

| If the image shows... | Use... |
|---|---|
| A metric/stat card | `components/ui/SummaryCard.tsx` |
| A category label/pill | `components/ui/Badge.tsx` |
| A bar chart | `components/charts/SpendingBarChart.tsx` |
| A donut/pie chart | `components/charts/CategoryPieChart.tsx` |
| An expense row | `components/ui/ExpenseCard.tsx` |
| A modal/dialog | `components/ui/Modal.tsx` |

Only create new components for UI patterns that do not exist yet. Place new components in the correct directory: `ui/`, `charts/`, `insights/`, or `forms/`.

### 3a. If a route was provided — create a full page

Create `app/<route>/page.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/hooks";
import { computeSummary, formatCurrency } from "@/lib/analytics";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORIES } from "@/lib/types";

export default function <PageName>Page() {
  const { expenses, isLoaded } = useExpenses();
  const summary = useMemo(() => computeSummary(expenses), [expenses]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* implement layout from image */}
    </div>
  );
}
```

Then add the nav link to **both** `components/layout/Sidebar.tsx` and `components/layout/MobileNav.tsx`:
```ts
{ href: "/<route>", label: "<PageTitle>", icon: "<emoji>" },
```
Choose an emoji that matches the page theme. Both nav arrays must stay in sync.

### 3b. If no route was provided — create a standalone component

Determine the most fitting directory based on what the image shows:
- A data visualization → `components/charts/`
- A metric or info card → `components/ui/`
- An insight or streak widget → `components/insights/`

Create the component file with typed props, a single default export, and no internal expense state — data comes in via props.

### 4. Implement the layout

Translate the design into JSX + Tailwind:
- Reproduce the visual hierarchy, spacing, and layout as closely as possible
- Use `formatCurrency` for all monetary values
- Use `CATEGORY_COLORS[category]` for category-specific colors (never hardcode hex values for categories)
- Use `CATEGORY_ICONS[category]` for category emojis
- For charts, use `recharts` with `ResponsiveContainer`
- All layout is Tailwind utility classes only — no inline styles except for dynamic values (e.g., `style={{ backgroundColor: color }}`)

### 5. Run the quality gate

```bash
npm run lint && npx tsc --noEmit
```

Fix all errors before finishing. Do not suppress errors with `as any` or `// @ts-ignore`.

## Important notes

- The output quality depends on the clarity of the image. A clean mockup produces accurate code; a rough sketch produces a best-effort interpretation. Flag any ambiguities in the final report.
- Do not invent data sources. Only use what is available from `useExpenses` and `computeSummary`. If the design shows data that doesn't exist in the project (e.g., income, budgets, goals), create a realistic placeholder with a comment marking it as `// TODO: requires new data source`.
- Do not add new dependencies. Use Recharts for charts and date-fns for dates — both are already installed.

## Done

Report:
- Files created and their paths
- Existing components reused
- Any design elements that could not be reproduced exactly and why
- Any `// TODO` placeholders left for missing data sources
- Lint/type check result
