"use client";

import { useState } from "react";
import { useExpenses } from "@/lib/hooks";
import { exportToCSV, exportToJSON } from "@/lib/analytics";
import { ExportFormat } from "@/lib/types";

export default function ExportPage() {
  const { expenses, filtered, filters, isLoaded } = useExpenses();
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [useFiltered, setUseFiltered] = useState(false);

  const hasActiveFilters =
    filters.search || filters.category !== "All" || filters.startDate || filters.endDate;
  const exportSet = useFiltered && hasActiveFilters ? filtered : expenses;

  function handleExport() {
    if (format === "csv") {
      exportToCSV(exportSet);
    } else {
      exportToJSON(exportSet);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Export Data</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Download your expense data in your preferred format
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {/* Format selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["csv", "json"] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  format === f
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">{f === "csv" ? "📊" : "📄"}</span>
                <div>
                  <p className="font-semibold text-sm uppercase">{f}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {f === "csv" ? "Spreadsheet compatible" : "Machine readable"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scope selection */}
        {hasActiveFilters && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Data Scope
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!useFiltered}
                  onChange={() => setUseFiltered(false)}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-slate-700">
                  All expenses ({expenses.length} records)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={useFiltered}
                  onChange={() => setUseFiltered(true)}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-slate-700">
                  Filtered expenses ({filtered.length} records)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
          <span className="font-medium">{exportSet.length}</span> expense
          {exportSet.length !== 1 ? "s" : ""} will be exported as{" "}
          <span className="font-medium uppercase">{format}</span>
        </div>

        <button
          onClick={handleExport}
          disabled={expenses.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          📥 Download {format.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
