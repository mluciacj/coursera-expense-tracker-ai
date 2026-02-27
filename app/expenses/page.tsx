"use client";

import { useState, useMemo } from "react";
import { useExpenses } from "@/lib/hooks";
import { formatCurrency } from "@/lib/analytics";
import { Expense, ExpenseFilters } from "@/lib/types";
import ExpenseCard from "@/components/ui/ExpenseCard";
import FilterBar from "@/components/forms/FilterBar";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ExpenseForm from "@/components/forms/ExpenseForm";
import ExportModal from "@/components/export/ExportModal";

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  startDate: "",
  endDate: "",
};

export default function ExpensesPage() {
  const { expenses, filtered, filters, setFilters, add, update, remove, isLoaded } =
    useExpenses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function handleAdd(data: Parameters<typeof add>[0]) {
    add(data);
    setShowAddModal(false);
    showSuccess("Expense added successfully!");
  }

  function handleUpdate(data: Parameters<typeof add>[0]) {
    if (!editTarget) return;
    update(editTarget.id, data);
    setEditTarget(null);
    showSuccess("Expense updated successfully!");
  }

  function handleDelete(id: string) {
    remove(id);
    showSuccess("Expense deleted.");
  }

  const totalFiltered = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {expenses.length} total expense{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span>📤</span> Export
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span>+</span> Add Expense
          </button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right-5">
          ✓ {successMsg}
        </div>
      )}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Results count + total */}
      {(filters.search || filters.category !== "All" || filters.startDate || filters.endDate) && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-1">
          <span>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
          </span>
          <span className="font-semibold text-slate-700">
            Total: {formatCurrency(totalFiltered)}
          </span>
        </div>
      )}

      {/* Expense List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          {expenses.length === 0 ? (
            <>
              <p className="text-5xl mb-4">💳</p>
              <h3 className="text-base font-semibold text-slate-800 mb-2">
                No expenses yet
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Start tracking your spending by adding your first expense
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                + Add Expense
              </button>
            </>
          ) : (
            <>
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-base font-semibold text-slate-800 mb-2">
                No matching expenses
              </h3>
              <p className="text-slate-500 text-sm">
                Try adjusting your search or filters
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Expense"
      >
        <ExpenseForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit Expense"
      >
        <ExpenseForm
          initial={editTarget ?? undefined}
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        allExpenses={expenses}
      />
    </div>
  );
}
