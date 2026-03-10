"use client";

import { useState } from "react";

interface BudgetStreakProps {
  streak: number;
}

export default function BudgetStreak({ streak }: BudgetStreakProps) {
  const [active, setActive] = useState(true);

  return (
    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-2">
      <p className="text-sm font-semibold text-slate-600 tracking-wide">Budget Streak</p>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <span className="text-4xl font-black text-emerald-500">{streak}</span>
          <p className="text-sm text-slate-500 font-medium">days!</p>
        </div>
        {/* Toggle pill */}
        <button
          onClick={() => setActive((v) => !v)}
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
            active ? "bg-emerald-400" : "bg-slate-200"
          }`}
          aria-label="Toggle streak"
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              active ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
