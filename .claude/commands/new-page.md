Scaffold a new page for this Next.js expense tracker, following all conventions in CLAUDE.md.

## Arguments: $ARGUMENTS

Parse the arguments as follows:
- First word: the route segment (e.g., `budget` → `app/budget/page.tsx`, URL `/budget`)
- Remaining words (optional): the human-readable page title (e.g., `Budget Overview`). If no title is provided, capitalize the route segment and use that (e.g., `budget` → `Budget`).

If no arguments are provided, ask the user for the route and title before proceeding.

## Steps

### 1. Create the page file

Create `app/<route>/page.tsx` with this exact structure:

```tsx
"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/hooks";

export default function <PageName>Page() {
  const { expenses, isLoaded } = useExpenses();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6"><PageTitle></h1>
    </div>
  );
}
```

Rules:
- `<PageName>` = PascalCase version of the route (e.g., `budget` → `Budget`, `top-budget` → `TopBudget`)
- `<PageTitle>` = the human-readable title argument
- Only import `useMemo` if it will be used. If the page has no derived data yet, omit it.
- Keep `expenses` in the destructure only if the page will use it. If the page is purely static, omit `useExpenses` entirely.

### 2. Add nav link to Sidebar

Open `components/layout/Sidebar.tsx` and add a new entry to the `navItems` array, after the last existing item:

```ts
{ href: "/<route>", label: "<PageTitle>", icon: "<emoji>" },
```

Choose an emoji that fits the page's theme. When in doubt, use `"📄"`.

### 3. Add nav link to MobileNav

Open `components/layout/MobileNav.tsx` and add the exact same entry to its `navItems` array, in the same position.

Both nav files must always be in sync — same routes, same order.

### 4. Run the quality gate

Run `npm run lint && npx tsc --noEmit` to confirm the new files have no errors. Fix any issues before finishing.

## Done

Report:
- The file path created
- The nav label and emoji added
- Any lint or type issues found and fixed
