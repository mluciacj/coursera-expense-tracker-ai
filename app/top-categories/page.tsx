"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/hooks";
import { computeSummary, formatCurrency } from "@/lib/analytics";
import SummaryCard from "@/components/ui/SummaryCard";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/types";
import Link from "next/link";

export default function TopCategoriesPage() {
  const { expenses, isLoaded } = useExpenses();

  const summary = useMemo(() => computeSummary(expenses), [expenses]);

  const rankedCategories = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      total: summary.byCategory[cat],
      count: expenses.filter((e) => e.category === cat).length,
    }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenses, summary]);

  const maxAmount = rankedCategories[0]?.total ?? 0;
  const totalSpending = rankedCategories.reduce((sum, c) => sum + c.total, 0);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Top Categories</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {expenses.length} expense{expenses.length !== 1 ? "s" : ""} across{" "}
          {rankedCategories.length} categor
          {rankedCategories.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Spending"
          value={formatCurrency(totalSpending)}
          subtitle={`${expenses.length} expenses`}
          icon="💰"
          color="indigo"
        />
        <SummaryCard
          title="Top Category"
          value={rankedCategories[0]?.category ?? "None"}
          subtitle={
            rankedCategories[0]
              ? formatCurrency(rankedCategories[0].total)
              : "No data yet"
          }
          icon={
            rankedCategories[0]
              ? CATEGORY_ICONS[rankedCategories[0].category]
              : "📊"
          }
          color="rose"
        />
        <SummaryCard
          title="Categories Used"
          value={String(rankedCategories.length)}
          subtitle={`of ${CATEGORIES.length} total`}
          icon="🏷️"
          color="emerald"
        />
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-5xl mb-4">📊</p>
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            No data yet
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Add expenses to see your spending breakdown by category
          </p>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            + Add Expense
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Ranked list */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Spending by Category
            </h2>
            <div className="space-y-5">
              {rankedCategories.map((item, index) => {
                const pct =
                  totalSpending > 0 ? (item.total / totalSpending) * 100 : 0;
                const barWidth =
                  maxAmount > 0 ? (item.total / maxAmount) * 100 : 0;
                const color = CATEGORY_COLORS[item.category];
                return (
                  <div key={item.category}>
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-slate-400 text-right flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-lg flex-shrink-0">
                        {CATEGORY_ICONS[item.category]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-800">
                            {item.category}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-xs text-slate-400">
                              {pct.toFixed(1)}%
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.count} transaction
                          {item.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pie chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Distribution
            </h2>
            <CategoryPieChart byCategory={summary.byCategory} />
          </div>
        </div>
      )}
    </div>
  );
}
