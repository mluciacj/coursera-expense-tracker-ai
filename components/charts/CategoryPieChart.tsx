"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Category, CATEGORY_COLORS, CATEGORIES } from "@/lib/types";
import { formatCurrency } from "@/lib/analytics";

interface CategoryPieChartProps {
  byCategory: Record<Category, number>;
}

export default function CategoryPieChart({ byCategory }: CategoryPieChartProps) {
  const data = CATEGORIES.filter((cat) => byCategory[cat] > 0).map((cat) => ({
    name: cat,
    value: byCategory[cat],
    color: CATEGORY_COLORS[cat],
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No spending data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Amount"]}
            contentStyle={{
              background: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-600 truncate">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800 flex-shrink-0">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
