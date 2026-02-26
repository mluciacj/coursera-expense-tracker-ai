"use client";

import { CATEGORIES, ExpenseFilters } from "@/lib/types";

interface FilterBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  onReset: () => void;
}

export default function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  function update(key: keyof ExpenseFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters =
    filters.search || filters.category !== "All" || filters.startDate || filters.endDate;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => update("category", e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white min-w-36"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Start date */}
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => update("startDate", e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
          title="From date"
        />

        {/* End date */}
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => update("endDate", e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
          title="To date"
        />

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
