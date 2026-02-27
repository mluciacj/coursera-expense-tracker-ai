import { format, addDays, addWeeks, addMonths } from "date-fns";
import { Expense } from "./types";

// ─── Core Types ──────────────────────────────────────────────────────────────

export type TemplateId =
  | "tax-report"
  | "monthly-summary"
  | "category-analysis"
  | "full-backup"
  | "accountant-format"
  | "spending-insights";

export type IntegrationId =
  | "google-sheets"
  | "google-drive"
  | "dropbox"
  | "onedrive"
  | "notion"
  | "airtable"
  | "slack"
  | "email";

export type ExportFormat = "CSV" | "JSON" | "PDF" | "XLSX";
export type ExportFrequency = "daily" | "weekly" | "monthly";
export type ExportStatus = "completed" | "failed" | "processing" | "scheduled";

export interface ExportTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  format: ExportFormat;
  fields: string[];
  gradient: string;
  accentColor: string;
  badge?: string;
}

export interface CloudIntegration {
  id: IntegrationId;
  name: string;
  logo: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  category: "cloud" | "productivity" | "communication";
  authSteps: string[];
}

export interface ConnectedIntegration {
  id: IntegrationId;
  connectedAt: string;
  accountEmail: string;
  lastSync?: string;
  syncStatus: "synced" | "syncing" | "error" | "idle";
  autoSync: boolean;
}

export interface ExportRecord {
  id: string;
  timestamp: string;
  templateId: TemplateId;
  destination: IntegrationId | "local";
  format: ExportFormat;
  status: ExportStatus;
  expenseCount: number;
  fileSizeKB: number;
  shareCode?: string;
  errorMessage?: string;
}

export interface BackupSchedule {
  id: string;
  name: string;
  enabled: boolean;
  frequency: ExportFrequency;
  hour: number;
  destination: IntegrationId | "local";
  templateId: TemplateId;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt: string;
  runCount: number;
}

export interface SharedExport {
  code: string;
  templateId: TemplateId;
  createdAt: string;
  expiresAt: string;
  accessCount: number;
  maxAccess: number | null;
  passwordProtected: boolean;
  url: string;
  note?: string;
}

// ─── Static Definitions ──────────────────────────────────────────────────────

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: "tax-report",
    name: "Tax Report",
    description:
      "IRS-ready report grouped by deductible categories with subtotals, ready to hand to your accountant.",
    icon: "🧾",
    format: "CSV",
    fields: ["Date", "Amount", "Category", "Description", "Tax Year", "Deductible?"],
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "emerald",
    badge: "Most Popular",
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description:
      "Clean month-by-month breakdown with totals, category splits, and month-over-month trend data.",
    icon: "📅",
    format: "PDF",
    fields: ["Month", "Total Spent", "By Category", "Top Expense", "vs Last Month"],
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "blue",
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description:
      "Deep-dive into spending patterns per category with percentage breakdowns and trend indicators.",
    icon: "🎯",
    format: "XLSX",
    fields: ["Category", "Total", "% of Spend", "Avg per Transaction", "Trend"],
    gradient: "from-violet-500 to-purple-600",
    accentColor: "violet",
  },
  {
    id: "full-backup",
    name: "Full Backup",
    description:
      "Complete JSON snapshot of all data — perfect for migration, archiving, or disaster recovery.",
    icon: "💾",
    format: "JSON",
    fields: ["All Expenses", "Metadata", "Settings", "Schema Version"],
    gradient: "from-slate-600 to-slate-800",
    accentColor: "slate",
  },
  {
    id: "accountant-format",
    name: "Accountant Format",
    description:
      "Double-entry bookkeeping format with debit/credit columns and running balance — accountant approved.",
    icon: "🏦",
    format: "XLSX",
    fields: ["Date", "Reference No.", "Debit", "Credit", "Running Balance", "Notes"],
    gradient: "from-amber-500 to-orange-600",
    accentColor: "amber",
  },
  {
    id: "spending-insights",
    name: "Spending Insights",
    description:
      "AI-ready normalized data export with time-series, anomaly flags, and category vectors for analysis.",
    icon: "✨",
    format: "JSON",
    fields: ["Normalized Data", "Category Vectors", "Time Series", "Anomaly Flags"],
    gradient: "from-pink-500 to-rose-600",
    accentColor: "pink",
    badge: "New",
  },
];

