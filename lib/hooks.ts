"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addExpense,
  deleteExpense,
  generateId,
  getExpenses,
  updateExpense,
} from "./storage";
import { Expense, ExpenseFilters, ExpenseFormData } from "./types";
import { parseISO } from "date-fns";

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  startDate: "",
  endDate: "",
};

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setExpenses(getExpenses());
    setIsLoaded(true);
  }, []);

  const add = useCallback((data: ExpenseFormData) => {
    const expense: Expense = {
      id: generateId(),
      date: data.date,
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description.trim(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(addExpense(expense));
    return expense;
  }, []);

  const update = useCallback((id: string, data: ExpenseFormData) => {
    const expense: Expense = {
      id,
      date: data.date,
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description.trim(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(updateExpense(expense));
  }, []);

  const remove = useCallback((id: string) => {
    setExpenses(deleteExpense(id));
  }, []);

  const filtered = expenses.filter((e) => {
    if (
      filters.search &&
      !e.description.toLowerCase().includes(filters.search.toLowerCase()) &&
      !e.category.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.category !== "All" && e.category !== filters.category) {
      return false;
    }
    if (filters.startDate) {
      const start = parseISO(filters.startDate);
      if (parseISO(e.date) < start) return false;
    }
    if (filters.endDate) {
      const end = parseISO(filters.endDate);
      if (parseISO(e.date) > end) return false;
    }
    return true;
  });

  return { expenses, filtered, filters, setFilters, add, update, remove, isLoaded };
}
