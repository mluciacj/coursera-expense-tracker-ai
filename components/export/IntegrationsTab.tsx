"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Expense } from "@/lib/types";
import {
  CLOUD_INTEGRATIONS,
  INTEGRATION_CATEGORY_LABELS,
  CloudIntegration,
  ConnectedIntegration,
  ExportRecord,
  IntegrationId,
  ExportFormat,
  EXPORT_TEMPLATES,
  TemplateId,
  addExportRecord,
  buildExportPayload,
} from "@/lib/cloudExport";

interface Props {
  connections: ConnectedIntegration[];
  expenses: Expense[];
  onConnect: (conn: ConnectedIntegration) => void;
  onDisconnect: (id: IntegrationId) => void;
  onExportToCloud: (record: ExportRecord) => void;
}

// ─── OAuth Flow Modal ──────────────────────────────────────────────────────────

function ConnectModal({
  integration,
  onClose,
  onConnect,
}: {
  integration: CloudIntegration;
  onClose: () => void;
  onConnect: (conn: ConnectedIntegration) => void;
}) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [connecting, setConnecting] = useState(false);
  const totalSteps = integration.authSteps.length;

  function handleNext() {
    if (step < totalSteps - 1) {
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        setStep((s) => s + 1);
      }, 900);
    } else {
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        const conn: ConnectedIntegration = {
          id: integration.id,
          connectedAt: new Date().toISOString(),
          accountEmail: email || `user@${integration.id.replace("-", "")}.com`,
          syncStatus: "synced",
          autoSync: true,
        };
        onConnect(conn);
        onClose();
      }, 1200);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="p-6 border-b border-slate-100"
          style={{ backgroundColor: integration.bgColor, borderColor: integration.borderColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                style={{ backgroundColor: "white", border: `1.5px solid ${integration.borderColor}` }}
              >
                {integration.logo}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Connect {integration.name}</h2>
                <p className="text-slate-500 text-xs">Step {step + 1} of {totalSteps}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">
              ×
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 bg-white/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((step + 1) / totalSteps) * 100}%`,
                backgroundColor: integration.color,
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: integration.color }}
              >
                {step + 1}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  {integration.authSteps[step]}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {step === 0 && "A secure authorization window will open in your browser."}
                  {step === 1 && "We only request the minimum permissions needed."}
                  {step === 2 && "You can change this at any time in settings."}
                </p>
              </div>
            </div>
          </div>

          {/* Email input for email integration */}
          {integration.id === "email" && step === 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}

          {/* Simulated browser popup hint */}
          {step < totalSteps - 1 && integration.id !== "email" && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <span>🔐</span>
              <span>A secure popup window will open for authentication.</span>
            </div>
          )}

          {step === totalSteps - 1 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
              <span>✅</span>
              <span>Almost done! Click Connect to finalize the integration.</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={connecting || (integration.id === "email" && step === 0 && !email)}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
              style={{
                backgroundColor: connecting ? "#94a3b8" : integration.color,
                cursor: connecting ? "wait" : "pointer",
              }}
            >
              {connecting
                ? "Connecting…"
                : step === totalSteps - 1
                ? "Connect"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cloud Sync Modal ──────────────────────────────────────────────────────────

function SyncModal({
  connection,
  integration,
  expenses,
  onClose,
  onSync,
}: {
  connection: ConnectedIntegration;
  integration: CloudIntegration;
  expenses: Expense[];
  onClose: () => void;
  onSync: (record: ExportRecord) => void;
}) {
  const [templateId, setTemplateId] = useState<TemplateId>("tax-report");
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => {
      const record: ExportRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        templateId,
        destination: integration.id,
        format: EXPORT_TEMPLATES.find((t) => t.id === templateId)!.format as ExportFormat,
        status: "completed",
        expenseCount: expenses.length,
        fileSizeKB: Math.max(1, Math.round(buildExportPayload(expenses, templateId).length / 1024)),
      };
      addExportRecord(record);
      setSyncing(false);
      setDone(true);
      onSync(record);
      setTimeout(onClose, 1500);
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: integration.bgColor }}
            >
              {integration.logo}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Sync to {integration.name}</h3>
              <p className="text-slate-500 text-xs">{connection.accountEmail}</p>
            </div>
            <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700">
              ×
            </button>
          </div>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">☁️</div>
            <p className="font-semibold text-slate-800">Synced successfully!</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Export Template
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value as TemplateId)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {EXPORT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name} ({t.format})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
                style={{ backgroundColor: syncing ? "#94a3b8" : integration.color }}
              >
                {syncing ? "Syncing…" : "Sync Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntegrationsTab({
  connections,
  expenses,
  onConnect,
  onDisconnect,
  onExportToCloud,
}: Props) {
  const [connectingTo, setConnectingTo] = useState<CloudIntegration | null>(null);
  const [syncingWith, setSyncingWith] = useState<{
    conn: ConnectedIntegration;
    integration: CloudIntegration;
  } | null>(null);

  const connectedIds = new Set(connections.map((c) => c.id));
  const categories = Array.from(
    new Set(CLOUD_INTEGRATIONS.map((i) => i.category))
  ) as CloudIntegration["category"][];

  const availableIntegrations = CLOUD_INTEGRATIONS.filter((i) => !connectedIds.has(i.id));

  return (
    <div className="space-y-8">
      {/* Connected */}
      {connections.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Connected ({connections.length})
          </h2>
          <div className="space-y-3">
            {connections.map((conn) => {
              const integration = CLOUD_INTEGRATIONS.find((i) => i.id === conn.id)!;
              return (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: integration.bgColor }}
                    >
                      {integration.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">
                          {integration.name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{conn.accountEmail}</p>
                      {conn.lastSync && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Last sync: {format(parseISO(conn.lastSync), "MMM d, h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSyncingWith({ conn, integration })}
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors"
                      style={{ backgroundColor: integration.color }}
                    >
                      Sync
                    </button>
                    <button
                      onClick={() => onDisconnect(conn.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available */}
      {availableIntegrations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            {connections.length > 0 ? "Add More" : "Available Integrations"}
          </h2>

          {categories.map((cat) => {
            const items = availableIntegrations.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {INTEGRATION_CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: integration.bgColor }}
                      >
                        {integration.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{integration.name}</p>
                        <p className="text-xs text-slate-500 truncate">{integration.description}</p>
                      </div>
                      <button
                        onClick={() => setConnectingTo(integration)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                        style={{
                          color: integration.color,
                          borderColor: integration.borderColor,
                          backgroundColor: integration.bgColor,
                        }}
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {connections.length === 0 && availableIntegrations.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">🔌</div>
          <p className="text-sm">All integrations are connected!</p>
        </div>
      )}

      {connectingTo && (
        <ConnectModal
          integration={connectingTo}
          onClose={() => setConnectingTo(null)}
          onConnect={(conn) => {
            onConnect(conn);
            setConnectingTo(null);
          }}
        />
      )}

      {syncingWith && (
        <SyncModal
          connection={syncingWith.conn}
          integration={syncingWith.integration}
          expenses={expenses}
          onClose={() => setSyncingWith(null)}
          onSync={(record) => {
            onExportToCloud(record);
            setSyncingWith(null);
          }}
        />
      )}
    </div>
  );
}
