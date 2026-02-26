interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  trend?: { value: string; positive: boolean } | null;
  color?: "indigo" | "emerald" | "amber" | "rose";
}

const colorMap = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "indigo",
}: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1">
          <span
            className={`text-xs font-semibold ${
              trend.positive ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