export const CLOUD_INTEGRATIONS: CloudIntegration[] = [
  {
    id: "google-sheets",
    name: "Google Sheets",
    logo: "📊",
    description: "Auto-sync expenses to a Google Sheet for real-time collaboration with your team.",
    color: "#34a853",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    category: "productivity",
    authSteps: [
      "Sign in with Google account",
      "Grant Sheets read/write access",
      "Select destination spreadsheet",
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    logo: "💼",
    description: "Save every export directly to a Google Drive folder — automatic and organized.",
    color: "#4285f4",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    category: "cloud",
    authSteps: [
      "Sign in with Google account",
      "Grant Drive file access",
      "Choose default export folder",
    ],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    logo: "📦",
    description: "Automatically back up every export to your Dropbox — accessible from any device.",
    color: "#0061ff",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    category: "cloud",
    authSteps: [
      "Connect Dropbox account",
      "Authorize file system access",
      "Set backup destination folder",
    ],
  },
  {
    id: "onedrive",
    name: "OneDrive",
    logo: "☁️",
    description: "Sync with Microsoft OneDrive and open exports directly in Excel or Word.",
    color: "#0078d4",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    category: "cloud",
    authSteps: [
      "Sign in with Microsoft account",
      "Grant OneDrive access",
      "Choose destination folder",
    ],
  },
  {
    id: "notion",
    name: "Notion",
    logo: "📝",
    description: "Push expense data into a Notion database with rich properties and linked views.",
    color: "#000000",
    bgColor: "#f8fafc",
    borderColor: "#e2e8f0",
    category: "productivity",
    authSteps: [
      "Connect Notion workspace",
      "Select target database",
      "Map expense fields to properties",
    ],
  },
  {
    id: "airtable",
    name: "Airtable",
    logo: "🗂️",
    description: "Sync expenses to an Airtable base for custom views, filters, and automations.",
    color: "#18bfff",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    category: "productivity",
    authSteps: [
      "Enter Airtable personal API key",
      "Select base and table",
      "Configure field mapping",
    ],
  },
  {
    id: "slack",
    name: "Slack",
    logo: "💬",
    description: "Receive automated weekly summaries and export alerts right in your Slack channel.",
    color: "#4a154b",
    bgColor: "#fdf4ff",
    borderColor: "#e9d5ff",
    category: "communication",
    authSteps: [
      "Add ExpenseTracker to Slack workspace",
      "Choose notification channel",
      "Configure alert frequency and type",
    ],
  },
  {
    id: "email",
    name: "Email",
    logo: "✉️",
    description: "Schedule recurring email reports delivered to any inbox — no signup required.",
    color: "#6366f1",
    bgColor: "#eef2ff",
    borderColor: "#c7d2fe",
    category: "communication",
    authSteps: [
      "Enter recipient email address",
      "Verify ownership via confirmation link",
      "Configure report format and schedule",
    ],
  },
];

export const INTEGRATION_CATEGORY_LABELS: Record<CloudIntegration["category"], string> = {
  cloud: "Cloud Storage",
  productivity: "Productivity",
  communication: "Communication",
};

// ─── localStorage Helpers ─────────────────────────────────────────────────────

const STORAGE_KEYS = {
  connections: "et_cloud_connections",
  history: "et_export_history",
  schedules: "et_backup_schedules",
  shares: "et_shared_exports",
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getConnections(): ConnectedIntegration[] {
  return safeRead<ConnectedIntegration[]>(STORAGE_KEYS.connections, []);
}

export function saveConnection(conn: ConnectedIntegration): void {
  const list = getConnections().filter((c) => c.id !== conn.id);
  localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify([...list, conn]));
}

export function removeConnection(id: IntegrationId): void {
  const list = getConnections().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(list));
}

export function getExportHistory(): ExportRecord[] {
  return safeRead<ExportRecord[]>(STORAGE_KEYS.history, []);
}

export function addExportRecord(record: ExportRecord): void {
  const list = getExportHistory();
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify([record, ...list].slice(0, 100)));
}

export function getSchedules(): BackupSchedule[] {
  return safeRead<BackupSchedule[]>(STORAGE_KEYS.schedules, []);
}

export function saveSchedule(schedule: BackupSchedule): void {
  const list = getSchedules().filter((s) => s.id !== schedule.id);
  localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify([...list, schedule]));
}

export function removeSchedule(id: string): void {
  const list = getSchedules().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(list));
}

export function getSharedExports(): SharedExport[] {
  return safeRead<SharedExport[]>(STORAGE_KEYS.shares, []);
}

export function saveSharedExport(share: SharedExport): void {
  const list = getSharedExports();
  localStorage.setItem(STORAGE_KEYS.shares, JSON.stringify([share, ...list].slice(0, 50)));
}

