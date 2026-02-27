"use client";

import { useState } from "react";
import { Expense } from "@/lib/types";
import {
  EXPORT_TEMPLATES,
  ExportTemplate,
  ExportRecord,
  TemplateId,
  downloadExport,
  getTemplateById,
} from "@/lib/cloudExport";

interface Props {
  expenses: Expense[];
  onExport: (record: ExportRecord) => void;
}

function FieldPill({ label }: { label: string }) {
  return (
    <span className="inline-block px-2 py-0.5 bg-white/20 text-white/90 text-xs rounded-md font-mono">
      {label}
    </span>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: ExportTemplate;
  onSelect: (id: TemplateId) => void;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => onSelect(template.id)}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${template.gradient} p-5`}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{template.icon}</span>
          <div className="flex items-center gap-2">
            {template.badge && (
              <span className="px-2 py-0.5 bg-white/25 text-white text-xs font-semibold rounded-full">
                {template.badge}
              </span>
            )}
            <span className="px-2 py-0.5 bg-black/20 text-white text-xs font-bold rounded-md tracking-wide">
              {template.format}
            </span>
          </div>
        </div>
        <h3 className="text-white font-bold text-base">{template.name}</h3>
        <p className="text-white/75 text-xs mt-1 leading-relaxed line-clamp-2">
          {template.description}
        </p>
      </div>

      {/* Fields */}
      <div className={`bg-gradient-to-br ${template.gradient} px-5 pb-4`}>
        <div className="flex flex-wrap gap-1.5">
          {template.fields.slice(0, 4).map((f) => (
            <FieldPill key={f} label={f} />
          ))}
          {template.fields.length > 4 && (
            <span className="text-white/60 text-xs self-center">
              +{template.fields.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="px-5 py-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template.id);
          }}
          className="w-full py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group-hover:border-slate-300"
        >
          Export Now →
        </button>
      </div>
    </div>
  );
}

function ExportModal({
  templateId,
  expenses,
  onClose,
  onExport,
}: {
  templateId: TemplateId;
  expenses: Expense[];
  onClose: () => void;
  onExport: (record: ExportRecord) => void;
}) {
  const template = getTemplateById(templateId);
  const [dateRange, setDateRange] = useState<"all" | "this-month" | "last-month" | "custom">("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const filteredExpenses = (() => {
    const now = new Date();
    if (dateRange === "this-month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return expenses.filter((e) => new Date(e.date) >= start);
    }
    if (dateRange === "last-month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }
    if (dateRange === "custom" && customStart && customEnd) {
      return expenses.filter((e) => e.date >= customStart && e.date <= customEnd);
    }
    return expenses;
  })();

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      const record = downloadExport(filteredExpenses, templateId);
      setExporting(false);
      setDone(true);
      onExport(record);
      setTimeout(onClose, 1200);
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-br ${template.gradient} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{template.icon}</span>
              <div>
                <h2 className="text-white font-bold text-lg">{template.name}</h2>
                <p className="text-white/70 text-xs">{template.format} format</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-bold text-slate-800 text-lg">Export Complete!</h3>
            <p className="text-slate-500 text-sm mt-1">
              {filteredExpenses.length} expenses exported
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Date range */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["all", "All Time"],
                    ["this-month", "This Month"],
                    ["last-month", "Last Month"],
                    ["custom", "Custom Range"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setDateRange(val)}
                    className={`py-2 px-3 text-sm rounded-xl border transition-colors ${
                      dateRange === val
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Export Preview
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {filteredExpenses.length} records
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex text-xs text-slate-400 font-medium gap-4 px-1">
                  <span className="w-20">Date</span>
                  <span className="w-16">Amount</span>
                  <span>Category</span>
                </div>
                {filteredExpenses.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="flex text-xs text-slate-600 gap-4 px-1 py-0.5 bg-white rounded-lg"
                  >
                    <span className="w-20 font-mono">{e.date}</span>
                    <span className="w-16 font-mono text-slate-800">${e.amount.toFixed(2)}</span>
                    <span className="text-slate-500">{e.category}</span>
                  </div>
                ))}
                {filteredExpenses.length > 3 && (
                  <div className="text-xs text-slate-400 px-1">
                    +{filteredExpenses.length - 3} more rows…
                  </div>
                )}
                {filteredExpenses.length === 0 && (
                  <div className="text-xs text-slate-400 px-1 py-2 text-center">
                    No expenses in selected range
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || filteredExpenses.length === 0}
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all ${
                  exporting
                    ? "bg-indigo-400 cursor-wait"
                    : filteredExpenses.length === 0
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {exporting ? "Exporting…" : `Export ${filteredExpenses.length} Records`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplatesTab({ expenses, onExport }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-800">Export Templates</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Choose a format tailored to your specific use case.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} onSelect={setSelectedTemplate} />
        ))}
      </div>

      {selectedTemplate && (
        <ExportModal
          templateId={selectedTemplate}
          expenses={expenses}
          onClose={() => setSelectedTemplate(null)}
          onExport={(record) => {
            onExport(record);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}
