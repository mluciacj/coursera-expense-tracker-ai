"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, Expense, ExpenseFormData } from "@/lib/types";
import { format } from "date-fns";

interface ExpenseFormProps {
  initial?: Expense;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
}

interface FormErrors {
  date?: string;
  amount?: string;
  category?: string;
  description?: string;
}

const today = format(new Date(), "yyyy-MM-dd");

export default function ExpenseForm({ initial, onSubmit, onCancel }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>({
    date: initial?.date ?? today,
    amount: initial ? String(initial.amount) : "",
    category: initial?.category ?? "Food",
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        date: initial.date,
        amount: String(initial.amount),
        category: initial.category,
        description: initial.description,
      });
    }
  }, [initial]);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.date) errs.date = "Date is required";
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      errs.amount = "Enter a valid amount greater than 0";
    if (!form.category) errs.category = "Category is required";
    if (!form.description.trim()) errs.description = "Description is required";
    else if (form.description.trim().length > 200)
      errs.description = "Description must be 200 characters or less";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Date <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          max={today}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all ${
            errors.date
              ? "border-rose-400 focus:ring-rose-300"
              : "border-slate-200 focus:ring-indigo-300 focus:border-indigo-400"
          }`}
        />
        {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Amount (USD) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className={`w-full pl-7 pr-3 py-2.5 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all ${
              errors.amount
                ? "border-rose-400 focus:ring-rose-300"
                : "border-slate-200 focus:ring-indigo-300 focus:border-indigo-400"
            }`}
          />
        </div>
        {errors.amount && <p className="text-rose-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Category <span className="text-rose-500">*</span>
        </label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all bg-white ${
            errors.category
              ? "border-rose-400 focus:ring-rose-300"
              : "border-slate-200 focus:ring-indigo-300 focus:border-indigo-400"
          }`}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="What was this expense for?"
          rows={3}
          maxLength={200}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 transition-all ${
            errors.description
              ? "border-rose-400 focus:ring-rose-300"
              : "border-slate-200 focus:ring-indigo-300 focus:border-indigo-400"
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-rose-500 text-xs">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-400">{form.description.length}/200</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? "Saving…" : initial ? "Update Expense" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
