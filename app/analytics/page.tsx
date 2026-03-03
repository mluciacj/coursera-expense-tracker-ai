"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/hooks";
import {
  computeSummary,
  computeCategoryTrend,
  getTopExpenses,
  formatCurrency,
} from "@/lib/analytics";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import { format, parseISO } from "date-fns";

export default function AnalyticsPage() {
  const { expenses, isLoaded } = useExpenses();

  const summary = useMemo(() => computeSummary(expenses), [expenses]);
  const categoryTrend = useMemo(() => computeCategoryTrend(expenses), [expenses]);
  const topExpenses = useMemo(() => getTopExpenses(expenses, 5), [expenses]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-slate-500 text-sm">Add expenses to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Detailed spending insights</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total All Time",
            value: formatCurrency(summary.total),
            icon: "💰",
          },
          {
            label: "Avg Monthly Spend",
            value: formatCurrency(summary.avgMonthly),
            icon: "📅",
          },
          {
            label: "This vs Last Month",
            value:
              summary.lastMonth > 0
                ? `${(((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100).toFixed(1)}%`
                : "N/A",
            icon: summary.thisMonth <= summary.lastMonth ? "📉" : "📈",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-xl font-bold text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Category trends */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Category Trends (This vs Last Month)
        </h2>
        <div className="space-y-3">
          {categoryTrend
            .filter((c) => c.current > 0 || c.previous > 0)
            .sort((a, b) => b.current - a.current)
            .map((c) => {
              const maxVal = Math.max(c.current, c.previous, 1);
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <span>{CATEGORY_ICONS[c.category as keyof typeof CATEGORY_ICONS]}</span>
                      {c.category}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {formatCurrency(c.current)}
                      {c.previous > 0 && (
                        <span
                          className={`ml-2 font-medium ${
                            c.change <= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {c.change > 0 ? "+" : ""}
                          {formatCurrency(c.change)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.current / maxVal) * 100}%`,
                        backgroundColor:
                          CATEGORY_COLORS[c.category as keyof typeof CATEGORY_COLORS],
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Top expenses */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Top Expenses (All Time)
        </h2>
        <div className="divide-y divide-slate-50">
          {topExpenses.map((expense, i) => (
            <div
              key={expense.id}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {expense.description}
                </p>
                <p className="text-xs text-slate-400">
                  {format(parseISO(expense.date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge category={expense.category} size="sm" />
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
