import { format, parseISO } from "date-fns";
import { Category, CATEGORIES, CATEGORY_ICONS, Expense } from "./types";
import { formatCurrency } from "./analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportConfig {
  format: ExportFormat;
  startDate: string;
  endDate: string;
  categories: Category[];   // empty = all categories
  filename: string;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: "csv",
  startDate: "",
  endDate: "",
  categories: [...CATEGORIES],
  filename: "",
};

// ─── Filtering ────────────────────────────────────────────────────────────────

export function applyExportFilters(
  expenses: Expense[],
  config: Pick<ExportConfig, "startDate" | "endDate" | "categories">
): Expense[] {
  return expenses.filter((e) => {
    if (config.startDate) {
      if (parseISO(e.date) < parseISO(config.startDate)) return false;
    }
    if (config.endDate) {
      if (parseISO(e.date) > parseISO(config.endDate)) return false;
    }
    if (config.categories.length > 0 && config.categories.length < CATEGORIES.length) {
      if (!config.categories.includes(e.category)) return false;
    }
    return true;
  });
}

export function buildFilename(base: string, ext: ExportFormat): string {
  const stem = base.trim()
    ? base.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")
    : `expenses_${format(new Date(), "yyyy-MM-dd")}`;
  return `${stem}.${ext === "pdf" ? "pdf" : ext}`;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function exportAsCSV(expenses: Expense[], filename: string): void {
  const headers = ["Date", "Amount (USD)", "Category", "Description", "ID"];
  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.id,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8;");
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function exportAsJSON(expenses: Expense[], filename: string): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description,
      createdAt: e.createdAt,
    })),
  };
  downloadBlob(JSON.stringify(payload, null, 2), filename, "application/json;charset=utf-8;");
}

// ─── PDF (print-based) ────────────────────────────────────────────────────────

export function exportAsPDF(expenses: Expense[], filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Compute category breakdown
  const byCategory = CATEGORIES.reduce(
    (acc, cat) => {
      const sum = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      if (sum > 0) acc.push({ cat, sum });
      return acc;
    },
    [] as { cat: Category; sum: number }[]
  ).sort((a, b) => b.sum - a.sum);

  const rows = expenses
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (e, i) => `
      <tr class="${i % 2 === 0 ? "even" : "odd"}">
        <td>${e.date}</td>
        <td>${CATEGORY_ICONS[e.category]} ${e.category}</td>
        <td>${e.description}</td>
        <td class="amount">$${e.amount.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const summaryRows = byCategory
    .map(
      ({ cat, sum }) =>
        `<tr><td>${CATEGORY_ICONS[cat]} ${cat}</td><td class="amount">$${sum.toFixed(2)}</td><td>${((sum / total) * 100).toFixed(1)}%</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${filename.replace(".pdf", "")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 12px; margin-bottom: 24px; }
    .meta { display: flex; gap: 32px; margin-bottom: 28px; padding: 16px 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
    .meta-item { }
    .meta-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .meta-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    h2 { font-size: 14px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e2e8f0; }
    td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
    tr.even { background: #fafafa; }
    .amount { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
    .total-row td { font-weight: 700; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 12px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 16px; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>Expense Report</h1>
  <div class="subtitle">Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Total Records</div>
      <div class="meta-value">${expenses.length}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Total Amount</div>
      <div class="meta-value">${formatCurrency(total)}</div>
    </div>
    ${
      expenses.length > 0
        ? `<div class="meta-item">
      <div class="meta-label">Date Range</div>
      <div class="meta-value" style="font-size:14px;">${expenses.slice().sort((a,b)=>a.date.localeCompare(b.date))[0].date} → ${expenses.slice().sort((a,b)=>b.date.localeCompare(a.date))[0].date}</div>
    </div>`
        : ""
    }
  </div>

  <h2>Category Summary</h2>
  <table>
    <thead><tr><th>Category</th><th>Amount</th><th>% of Total</th></tr></thead>
    <tbody>
      ${summaryRows}
      <tr class="total-row"><td>Total</td><td class="amount">$${total.toFixed(2)}</td><td></td></tr>
    </tbody>
  </table>

  <h2>Expense Transactions (${expenses.length})</h2>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${rows}
      <tr class="total-row"><td colspan="3">Total</td><td class="amount">$${total.toFixed(2)}</td></tr>
    </tbody>
  </table>

  <div class="footer">Coursera Expense Tracker • Exported ${new Date().toISOString()}</div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export function runExport(expenses: Expense[], config: ExportConfig): void {
  const data = applyExportFilters(expenses, config);
  const name = buildFilename(config.filename, config.format);
  if (config.format === "csv") exportAsCSV(data, name);
  else if (config.format === "json") exportAsJSON(data, name);
  else exportAsPDF(data, name);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
