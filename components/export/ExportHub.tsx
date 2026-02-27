"use client";

import { useState, useEffect } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { useExpenses } from "@/lib/hooks";
import {
  ConnectedIntegration,
  ExportRecord,
  BackupSchedule,
  SharedExport,
  IntegrationId,
  CLOUD_INTEGRATIONS,
  getConnections,
  saveConnection,
  removeConnection,
  getExportHistory,
  addExportRecord,
  getSchedules,
  saveSchedule,
  removeSchedule,
  getSharedExports,
  saveSharedExport,
} from "@/lib/cloudExport";

import TemplatesTab from "./TemplatesTab";
import IntegrationsTab from "./IntegrationsTab";
import ScheduleTab from "./ScheduleTab";
import HistoryTab from "./HistoryTab";
import ShareTab from "./ShareTab";

type Tab = "templates" | "integrations" | "schedule" | "history" | "share";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "templates", label: "Templates", icon: "📋" },
  { id: "integrations", label: "Integrations", icon: "🔌" },
  { id: "schedule", label: "Schedule", icon: "⏰" },
  { id: "history", label: "History", icon: "📜" },
  { id: "share", label: "Share", icon: "🔗" },
];

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed top-4 right-4 z-[100] bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right-5">
      <span className="text-base">✓</span>
      {message}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ExportHub() {
  const { expenses, isLoaded } = useExpenses();

  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [connections, setConnections] = useState<ConnectedIntegration[]>([]);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [shares, setShares] = useState<SharedExport[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setConnections(getConnections());
    setHistory(getExportHistory());
    setSchedules(getSchedules());
    setShares(getSharedExports());
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleExport(record: ExportRecord) {
    setHistory(getExportHistory());
    showToast(`Export complete — ${record.expenseCount} records saved.`);
  }

  function handleConnect(conn: ConnectedIntegration) {
    saveConnection(conn);
    setConnections(getConnections());
    const name = CLOUD_INTEGRATIONS.find((i) => i.id === conn.id)?.name ?? conn.id;
    showToast(`${name} connected successfully!`);
  }

  function handleDisconnect(id: IntegrationId) {
    removeConnection(id);
    setConnections(getConnections());
    showToast("Integration disconnected.");
  }

  function handleCloudExport(record: ExportRecord) {
    addExportRecord(record);
    setHistory(getExportHistory());
    const name = record.destination === "local"
      ? "locally"
      : CLOUD_INTEGRATIONS.find((i) => i.id === record.destination)?.name ?? record.destination;
    showToast(`Synced to ${name}!`);
  }

  function handleAddSchedule(schedule: BackupSchedule) {
    saveSchedule(schedule);
    setSchedules(getSchedules());
    showToast("Backup schedule created!");
  }

  function handleToggleSchedule(id: string, enabled: boolean) {
    const sched = schedules.find((s) => s.id === id);
    if (!sched) return;
    saveSchedule({ ...sched, enabled });
    setSchedules(getSchedules());
  }

  function handleRemoveSchedule(id: string) {
    removeSchedule(id);
    setSchedules(getSchedules());
    showToast("Schedule removed.");
  }

  function handleShare(share: SharedExport) {
    saveSharedExport(share);
    setShares(getSharedExports());
    setHistory(getExportHistory());
    showToast("Share link generated and copied!");
  }

  // Stats
  const thisMonthExports = history.filter(
    (h) => parseISO(h.timestamp) >= startOfMonth(new Date())
  ).length;

  const activeSchedules = schedules.filter((s) => s.enabled).length;

  const nextSchedule = schedules
    .filter((s) => s.enabled)
    .sort((a, b) => (a.nextRunAt < b.nextRunAt ? -1 : 1))[0];

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {toast && <Toast message={toast} />}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="text-2xl">☁️</span>
            Export & Sync Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Export, share, and automatically sync your expense data across any service.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {connections.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              {connections.length} service{connections.length !== 1 ? "s" : ""} connected
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon="📤"
          label="Total Exports"
          value={history.length}
          sub={`${thisMonthExports} this month`}
          color="bg-indigo-50"
        />
        <StatCard
          icon="🔌"
          label="Connected"
          value={connections.length}
          sub={`of ${CLOUD_INTEGRATIONS.length} available`}
          color="bg-green-50"
        />
        <StatCard
          icon="⏰"
          label="Active Schedules"
          value={activeSchedules}
          sub={activeSchedules === 0 ? "Set one up →" : "running automatically"}
          color="bg-amber-50"
        />
        <StatCard
          icon="🔗"
          label="Active Shares"
          value={shares.filter((s) => new Date(s.expiresAt) > new Date()).length}
          sub={`${shares.length} total created`}
          color="bg-purple-50"
        />
      </div>

      {/* Next backup banner */}
      {nextSchedule && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="font-semibold text-sm">Next auto-backup</p>
              <p className="text-white/75 text-xs">
                {nextSchedule.name} · {format(parseISO(nextSchedule.nextRunAt), "EEEE, MMM d 'at' h:mm a")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("schedule")}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Manage →
          </button>
        </div>
      )}

      {/* Tab container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map((tab) => {
            const badge =
              tab.id === "history"
                ? history.length
                : tab.id === "integrations"
                ? connections.length
                : tab.id === "schedule"
                ? activeSchedules
                : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/60"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {badge > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white"
                        : tab.id === "integrations"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "templates" && (
            <TemplatesTab expenses={expenses} onExport={handleExport} />
          )}
          {activeTab === "integrations" && (
            <IntegrationsTab
              connections={connections}
              expenses={expenses}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onExportToCloud={handleCloudExport}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab
              schedules={schedules}
              connections={connections}
              onAdd={handleAddSchedule}
              onToggle={handleToggleSchedule}
              onRemove={handleRemoveSchedule}
            />
          )}
          {activeTab === "history" && (
            <HistoryTab history={history} expenses={expenses} />
          )}
          {activeTab === "share" && (
            <ShareTab expenses={expenses} shares={shares} onShare={handleShare} />
          )}
        </div>
      </div>

      {/* Tip footer */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
        <span className="text-xl">💡</span>
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Pro tip:</span> Connect Google Sheets and
          create a weekly schedule to automatically keep a live spreadsheet of your expenses — great
          for shared household budgets or business expense tracking.
        </p>
      </div>
    </div>
  );
}