// ─── Utility Functions ────────────────────────────────────────────────────────

export function generateShareCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    ""
  );
}

export function computeNextRun(
  frequency: ExportFrequency,
  hour: number
): string {
  const now = new Date();
  let next: Date;
  if (frequency === "daily") {
    next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next = addDays(next, 1);
  } else if (frequency === "weekly") {
    next = addWeeks(new Date(now.setHours(hour, 0, 0, 0)), 1);
  } else {
    next = addMonths(new Date(now.setDate(1)), 1);
    next.setHours(hour, 0, 0, 0);
  }
  return next.toISOString();
}

export function buildExportPayload(expenses: Expense[], templateId: TemplateId): string {
  const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;

  if (template.format === "JSON") {
    return JSON.stringify(
      {
        template: template.name,
        version: "1.0",
        exportedAt: new Date().toISOString(),
        totalRecords: expenses.length,
        expenses: expenses.map((e) => ({
          ...e,
          _meta:
            templateId === "spending-insights"
              ? {
                  normalizedAmount: e.amount / 1000,
                  dayOfWeek: new Date(e.date).getDay(),
                  isWeekend: [0, 6].includes(new Date(e.date).getDay()),
                }
              : undefined,
        })),
      },
      null,
      2
    );
  }

  // CSV / XLSX / PDF — all produce CSV for download
  const rows: string[][] = [];
  if (templateId === "accountant-format") {
    rows.push(["Date", "Reference", "Description", "Category", "Debit", "Credit", "Balance"]);
    let balance = 0;
    expenses.forEach((e, i) => {
      balance -= e.amount;
      rows.push([
        e.date,
        `EXP-${String(i + 1).padStart(4, "0")}`,
        `"${e.description.replace(/"/g, '""')}"`,
        e.category,
        e.amount.toFixed(2),
        "",
        balance.toFixed(2),
      ]);
    });
  } else if (templateId === "category-analysis") {
    const byCategory: Record<string, number[]> = {};
    expenses.forEach((e) => {
      if (!byCategory[e.category]) byCategory[e.category] = [];
      byCategory[e.category].push(e.amount);
    });
    rows.push(["Category", "Total", "Count", "Average", "% of Total"]);
    const grand = expenses.reduce((s, e) => s + e.amount, 0);
    Object.entries(byCategory).forEach(([cat, amounts]) => {
      const total = amounts.reduce((s, a) => s + a, 0);
      rows.push([
        cat,
        total.toFixed(2),
        String(amounts.length),
        (total / amounts.length).toFixed(2),
        ((total / grand) * 100).toFixed(1) + "%",
      ]);
    });
  } else {
    // tax-report, monthly-summary, spending-insights (CSV fallback)
    rows.push(["Date", "Amount", "Category", "Description"]);
    expenses.forEach((e) =>
      rows.push([e.date, e.amount.toFixed(2), e.category, `"${e.description.replace(/"/g, '""')}"`])
    );
  }

  return rows.map((r) => r.join(",")).join("\n");
}

export function downloadExport(expenses: Expense[], templateId: TemplateId): ExportRecord {
  const template = EXPORT_TEMPLATES.find((t) => t.id === templateId)!;
  const payload = buildExportPayload(expenses, templateId);
  const extMap: Record<ExportFormat, string> = { CSV: "csv", JSON: "json", PDF: "csv", XLSX: "csv" };
  const mimeMap: Record<ExportFormat, string> = {
    CSV: "text/csv;charset=utf-8;",
    JSON: "application/json;charset=utf-8;",
    PDF: "text/csv;charset=utf-8;",
    XLSX: "text/csv;charset=utf-8;",
  };

  const blob = new Blob([payload], { type: mimeMap[template.format] });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${templateId}_${format(new Date(), "yyyy-MM-dd")}.${extMap[template.format]}`;
  link.click();
  URL.revokeObjectURL(url);

  const record: ExportRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    templateId,
    destination: "local",
    format: template.format,
    status: "completed",
    expenseCount: expenses.length,
    fileSizeKB: Math.max(1, Math.round(payload.length / 1024)),
  };
  addExportRecord(record);
  return record;
}

export function getIntegrationById(id: IntegrationId): CloudIntegration {
  return CLOUD_INTEGRATIONS.find((i) => i.id === id)!;
}

export function getTemplateById(id: TemplateId): ExportTemplate {
  return EXPORT_TEMPLATES.find((t) => t.id === id)!;
}
