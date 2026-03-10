"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useExpenses } from "@/lib/hooks";
import { computeSummary, formatCurrency } from "@/lib/analytics";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORIES } from "@/lib/types";
import { format, parseISO, startOfMonth, subDays } from "date-fns";
import BudgetStreak from "@/components/insights/BudgetStreak";

export default function InsightsPage() {
  const { expenses, isLoaded } = useExpenses();

  const summary = useMemo(() => computeSummary(expenses), [expenses]);

  const chartData = useMemo(
    () =>
      CATEGORIES.filter((cat) => summary.byCategory[cat] > 0).map((cat) => ({
        name: cat,
        value: summary.byCategory[cat],
        color: CATEGORY_COLORS[cat],
      })),
    [summary]
  );

  const top3 = useMemo(
    () =>
      [...chartData]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3),
    [chartData]
  );

  const streak = useMemo(() => {
    if (!expenses.length) return 0;
    const today = new Date();
    const daysWithExpenses = new Set(
      expenses
        .filter((e) => {
          const d = parseISO(e.date);
          return d >= startOfMonth(today) && d <= today;
        })
        .map((e) => e.date)
    );
    let count = 0;
    let cursor = today;
    while (daysWithExpenses.has(format(cursor, "yyyy-MM-dd"))) {
      count++;
      cursor = subDays(cursor, 1);
    }
    return count;
  }, [expenses]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Monthly Insights
        </h1>
        <div className="mt-1 flex justify-center">
          <svg width="200" height="10" viewBox="0 0 200 10" className="text-slate-400">
            <path
              d="M0 5 Q10 2 20 5 Q30 8 40 5 Q50 2 60 5 Q70 8 80 5 Q90 2 100 5 Q110 8 120 5 Q130 2 140 5 Q150 8 160 5 Q170 2 180 5 Q190 8 200 5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 2"
            />
          </svg>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-lg p-6 space-y-6">

        {/* Donut Chart */}
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            No spending data yet
          </div>
        ) : (
          <div className="flex justify-center relative">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Amount"]}
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                Spending
              </span>
            </div>
          </div>
        )}

        {/* Top 3 Categories */}
        {top3.length > 0 && (
          <div className="space-y-3">
            {top3.map((entry) => (
              <div key={entry.name} className="flex items-center gap-3">
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-base">{CATEGORY_ICONS[entry.name as keyof typeof CATEGORY_ICONS]}</span>
                <span className="flex-1 text-sm font-medium text-slate-700">
                  {entry.name}:
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
            <p className="text-right text-xs text-slate-400 italic">Top 3!</p>
          </div>
        )}

        {/* Divider */}
        <hr className="border-slate-100" />

        {/* Budget Streak */}
        <BudgetStreak streak={streak} />
      </div>
    </div>
  );
}
