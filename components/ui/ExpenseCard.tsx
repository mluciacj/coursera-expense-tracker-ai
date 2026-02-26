"use client";

import { format, parseISO } from "date-fns";
import { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/analytics";
import Badge from "./Badge";

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all hover:border-slate-200 group">
      {/* Date block */}
      <div className="text-center min-w-[52px] hidden sm:block">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {format(parseISO(expense.date), "MMM")}
        </p>
        <p className="text-2xl font-bold text-slate-800 leading-none">
          {format(parseISO(expense.date), "d")}
        </p>
        <p className="text-xs text-slate-400">{format(parseISO(expense.date), "yyyy")}</p>
      </div>

      <div className="hidden sm:block w-px h-10 bg-slate-100" />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate flex-1">
            {expense.description}
          </p>
          <Badge category={expense.category} size="sm" />
        </div>
        <p className="text-xs text-slate-400 mt-0.5 sm:hidden">
          {format(parseISO(expense.date), "MMM d, yyyy")}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="text-base font-bold text-slate-900">{formatCurrency(expense.amount)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
