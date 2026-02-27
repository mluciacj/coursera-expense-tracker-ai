"use client";

import { useState } from "react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Expense } from "@/lib/types";
import {
  ExportRecord,
  ExportStatus,
  CLOUD_INTEGRATIONS,
  getTemplateById,
  downloadExport,
} from "@/lib/cloudExport";

interface Props {
  history: ExportRecord[];
  expenses: Expense[];
}

const STATUS_CONFIG: Record<
  ExportStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700", icon: "✅" },
  failed: { label: "Failed", bg: "bg-red-100", text: "text-red-700", icon: "❌" },
  processing: { label: "Processing", bg: "bg-blue-100", text: "text-blue-700", icon: "⏳" },
  scheduled: { label: "Scheduled", bg: "bg-amber-100", text: "text-amber-700", icon: "📅" },
};

function DestinationBadge({ destination }: { destination: ExportRecord["destination"] }) {
  if (destination === "local") {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <span>💻</span>
        <span>Local</span>
      </span>
    );
  }
  const intg = CLOUD_INTEGRATIONS.find((i) => i.id === destination);
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      <span>{intg?.logo}</span>
      <span>{intg?.name}</span>
    </span>
  );
}

function HistoryRow({
  record,
  expenses,
  onRedownload,
}: {
  record: ExportRecord;
  expenses: Expense[];
  onRedownload: () => void;
}) {
  const template = getTemplateById(record.templateId);
  const status = STATUS_CONFIG[record.status];

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all group">
      {/* Template icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br ${template.gradient}`}
      >
        {template.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm">{template.name}</span>
          <span
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.bg} ${status.text}`}
          >
            <span className="text-xs">{status.icon}</span>
            {status.label}
          </span>
          {record.shareCode && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
              🔗 Shared
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
          <span>{format(parseISO(record.timestamp), "MMM d, yyyy · h:mm a")}</span>
          <span>{record.expenseCount} records</span>
          <span>{record.fileSizeKB} KB</span>
          <span className="uppercase font-mono">{record.format}</span>
          <DestinationBadge destination={record.destination} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {record.status === "completed" && record.destination === "local" && (
          <button
            onClick={onRedownload}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Re-download
          </button>
        )}
        {record.shareCode && (
          <button
            onClick={() => navigator.clipboard.writeText(`https://expensetracker.app/share/${record.shareCode}`)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Copy Link
          </button>
        )}
      </div>

      {/* Relative time - right side */}
      <span className="text-xs text-slate-400 flex-shrink-0 hidden sm:block">
        {formatDistanceToNow(parseISO(record.timestamp), { addSuffix: true })}
      </span>
    </div>
  );
}

function StatsBar({ history }: { history: ExportRecord[] }) {
  const total = history.length;
  const completed = history.filter((h) => h.status === "completed").length;
  const totalKB = history.reduce((s, h) => s + h.fileSizeKB, 0);
  const destinations = new Set(history.map((h) => h.destination)).size;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Exports", value: total, icon: "📤" },
        { label: "Completed", value: completed, icon: "✅" },
        { label: "Total Size", value: `${totalKB} KB`, icon: "💾" },
        { label: "Destinations", value: destinations, icon: "🗺️" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3"
        >
          <span className="text-xl">{stat.icon}</span>
          <div>
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="font-bold text-slate-800 text-sm">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HistoryTab({ history, expenses }: Props) {
  const [filterStatus, setFilterStatus] = useState<ExportStatus | "all">("all");
  const [filterTemplate, setFilterTemplate] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleRedownload(record: ExportRecord) {
    downloadExport(expenses, record.templateId);
    showToast("Re-downloaded successfully!");
  }

  const filtered = history.filter((h) => {
    if (filterStatus !== "all" && h.status !== filterStatus) return false;
    if (filterTemplate !== "all" && h.templateId !== filterTemplate) return false;
    return true;
  });

  // Group by date
  const grouped: Record<string, ExportRecord[]> = {};
  filtered.forEach((record) => {
    const day = format(parseISO(record.timestamp), "MMMM d, yyyy");
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(record);
  });

  const usedTemplateIds = Array.from(new Set(history.map((h) => h.templateId)));

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Export History</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {history.length} export{history.length !== 1 ? "s" : ""} across all time
          </p>
        </div>
      </div>

      {history.length > 0 && <StatsBar history={history} />}

      {history.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ExportStatus | "all")}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as ExportStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All Templates</option>
            {usedTemplateIds.map((id) => {
              const t = getTemplateById(id);
              return (
                <option key={id} value={id}>
                  {t.icon} {t.name}
                </option>
              );
            })}
          </select>

          {(filterStatus !== "all" || filterTemplate !== "all") && (
            <button
              onClick={() => {
                setFilterStatus("all");
                setFilterTemplate("all");
              }}
              className="px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-5xl mb-3">📜</div>
          <h3 className="font-semibold text-slate-700 text-base mb-1">
            {history.length === 0 ? "No exports yet" : "No matching exports"}
          </h3>
          <p className="text-slate-400 text-sm">
            {history.length === 0
              ? "Your export history will appear here once you start exporting."
              : "Try adjusting the filters above."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, records]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {day}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">{records.length} export{records.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {records.map((record) => (
                  <HistoryRow
                    key={record.id}
                    record={record}
                    expenses={expenses}
                    onRedownload={() => handleRedownload(record)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
