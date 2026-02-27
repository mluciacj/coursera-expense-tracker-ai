"use client";

import { useState } from "react";
import { format, parseISO, formatDistanceToNow, addDays } from "date-fns";
import { Expense } from "@/lib/types";
import {
  SharedExport,
  EXPORT_TEMPLATES,
  TemplateId,
  generateShareCode,
  getTemplateById,
} from "@/lib/cloudExport";

interface Props {
  expenses: Expense[];
  shares: SharedExport[];
  onShare: (share: SharedExport) => void;
}

// ─── QR Code Generator ────────────────────────────────────────────────────────

function QRCode({ value, size = 180 }: { value: string; size?: number }) {
  const MODULES = 25;
  const cellSize = Math.floor(size / MODULES);
  const svgSize = MODULES * cellSize;

  // Deterministic seed from value
  const seed = value.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1) * 31, 0);

  function pseudo(r: number, c: number): boolean {
    const x = ((seed ^ (r * 2654435761)) ^ (c * 40503)) >>> 0;
    return x % 3 < 1;
  }

  function isFinderPattern(r: number, c: number): boolean {
    const tl = r <= 6 && c <= 6;
    const tr = r <= 6 && c >= MODULES - 7;
    const bl = r >= MODULES - 7 && c <= 6;
    return tl || tr || bl;
  }

  function isTimingPattern(r: number, c: number): boolean {
    return (r === 6 && c > 7 && c < MODULES - 8) || (c === 6 && r > 7 && r < MODULES - 8);
  }

  function getFinderCell(r: number, c: number): boolean {
    // Top-left
    if (r <= 6 && c <= 6) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Top-right
    if (r <= 6 && c >= MODULES - 7) {
      const lc = c - (MODULES - 7);
      if (r === 0 || r === 6 || lc === 0 || lc === 6) return true;
      if (r >= 2 && r <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }
    // Bottom-left
    if (r >= MODULES - 7 && c <= 6) {
      const lr = r - (MODULES - 7);
      if (lr === 0 || lr === 6 || c === 0 || c === 6) return true;
      if (lr >= 2 && lr <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    return false;
  }

  const rects: { x: number; y: number; w: number; h: number; dark: boolean }[] = [];

  for (let r = 0; r < MODULES; r++) {
    for (let c = 0; c < MODULES; c++) {
      let dark = false;
      if (isFinderPattern(r, c)) {
        dark = getFinderCell(r, c);
      } else if (isTimingPattern(r, c)) {
        dark = (r === 6 ? c : r) % 2 === 0;
      } else {
        dark = pseudo(r, c);
      }
      rects.push({ x: c * cellSize, y: r * cellSize, w: cellSize, h: cellSize, dark });
    }
  }

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-lg"
    >
      <rect width={svgSize} height={svgSize} fill="white" />
      {rects
        .filter((r) => r.dark)
        .map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#1e293b" />
        ))}
    </svg>
  );
}

// ─── Generate Share Form ───────────────────────────────────────────────────────

