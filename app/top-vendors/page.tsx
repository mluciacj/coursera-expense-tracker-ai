"use client";

import { useMemo } from "react";
import { useExpenses } from "@/lib/hooks";
import { formatCurrency } from "@/lib/analytics";
import SummaryCard from "@/components/ui/SummaryCard";
import Badge from "@/components/ui/Badge";
import { Category } from "@/lib/types";
import Link from "next/link";

interface VendorData {
  name: string;
  total: number;
  count: number;
  topCategory: Category;
}

export default function TopVendorsPage() {
  const { expenses, isLoaded } = useExpenses();

  const vendors = useMemo<VendorData[]>(() => {
    const map = new Map<
      string,
      { total: number; count: number; categories: Record<string, number>; displayName: string }
    >();

    for (const expense of expenses) {
      const key = expense.description.trim().toLowerCase();
      if (!key) continue;
      const existing = map.get(key) ?? {
        total: 0,
        count: 0,
        categories: {},
        displayName: expense.description.trim(),
      };
      existing.total += expense.amount;
      existing.count += 1;
      existing.categories[expense.category] =
        (existing.categories[expense.category] ?? 0) + 1;
      map.set(key, existing);
    }

    return Array.from(map.values())
      .map((data) => {
        const topCategory = Object.entries(data.categories).sort(
          (a, b) => b[1] - a[1]
        )[0][0] as Category;
        return {
          name: data.displayName,
          total: data.total,
          count: data.count,
          topCategory,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const totalSpending = vendors.reduce((sum, v) => sum + v.total, 0);
  const maxAmount = vendors[0]?.total ?? 0;

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
        <h1 className="text-2xl font-bold text-slate-900">Top Vendors</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {expenses.length} expense{expenses.length !== 1 ? "s" : ""} across{" "}
          {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
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
          title="Top Vendor"
          value={vendors[0]?.name ?? "None"}
          subtitle={
            vendors[0] ? formatCurrency(vendors[0].total) : "No data yet"
          }
          icon="🏪"
          color="rose"
        />
        <SummaryCard
          title="Unique Vendors"
          value={String(vendors.length)}
          subtitle="distinct merchants"
          icon="🏬"
          color="emerald"
        />
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-5xl mb-4">🏪</p>
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            No vendors yet
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Add expenses with descriptions to see your top vendors
          </p>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            + Add Expense
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Spending by Vendor
          </h2>
          <div className="space-y-4">
            {vendors.map((vendor, index) => {
              const pct =
                totalSpending > 0 ? (vendor.total / totalSpending) * 100 : 0;
              const barWidth =
                maxAmount > 0 ? (vendor.total / maxAmount) * 100 : 0;
              const initial = vendor.name.charAt(0).toUpperCase();
              return (
                <div key={vendor.name} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-slate-400 text-right flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {vendor.name}
                        </span>
                        <Badge category={vendor.topCategory} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-slate-400">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(vendor.total)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {vendor.count} transaction{vendor.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
