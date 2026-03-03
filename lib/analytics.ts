import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { Category, CATEGORIES, Expense, SpendingSummary } from "./types";

export function computeSummary(expenses: Expense[]): SpendingSummary {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpenses = expenses.filter((e) => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });
  const thisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const lastMonthExpenses = expenses.filter((e) => {
    const d = parseISO(e.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });
  const lastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = expenses
        .filter((e) => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      return acc;
    },
    {} as Record<Category, number>
  );

  const topCategory =
    CATEGORIES.reduce<Category | null>((top, cat) => {
      if (!top || byCategory[cat] > byCategory[top]) return cat;
      return top;
    }, null) ?? null;

  // Build monthly breakdown for last 6 months
  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    monthlyMap[format(m, "MMM yyyy")] = 0;
  }
  expenses.forEach((e) => {
    const key = format(parseISO(e.date), "MMM yyyy");
    if (key in monthlyMap) {
      monthlyMap[key] += e.amount;
    }
  });
  const byMonth = Object.entries(monthlyMap).map(([month, amount]) => ({
    month,
    amount,
  }));

  const nonZeroMonths = byMonth.filter((m) => m.amount > 0);
  const avgMonthly =
    nonZeroMonths.length > 0
      ? nonZeroMonths.reduce((sum, m) => sum + m.amount, 0) / nonZeroMonths.length
      : 0;

  return { total, thisMonth, lastMonth, topCategory, byCategory, byMonth, avgMonthly };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function exportToCSV(expenses: Expense[], filename?: string): void {
  const headers = ["Date", "Amount", "Category", "Description"];
  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalsRow = ["TOTAL", total.toFixed(2), "", ""];

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
    totalsRow.join(","),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `expenses_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(expenses: Expense[], filename?: string): void {
  const data = {
    exportedAt: new Date().toISOString(),
    count: expenses.length,
    expenses,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `expenses_${format(new Date(), "yyyy-MM-dd")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function getTopExpenses(expenses: Expense[], limit = 5): Expense[] {
  return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export function computeCategoryTrend(
  expenses: Expense[]
): { category: string; current: number; previous: number; change: number }[] {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  return CATEGORIES.map((cat) => {
    const current = expenses
      .filter((e) => {
        const d = parseISO(e.date);
        return e.category === cat && d >= thisMonthStart && d <= thisMonthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const previous = expenses
      .filter((e) => {
        const d = parseISO(e.date);
        return e.category === cat && d >= prevMonthStart && d <= prevMonthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return { category: cat, current, previous, change: current - previous };
  });
}
