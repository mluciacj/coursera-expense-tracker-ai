"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/expenses", label: "Expenses", icon: "💳" },
  { href: "/top-vendors", label: "Top Vendors", icon: "🏪" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 flex md:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              active ? "text-indigo-400" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
