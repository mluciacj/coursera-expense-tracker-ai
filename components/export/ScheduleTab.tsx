"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BackupSchedule,
  ConnectedIntegration,
  EXPORT_TEMPLATES,
  CLOUD_INTEGRATIONS,
  ExportFrequency,
  TemplateId,
  IntegrationId,
  computeNextRun,
  getIntegrationById,
  getTemplateById,
} from "@/lib/cloudExport";

interface Props {
  schedules: BackupSchedule[];
  connections: ConnectedIntegration[];
  onAdd: (schedule: BackupSchedule) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}

const FREQUENCY_LABELS: Record<ExportFrequency, { label: string; icon: string; desc: string }> = {
  daily: { label: "Daily", icon: "🌅", desc: "Every day at the chosen time" },
  weekly: { label: "Weekly", icon: "📆", desc: "Every 7 days" },
  monthly: { label: "Monthly", icon: "🗓️", desc: "On the 1st of each month" },
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? "AM" : "PM";
  const h = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return { value: i, label: `${h}:00 ${ampm}` };
});

function DestinationLabel({ id }: { id: IntegrationId | "local" }) {
  if (id === "local") {
    return (
      <span className="flex items-center gap-1">
        <span>💻</span>
        <span>Local Download</span>
      </span>
    );
  }
  const intg = CLOUD_INTEGRATIONS.find((i) => i.id === id);
  return (
    <span className="flex items-center gap-1">
      <span>{intg?.logo}</span>
      <span>{intg?.name}</span>
    </span>
  );
}

function ScheduleCard({
  schedule,
  onToggle,
  onRemove,
}: {
  schedule: BackupSchedule;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const template = getTemplateById(schedule.templateId);
  const freqInfo = FREQUENCY_LABELS[schedule.frequency];

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        schedule.enabled
          ? "bg-white border-slate-100 shadow-sm"
          : "bg-slate-50 border-slate-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-2xl mt-0.5">{template.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">{schedule.name}</span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  schedule.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {schedule.enabled ? "Active" : "Paused"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span>{freqInfo.icon}</span>
                <span>{freqInfo.label}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>🕐</span>
                <span>{HOURS[schedule.hour].label}</span>
              </span>
              <span>
                <DestinationLabel id={schedule.destination} />
              </span>
              <span className="flex items-center gap-1">
                <span>📤</span>
                <span>{template.name}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 mt-2 text-xs">
              {schedule.lastRunAt && (
                <span className="text-slate-400">
                  Last run: {format(parseISO(schedule.lastRunAt), "MMM d, h:mm a")}
                </span>
              )}
              {schedule.enabled && (
                <span className="text-indigo-600 font-medium">
                  Next: {format(parseISO(schedule.nextRunAt), "MMM d, h:mm a")}
                </span>
              )}
              <span className="text-slate-400">{schedule.runCount} runs total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle */}
          <button
            onClick={() => onToggle(schedule.id, !schedule.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              schedule.enabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                schedule.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <button
            onClick={() => onRemove(schedule.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
            title="Remove schedule"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

function AddScheduleForm({
  connections,
  onSave,
  onCancel,
}: {
  connections: ConnectedIntegration[];
  onSave: (schedule: BackupSchedule) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("Weekly Backup");
  const [frequency, setFrequency] = useState<ExportFrequency>("weekly");
  const [hour, setHour] = useState(9);
  const [destination, setDestination] = useState<IntegrationId | "local">("local");
  const [templateId, setTemplateId] = useState<TemplateId>("full-backup");

  function handleSave() {
    const schedule: BackupSchedule = {
      id: crypto.randomUUID(),
      name,
      enabled: true,
      frequency,
      hour,
      destination,
      templateId,
      createdAt: new Date().toISOString(),
      nextRunAt: computeNextRun(frequency, hour),
      runCount: 0,
    };
    onSave(schedule);
  }

  const isValid = name.trim().length > 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span>⏰</span> New Backup Schedule
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 text-xl">
          ×
        </button>
      </div>

      {/* Schedule name */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Schedule Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          placeholder="e.g. Monthly Tax Backup"
        />
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Frequency
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(FREQUENCY_LABELS) as [ExportFrequency, typeof FREQUENCY_LABELS[ExportFrequency]][]).map(
            ([freq, info]) => (
              <button
                key={freq}
                onClick={() => setFrequency(freq)}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-colors ${
                  frequency === freq
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-xl mb-1">{info.icon}</span>
                <span className="text-xs font-semibold">{info.label}</span>
                <span className="text-xs text-slate-400 mt-0.5 leading-tight">{info.desc}</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Time */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Run At
          </label>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* Template */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Template
          </label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as TemplateId)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {EXPORT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Destination
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDestination("local")}
            className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors ${
              destination === "local"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>💻</span>
            <span className="font-medium">Local Download</span>
          </button>
          {connections.map((conn) => {
            const intg = CLOUD_INTEGRATIONS.find((i) => i.id === conn.id)!;
            return (
              <button
                key={conn.id}
                onClick={() => setDestination(conn.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors ${
                  destination === conn.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{intg.logo}</span>
                <span className="font-medium truncate">{intg.name}</span>
              </button>
            );
          })}
        </div>
        {connections.length === 0 && (
          <p className="text-xs text-slate-400 mt-1.5">
            Connect a cloud service in the Integrations tab to enable cloud destinations.
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white/70 rounded-xl p-3 border border-indigo-100">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Summary:</span> Export{" "}
          <span className="text-indigo-600 font-medium">
            {getTemplateById(templateId).name}
          </span>{" "}
          <span className="text-indigo-600 font-medium">{frequency}</span> at{" "}
          <span className="text-indigo-600 font-medium">{HOURS[hour].label}</span> to{" "}
          <span className="text-indigo-600 font-medium">
            {destination === "local"
              ? "local download"
              : CLOUD_INTEGRATIONS.find((i) => i.id === destination)?.name}
          </span>
          . Next run:{" "}
          <span className="text-indigo-600 font-medium">
            {format(parseISO(computeNextRun(frequency, hour)), "MMM d, h:mm a")}
          </span>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${
            isValid ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          Create Schedule
        </button>
      </div>
    </div>
  );
}

export default function ScheduleTab({ schedules, connections, onAdd, onToggle, onRemove }: Props) {
  const [showForm, setShowForm] = useState(false);

  const active = schedules.filter((s) => s.enabled);
  const paused = schedules.filter((s) => !s.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Backup Schedules</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Automatically export your data on a recurring basis.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <span>+</span> New Schedule
          </button>
        )}
      </div>

      {showForm && (
        <AddScheduleForm
          connections={connections}
          onSave={(s) => {
            onAdd(s);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {schedules.length === 0 && !showForm && (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-5xl mb-3">⏰</div>
          <h3 className="font-semibold text-slate-700 text-base mb-1">No schedules yet</h3>
          <p className="text-slate-400 text-sm mb-5">
            Set up automatic backups so you never lose your expense data.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
          >
            Create First Schedule
          </button>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Active ({active.length})
          </h3>
          <div className="space-y-3">
            {active.map((s) => (
              <ScheduleCard key={s.id} schedule={s} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}

      {paused.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Paused ({paused.length})
          </h3>
          <div className="space-y-3">
            {paused.map((s) => (
              <ScheduleCard key={s.id} schedule={s} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
