"use client";

import { Expense } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";
import { formatCurrency } from "@/lib/analytics";

interface ExportPreviewProps {
  expenses: Expense[];
  totalCount: number;
}

const PAGE_LIMIT = 8;

export default function ExportPreview({ expenses, totalCount }: ExportPreviewProps) {
  const visible = expenses.slice(0, PAGE_LIMIT);
  const hidden = totalCount - visible.length;
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm font-medium text-slate-700">No records match your filters</p>
        <p className="text-xs text-slate-400 mt-1">Adjust the date range or category selection</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Summary pill */}
      <div className="flex items-center justify-between text-xs font-medium px-0.5">
        <span className="text-slate-500">
          Showing{" "}
          <span className="text-slate-800 font-semibold">{Math.min(PAGE_LIMIT, totalCount)}</span>
          {" "}of{" "}
          <span className="text-slate-800 font-semibold">{totalCount}</span>{" "}
          record{totalCount !== 1 ? "s" : ""}
        </span>
        <span className="text-indigo-600 font-semibold">{formatCurrency(total)}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e, i) => (
              <tr
                key={e.id}
                className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
              >
                <td className="px-3 py-2 text-slate-500 font-mono text-xs whitespace-nowrap">{e.date}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                    <span>{CATEGORY_ICONS[e.category]}</span>
                    {e.category}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-700 max-w-[160px] truncate">{e.description}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(e.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Overflow indicator */}
      {hidden > 0 && (
        <p className="text-center text-xs text-slate-400 py-1">
          + {hidden} more record{hidden !== 1 ? "s" : ""} not shown in preview
        </p>
      )}
    </div>
  );
}
