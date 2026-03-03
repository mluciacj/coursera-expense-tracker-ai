export type Category =
  | "Food"
  | "Transportation"
  | "Entertainment"
  | "Shopping"
  | "Bills"
  | "Other";

export interface Expense {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  category: Category;
  description: string;
  createdAt: string; // ISO timestamp
}

export interface ExpenseFormData {
  date: string;
  amount: string;
  category: Category;
  description: string;
}

export interface ExpenseFilters {
  search: string;
  category: Category | "All";
  startDate: string;
  endDate: string;
}

export interface SpendingSummary {
  total: number;
  thisMonth: number;
  lastMonth: number;
  topCategory: Category | null;
  byCategory: Record<Category, number>;
  byMonth: { month: string; amount: number }[];
}

export const CATEGORIES: Category[] = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#f97316",
  Transportation: "#3b82f6",
  Entertainment: "#a855f7",
  Shopping: "#ec4899",
  Bills: "#ef4444",
  Other: "#6b7280",
};

export type ExportFormat = "csv" | "json";

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: "🍔",
  Transportation: "🚗",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Bills: "📋",
  Other: "📦",
};