function GenerateSharePanel({
  expenses,
  onGenerate,
}: {
  expenses: Expense[];
  onGenerate: (share: SharedExport) => void;
}) {
  const [templateId, setTemplateId] = useState<TemplateId>("monthly-summary");
  const [expiry, setExpiry] = useState<"7d" | "30d" | "90d" | "never">("30d");
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<SharedExport | null>(null);
  const [copied, setCopied] = useState(false);

  const expiryDays: Record<string, number | null> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    never: null,
  };

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      const code = generateShareCode();
      const days = expiryDays[expiry];
      const share: SharedExport = {
        code,
        templateId,
        createdAt: new Date().toISOString(),
        expiresAt: days ? addDays(new Date(), days).toISOString() : "9999-12-31T00:00:00.000Z",
        accessCount: 0,
        maxAccess: null,
        passwordProtected,
        url: `https://expensetracker.app/share/${code}`,
        note: note.trim() || undefined,
      };
      setGenerating(false);
      setGenerated(share);
      onGenerate(share);
    }, 800);
  }

  function handleCopy() {
    if (generated) {
      navigator.clipboard.writeText(generated.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleReset() {
    setGenerated(null);
    setCopied(false);
    setNote("");
  }

  if (generated) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔗</span>
          <h3 className="font-bold text-slate-800">Share Link Generated!</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {/* Left: Link & info */}
          <div className="space-y-4">
            {/* URL box */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Share URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-indigo-700 font-mono break-all">
                  {generated.url}
                </code>
                <button
                  onClick={handleCopy}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              {[
                {
                  icon: "📋",
                  label: "Template",
                  value: getTemplateById(generated.templateId).name,
                },
                {
                  icon: "⏱️",
                  label: "Expires",
                  value:
                    generated.expiresAt === "9999-12-31T00:00:00.000Z"
                      ? "Never"
                      : format(parseISO(generated.expiresAt), "MMM d, yyyy"),
                },
                {
                  icon: generated.passwordProtected ? "🔒" : "🔓",
                  label: "Access",
                  value: generated.passwordProtected ? "Password protected" : "Public link",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span>{item.icon}</span>
                  <span className="text-slate-500">{item.label}:</span>
                  <span className="font-medium text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Email share */}
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-2">Share via Email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  className="flex-1 px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
                <button className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Send
                </button>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Generate a new link
            </button>
          </div>

          {/* Right: QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
              <QRCode value={generated.code} size={160} />
            </div>
            <p className="text-xs text-slate-400 text-center">
              Scan QR code to open in browser
            </p>
            <div className="bg-slate-100 rounded-lg px-3 py-1.5">
              <code className="text-xs font-bold text-slate-700 tracking-widest">
                {generated.code.toUpperCase()}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <span>🔗</span> Generate Share Link
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Create a secure link to share your expense data with anyone.
        </p>
      </div>

      {/* Template */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Report Template
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EXPORT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-colors ${
                templateId === t.id
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{t.icon}</span>
              <span className="font-medium truncate text-xs">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Expiry */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Link Expiry
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["7d", "7 days"],
                ["30d", "30 days"],
                ["90d", "90 days"],
                ["never", "Never"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setExpiry(val)}
                className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                  expiry === val
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Settings
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <div>
                <p className="text-xs font-semibold text-slate-700">Password protected</p>
                <p className="text-xs text-slate-400">Require a PIN to access</p>
              </div>
            </div>
            <div
              onClick={() => setPasswordProtected(!passwordProtected)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                passwordProtected ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  passwordProtected ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Q1 2026 expenses for review"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className={`w-full py-3 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 ${
          generating ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {generating ? (
          <>
            <span className="animate-spin">⏳</span> Generating link…
          </>
        ) : (
          <>🔗 Generate Shareable Link</>
        )}
      </button>
    </div>
  );
}

// ─── Active Shares List ────────────────────────────────────────────────────────

function ShareCard({ share }: { share: SharedExport }) {
  const [copied, setCopied] = useState(false);
  const template = getTemplateById(share.templateId);
  const isExpired =
    share.expiresAt !== "9999-12-31T00:00:00.000Z" &&
    new Date(share.expiresAt) < new Date();

  function handleCopy() {
    navigator.clipboard.writeText(share.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`p-4 bg-white rounded-xl border transition-all ${
        isExpired ? "opacity-50 border-slate-100" : "border-slate-100 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br ${template.gradient}`}
        >
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{template.name}</span>
            {isExpired ? (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600">
                Expired
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                Active
              </span>
            )}
            {share.passwordProtected && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                🔒 Protected
              </span>
            )}
          </div>
          {share.note && (
            <p className="text-xs text-slate-500 mt-0.5 italic">"{share.note}"</p>
          )}
          <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-slate-400">
            <span>
              Created {formatDistanceToNow(parseISO(share.createdAt), { addSuffix: true })}
            </span>
            <span>
              {share.expiresAt === "9999-12-31T00:00:00.000Z"
                ? "Never expires"
                : isExpired
                ? `Expired ${format(parseISO(share.expiresAt), "MMM d")}`
                : `Expires ${format(parseISO(share.expiresAt), "MMM d, yyyy")}`}
            </span>
            <span>{share.accessCount} views</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 text-xs text-indigo-600 font-mono truncate bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              {share.url}
            </code>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                copied ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {copied ? "✓" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShareTab({ expenses, shares, onShare }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Share & Collaborate</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate shareable links with QR codes for your expense reports.
        </p>
      </div>

      <GenerateSharePanel expenses={expenses} onGenerate={onShare} />

      {shares.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            Active Shares
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
              {shares.length}
            </span>
          </h3>
          <div className="space-y-3">
            {shares.map((share) => (
              <ShareCard key={share.code} share={share} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
