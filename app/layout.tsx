import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "ExpenseTracker – Personal Finance",
  description: "Track and manage your personal expenses with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden md:block flex-shrink-0">
            <div className="sticky top-0 h-screen">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileNav />
      </body>
    </html>
  );
}
