"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/hooks";
import { computeSummary, formatCurrency, exportToCSV } from "@/lib/analytics";
import SummaryCard from "@/components/ui/SummaryCard";
import SpendingBarChart from "@/components/charts/SpendingBarChart";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CATEGORY_ICONS } from "@/lib/types";

export default function DashboardPage() {
  const { expenses, isLoaded } = useExpenses();

  const summary = useMemo(() => computeSummary(expenses), [expenses]);

  const recentExpenses = expenses.slice(0, 5);

  const trend = useMemo(() => {
    if (summary.lastMonth === 0) return null;
    const pct = ((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100;
    return {
      value: `${Math.abs(pct).toFixed(1)}%`,
      positive: pct <= 0,
    };
  }, [summary]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {format(new Date(), "MMMM yyyy")} overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(expenses)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Export Data
          </button>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span>+</span> Add Expense
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Spending"
          value={formatCurrency(summary.total)}
          subtitle={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`}
          icon="💰"
          color="indigo"
        />
        <SummaryCard
          title="This Month"
          value={formatCurrency(summary.thisMonth)}
          subtitle="Current month"
          icon="📅"
          trend={trend}
          color="emerald"
        />
        <SummaryCard
          title="Last Month"
          value={formatCurrency(summary.lastMonth)}
          subtitle="Previous month"
          icon="📆"
          color="amber"
        />
        <SummaryCard
          title="Top Category"
          value={summary.topCategory ?? "None"}
          subtitle={
            summary.topCategory
              ? formatCurrency(summary.byCategory[summary.topCategory])
              : "No data yet"
          }
          icon={summary.topCategory ? CATEGORY_ICONS[summary.topCategory] : "📊"}
          color="rose"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Monthly Spending (Last 6 Months)
          </h2>
          <SpendingBarChart data={summary.byMonth} />
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            By Category
          </h2>
          <CategoryPieChart byCategory={summary.byCategory} />
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Recent Expenses</h2>
          <Link
            href="/expenses"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View all →
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500 text-sm mb-4">No expenses yet</p>
            <Link
              href="/expenses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Add your first expense
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm flex-shrink-0">
                  {CATEGORY_ICONS[expense.category]}
                </div>
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
        )}
      </div>
    </div>
  );
}
