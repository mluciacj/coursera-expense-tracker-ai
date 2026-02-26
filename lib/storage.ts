import { Expense } from "./types";

const STORAGE_KEY = "expense_tracker_data";

export function getExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Expense): Expense[] {
  const expenses = getExpenses();
  const updated = [expense, ...expenses];
  saveExpenses(updated);
  return updated;
}

export function updateExpense(updated: Expense): Expense[] {
  const expenses = getExpenses();
  const next = expenses.map((e) => (e.id === updated.id ? updated : e));
  saveExpenses(next);
  return next;
}

export function deleteExpense(id: string): Expense[] {
  const expenses = getExpenses();
  const next = expenses.filter((e) => e.id !== id);
  saveExpenses(next);
  return next;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
