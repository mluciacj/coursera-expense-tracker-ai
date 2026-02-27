"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, Category, Expense } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";
import {
  applyExportFilters,
  buildFilename,
  DEFAULT_EXPORT_CONFIG,
  ExportConfig,
  ExportFormat,
  runExport,
} from "@/lib/exportEngine";
import { formatCurrency } from "@/lib/analytics";
import ExportPreview from "./ExportPreview";

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormatCard({
  value,
  icon,
  label,
  description,
  selected,
  onSelect,
}: {
  value: ExportFormat;
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (v: ExportFormat) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border-2 transition-all duration-150 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
        selected
          ? "border-indigo-500 bg-indigo-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-sm font-semibold ${selected ? "text-indigo-700" : "text-slate-700"}`}>
        {label}
      </span>
      <span className="text-xs text-slate-400 leading-tight">{description}</span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{children}</p>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 my-4" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allExpenses: Expense[];
}

type ExportStep = "configure" | "exporting" | "done";

export default function ExportModal({ isOpen, onClose, allExpenses }: ExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({ ...DEFAULT_EXPORT_CONFIG });
  const [step, setStep] = useState<ExportStep>("configure");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig({ ...DEFAULT_EXPORT_CONFIG });
      setStep("configure");
      setProgress(0);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]);

  // Keyboard close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step === "configure") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, step]);

  // Derive filtered preview data whenever config changes
  const previewData = useMemo(
    () =>
      applyExportFilters(allExpenses, config).sort((a, b) => b.date.localeCompare(a.date)),
    [allExpenses, config]
  );

  const suggestedFilename = useMemo(
    () => buildFilename(config.filename, config.format),
    [config.filename, config.format]
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const patch = useCallback(<K extends keyof ExportConfig>(key: K, val: ExportConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const toggleCategory = useCallback((cat: Category) => {
    setConfig((prev) => {
      const has = prev.categories.includes(cat);
      if (has && prev.categories.length === 1) return prev; // prevent deselecting all
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setConfig((prev) => ({ ...prev, categories: [...CATEGORIES] }));
  }, []);

  const clearAllCategories = useCallback(() => {
    // Keep at least one – if none selected, select first
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.length === CATEGORIES.length ? [CATEGORIES[0]] : prev.categories,
    }));
  }, []);

  const handleExport = useCallback(() => {
    if (previewData.length === 0) return;
    setStep("exporting");
    setProgress(0);

    // Animate progress bar
    const steps = [20, 45, 70, 90, 100];
    let i = 0;
    const tick = () => {
      setProgress(steps[i]);
      i++;
      if (i < steps.length) {
        timerRef.current = setTimeout(tick, 150 + Math.random() * 100);
      } else {
        timerRef.current = setTimeout(() => {
          runExport(allExpenses, config);
          setStep("done");
        }, 200);
      }
    };
    timerRef.current = setTimeout(tick, 80);
  }, [allExpenses, config, previewData.length]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const allSelected = config.categories.length === CATEGORIES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step === "configure" ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">
              📤
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Export Data</h2>
              <p className="text-xs text-slate-400">
                {allExpenses.length} total expense{allExpenses.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
          {step === "configure" && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {step === "configure" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Left column: configuration */}
              <div className="p-6 space-y-5">
                {/* Format */}
                <div>
                  <SectionLabel>Export Format</SectionLabel>
                  <div className="flex gap-2">
                    <FormatCard
                      value="csv"
                      icon="📊"
                      label="CSV"
                      description="Spreadsheet-compatible"
                      selected={config.format === "csv"}
                      onSelect={(v) => patch("format", v)}
                    />
                    <FormatCard
                      value="json"
                      icon="{ }"
                      label="JSON"
                      description="Machine-readable"
                      selected={config.format === "json"}
                      onSelect={(v) => patch("format", v)}
                    />
                    <FormatCard
                      value="pdf"
                      icon="📄"
                      label="PDF"
                      description="Print-ready report"
                      selected={config.format === "pdf"}
                      onSelect={(v) => patch("format", v)}
                    />
                  </div>
                </div>

                <Divider />

                {/* Date range */}
                <div>
                  <SectionLabel>Date Range</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">From</label>
                      <input
                        type="date"
                        value={config.startDate}
                        onChange={(e) => patch("startDate", e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">To</label>
                      <input
                        type="date"
                        value={config.endDate}
                        onChange={(e) => patch("endDate", e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                  {config.startDate && config.endDate && config.startDate > config.endDate && (
                    <p className="text-xs text-rose-500 mt-1.5">Start date must be before end date</p>
                  )}
                </div>

                <Divider />

                {/* Categories */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <SectionLabel>Categories</SectionLabel>
                    <button
                      type="button"
                      onClick={allSelected ? clearAllCategories : selectAllCategories}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => {
                      const checked = config.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                            checked
                              ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
                              checked ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                            }`}
                          >
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span>{CATEGORY_ICONS[cat]}</span>
                          <span className="truncate">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Divider />

                {/* Filename */}
                <div>
                  <SectionLabel>Filename</SectionLabel>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.filename}
                      onChange={(e) => patch("filename", e.target.value)}
                      placeholder="Leave blank for auto-generated name"
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 placeholder:text-slate-300 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                      .{config.format}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Will save as: <span className="text-slate-600 font-medium">{suggestedFilename}</span>
                  </p>
                </div>
              </div>

              {/* Right column: preview */}
              <div className="p-6 flex flex-col gap-4 bg-slate-50/50">
                <div>
                  <SectionLabel>Data Preview</SectionLabel>

                  {/* Stats strip */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <StatPill
                      label="Records"
                      value={String(previewData.length)}
                      highlight={previewData.length > 0}
                    />
                    <StatPill
                      label="Total"
                      value={formatCurrency(previewData.reduce((s, e) => s + e.amount, 0))}
                      highlight={previewData.length > 0}
                    />
                    <StatPill
                      label="Categories"
                      value={String(new Set(previewData.map((e) => e.category)).size)}
                      highlight={previewData.length > 0}
                    />
                  </div>

                  <ExportPreview expenses={previewData} totalCount={previewData.length} />
                </div>
              </div>
            </div>
          )}

          {/* ── Exporting state ── */}
          {step === "exporting" && (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl mb-6 animate-bounce">
                {config.format === "csv" ? "📊" : config.format === "json" ? "{ }" : "📄"}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Preparing Export…</h3>
              <p className="text-sm text-slate-500 mb-8">
                Processing {previewData.length} record{previewData.length !== 1 ? "s" : ""}
              </p>
              <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-3">{progress}%</p>
            </div>
          )}

          {/* ── Done state ── */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mb-6">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Export Complete!</h3>
              <p className="text-sm text-slate-500 mb-2">
                <span className="font-semibold text-slate-700">{suggestedFilename}</span>
              </p>
              <p className="text-sm text-slate-400 mb-8">
                {previewData.length} record{previewData.length !== 1 ? "s" : ""} exported successfully
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("configure");
                    setProgress(0);
                  }}
                  className="px-5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Export Again
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-medium text-white bg-slate-800 rounded-xl hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer (only in configure step) ── */}
        {step === "configure" && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4 shrink-0">
            {/* Export summary */}
            <div className="flex items-center gap-3">
              {previewData.length > 0 ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-600">
                    Ready to export{" "}
                    <span className="font-semibold text-slate-900">{previewData.length}</span>
                    {" "}record{previewData.length !== 1 ? "s" : ""} ·{" "}
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(previewData.reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <p className="text-sm text-slate-500">No records match current filters</p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={
                  previewData.length === 0 ||
                  (config.startDate !== "" &&
                    config.endDate !== "" &&
                    config.startDate > config.endDate)
                }
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <span>↓</span>
                Export {config.format.toUpperCase()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small helper component ───────────────────────────────────────────────────

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 border text-center transition-colors ${
        highlight ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${highlight ? "text-indigo-700" : "text-slate-400"}`}>
        {value}
      </p>
    </div>
  );
}
